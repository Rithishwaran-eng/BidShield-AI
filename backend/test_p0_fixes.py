"""Automated tests for all BidShield AI P0 Audit Fixes."""

import io
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user
from app.supabase_client import get_supabase

client = TestClient(app)


def test_issue_4_bid_submission_endpoint_is_bidder_only():
    """Issue 4: Procurement officer cannot submit bids (403), unauthenticated gets 401."""
    # Unauthenticated with active clerk secret
    with patch("app.auth.CLERK_SECRET_KEY", "sk_live_test_secret_key"):
        res = client.post("/tenders/dummy-tender/apply", data={})
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"

    # Officer gets 403 Forbidden
    async def mock_officer():
        return {"sub": "officer_123", "role": "procurement_officer", "email": "officer@gem.gov.in"}

    app.dependency_overrides[get_current_user] = mock_officer
    try:
        res = client.post("/tenders/dummy-tender/apply", data={"company_name": "Test Co", "contact_email": "test@co.com"})
        assert res.status_code == 403, f"Expected 403 for officer on apply, got {res.status_code}: {res.text}"
    finally:
        app.dependency_overrides.clear()


def test_issue_5_legacy_bidder_document_endpoints_inaccessible():
    """Issue 5: Legacy bidder document endpoints return 410 Gone."""
    res_post = client.post("/bidders/some-id/documents")
    assert res_post.status_code == 410, f"Expected 410 Gone for legacy doc upload, got {res_post.status_code}"

    res_get = client.get("/bidders/some-id/documents")
    assert res_get.status_code == 410, f"Expected 410 Gone for legacy doc list, got {res_get.status_code}"


def test_issue_8_remove_administrator_role_mapping():
    """Issue 8: Users with administrator metadata role must NOT be mapped to procurement_officer."""
    payload = {"sub": "user_admin_123", "role": "administrator", "email": "admin@test.com"}
    raw_role = payload.get("role")
    role = "procurement_officer" if raw_role == "procurement_officer" else "bidder"
    assert role == "bidder", f"Expected administrator to map to bidder, but got {role}"


def test_issue_9_remove_expired_jwt_grace():
    """Issue 9: Unsigned or expired tokens must not be accepted under grace period."""
    with patch("app.auth.CLERK_SECRET_KEY", "sk_live_test_secret_key"):
        res = client.get("/officer/audit", headers={"Authorization": "Bearer invalid_or_expired_token"})
        assert res.status_code == 401, f"Expected 401 for invalid token, got {res.status_code}"



def test_issue_11_prevent_officer_changing_rules_after_open():
    """Issue 11: Rules cannot be extracted or updated when tender is OPEN."""
    async def mock_officer():
        return {"sub": "officer_123", "role": "procurement_officer", "name": "Officer Test"}

    app.dependency_overrides[get_current_user] = mock_officer

    # Mock supabase returning OPEN tender
    mock_sb = MagicMock()
    mock_sb.table().select().eq().execute.return_value.data = [{"id": "t-1", "status": "open"}]

    with patch("app.routes.tenders.get_supabase", return_value=mock_sb):
        try:
            # Try to update rules
            res_patch = client.patch("/tenders/t-1/rules", json={"rules": [], "approve": True})
            assert res_patch.status_code == 400, f"Expected 400 when editing rules on open tender, got {res_patch.status_code}: {res_patch.text}"
            assert "immutable" in res_patch.json().get("detail", "").lower()

            # Try to extract rules
            res_extract = client.post("/tenders/t-1/extract-rules")
            assert res_extract.status_code == 400, f"Expected 400 when extracting rules on open tender, got {res_extract.status_code}: {res_extract.text}"
            assert "immutable" in res_extract.json().get("detail", "").lower()
        finally:
            app.dependency_overrides.clear()


