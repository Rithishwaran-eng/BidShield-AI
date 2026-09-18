import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import FRONTEND_URL, ENVIRONMENT
from app.routes import tenders, bids, bidders, documents, dashboard, findings, audit, webhooks

logger = logging.getLogger(__name__)

app = FastAPI(
    title="BidShield AI API",
    description="AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement",
    version="2.0.0",
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforce standard HTTP security headers (SEC-10)."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# Strict CORS configuration (SEC-11)
allowed_origins = [FRONTEND_URL]
if ENVIRONMENT == "development" and "http://localhost:3000" not in allowed_origins:
    allowed_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "svix-id",
        "svix-timestamp",
        "svix-signature",
    ],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error on path {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact system administrator."},
    )


app.include_router(tenders.router, prefix="/tenders", tags=["Tenders"])
app.include_router(bids.router, tags=["Bids"])
app.include_router(bidders.router, tags=["Bidders"])
app.include_router(documents.router, tags=["Documents"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(findings.router, prefix="/findings", tags=["Findings"])
app.include_router(audit.router, tags=["Audit"])
app.include_router(webhooks.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BidShield AI API", "version": "2.0.0"}
