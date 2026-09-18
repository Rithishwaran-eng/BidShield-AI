from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import FRONTEND_URL
from app.routes import tenders, bids, bidders, documents, dashboard, findings, audit, webhooks

app = FastAPI(
    title="BidShield AI API",
    description="AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