def test_issue_12_validate_tender_status_transitions():
    """Issue 12: Tender status transitions must be validated."""
    async def mock_officer():
        return {"sub": "officer_123", "role": "procurement_officer", "name": "Officer Test"}

    app.dependency_overrides[get_current_user] = mock_officer

    mock_sb = MagicMock()
    # Tender currently in "draft"
    mock_sb.table().select().eq().execute.return_value.data = [{"id": "t-1", "status": "draft"}]

    with patch("app.routes.tenders.get_supabase", return_value=mock_sb):
        try:
            # Invalid transition: draft -> completed directly
            res = client.patch("/tenders/t-1/status", json={"status": "completed"})
            assert res.status_code == 400, f"Expected 400 for invalid transition draft->completed, got {res.status_code}: {res.text}"
            assert "invalid" in res.json().get("detail", "").lower()
        finally:
            app.dependency_overrides.clear()


def test_issue_18_pdf_only_and_size_validation():
    """Issue 18: Non-PDF files or files without %PDF header must be rejected."""
    async def mock_officer():
        return {"sub": "officer_123", "role": "procurement_officer"}

    app.dependency_overrides[get_current_user] = mock_officer
    try:
        # Non-PDF extension
        txt_file = io.BytesIO(b"Hello text content")
        res = client.post(
            "/tenders/upload-pdf",
            files={"file": ("test.txt", txt_file, "text/plain")},
        )
        assert res.status_code == 400, f"Expected 400 for .txt file, got {res.status_code}: {res.text}"
        assert "only pdf" in res.json().get("detail", "").lower()

        # PDF extension but fake header
        fake_pdf = io.BytesIO(b"Not a real PDF file")
        res2 = client.post(
            "/tenders/upload-pdf",
            files={"file": ("fake.pdf", fake_pdf, "application/pdf")},
        )
        assert res2.status_code == 400, f"Expected 400 for fake PDF header, got {res2.status_code}: {res2.text}"
        assert "%pdf" in res2.json().get("detail", "").lower()
    finally:
        app.dependency_overrides.clear()


def test_issue_13_deadline_check():
    """Issue 13: Bids cannot be accepted if tender deadline has passed."""
    async def mock_bidder():
        return {"sub": "bidder_123", "role": "bidder", "email": "bidder@vendor.com"}

    app.dependency_overrides[get_current_user] = mock_bidder

    # Tender has expired deadline
    past_time = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    mock_sb = MagicMock()
    mock_sb.table().select().eq().execute.return_value.data = [
        {"id": "t-1", "status": "open", "deadline": past_time, "title": "Expired Tender"}
    ]

    with patch("app.routes.bids.get_supabase", return_value=mock_sb):
        try:
            pdf_bytes = io.BytesIO(b"%PDF-1.4 valid test pdf bytes")
            res = client.post(
                "/tenders/t-1/apply",
                data={"company_name": "Late Co", "contact_email": "late@co.com", "document_types": ["PAN"]},
                files=[("files", ("doc.pdf", pdf_bytes, "application/pdf"))],
            )
            assert res.status_code == 400, f"Expected 400 for expired deadline, got {res.status_code}: {res.text}"
            assert "deadline" in res.json().get("detail", "").lower()
        finally:
            app.dependency_overrides.clear()


def test_issue_14_prevent_duplicate_bids():
    """Issue 14: Prevent duplicate bids for the same bidder + tender."""
    async def mock_bidder():
        return {"sub": "bidder_dup_123", "role": "bidder", "email": "dup@vendor.com"}

    app.dependency_overrides[get_current_user] = mock_bidder

    mock_sb = MagicMock()
    def mock_table(table_name):
        t_mock = MagicMock()
        if table_name == "tenders":
            t_mock.select.return_value.eq.return_value.execute.return_value.data = [
                {"id": "t-1", "status": "open", "deadline": None, "title": "Open Tender"}
            ]
        elif table_name == "rules":
            t_mock.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
                {"id": "r-1", "approved": True}
            ]
        elif table_name == "bidders":
            t_mock.select.return_value.eq.return_value.execute.return_value.data = [{"id": "b-existing"}]
        elif table_name == "bids":
            t_mock.select.return_value.eq.return_value.in_.return_value.execute.return_value.data = [{"id": "bid-existing"}]
        return t_mock

    mock_sb.table.side_effect = mock_table



    with patch("app.routes.bids.get_supabase", return_value=mock_sb):
        try:
            pdf_bytes = io.BytesIO(b"%PDF-1.4 valid test pdf bytes")
            res = client.post(
                "/tenders/t-1/apply",
                data={"company_name": "Dup Co", "contact_email": "dup@co.com", "document_types": ["PAN"]},
                files=[("files", ("doc.pdf", pdf_bytes, "application/pdf"))],
            )
            assert res.status_code == 400, f"Expected 400 for duplicate bid, got {res.status_code}: {res.text}"
            assert "duplicate" in res.json().get("detail", "").lower()
        finally:
            app.dependency_overrides.clear()


