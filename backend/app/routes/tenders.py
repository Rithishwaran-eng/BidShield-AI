"""Tender routes: create, import, list, get, PDF text extraction, extract rules, approve rules, publish tender."""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.auth import require_role
from app.models import TenderCreate, TenderResponse, RuleResponse, RuleUpdate, TenderStatusUpdate
from app.supabase_client import get_supabase
from app.services.gemini_extraction import extract_tender_rules
from app.services.pdf_extraction import extract_text_from_pdf

router = APIRouter()


@router.post(
    "",
    response_model=TenderResponse,
    dependencies=[Depends(require_role("procurement_officer"))],
)
def create_tender(body: TenderCreate):
    sb = get_supabase()
    insert_data = {
        "title": body.title,
        "description": body.description,
        "organization": body.organization or "Ministry of Commerce & Industry",
        "category": body.category or "Goods & Equipment",
        "deadline": body.deadline,
        "uploaded_text": body.uploaded_text,
        "status": "draft",
    }
    
    try:
        result = sb.table("tenders").insert(insert_data).execute()
    except Exception as e:
        # Fallback if optional schema columns not present
        result = sb.table("tenders").insert({
            "title": body.title,
            "uploaded_text": body.uploaded_text,
            "status": "draft",
        }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create tender")

    return result.data[0]


MAX_TENDER_PDF_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post(
    "/upload-pdf",
    dependencies=[Depends(require_role("procurement_officer"))],
)
async def upload_tender_pdf(file: UploadFile = File(...)):
    """Extract raw text from an uploaded Tender PDF using pdfplumber."""
    filename = file.filename or "tender_document.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files (.pdf) are permitted. Received file: '{filename}'",
        )
    if file.content_type and file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type '{file.content_type}'. Must be 'application/pdf'.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded tender PDF is empty.")
    if len(file_bytes) > MAX_TENDER_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Tender PDF exceeds maximum allowed size of 25 MB ({len(file_bytes)} bytes).",
        )
    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' is not a valid PDF document (missing %PDF magic header).",
        )

    extraction = extract_text_from_pdf(file_bytes)
    if not extraction["success"] or not extraction["text"]:
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract text from tender PDF: {extraction.get('error', 'No text extracted')}",
        )

    return {
        "filename": filename,
        "page_count": extraction.get("page_count", 1),
        "text": extraction["text"],
    }



@router.post(
    "/import-gem",
    response_model=TenderResponse,
    dependencies=[Depends(require_role("procurement_officer"))],
)
def import_gem_tender(sample_id: Optional[str] = "CPCL_MECH_01"):
    """Simulated GeM tender import adapter for prototyping."""
    sb = get_supabase()

    gem_samples = {
        "CPCL_MECH_01": {
            "title": "CPCL Mechanical Procurement - GeM Bid No. GEM/2026/B/8912400",
            "organization": "Chennai Petroleum Corporation Limited (CPCL)",
            "category": "Industrial Mechanical Equipment",
            "description": "Supply, installation and commissioning of high-pressure industrial valves, piping systems, and mechanical pumps for CPCL Manali Refinery expansion.",
            "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - BID SPECIFICATION
Bid Number: GEM/2026/B/8912400
Procuring Entity: Chennai Petroleum Corporation Limited (CPCL)
Subject: Supply of Industrial Mechanical Valves, High-Pressure Pumps & Equipment

ELIGIBILITY REQUIREMENTS:
1. FINANCIAL REQUIREMENT: Minimum average annual turnover of Rs 10 Crore for the last 3 financial years (FY 2022-23, FY 2023-24, FY 2024-25).
2. GST REGISTRATION: Valid GST Registration Certificate with active filing status.
3. PAN VERIFICATION: Valid PAN Card matching the legal entity name.
4. UDYAM REGISTRATION: Valid Udyam Registration Certificate for MSME benefits.
5. PAST EXPERIENCE: Minimum 3 similar mechanical equipment supply orders (Rs 2 Crore each) in last 5 years.
6. EARNEST MONEY DEPOSIT (EMD): EMD of Rs 5,00,000 in the form of Bank Guarantee or Demand Draft.""",
            "status": "draft",
        },
        "MEITY_IT_01": {
            "title": "Supply of Enterprise IT Hardware & Networking Equipment - GEM/2026/B/9041280",
            "organization": "Ministry of Electronics and Information Technology (MeitY)",
            "category": "IT & Telecom Hardware",
            "description": "Procurement of high-availability servers, rack storage units, and managed network switches for National Data Center upgrade.",
            "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - BID DOCUMENT
Bid Number: GEM/2026/B/9041280
Ministry: Ministry of Electronics and Information Technology (MeitY)

MANDATORY CRITERIA:
1. Average annual financial turnover of INR 5.00 Crore for FY 22-25 (Audited Financials).
2. Valid GST and PAN registration.
3. Prior experience of executing at least two government IT contracts of INR 2.00 Crore each.
4. Manufacturer Authorization Form (MAF) directly from OEM with 36-month warranty.
5. Udyam registration for MSE preference.""",
            "status": "draft",
        }
    }

    sample = gem_samples.get(sample_id, gem_samples["CPCL_MECH_01"])
    try:
        result = sb.table("tenders").insert(sample).execute()
    except Exception:
        result = sb.table("tenders").insert({
            "title": sample["title"],
            "uploaded_text": sample["uploaded_text"],
            "status": "draft",
        }).execute()

    return result.data[0]


