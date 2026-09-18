import logging
import time
from typing import Callable, List, Optional
from fastapi import Depends, HTTPException, Request, status
import jwt
from clerk_backend_api import authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions
from app.config import CLERK_SECRET_KEY, ENVIRONMENT, ALLOW_DEV_AUTH_BYPASS

logger = logging.getLogger(__name__)

# Valid roles in BidShield AI (Strictly two human roles)
VALID_ROLES = {"bidder", "procurement_officer"}


async def get_optional_current_user(request: Request) -> Optional[dict]:
    """
    Returns verified user payload if valid Authorization header or __session cookie is provided,
    otherwise returns None without raising an HTTPException.
    """
    auth_header = request.headers.get("Authorization", "")
    session_cookie = request.cookies.get("__session")

    if not auth_header and not session_cookie:
        return None

    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency that authenticates incoming requests using Clerk.
    Checks Authorization: Bearer <token> or __session cookie.
    Raises 401 if missing, expired, or invalid.
    Returns verified payload containing 'sub' (Clerk user ID) and 'role'.
    """
    auth_header = request.headers.get("Authorization", "")
    session_cookie = request.cookies.get("__session")

    if not auth_header and not session_cookie:
        # Check if running in development mode with explicit dev bypass allowed
        if ALLOW_DEV_AUTH_BYPASS and ENVIRONMENT == "development":
            logger.warning("ALLOW_DEV_AUTH_BYPASS is active in development mode; substituting dev_officer.")
            return {
                "sub": "dev_officer",
                "role": "procurement_officer",
                "name": "Procurement Officer (Dev)",
                "email": "officer@bidshield.gov.in",
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not CLERK_SECRET_KEY or CLERK_SECRET_KEY.startswith("sk_test_placeholder"):
        if ALLOW_DEV_AUTH_BYPASS and ENVIRONMENT == "development":
            logger.warning("CLERK_SECRET_KEY placeholder with dev bypass active; substituting dev_officer.")
            return {
                "sub": "dev_officer",
                "role": "procurement_officer",
                "name": "Procurement Officer (Dev)",
                "email": "officer@bidshield.gov.in",
            }
        logger.error("CLERK_SECRET_KEY is not configured; failing closed.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Server authentication service not configured.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        request_state = authenticate_request(
            request,
            AuthenticateRequestOptions(
                secret_key=CLERK_SECRET_KEY,
                clock_skew_in_ms=60000,  # 60s clock skew tolerance
            )
        )
    except Exception as e:
        logger.error(f"Error during Clerk authentication: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid token or session.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not request_state.is_signed_in or not request_state.payload:
        reason = getattr(request_state, "reason", "Unauthorized")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication required: {reason}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = request_state.payload
    # Strict role mapping: only "procurement_officer" is officer; all others are "bidder". No administrator mapping.
    raw_role = payload.get("role") or payload.get("metadata", {}).get("role") or payload.get("public_metadata", {}).get("role") or "bidder"
    role = "procurement_officer" if raw_role == "procurement_officer" else "bidder"

    # Extract user identity information
    user_name = payload.get("name")
    if not user_name and payload.get("first_name"):
        user_name = f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip()

    return {
        "sub": payload.get("sub"),
        "role": role,
        "name": user_name or payload.get("email") or payload.get("sub"),
        "email": payload.get("email"),
        "payload": payload,
    }



def require_role(*allowed_roles: str) -> Callable:
    """
    Reusable dependency factory that verifies the authenticated user possesses one of the allowed roles.
    Raises 403 Forbidden if the verified role isn't in the allowed set.
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "bidder")
        if user_role not in allowed_roles:
            logger.warning(f"Access forbidden: User {current_user.get('sub')} with role '{user_role}' tried to access endpoint requiring {allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Role '{user_role}' is not authorized to perform this action. Required: {', '.join(allowed_roles)}.",
            )
        return current_user

    return role_checker