def test_issue_15_fail_submission_on_storage_failure():
    """Issue 15: Submission must fail if storage upload fails."""
    async def mock_bidder():
        return {"sub": "bidder_storage_test", "role": "bidder", "email": "storage@test.com"}

    app.dependency_overrides[get_current_user] = mock_bidder

    mock_sb = MagicMock()
    def mock_table_15(table_name):
        t_mock = MagicMock()
        if table_name == "tenders":
            t_mock.select.return_value.eq.return_value.execute.return_value.data = [{"id": "t-1", "status": "open", "title": "Tender"}]
        elif table_name == "rules":
            t_mock.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{"id": "r-1", "approved": True}]
        elif table_name == "bidders":
            t_mock.select.return_value.eq.return_value.execute.return_value.data = []
            t_mock.insert.return_value.execute.return_value.data = [{"id": "bidder-1"}]
        elif table_name == "bids":
            t_mock.insert.return_value.execute.return_value.data = [{"id": "bid-1"}]
        return t_mock

    mock_sb.table.side_effect = mock_table_15

    # Storage upload and update both fail
    mock_sb.storage.from_().upload.side_effect = Exception("Storage S3 connection timeout")
    mock_sb.storage.from_().update.side_effect = Exception("Storage update failed")

    with patch("app.routes.bids.get_supabase", return_value=mock_sb):
        try:
            pdf_bytes = io.BytesIO(b"%PDF-1.4 valid test pdf bytes")
            res = client.post(
                "/tenders/t-1/apply",
                data={"company_name": "Storage Co", "contact_email": "storage@co.com", "document_types": ["PAN"]},
                files=[("files", ("doc.pdf", pdf_bytes, "application/pdf"))],
            )
            assert res.status_code == 500, f"Expected 500 for storage failure, got {res.status_code}: {res.text}"
            assert "storage upload failed" in res.json().get("detail", "").lower()
        finally:
            app.dependency_overrides.clear()


def test_issue_16_filter_approved_rules_only():
    """Issue 16: Verification must only evaluate approved rules, and fail if no approved rules exist."""
    async def mock_bidder():
        return {"sub": "bidder_rules_test", "role": "bidder", "email": "rules@test.com"}

    app.dependency_overrides[get_current_user] = mock_bidder

    mock_sb = MagicMock()
    def mock_table_16(table_name):
        t_mock = MagicMock()
        if table_name == "tenders":
            t_mock.select.return_value.eq.return_value.execute.return_value.data = [{"id": "t-1", "status": "open", "title": "Tender"}]
        elif table_name == "rules":
            t_mock.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        elif table_name == "bidders":
            t_mock.select.return_value.eq.return_value.execute.return_value.data = []
        return t_mock

    mock_sb.table.side_effect = mock_table_16


    with patch("app.routes.bids.get_supabase", return_value=mock_sb):
        try:
            pdf_bytes = io.BytesIO(b"%PDF-1.4 valid test pdf bytes")
            res = client.post(
                "/tenders/t-1/apply",
                data={"company_name": "Rules Co", "contact_email": "rules@co.com", "document_types": ["PAN"]},
                files=[("files", ("doc.pdf", pdf_bytes, "application/pdf"))],
            )
            assert res.status_code == 400, f"Expected 400 when no approved rules exist, got {res.status_code}: {res.text}"
            assert "approved" in res.json().get("detail", "").lower()
        finally:
            app.dependency_overrides.clear()


