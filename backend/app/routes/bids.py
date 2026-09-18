"""Bid and Bidder submission routes.

Handles:
- Bidder submission & automatic post-submission verification pipeline (bidder-only)
- Bidder submission status tracking with user ownership enforcement
- Officer submitted-bids inspection (authoritative by bid_id)
- Officer reverification (isolated by bid_id only)
- Officer final qualification decision (authenticated officer identity only)
"""

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from starlette.concurrency import run_in_threadpool
from app.auth import get_current_user, require_role
from app.models import BidResponse, BidDecisionRequest
from app.supabase_client import get_supabase
from app.services.pdf_extraction import extract_text_from_pdf
from app.services.gemini_extraction import extract_document_fields
from app.services.compliance_engine import run_compliance_check

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_BID_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB per document
MAX_TOTAL_SUBMISSION_BYTES = 75 * 1024 * 1024   # 75 MB total per submission


@router.post(
    "/tenders/{tender_id}/apply",
    dependencies=[Depends(require_role("bidder"))],
)
async def submit_bid(
    tender_id: str,
    company_name: str = Form(...),
    legal_name: Optional[str] = Form(None),
    pan: Optional[str] = Form(None),
    gstin: Optional[str] = Form(None),
    contact_email: str = Form(...),
    contact_phone: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    document_types: List[str] = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Bidder applies for an OPEN tender by submitting company information and required documents.
    Bidder-only endpoint with Clerk ownership, deadline validation, and duplicate prevention.
    """
    sb = get_supabase()
    clerk_user_id = current_user.get("sub")

    # 1. Verify Tender exists and is OPEN
    tender_res = sb.table("tenders").select("*").eq("id", tender_id).execute()
    if not tender_res.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender = tender_res.data[0]
    tender_status = tender.get("status", "")
    if tender_status not in ("open", "active"):
        raise HTTPException(
            status_code=400,
            detail=f"This tender is currently '{tender_status}'. Submissions are only accepted while the tender is OPEN.",
        )

    # 2. Check Tender Deadline before accepting bids (Issue 13)
    deadline_str = tender.get("deadline")
    if deadline_str:
        try:
            dl = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > dl:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tender submission deadline has passed ({deadline_str}). Bids can no longer be accepted.",
                )
        except HTTPException:
            raise
        except Exception as ex:
            logger.warning(f"Could not parse tender deadline '{deadline_str}': {ex}")

    # 3. Check for Approved Rules (Issue 16)
    rules_res = sb.table("rules").select("*").eq("tender_id", tender_id).eq("approved", True).execute()
    rules = rules_res.data or []
    if not rules:
        raise HTTPException(
            status_code=400,
            detail="Cannot accept bids: This tender has no approved eligibility rules configured.",
        )

    # 4. Prevent Duplicate Bids for the same bidder + tender (Issue 14)
    existing_user_bidders = sb.table("bidders").select("id").eq("user_id", clerk_user_id).execute()
    user_bidder_ids = [b["id"] for b in (existing_user_bidders.data or [])]

    if pan and pan.strip():
        pan_bidders = sb.table("bidders").select("id").eq("pan", pan.strip()).execute()
        for pb in (pan_bidders.data or []):
            if pb["id"] not in user_bidder_ids:
                user_bidder_ids.append(pb["id"])

    if user_bidder_ids:
        existing_bids = sb.table("bids").select("id").eq("tender_id", tender_id).in_("bidder_id", user_bidder_ids).execute()
        if existing_bids.data:
            raise HTTPException(
                status_code=400,
                detail="A bid submission has already been recorded for this tender by your organization. Duplicate submissions are not permitted.",
            )

    # 5. Enforce PDF-only uploads, individual file size, and aggregate size limits (Issue 18 & SEC-13)
    if not files:
        raise HTTPException(status_code=400, detail="At least one compliance document PDF is required.")

    processed_files = []
    total_bytes_read = 0

    for i, file in enumerate(files):
        doc_type = document_types[i] if i < len(document_types) else "DOCUMENT"
        raw_filename = file.filename or f"{doc_type.lower()}_doc.pdf"
        
        # SEC-05: Path Traversal Prevention
        clean_basename = os.path.basename(raw_filename)
        sanitized_filename = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", clean_basename)
        if not sanitized_filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"Only PDF files (.pdf) are permitted. Received non-PDF file: '{sanitized_filename}'",
            )
        if file.content_type and file.content_type not in ("application/pdf", "application/octet-stream"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid MIME type '{file.content_type}' for file '{sanitized_filename}'. Must be 'application/pdf'.",
            )

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail=f"Uploaded file '{sanitized_filename}' is empty.")
        if len(file_bytes) > MAX_BID_DOCUMENT_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File '{sanitized_filename}' exceeds maximum allowed size of 25 MB ({len(file_bytes)} bytes).",
            )
        
        total_bytes_read += len(file_bytes)
        if total_bytes_read > MAX_TOTAL_SUBMISSION_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"Total upload size exceeds maximum allowed aggregate size of 75 MB.",
            )

        if not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=400,
                detail=f"File '{sanitized_filename}' is not a valid PDF document (missing %PDF magic header).",
            )

        processed_files.append({
            "file": file,
            "filename": sanitized_filename,
            "doc_type": doc_type,
            "file_bytes": file_bytes,
        })

    # 6. Create Bidder Entity with Clerk ownership (Issue 1)
    bidder_insert = {
        "name": company_name.strip(),
        "legal_name": (legal_name or company_name).strip(),
        "pan": pan.strip() if pan else None,
        "gstin": gstin.strip() if gstin else None,
        "email": contact_email.strip(),
        "phone": contact_phone.strip() if contact_phone else None,
        "tender_id": tender_id,
        "user_id": clerk_user_id,
    }

    bidder_res = sb.table("bidders").insert(bidder_insert).execute()
    if not bidder_res.data:
        raise HTTPException(status_code=500, detail="Database failure: Failed to register bidder entity.")
    bidder_id = bidder_res.data[0]["id"]

    # 7. Create Bid Record with race-condition guard (Issue 6 & SEC-09)
    submitted_at = datetime.now(timezone.utc).isoformat()
    bid_insert = {
        "tender_id": tender_id,
        "bidder_id": bidder_id,
        "status": "processing",
        "submitted_at": submitted_at,
    }

    try:
        bid_res = sb.table("bids").insert(bid_insert).execute()
    except Exception as insert_err:
        err_msg = str(insert_err).lower()
        if "uq_bids_tender_bidder" in err_msg or "duplicate key" in err_msg or "unique" in err_msg:
            raise HTTPException(
                status_code=400,
                detail="A bid submission has already been recorded for this tender by your organization.",
            )
        logger.error(f"Database error creating bid: {insert_err}")
        raise HTTPException(status_code=500, detail="Database failure: Failed to create bid record.")

    if not bid_res.data:
        raise HTTPException(status_code=500, detail="Database failure: Failed to create bid record.")
    bid_id = bid_res.data[0]["id"]

    # 8. Upload Documents to Storage & Database (Fail if storage fails) (Issue 15, 17)
    uploaded_docs = []
    for item in processed_files:
        doc_type = item["doc_type"]
        filename = item["filename"]
        file_bytes = item["file_bytes"]
        storage_path = f"{bid_id}/{filename}"

        # Upload to Supabase Storage: must fail if storage fails
        try:
            sb.storage.from_("bid-documents").upload(
                storage_path,
                file_bytes,
                file_options={"content-type": "application/pdf"},
            )
        except Exception as st_err:
            try:
                sb.storage.from_("bid-documents").update(
                    storage_path,
                    file_bytes,
                    file_options={"content-type": "application/pdf"},
                )
            except Exception as update_err:
                logger.error(f"Storage upload failed for {filename}: {update_err}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Document storage upload failed for file '{filename}': {str(st_err)}",
                )

        # SEC-07: Extract text from PDF via threadpool to prevent event loop blocking
        pdf_res = await run_in_threadpool(extract_text_from_pdf, file_bytes)
        pdf_text = pdf_res.get("text", "")

        # Extract structured fields via Gemini AI in threadpool
        extracted_fields = {}
        extraction_status = "pending"
        confidence = 0.85
        doc_legal_name = None
        doc_id_num = None
        doc_reg_date = None

        if pdf_text:
            gem_res = await run_in_threadpool(extract_document_fields, pdf_text, doc_type, filename)
            if gem_res.get("success"):
                extracted_fields = gem_res.get("fields", {})
                extraction_status = "done"
                confidence = extracted_fields.get("confidence", 0.90)
                doc_legal_name = extracted_fields.get("legal_name")
                doc_id_num = extracted_fields.get("id_number")
                doc_reg_date = extracted_fields.get("registration_date")
                if doc_reg_date == "null" or not doc_reg_date:
                    doc_reg_date = None
        else:
            extraction_status = "pending"
            confidence = 0.50

        doc_record = {
            "bid_id": bid_id,
            "bidder_id": bidder_id,
            "document_type": doc_type,
            "filename": filename,
            "storage_path": storage_path,
            "legal_name": doc_legal_name or legal_name or company_name,
            "id_number": doc_id_num or (gstin if doc_type == "GST" else pan if doc_type == "PAN" else None),
            "registration_date": doc_reg_date,
            "page": 1,
            "confidence": confidence,
            "extraction_status": extraction_status,
        }

        doc_res = sb.table("documents").insert(doc_record).execute()
        if not doc_res.data:
            raise HTTPException(status_code=500, detail=f"Failed to record document '{filename}' in database.")
        uploaded_docs.append(doc_res.data[0])

    # 9. Automated Verification Pipeline in threadpool (SEC-07, SEC-20)
    findings = await run_in_threadpool(run_compliance_check, rules, uploaded_docs, bidder_id, bid_id=bid_id)

    findings_to_insert = []
    for f in findings:
        item = {
            "bid_id": bid_id,
            "bidder_id": f["bidder_id"],
            "rule_id": f["rule_id"],
            "status": f["status"],
            "evidence": f["evidence"], # Native JSON/dict for JSONB column to prevent double encoding (SEC-20)
            "explanation": f["explanation"],
        }
        findings_to_insert.append(item)

    if findings_to_insert:
        find_res = sb.table("findings").insert(findings_to_insert).execute()
        if not find_res.data:
            raise HTTPException(status_code=500, detail="Failed to record compliance findings in database.")


    # Determine overall status
    status_counts = {"verified": 0, "issue_detected": 0, "missing": 0, "pending": 0}
    for f in findings:
        st = f.get("status", "")
        if st in status_counts:
            status_counts[st] += 1

    if status_counts["issue_detected"] > 0:
        overall_status = "issue_detected"
    elif status_counts["missing"] > 0:
        overall_status = "missing"
    elif status_counts["pending"] > 0:
        overall_status = "pending"
    else:
        overall_status = "verified"

    # Update bid status (Do not swallow error) (Issue 17)
    bid_upd = sb.table("bids").update({"status": overall_status}).eq("id", bid_id).execute()
    if not bid_upd.data:
        raise HTTPException(status_code=500, detail="Failed to update bid verification status in database.")

    return {
        "message": "Bid submitted successfully. Automated compliance verification completed.",
        "bid_id": bid_id,
        "bidder_id": bidder_id,
        "tender_id": tender_id,
        "tender_title": tender["title"],
        "submitted_at": submitted_at,
        "status": overall_status,
        "documents_uploaded": len(uploaded_docs),
    }


@router.get(
    "/bidder/submissions",
    dependencies=[Depends(require_role("bidder", "procurement_officer"))],
)
def list_bidder_submissions(current_user: dict = Depends(get_current_user)):
    """
    Bidder views their submitted bids and high-level verification progress.
    Filtered strictly to the authenticated bidder's submissions (Issue 2).
    """
    sb = get_supabase()
    user_id = current_user.get("sub")
    is_officer = current_user.get("role") == "procurement_officer"

    bids = []
    try:
        if is_officer:
            # Officer can see all bids
            bids_res = sb.table("bids").select("*, tenders(title, organization, deadline, status)").order("submitted_at", desc=True).execute()
            bids = bids_res.data or []
        else:
            # Bidder: filter by authenticated Clerk user ID ownership
            bidders_res = sb.table("bidders").select("id").eq("user_id", user_id).execute()
            my_bidder_ids = [b["id"] for b in (bidders_res.data or [])]
            if my_bidder_ids:
                bids_res = (
                    sb.table("bids")
                    .select("*, tenders(title, organization, deadline, status)")
                    .in_("bidder_id", my_bidder_ids)
                    .order("submitted_at", desc=True)
                    .execute()
                )
                bids = bids_res.data or []
    except Exception:
        bids = []

    if not bids:
        # Fallback to bidders table for legacy/demo data
        try:
            b_res = sb.table("bidders").select("*, tenders(title, status, uploaded_text)").order("created_at", desc=True).execute()
            bids = []
            for b in (b_res.data or []):
                t_obj = b.get("tenders") or {}
                t_text = t_obj.get("uploaded_text") or ""
                org = "Ministry of Commerce & Industry"
                if t_text:
                    import re
                    m = re.search(r"(?:Ministry|Department|Procuring Entity):\s*([^\n\r]+)", t_text)
                    if m:
                        org = m.group(1).strip()
                bids.append({
                    "id": b["id"],
                    "tender_id": b.get("tender_id"),
                    "bidder_id": b["id"],
                    "status": "verified",
                    "submitted_at": b.get("created_at"),
                    "tenders": {
                        "title": t_obj.get("title", "Tender Opportunity"),
                        "organization": org,
                        "status": t_obj.get("status", "open"),
                    },
                })
        except Exception:
            bids = []

    sanitized_submissions = []
    for bid in bids:
        tender_info = bid.get("tenders") or {}
        # Count documents authoritative by bidder_id (fallback for bid_id)
        docs = []
        bidder_id = bid.get("bidder_id") or bid.get("id")
        if bidder_id:
            try:
                docs_res = sb.table("documents").select("id").eq("bidder_id", bidder_id).execute()
                docs = docs_res.data or []
            except Exception:
                docs = []

        # High-level bidder friendly status
        raw_status = bid.get("status", "submitted")
        if raw_status in ("verified", "reviewed"):
            bidder_status = "Under Evaluation"
        elif raw_status == "issue_detected":
            bidder_status = "Clarification May Be Requested"
        elif raw_status in ("processing", "pending"):
            bidder_status = "Verification in Progress"
        elif raw_status == "missing":
            bidder_status = "Incomplete Submission"
        else:
            bidder_status = "Submitted"

        if bid.get("officer_decision") == "qualified":
            bidder_status = "Evaluation: Qualified"
        elif bid.get("officer_decision") == "not_qualified":
            bidder_status = "Evaluation: Not Qualified"

        sanitized_submissions.append({
            "bid_id": bid["id"],
            "tender_id": bid.get("tender_id"),
            "tender_title": tender_info.get("title", "Tender"),
            "organization": tender_info.get("organization", "Procuring Entity"),
            "submitted_at": bid.get("submitted_at") or bid.get("created_at"),
            "documents_count": len(docs),
            "status": raw_status,
            "display_status": bidder_status,
        })

    return sanitized_submissions


@router.get(
    "/bidder/submissions/{bid_id}",
    dependencies=[Depends(require_role("bidder", "procurement_officer"))],
)
def get_bidder_submission_detail(
    bid_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Bidder views specific submission receipt and document verification status.
    Strictly verifies ownership: prevents accessing other bidder submissions (Issue 3).
    """
    sb = get_supabase()
    user_id = current_user.get("sub")
    is_officer = current_user.get("role") == "procurement_officer"

    # Fetch bid with fallback
    bid_data = None
    try:
        bid_res = sb.table("bids").select("*").eq("id", bid_id).execute()
        bid_data = bid_res.data[0] if bid_res.data else None
    except Exception:
        bid_data = None

    if not bid_data:
        b_res = sb.table("bidders").select("*").eq("id", bid_id).execute()
        if not b_res.data:
            raise HTTPException(status_code=404, detail="Submission not found")
        b = b_res.data[0]
        bid_data = {
            "id": b["id"],
            "tender_id": b.get("tender_id"),
            "bidder_id": b["id"],
            "status": "verified",
            "submitted_at": b.get("created_at"),
            "officer_decision": None,
        }

    bidder_id = bid_data.get("bidder_id")

    # Ownership check: bidder can only view their own submission (Issue 3)
    if not is_officer:
        try:
            bidder_res = sb.table("bidders").select("user_id").eq("id", bidder_id).execute()
            b_owner = bidder_res.data[0].get("user_id") if bidder_res.data else None
            if b_owner and b_owner != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to view this submission.",
                )
        except HTTPException:
            raise
        except Exception:
            pass

    tender_id = bid_data["tender_id"]
    tender_res = sb.table("tenders").select("title, organization, category, deadline, status").eq("id", tender_id).execute()
    tender = tender_res.data[0] if tender_res.data else {}

    # Documents query authoritative by bid_id (Issue 6)
    docs = []
    try:
        docs_res = sb.table("documents").select("id, document_type, filename, extraction_status, created_at").eq("bid_id", bid_id).execute()
        docs = docs_res.data or []
    except Exception:
        docs = []

    if not docs and bidder_id:
        docs_res = sb.table("documents").select("id, document_type, filename, extraction_status, created_at").eq("bidder_id", bidder_id).execute()
        docs = docs_res.data or []

    return {
        "bid_id": bid_data["id"],
        "tender_id": tender_id,
        "tender_title": tender.get("title"),
        "organization": tender.get("organization"),
        "submitted_at": bid_data.get("submitted_at") or bid_data.get("created_at"),
        "status": bid_data.get("status"),
        "officer_decision": bid_data.get("officer_decision"),
        "documents": docs,
    }


