from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date


# --- Tender models ---

class TenderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    organization: Optional[str] = "Ministry of Commerce & Industry"
    category: Optional[str] = "Goods & Equipment"
    deadline: Optional[str] = None
    uploaded_text: Optional[str] = None


class TenderResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    organization: Optional[str] = None
    category: Optional[str] = None
    deadline: Optional[str] = None
    uploaded_text: Optional[str] = None
    status: str
    created_at: str


class TenderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|rules_pending|rules_approved|open|bid_submission_closed|under_evaluation|decision_pending|completed)$")


# --- Rule models ---

class RuleBase(BaseModel):
    rule_id: str
    requirement: str
    mandatory: bool = True
    evidence_required: list[str] = []
    threshold: Optional[str] = None


class RuleResponse(RuleBase):
    id: str
    tender_id: str
    approved: bool


class RuleUpdate(BaseModel):
    rules: list[RuleBase]
    approve: bool = False


# --- Bidder / Vendor Entity models ---

class BidderBase(BaseModel):
    name: str
    legal_name: Optional[str] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class BidderResponse(BidderBase):
    id: str
    created_at: str


# --- Bid Submission models ---

class BidSubmissionCreate(BaseModel):
    company_name: str
    legal_name: Optional[str] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None


class BidResponse(BaseModel):
    id: str
    tender_id: str
    bidder_id: str
    bidder_name: str
    status: str
    submitted_at: str
    officer_decision: Optional[str] = None
    officer_decision_note: Optional[str] = None
    decision_at: Optional[str] = None
    created_at: str


class BidDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(qualified|not_qualified)$")
    officer_name: Optional[str] = None
    note: str = Field(..., min_length=3, description="Mandatory justification note for final qualification decision")


# --- Document models ---

class DocumentResponse(BaseModel):
    id: str
    bid_id: Optional[str] = None
    bidder_id: str
    document_type: str
    filename: str
    storage_path: str
    legal_name: Optional[str] = None
    id_number: Optional[str] = None
    registration_date: Optional[str] = None
    page: Optional[int] = None
    confidence: Optional[float] = None
    extraction_status: str
    created_at: str


# --- Evidence Item ---

class EvidenceItem(BaseModel):
    document_id: str
    document_type: str
    field: str
    value: str
    page: Optional[int] = None


# --- Finding models ---

class FindingResponse(BaseModel):
    id: str
    bid_id: Optional[str] = None
    bidder_id: str
    rule_id: Optional[str] = None
    status: str
    evidence: list[dict]
    explanation: str
    officer_action: Optional[str] = None
    officer_note: Optional[str] = None
    action_at: Optional[str] = None
    created_at: str
    bidder_name: Optional[str] = None
    rule_requirement: Optional[str] = None


class FindingActionRequest(BaseModel):
    action: str = Field(..., pattern="^(accept|reject|request_clarification|mark_verified|override)$")
    officer_name: Optional[str] = None
    note: Optional[str] = None


# --- Audit log models ---

class AuditLogResponse(BaseModel):
    id: str
    tender_id: Optional[str] = None
    bid_id: Optional[str] = None
    finding_id: Optional[str] = None
    officer_name: str
    officer_clerk_id: Optional[str] = None
    action: str
    note: Optional[str] = None
    created_at: str


# --- Dashboard / Summary models ---

class BidSummary(BaseModel):
    bid_id: str
    bidder_id: str
    bidder_name: str
    status: str
    submitted_at: str
    verified_count: int = 0
    issue_count: int = 0
    missing_count: int = 0
    pending_count: int = 0
    total_documents_required: int = 0
    total_documents_uploaded: int = 0
    officer_decision: Optional[str] = None


class DashboardResponse(BaseModel):
    tender_id: str
    tender_title: str
    status: str
    bids: list[BidSummary]
    findings: list[FindingResponse]
