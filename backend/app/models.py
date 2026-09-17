from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


# --- Tender models ---

class TenderCreate(BaseModel):
    title: str
    uploaded_text: Optional[str] = None


class TenderResponse(BaseModel):
    id: str
    title: str
    uploaded_text: Optional[str] = None
    status: str
    created_at: str


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


# --- Bidder models ---

class BidderCreate(BaseModel):
    name: str


class BidderResponse(BaseModel):
    id: str
    tender_id: str
    name: str
    created_at: str


# --- Document models ---

class DocumentResponse(BaseModel):
    id: str
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


# --- Evidence item ---

class EvidenceItem(BaseModel):
    document_id: str
    document_type: str
    field: str
    value: str
    page: Optional[int] = None


# --- Finding models ---

class FindingResponse(BaseModel):
    id: str
    bidder_id: str
    rule_id: Optional[str] = None
    status: str
    evidence: list[dict]
    explanation: str
    created_at: str
    bidder_name: Optional[str] = None
    rule_requirement: Optional[str] = None


class FindingActionRequest(BaseModel):
    action: str = Field(..., pattern="^(accept|reject|request_clarification|mark_verified|override)$")
    officer_name: str
    note: Optional[str] = None


# --- Audit log models ---

class AuditLogResponse(BaseModel):
    id: str
    finding_id: str
    officer_name: str
    action: str
    note: Optional[str] = None
    created_at: str


# --- Dashboard models ---

class BidderSummary(BaseModel):
    bidder_id: str
    bidder_name: str
    verified_count: int = 0
    issue_count: int = 0
    missing_count: int = 0
    pending_count: int = 0
    total_documents_required: int = 0
    total_documents_uploaded: int = 0
    evidence_coverage: float = 0.0


class DashboardResponse(BaseModel):
    tender_id: str
    tender_title: str
    bidder_summaries: list[BidderSummary]
    findings: list[FindingResponse]