@router.get("", response_model=list[TenderResponse])
def list_tenders(status: Optional[str] = None):
    """List tenders. Bidders can filter by open tenders; officers can view all."""
    sb = get_supabase()
    query = sb.table("tenders").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/{tender_id}", response_model=TenderResponse)
def get_tender(tender_id: str):
    sb = get_supabase()
    result = sb.table("tenders").select("*").eq("id", tender_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    return result.data[0]


VALID_STATUS_TRANSITIONS = {
    "draft": {"rules_pending", "cancelled"},
    "rules_pending": {"rules_approved", "draft", "cancelled"},
    "rules_approved": {"open", "rules_pending", "draft", "cancelled"},
    "open": {"bid_submission_closed", "under_evaluation", "cancelled"},
    "bid_submission_closed": {"under_evaluation", "cancelled"},
    "under_evaluation": {"decision_pending", "completed", "cancelled"},
    "decision_pending": {"completed", "under_evaluation", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}

IMMUTABLE_RULE_STATUSES = ("open", "active", "bid_submission_closed", "under_evaluation", "decision_pending", "completed")


@router.post(
    "/{tender_id}/extract-rules",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def extract_rules(tender_id: str):
    sb = get_supabase()

    # Get tender
    tender = sb.table("tenders").select("*").eq("id", tender_id).execute()
    if not tender.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender_status = tender.data[0].get("status", "draft")
    if tender_status in IMMUTABLE_RULE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Rules cannot be extracted when tender is in '{tender_status}' status. Tender rules are immutable once opened/published.",
        )

    tender_text = tender.data[0].get("uploaded_text", "")
    if not tender_text:
        raise HTTPException(status_code=400, detail="Tender has no text content to extract from")

    # Call Gemini for rule extraction
    extraction = extract_tender_rules(tender_text)

    if not extraction["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Rule extraction failed: {extraction['error']}"
        )

    # Delete existing unapproved rules for this tender
    sb.table("rules").delete().eq("tender_id", tender_id).eq("approved", False).execute()

    # Insert extracted rules
    rules_to_insert = []
    for rule in extraction["rules"]:
        rules_to_insert.append({
            "tender_id": tender_id,
            "rule_id": rule.get("rule_id", "RULE_01"),
            "requirement": rule.get("requirement", ""),
            "mandatory": rule.get("mandatory", True),
            "evidence_required": rule.get("evidence_required", []),
            "threshold": rule.get("threshold"),
            "approved": False,
        })

    if rules_to_insert:
        sb.table("rules").insert(rules_to_insert).execute()

    # Update tender status to rules_pending
    update_t = sb.table("tenders").update({"status": "rules_pending"}).eq("id", tender_id).execute()
    if not update_t.data:
        raise HTTPException(status_code=500, detail="Failed to update tender status to rules_pending.")

    result = sb.table("rules").select("*").eq("tender_id", tender_id).execute()

    return {
        "message": f"Extracted {len(rules_to_insert)} rules",
        "rules": result.data,
    }


@router.get("/{tender_id}/rules", response_model=list[RuleResponse])
def get_rules(tender_id: str):
    sb = get_supabase()
    result = sb.table("rules").select("*").eq("tender_id", tender_id).execute()
    return result.data


@router.patch(
    "/{tender_id}/rules",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def update_rules(tender_id: str, body: RuleUpdate):
    """
    Officer updates or approves rules.
    Approving rules marks rules as approved (tender status -> 'rules_approved'),
    without automatically opening the tender for bids until the officer publishes it.
    Rules cannot be modified after the tender is opened/published.
    """
    sb = get_supabase()

    tender = sb.table("tenders").select("status").eq("id", tender_id).execute()
    if not tender.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender_status = tender.data[0].get("status", "draft")
    if tender_status in IMMUTABLE_RULE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Rules cannot be modified when tender is in '{tender_status}' status. Tender rules are immutable once opened/published.",
        )

    # Delete existing rules for this tender
    sb.table("rules").delete().eq("tender_id", tender_id).execute()

    # Insert updated rules
    rules_to_insert = []
    for rule in body.rules:
        rules_to_insert.append({
            "tender_id": tender_id,
            "rule_id": rule.rule_id,
            "requirement": rule.requirement,
            "mandatory": rule.mandatory,
            "evidence_required": rule.evidence_required,
            "threshold": rule.threshold,
            "approved": body.approve,
        })

    if rules_to_insert:
        sb.table("rules").insert(rules_to_insert).execute()

    # Update tender status if approving rules (becomes rules_approved)
    if body.approve:
        t_res = sb.table("tenders").update({"status": "rules_approved"}).eq("id", tender_id).execute()
        if not t_res.data:
            raise HTTPException(status_code=500, detail="Failed to mark tender status as rules_approved.")

    result = sb.table("rules").select("*").eq("tender_id", tender_id).execute()
    return {
        "message": "Rules updated" + (" and marked as approved." if body.approve else "."),
        "rules": result.data,
    }


@router.post(
    "/{tender_id}/publish",
    response_model=TenderResponse,
    dependencies=[Depends(require_role("procurement_officer"))],
)
def publish_tender(tender_id: str):
    """Officer explicitly publishes and opens the tender for bidder submissions."""
    sb = get_supabase()

    tender_res = sb.table("tenders").select("*").eq("id", tender_id).execute()
    if not tender_res.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender = tender_res.data[0]
    if tender.get("status") in ("open", "active"):
        return tender

    if tender.get("status") not in ("rules_approved", "draft", "rules_pending"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish tender from '{tender.get('status')}' status."
        )

    # Verify approved rules exist
    rules = sb.table("rules").select("id").eq("tender_id", tender_id).eq("approved", True).execute()
    if not rules.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot publish tender without approved eligibility rules. Please review and approve rules first."
        )

    publish_res = sb.table("tenders").update({"status": "open"}).eq("id", tender_id).execute()
    if not publish_res.data:
        raise HTTPException(status_code=500, detail="Failed to publish tender.")
    return publish_res.data[0]


@router.patch(
    "/{tender_id}/status",
    response_model=TenderResponse,
    dependencies=[Depends(require_role("procurement_officer"))],
)
def update_tender_status(tender_id: str, body: TenderStatusUpdate):
    """Officer transitions tender across lifecycle phases with validation."""
    sb = get_supabase()

    tender_res = sb.table("tenders").select("*").eq("id", tender_id).execute()
    if not tender_res.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    current_status = tender_res.data[0].get("status", "draft")
    if current_status == body.status:
        return tender_res.data[0]

    allowed = VALID_STATUS_TRANSITIONS.get(current_status, set())
    if body.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tender status transition from '{current_status}' to '{body.status}'. Valid transitions from '{current_status}' are: {sorted(list(allowed))}.",
        )

    if body.status == "open":
        rules = sb.table("rules").select("id").eq("tender_id", tender_id).eq("approved", True).execute()
        if not rules.data:
            raise HTTPException(
                status_code=400,
                detail="Cannot transition tender to 'open' without approved eligibility rules.",
            )

    update_res = sb.table("tenders").update({"status": body.status}).eq("id", tender_id).execute()
    if not update_res.data:
        raise HTTPException(status_code=500, detail=f"Failed to update tender status to '{body.status}'.")

    return update_res.data[0]