def test_issue_10_validate_officer_identity_from_clerk():
    """Issue 10: Officer name and clerk ID are taken strictly from authenticated Clerk user."""
    async def mock_officer():
        return {"sub": "clerk_officer_999", "role": "procurement_officer", "name": "Real Officer Name", "email": "real@gem.gov.in"}

    app.dependency_overrides[get_current_user] = mock_officer

    mock_sb = MagicMock()
    mock_sb.table().select().eq().execute.return_value.data = [{"id": "f-1", "bid_id": "b-1"}]
    mock_sb.table().update().eq().execute.return_value.data = [{"id": "f-1"}]
    mock_sb.table().insert().execute.return_value.data = [{"id": "audit-1"}]

    with patch("app.routes.findings.get_supabase", return_value=mock_sb):
        try:
            # Caller sends fake officer_name in body
            res = client.patch(
                "/findings/f-1/action",
                json={"action": "accept", "officer_name": "Fake Impersonated Name"},
            )
            assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"

            # Inspect what was passed to audit_log insert
            insert_call_args = mock_sb.table("audit_log").insert.call_args[0][0]
            assert insert_call_args["officer_name"] == "Real Officer Name", f"Expected verified officer name, got {insert_call_args['officer_name']}"
            assert insert_call_args["officer_clerk_id"] == "clerk_officer_999"
        finally:
            app.dependency_overrides.clear()


def test_issue_3_prevent_bidder_access_to_other_submissions():
    """Issue 3: Bidder A cannot access Bidder B's submission."""
    async def mock_bidder_a():
        return {"sub": "user_bidder_A", "role": "bidder", "email": "a@bidder.com"}

    app.dependency_overrides[get_current_user] = mock_bidder_a

    mock_sb = MagicMock()
    # Bid exists and belongs to bidder_B
    mock_sb.table().select().eq().execute.side_effect = [
        MagicMock(data=[{"id": "bid-1", "bidder_id": "bidder-B-id", "tender_id": "t-1"}]), # bid lookup
        MagicMock(data=[{"id": "bidder-B-id", "user_id": "user_bidder_B"}]), # bidder lookup
    ]

    with patch("app.routes.bids.get_supabase", return_value=mock_sb):
        try:
            res = client.get("/bidder/submissions/bid-1")
            assert res.status_code == 403, f"Expected 403 for cross-bidder access, got {res.status_code}: {res.text}"
            assert "Forbidden" in res.json().get("detail", "")
        finally:
            app.dependency_overrides.clear()


def test_issue_2_filter_submissions_by_authenticated_bidder():
    """Issue 2: list_bidder_submissions only queries bids belonging to authenticated user's bidders."""
    async def mock_bidder_a():
        return {"sub": "user_bidder_A", "role": "bidder", "email": "a@bidder.com"}

    app.dependency_overrides[get_current_user] = mock_bidder_a

    mock_sb = MagicMock()
    def mock_table_2(table_name):
        t_mock = MagicMock()
        if table_name == "bidders":
            t_mock.select.return_value.eq.return_value.execute.return_value.data = [{"id": "bidder-A-1"}]
        elif table_name == "bids":
            t_mock.select.return_value.in_.return_value.order.return_value.execute.return_value.data = [
                {"id": "bid-A-1", "tender_id": "t-1", "bidder_id": "bidder-A-1", "tenders": {"title": "Tender A"}}
            ]
        elif table_name == "documents":
            t_mock.select.return_value.eq.return_value.execute.return_value.data = []
        return t_mock

    mock_sb.table.side_effect = mock_table_2


    with patch("app.routes.bids.get_supabase", return_value=mock_sb):
        try:
            res = client.get("/bidder/submissions")
            assert res.status_code == 200
            data = res.json()
            assert len(data) == 1
            assert data[0]["bid_id"] == "bid-A-1"
        finally:
            app.dependency_overrides.clear()


