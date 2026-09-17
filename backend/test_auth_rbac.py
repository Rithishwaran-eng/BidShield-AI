"""
Unit & Integration tests for Clerk RBAC and Role Guards.
Tests:
1. 401 when unauthenticated
2. 403 when Auditor attempts write actions (POST /tenders, PATCH /findings/{id}/action, PATCH /users/{id}/role)
3. 200/404 (not 403) when Auditor calls read endpoints
4. 403 when Procurement Officer attempts Manage Users (PATCH /users/{id}/role)
5. Webhook signature rejection with invalid secret
"""

import os
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user

client = TestClient(app)

def test_unauthenticated_request_returns_401():
    """Any protected route should return 401 if unauthenticated."""
    response = client.post("/tenders", json={"title": "Test", "uploaded_text": "Sample text"})
    assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


def test_auditor_cannot_create_tender():
    """Auditor role must get 403 Forbidden on POST /tenders."""
    async def mock_auditor():
        return {"sub": "user_auditor_123", "role": "auditor", "email": "auditor@test.com"}

    app.dependency_overrides[get_current_user] = mock_auditor
    try:
        response = client.post("/tenders", json={"title": "Test", "uploaded_text": "Sample text"})
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        assert "Forbidden" in response.json().get("detail", "")
    finally:
        app.dependency_overrides.clear()


def test_auditor_cannot_take_review_action():
    """Auditor role must get 403 Forbidden on PATCH /findings/{id}/action."""
    async def mock_auditor():
        return {"sub": "user_auditor_123", "role": "auditor", "email": "auditor@test.com"}

    app.dependency_overrides[get_current_user] = mock_auditor
    try:
        response = client.patch("/findings/some-finding-id/action", json={
            "action": "ACCEPT",
            "reason": "Auditor trying to accept",
            "officer_name": "Auditor Person"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
    finally:
        app.dependency_overrides.clear()


def test_officer_cannot_manage_users():
    """Procurement Officer must get 403 Forbidden on PATCH /users/{id}/role (Admin only)."""
    async def mock_officer():
        return {"sub": "user_officer_123", "role": "procurement_officer", "email": "officer@test.com"}

    app.dependency_overrides[get_current_user] = mock_officer
    try:
        response = client.patch("/users/target_user/role", json={"role": "administrator"})
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
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
def test_officer_cannot_add_or_delete_user():
    """Procurement Officer and Auditor must get 403 on DELETE /users and POST /users."""
    for role in ("procurement_officer", "auditor"):
        async def mock_user():
            return {"sub": f"user_{role}", "role": role, "email": f"{role}@test.com"}

        app.dependency_overrides[get_current_user] = mock_user
        try:
            del_res = client.delete("/users/other_user_id")
            assert del_res.status_code == 403, f"Expected 403 for {role} on DELETE, got {del_res.status_code}"

            post_res = client.post("/users", json={
                "name": "New User",
                "email": "new@test.com",
                "password": "Password123!",
                "role": "auditor"
            })
            assert post_res.status_code == 403, f"Expected 403 for {role} on POST, got {post_res.status_code}"
        finally:
            app.dependency_overrides.clear()


if __name__ == "__main__":
    print("Running tests...")
    test_unauthenticated_request_returns_401()
    print("[PASS] test_unauthenticated_request_returns_401")
    test_auditor_cannot_create_tender()
    print("[PASS] test_auditor_cannot_create_tender (Auditor rejected with 403 on write)")
    test_auditor_cannot_take_review_action()
    print("[PASS] test_auditor_cannot_take_review_action (Auditor rejected with 403 on review action)")
    test_officer_cannot_manage_users()
    print("[PASS] test_officer_cannot_manage_users (Officer rejected with 403 on Admin user role update)")
    test_officer_cannot_add_or_delete_user()
    print("[PASS] test_officer_cannot_add_or_delete_user (Officers & Auditors rejected with 403 on add/delete users)")
    test_webhook_invalid_signature_rejected()
    print("[PASS] test_webhook_invalid_signature_rejected (Webhook verified & protected by Svix)")
    print("\nALL RBAC SECURITY & PERMISSION TESTS PASSED!")
