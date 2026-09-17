import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from clerk_backend_api import Clerk
from app.auth import require_role
from app.config import CLERK_SECRET_KEY
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["User Management"])


class RoleUpdateRequest(BaseModel):
    role: str


class UserCreateRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "auditor"


VALID_ROLES = {"procurement_officer", "auditor", "administrator"}


def sync_clerk_users_to_supabase() -> list:
    """
    Synchronizes all accounts from Clerk (source of truth) into the Supabase users mirror table.
    Promotes any pending unsafe_metadata.requestedRole to public_metadata.role if not yet set.
    """
    sb = get_supabase()
    if not CLERK_SECRET_KEY:
        logger.warning("CLERK_SECRET_KEY not set; skipping Clerk API sync.")
        return []

    try:
        clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)
        clerk_users = clerk.users.list()
        for u in (clerk_users or []):
            user_id = u.id
            first = u.first_name or ""
            last = u.last_name or ""
            raw_name = f"{first} {last}".strip() or u.username or "OFFICER"
            name = raw_name.upper()
            email = u.email_addresses[0].email_address if u.email_addresses else ""

            public_role = (u.public_metadata or {}).get("role")
            unsafe_role = (u.unsafe_metadata or {}).get("requestedRole")
            role = public_role or unsafe_role or "auditor"
            if role not in VALID_ROLES:
                role = "auditor"

            # If public_metadata.role is missing, promote it server-side in Clerk
            if not public_role:
                try:
                    clerk.users.update_metadata(
                        user_id=user_id,
                        public_metadata={"role": role}
                    )
                    logger.info(f"Promoted role '{role}' to Clerk public_metadata for user {user_id}")
                except Exception as meta_err:
                    logger.warning(f"Could not promote public metadata in Clerk: {meta_err}")

            # Upsert into Supabase users table (strictly uppercase name)
            try:
                sb.table("users").upsert({
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "role": role,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).execute()
            except Exception as up_err:
                logger.warning(f"Failed to upsert user {user_id} into Supabase: {up_err}")

        res = sb.table("users").select("*").order("created_at", desc=True).execute()
        rows = res.data or []
        for r in rows:
            if r.get("name"):
                r["name"] = r["name"].upper()
        return rows
    except Exception as e:
        logger.error(f"Error syncing users from Clerk API: {e}")
        return []


@router.get("", dependencies=[Depends(require_role("administrator"))])
def list_users():
    """
    List all registered users.
    Auto-synchronizes from Clerk to ensure newly registered accounts immediately appear,
    then returns the synchronized list.
    Restricted exclusively to Administrators.
    """
    # 1. Attempt live sync from Clerk
    synced = sync_clerk_users_to_supabase()
    if synced:
        return synced

    # 2. Fallback to direct Supabase query
    sb = get_supabase()
    try:
        res = sb.table("users").select("*").order("created_at", desc=True).execute()
        rows = res.data or []
        for r in rows:
            if r.get("name"):
                r["name"] = r["name"].upper()
        return rows
    except Exception as e:
        logger.error(f"Error fetching users from Supabase: {e}")
        return []


@router.post("/sync", dependencies=[Depends(require_role("administrator"))])
def trigger_sync():
    """
    Manually trigger sync from Clerk into the Supabase users table.
    """
    synced = sync_clerk_users_to_supabase()
    return {"status": "success", "count": len(synced), "users": synced}


@router.patch("/{user_id}/role", dependencies=[Depends(require_role("administrator"))])
def update_user_role(user_id: str, body: RoleUpdateRequest):
    """
    Update a user's role.
    Only an Administrator is allowed to promote or demote anyone.
    Updates Clerk publicMetadata first, then updates Supabase mirror.
    """
    new_role = body.role.strip().lower()
    if new_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{body.role}'. Must be one of: {', '.join(sorted(VALID_ROLES))}",
        )

    # 1. Update Clerk Backend API first (Clerk is the source of truth)
    if CLERK_SECRET_KEY:
        try:
            clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)
            clerk.users.update_metadata(
                user_id=user_id,
                public_metadata={"role": new_role}
            )
            logger.info(f"Updated Clerk public_metadata.role to '{new_role}' for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to update user role in Clerk: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to update user role in Clerk: {str(e)}",
            )
    else:
        logger.warning("CLERK_SECRET_KEY not set; skipping Clerk API update.")

    # 2. Update Supabase mirror row
    sb = get_supabase()
    try:
        sb.table("users").update({
            "role": new_role,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", user_id).execute()
    except Exception as e:
        logger.error(f"Error updating user in Supabase: {e}")

    return {
        "status": "success",
        "user_id": user_id,
        "new_role": new_role,
        "message": f"User role updated to '{new_role}'.",
    }


@router.post("", dependencies=[Depends(require_role("administrator"))])
def create_user(body: UserCreateRequest):
    """
    Create a new user directly in Clerk with an assigned role and mirror to Supabase.
    Strictly restricted to Administrators.
    """
    role = body.role.strip().lower()
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{body.role}'. Must be one of: {', '.join(sorted(VALID_ROLES))}",
        )

    upper_name = body.name.strip().upper()
    parts = upper_name.split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""

    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="CLERK_SECRET_KEY not configured")

    try:
        clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)
        user = clerk.users.create(
            first_name=first_name,
            last_name=last_name,
            email_address=[body.email.strip().lower()],
            password=body.password,
            public_metadata={"role": role},
        )
    except Exception as e:
        logger.error(f"Error creating user in Clerk: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to create user in Clerk: {str(e)}")

    # Mirror into Supabase with strictly uppercase name
    sb = get_supabase()
    try:
        sb.table("users").upsert({
            "id": user.id,
            "name": upper_name,
            "email": body.email.strip().lower(),
            "role": role,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception as e:
        logger.warning(f"Error mirroring newly created user to Supabase: {e}")

    return {
        "status": "success",
        "id": user.id,
        "name": upper_name,
        "email": body.email.strip().lower(),
        "role": role,
    }


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    current_user: dict = Depends(require_role("administrator")),
):
    """
    Delete a user account from Clerk and Supabase.
    Strictly restricted to Administrators.
    An administrator cannot delete their own account.
    """
    if current_user.get("sub") == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own active administrator account.",
        )

    # 1. Delete from Clerk (source of truth)
    if CLERK_SECRET_KEY:
        try:
            clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)
            clerk.users.delete(user_id=user_id)
            logger.info(f"Deleted user {user_id} from Clerk.")
        except Exception as e:
            logger.error(f"Error deleting user from Clerk: {e}")
            raise HTTPException(status_code=502, detail=f"Failed to delete user from Clerk: {str(e)}")

    # 2. Delete from Supabase
    sb = get_supabase()
    try:
        sb.table("users").delete().eq("id", user_id).execute()
    except Exception as e:
        logger.error(f"Error deleting user from Supabase: {e}")

    return {
        "status": "success",
        "deleted_id": user_id,
        "message": "User account successfully deleted.",
    }