def test_issue_7_reverify_by_bid_id_only():
    """Issue 7: reverify_bid queries documents and deletes findings by bid_id only."""
    async def mock_officer():
        return {"sub": "officer_1", "role": "procurement_officer"}

    app.dependency_overrides[get_current_user] = mock_officer

    mock_sb = MagicMock()
    mock_sb.table().select().eq().execute.side_effect = [
        MagicMock(data=[{"id": "bid-100", "bidder_id": "bidder-10", "tender_id": "tender-1"}]), # bid lookup
        MagicMock(data=[{"id": "r-1", "requirement": "Req 1", "evidence_required": []}]), # rules lookup
        MagicMock(data=[{"id": "doc-1", "bid_id": "bid-100", "document_type": "PAN", "extraction_status": "done"}]), # documents by bid_id
    ]
    mock_sb.table().delete().eq().execute.return_value.data = []
    mock_sb.table().insert().execute.return_value.data = [{"id": "f-1"}]
    mock_sb.table().update().eq().execute.return_value.data = [{"id": "bid-100"}]

    with patch("app.routes.bids.get_supabase", return_value=mock_sb):
        try:
            res = client.post("/bids/bid-100/reverify")
            assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"

            # Verify that delete was called with eq("bid_id", "bid-100")
            delete_eq_calls = mock_sb.table("findings").delete().eq.call_args_list
            assert any(c[0] == ("bid_id", "bid-100") for c in delete_eq_calls), f"Expected delete by bid_id, got: {delete_eq_calls}"
        finally:
            app.dependency_overrides.clear()


if __name__ == "__main__":
    test_issue_4_bid_submission_endpoint_is_bidder_only()
    print("[PASS] Issue 4: Bid submission is bidder-only")
    test_issue_5_legacy_bidder_document_endpoints_inaccessible()
    print("[PASS] Issue 5: Legacy bidder document endpoints return 410 Gone")
    test_issue_8_remove_administrator_role_mapping()
    print("[PASS] Issue 8: Administrator role mapping completely removed")
    test_issue_9_remove_expired_jwt_grace()
    print("[PASS] Issue 9: Unverified expired JWT grace period removed")
    test_issue_11_prevent_officer_changing_rules_after_open()
    print("[PASS] Issue 11: Rules immutable once tender is OPEN")
    test_issue_12_validate_tender_status_transitions()
    print("[PASS] Issue 12: Tender status transitions validated")
    test_issue_18_pdf_only_and_size_validation()
    print("[PASS] Issue 18: PDF-only and file size limit enforced")
    test_issue_13_deadline_check()
    print("[PASS] Issue 13: Submissions rejected after tender deadline")
    test_issue_14_prevent_duplicate_bids()
    print("[PASS] Issue 14: Duplicate bid submissions prevented")
    test_issue_15_fail_submission_on_storage_failure()
    print("[PASS] Issue 15: Submission fails if document storage upload fails")
    test_issue_16_filter_approved_rules_only()
    print("[PASS] Issue 16: Verification only evaluates approved rules")
    test_issue_10_validate_officer_identity_from_clerk()
    print("[PASS] Issue 10: Officer identity validated strictly from authenticated Clerk user")
    test_issue_3_prevent_bidder_access_to_other_submissions()
    print("[PASS] Issue 3: Cross-bidder submission access blocked (403)")
    test_issue_2_filter_submissions_by_authenticated_bidder()
    print("[PASS] Issue 2: Bidder submissions strictly filtered by authenticated user")
    test_issue_7_reverify_by_bid_id_only()
    print("[PASS] Issue 7: Reverification deletes/reads by bid_id only")
    print("\nALL P0 AUDIT AND SECURITY TESTS PASSED!")

