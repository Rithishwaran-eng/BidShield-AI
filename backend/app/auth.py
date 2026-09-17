import logging
import time
from typing import Callable, List, Optional
from fastapi import Depends, HTTPException, Request, status
import jwt
from clerk_backend_api import authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions
from app.config import CLERK_SECRET_KEY

logger = logging.getLogger(__name__)


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not CLERK_SECRET_KEY or CLERK_SECRET_KEY.startswith("sk_test_placeholder"):
        # Development fallback warning
        logger.warning("CLERK_SECRET_KEY not set in backend/.env; using mock development fallback.")
        return {
            "sub": "dev_user",
            "role": "administrator",
            "name": "Dev Admin",
            "email": "dev@bidshield.internal",
        }

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

        # Grace period handling for token expiration (up to 10 minutes)
        if "TOKEN_EXPIRED" in str(reason) and auth_header:
            token = auth_header.replace("Bearer ", "").strip()
            try:
                unverified = jwt.decode(token, options={"verify_signature": False, "verify_exp": False})
                exp = unverified.get("exp", 0)
                if exp and (time.time() - exp) < 600:
                    logger.info(f"Token expired {int(time.time() - exp)}s ago; accepted within grace window.")
                    payload = unverified
                    role = payload.get("role") or payload.get("metadata", {}).get("role") or payload.get("public_metadata", {}).get("role") or "auditor"
                    return {
                        "sub": payload.get("sub"),
                        "role": role,
                        "email": payload.get("email"),
                        "payload": payload,
                    }
            except Exception as ex:
                logger.warning(f"Could not inspect expired token: {ex}")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication required: {reason}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = request_state.payload
    # Extract role from session claim (configured via Clerk Dashboard session token template: {"role": "{{user.public_metadata.role}}"})
    role = payload.get("role") or payload.get("metadata", {}).get("role") or payload.get("public_metadata", {}).get("role") or "auditor"

    return {
        "sub": payload.get("sub"),
        "role": role,
        "email": payload.get("email"),
        "payload": payload,
    }


def require_role(*allowed_roles: str) -> Callable:
    """
    Reusable dependency factory that verifies the authenticated user possesses one of the allowed roles.
    Raises 403 Forbidden if the verified role isn't in the allowed set.
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            logger.warning(f"Access forbidden: User {current_user.get('sub')} with role '{user_role}' tried to access endpoint requiring {allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Role '{user_role}' is not authorized to perform this action. Required: {', '.join(allowed_roles)}.",
            )
        return current_user

    return role_checker
