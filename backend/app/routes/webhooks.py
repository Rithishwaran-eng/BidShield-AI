import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, status
from svix.webhooks import Webhook, WebhookVerificationError
from clerk_backend_api import Clerk
from app.config import CLERK_SECRET_KEY, CLERK_WEBHOOK_SIGNING_SECRET
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/clerk")
async def clerk_webhook(request: Request):
    """
    Clerk Webhook endpoint for syncing users and role assignment.
    Subscribes to user.created and user.updated events.
    Public self-registrations default strictly to 'bidder'.
    """
    if not CLERK_WEBHOOK_SIGNING_SECRET:
        logger.error("CLERK_WEBHOOK_SIGNING_SECRET is not configured.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook signing secret not configured",
        )

    headers = {
        "svix-id": request.headers.get("svix-id", ""),
        "svix-timestamp": request.headers.get("svix-timestamp", ""),
        "svix-signature": request.headers.get("svix-signature", ""),
    }

    if not headers["svix-id"] or not headers["svix-timestamp"] or not headers["svix-signature"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Svix verification headers",
        )

    body = await request.body()

    try:
        wh = Webhook(CLERK_WEBHOOK_SIGNING_SECRET)
        payload = wh.verify(body, headers)
    except WebhookVerificationError as e:
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )
    except Exception as e:
        logger.error(f"Unexpected error verifying webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not verify webhook payload",
        )

    event_type = payload.get("type")
    data = payload.get("data", {})
    user_id = data.get("id")

    if not user_id:
        return {"status": "ignored", "reason": "No user ID in payload"}

    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    name = f"{first_name} {last_name}".strip()

    email_addresses = data.get("email_addresses", [])
    primary_email_id = data.get("primary_email_address_id")
    email = ""
    for email_obj in email_addresses:
        if email_obj.get("id") == primary_email_id or not email:
            email = email_obj.get("email_address", "")

    if not name:
        name = email.split("@")[0] if email else f"User {user_id[-6:]}"

    sb = get_supabase()

    if event_type == "user.created":
        unsafe_metadata = data.get("unsafe_metadata") or {}
        requested_role = unsafe_metadata.get("requestedRole")

        # Public users default to bidder unless explicitly authorized
        if requested_role == "procurement_officer" and (
            email.endswith(".gov.in") or email.endswith(".nic.in") or "officer" in email.lower() or "cpcl" in email.lower()
        ):
            validated_role = "procurement_officer"
        else:
            validated_role = "bidder"

        # Update public_metadata.role via Clerk Backend API
        if CLERK_SECRET_KEY:
            try:
                clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)
                clerk.users.update_metadata(
                    user_id=user_id,
                    public_metadata={"role": validated_role}
                )
                logger.info(f"Updated Clerk public_metadata.role to '{validated_role}' for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to update Clerk public_metadata: {e}")

        # Upsert into Supabase users table
        try:
            sb.table("users").upsert({
                "id": user_id,
                "name": name,
                "email": email,
                "role": validated_role,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception as e:
            logger.warning(f"Error mirroring user to Supabase: {e}")

        return {"status": "success", "event": event_type, "user_id": user_id, "role": validated_role}

    elif event_type == "user.updated":
        public_metadata = data.get("public_metadata") or {}
        role = public_metadata.get("role") or "bidder"

        try:
            sb.table("users").upsert({
                "id": user_id,
                "name": name,
                "email": email,
                "role": role,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception as e:
            logger.error(f"Error mirroring user update to Supabase: {e}")

        return {"status": "success", "event": event_type, "user_id": user_id, "role": role}

    return {"status": "ignored", "event": event_type}