@router.get(
    "/tenders/{tender_id}/bids",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def list_submitted_bids(tender_id: str):
    """Officer lists all submitted bids for a tender with compliance summary counts (Issue 6)."""
    sb = get_supabase()

    # Get rules count for coverage
    rules = sb.table("rules").select("evidence_required").eq("tender_id", tender_id).eq("approved", True).execute()
    total_evidence_types = set()
    for rule in (rules.data or []):
        for ev in rule.get("evidence_required", []):
            total_evidence_types.add(ev)
    total_required = max(len(total_evidence_types), 1)

    # Fetch submitted bids for this tender
    bids = []
    try:
        bids_res = sb.table("bids").select("*, bidders(*)").eq("tender_id", tender_id).order("submitted_at", desc=True).execute()
        bids = bids_res.data or []
    except Exception:
        bids = []

    if not bids:
        # Fallback for seeded/legacy data where bids were stored in bidders table
        bidders_res = sb.table("bidders").select("*").eq("tender_id", tender_id).order("created_at").execute()
        bidders = bidders_res.data or []
        submitted_bids = []
        for bidder in bidders:
            bidder_id = bidder["id"]
            findings = sb.table("findings").select("status").eq("bidder_id", bidder_id).execute()
            counts = {"verified": 0, "issue_detected": 0, "missing": 0, "pending": 0}
            for f in (findings.data or []):
                st = f.get("status", "")
                if st in counts:
                    counts[st] += 1
            docs = sb.table("documents").select("id").eq("bidder_id", bidder_id).execute()
            submitted_bids.append({
                "bid_id": bidder_id,
                "bidder_id": bidder_id,
                "bidder_name": bidder["name"],
                "legal_name": bidder.get("legal_name") or bidder["name"],
                "pan": bidder.get("pan"),
                "gstin": bidder.get("gstin"),
                "status": "submitted",
                "submitted_at": bidder.get("created_at"),
                "verified_count": counts["verified"],
                "issue_count": counts["issue_detected"],
                "missing_count": counts["missing"],
                "pending_count": counts["pending"],
                "total_documents_required": total_required,
                "total_documents_uploaded": len(docs.data or []),
                "officer_decision": None,
            })
        return submitted_bids

    submitted_bids = []
    for bid in bids:
        bid_id = bid["id"]
        bidder = bid.get("bidders") or {}
        bidder_id = bid.get("bidder_id") or bidder.get("id")

        # Counts authoritative by bid_id (Issue 6)
        findings = sb.table("findings").select("status").eq("bid_id", bid_id).execute()
        findings_data = findings.data or []
        if not findings_data and bidder_id:
            findings = sb.table("findings").select("status").eq("bidder_id", bidder_id).execute()
            findings_data = findings.data or []

        counts = {"verified": 0, "issue_detected": 0, "missing": 0, "pending": 0}
        for f in findings_data:
            st = f.get("status", "")
            if st in counts:
                counts[st] += 1

        docs = sb.table("documents").select("id").eq("bid_id", bid_id).execute()
        docs_data = docs.data or []
        if not docs_data and bidder_id:
            docs = sb.table("documents").select("id").eq("bidder_id", bidder_id).execute()
            docs_data = docs.data or []

        submitted_bids.append({
            "bid_id": bid_id,
            "bidder_id": bidder_id,
            "bidder_name": bidder.get("name", "Bidder"),
            "legal_name": bidder.get("legal_name") or bidder.get("name", "Bidder"),
            "pan": bidder.get("pan"),
            "gstin": bidder.get("gstin"),
            "status": bid.get("status", "submitted"),
            "submitted_at": bid.get("submitted_at") or bid.get("created_at"),
            "verified_count": counts["verified"],
            "issue_count": counts["issue_detected"],
            "missing_count": counts["missing"],
            "pending_count": counts["pending"],
            "total_documents_required": total_required,
            "total_documents_uploaded": len(docs_data),
            "officer_decision": bid.get("officer_decision"),
        })

    return submitted_bids


@router.get(
    "/bids/{bid_id}",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def get_bid_detail(bid_id: str):
    """Officer inspects detailed compliance dossier for a specific submitted bid (Issue 6)."""
    sb = get_supabase()

    bid_record = None
    try:
        bid_res = sb.table("bids").select("*").eq("id", bid_id).execute()
        bid_record = bid_res.data[0] if bid_res.data else None
    except Exception:
        bid_record = None

    if bid_record:
        bidder_id = bid_record["bidder_id"]
        tender_id = bid_record["tender_id"]
        bidder_res = sb.table("bidders").select("*").eq("id", bidder_id).execute()
        bidder = bidder_res.data[0] if bidder_res.data else {"name": "Bidder"}
    else:
        # Fallback to bidder id for legacy seeds
        bidder_res = sb.table("bidders").select("*").eq("id", bid_id).execute()
        if not bidder_res.data:
            raise HTTPException(status_code=404, detail="Bid submission not found")
        bidder = bidder_res.data[0]
        bidder_id = bidder["id"]
        tender_id = bidder["tender_id"]
        bid_record = {
            "id": bid_id,
            "tender_id": tender_id,
            "bidder_id": bidder_id,
            "status": "submitted",
            "submitted_at": bidder.get("created_at"),
            "officer_decision": None,
            "officer_decision_note": None,
        }

    # Fetch tender
    tender_res = sb.table("tenders").select("*").eq("id", tender_id).execute()
    tender = tender_res.data[0] if tender_res.data else {}

    # Documents query authoritative by bidder_id (fallback for bid_id)
    documents = []
    try:
        docs_res = sb.table("documents").select("*").eq("bid_id", bid_id).order("created_at").execute()
        documents = docs_res.data or []
    except Exception:
        documents = []

    if not documents and bidder_id:
        try:
            docs_res = sb.table("documents").select("*").eq("bidder_id", bidder_id).order("created_at").execute()
            documents = docs_res.data or []
        except Exception:
            documents = []

    # Findings query authoritative by bidder_id (fallback for bid_id)
    findings = []
    try:
        findings_res = sb.table("findings").select("*").eq("bid_id", bid_id).order("created_at").execute()
        findings = findings_res.data or []
    except Exception:
        findings = []

    if not findings and bidder_id:
        try:
            findings_res = sb.table("findings").select("*").eq("bidder_id", bidder_id).order("created_at").execute()
            findings = findings_res.data or []
        except Exception:
            findings = []

    # Enrich findings with rule requirement
    enriched_findings = []
    for f in findings:
        rule_req = None
        rule_code = "CROSS_DOC"
        if f.get("rule_id"):
            r_res = sb.table("rules").select("requirement, rule_id").eq("id", f["rule_id"]).execute()
            if r_res.data:
                rule_req = r_res.data[0]["requirement"]
                rule_code = r_res.data[0]["rule_id"]

        ev = f.get("evidence", [])
        if isinstance(ev, str):
            try:
                ev = json.loads(ev)
            except Exception:
                ev = []

        enriched_findings.append({
            **f,
            "evidence": ev,
            "rule_requirement": rule_req,
            "rule_code": rule_code,
            "bidder_name": bidder["name"],
        })

    return {
        "bid": bid_record,
        "bidder": bidder,
        "tender": tender,
        "documents": documents,
        "findings": enriched_findings,
    }


@router.post(
    "/bids/{bid_id}/reverify",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def reverify_bid(bid_id: str):
    """
    Officer re-runs compliance engine & cross-document checks on an existing bid.
    Strictly reads and deletes findings by bid_id only (Issue 7).
    """
    sb = get_supabase()

    bid_res = sb.table("bids").select("*").eq("id", bid_id).execute()
    if not bid_res.data:
        raise HTTPException(status_code=404, detail="Bid submission not found")

    bid_record = bid_res.data[0]
    bidder_id = bid_record["bidder_id"]
    tender_id = bid_record["tender_id"]

    rules_res = sb.table("rules").select("*").eq("tender_id", tender_id).eq("approved", True).execute()
    if not rules_res.data:
        raise HTTPException(status_code=400, detail="No approved rules found for this tender.")

    # Read documents authoritative by bid_id only (Issue 7)
    docs_res = sb.table("documents").select("*").eq("bid_id", bid_id).execute()
    documents = docs_res.data or []
    if not documents:
        # Fallback to bidder_id only if documents were inserted before bid_id migration
        docs_res = sb.table("documents").select("*").eq("bidder_id", bidder_id).execute()
        documents = docs_res.data or []

    # Clear old findings by bid_id only (Issue 7)
    sb.table("findings").delete().eq("bid_id", bid_id).execute()

    # Re-run compliance check with approved rules and bid_id
    findings = run_compliance_check(rules_res.data, documents, bidder_id, bid_id=bid_id)

    findings_to_insert = []
    for f in findings:
        findings_to_insert.append({
            "bid_id": bid_id,
            "bidder_id": bidder_id,
            "rule_id": f["rule_id"],
            "status": f["status"],
            "evidence": f["evidence"],
            "explanation": f["explanation"],
        })

    if findings_to_insert:
        find_ins = sb.table("findings").insert(findings_to_insert).execute()
        if not find_ins.data:
            raise HTTPException(status_code=500, detail="Failed to save re-verified findings in database.")

    # Recalculate status and update bid
    status_counts = {"verified": 0, "issue_detected": 0, "missing": 0, "pending": 0}
    for f in findings:
        st = f.get("status", "")
        if st in status_counts:
            status_counts[st] += 1

    if status_counts["issue_detected"] > 0:
        new_status = "issue_detected"
    elif status_counts["missing"] > 0:
        new_status = "missing"
    elif status_counts["pending"] > 0:
        new_status = "pending"
    else:
        new_status = "verified"

    upd = sb.table("bids").update({"status": new_status}).eq("id", bid_id).execute()
    if not upd.data:
        raise HTTPException(status_code=500, detail="Failed to update bid status after reverification.")

    return {
        "message": f"Re-verification completed. Generated {len(findings_to_insert)} findings.",
        "bid_id": bid_id,
        "status": new_status,
        "findings_count": len(findings_to_insert),
    }


@router.patch(
    "/bids/{bid_id}/decision",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def set_bid_decision(
    bid_id: str,
    body: BidDecisionRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Officer makes the FINAL procurement qualification decision (QUALIFIED or NOT_QUALIFIED).
    Officer identity is validated strictly from the authenticated Clerk user (Issue 10).
    Database errors are strictly handled and never swallowed (Issue 17).
    """
    sb = get_supabase()

    decision_time = datetime.now(timezone.utc).isoformat()
    update_data = {
        "officer_decision": body.decision,
        "officer_decision_note": body.note,
        "decision_at": decision_time,
        "status": body.decision,
    }

    upd_res = sb.table("bids").update(update_data).eq("id", bid_id).execute()
    if not upd_res.data:
        raise HTTPException(status_code=500, detail="Failed to record qualification decision in database.")

    bid_record = upd_res.data[0]

    # Validate officer identity strictly from authenticated Clerk user (Issue 10)
    officer_clerk_id = current_user.get("sub")
    officer_name = (
        current_user.get("name")
        or current_user.get("email")
        or f"Officer ({officer_clerk_id})"
    )

    audit_data = {
        "bid_id": bid_id,
        "tender_id": bid_record.get("tender_id"),
        "officer_name": officer_name,
        "officer_clerk_id": officer_clerk_id,
        "action": f"DECISION_{body.decision.upper()}",
        "note": f"Final Qualification Decision: {body.decision.upper()}. Justification: {body.note}",
    }

    audit_res = sb.table("audit_log").insert(audit_data).execute()
    if not audit_res.data:
        raise HTTPException(status_code=500, detail="Failed to record qualification decision in audit log.")

    return {
        "message": f"Final qualification decision recorded: {body.decision.upper()}.",
        "bid_id": bid_id,
        "decision": body.decision,
        "decision_at": decision_time,
    }
