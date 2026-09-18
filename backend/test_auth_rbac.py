"""
Unit & Integration tests for Clerk RBAC and Two-Actor Role Guards.
Tests:
1. 401 when unauthenticated
2. 403 when Bidder attempts Procurement Officer write actions (POST /tenders, PATCH /findings/{id}/action)
3. 403 when Procurement Officer attempts Bidder actions (POST /tenders/{id}/apply)
4. Webhook signature rejection with invalid secret
"""

from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user

client = TestClient(app)


def test_unauthenticated_request_returns_401():
    """Any protected route should return 401 if unauthenticated."""
    with patch("app.auth.CLERK_SECRET_KEY", "sk_live_actual_test_secret"):
        response = client.post("/tenders", json={"title": "Test", "uploaded_text": "Sample text"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


def test_bidder_cannot_create_tender():
    """Bidder role must get 403 Forbidden on POST /tenders."""
    async def mock_bidder():
        return {"sub": "user_bidder_123", "role": "bidder", "email": "bidder@test.com"}

    app.dependency_overrides[get_current_user] = mock_bidder
    try:
        response = client.post("/tenders", json={"title": "Test", "uploaded_text": "Sample text"})
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        assert "Forbidden" in response.json().get("detail", "")
    finally:
        app.dependency_overrides.clear()


def test_bidder_cannot_take_review_action():
    """Bidder role must get 403 Forbidden on PATCH /findings/{id}/action."""
    async def mock_bidder():
        return {"sub": "user_bidder_123", "role": "bidder", "email": "bidder@test.com"}

    app.dependency_overrides[get_current_user] = mock_bidder
    try:
        response = client.patch("/findings/some-finding-id/action", json={
            "action": "accept",
            "note": "Bidder trying to accept",
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
    finally:
        app.dependency_overrides.clear()


def test_officer_cannot_apply_for_bid():
    """Procurement Officer must get 403 on POST /tenders/{id}/apply."""
    async def mock_officer():
        return {"sub": "user_officer_123", "role": "procurement_officer", "email": "officer@test.com"}

    app.dependency_overrides[get_current_user] = mock_officer
    try:
        res = client.post("/tenders/some-tender/apply", data={"company_name": "Test Co", "contact_email": "test@co.com"})
        assert res.status_code == 403, f"Expected 403 for officer on apply, got {res.status_code}: {res.text}"
    finally:
        app.dependency_overrides.clear()


def test_webhook_invalid_signature_rejected():
    """Webhook endpoint /webhooks/clerk must reject requests with invalid svix signatures."""
    response = client.post(
        "/webhooks/clerk",
        content=b'{"type": "user.created"}',
        headers={
            "svix-id": "msg_test123",
            "svix-timestamp": "1614556800",
            "svix-signature": "v1,invalid_signature_here",
            "Content-Type": "application/json"
        }
    )
    assert response.status_code in (400, 401, 500)


if __name__ == "__main__":
    print("Running RBAC tests...")
    test_unauthenticated_request_returns_401()
    print("[PASS] test_unauthenticated_request_returns_401")
    test_bidder_cannot_create_tender()
    print("[PASS] test_bidder_cannot_create_tender (Bidder rejected with 403 on tender create)")
    test_bidder_cannot_take_review_action()
    print("[PASS] test_bidder_cannot_take_review_action (Bidder rejected with 403 on finding action)")
    test_officer_cannot_apply_for_bid()
    print("[PASS] test_officer_cannot_apply_for_bid (Officer rejected with 403 on bid application)")
    test_webhook_invalid_signature_rejected()
    print("[PASS] test_webhook_invalid_signature_rejected (Webhook protected by Svix)")
    print("\nALL TWO-ACTOR RBAC SECURITY TESTS PASSED!")
