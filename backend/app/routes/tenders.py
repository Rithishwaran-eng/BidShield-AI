"""Tender routes: create, list, get, extract rules, update rules."""

import json
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_role
from app.models import TenderCreate, TenderResponse, RuleResponse, RuleUpdate
from app.supabase_client import get_supabase
from app.services.gemini_extraction import extract_tender_rules

router = APIRouter()


@router.post(
    "",
    response_model=TenderResponse,
    dependencies=[Depends(require_role("procurement_officer", "administrator"))],
)
def create_tender(body: TenderCreate):
    sb = get_supabase()
    result = sb.table("tenders").insert({
        "title": body.title,
        "uploaded_text": body.uploaded_text,
        "status": "draft",
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create tender")

    return result.data[0]


@router.get("", response_model=list[TenderResponse])
def list_tenders():
    sb = get_supabase()
    result = sb.table("tenders").select("*").order("created_at", desc=True).execute()
    return result.data


@router.get(
    "/{tender_id}",
    response_model=TenderResponse,
    dependencies=[Depends(require_role("procurement_officer", "administrator", "auditor"))],
)
def get_tender(tender_id: str):
    sb = get_supabase()
    result = sb.table("tenders").select("*").eq("id", tender_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    return result.data[0]


@router.post(
    "/{tender_id}/extract-rules",
    dependencies=[Depends(require_role("procurement_officer", "administrator"))],
)
def extract_rules(tender_id: str):
    sb = get_supabase()

    # Get tender
    tender = sb.table("tenders").select("*").eq("id", tender_id).execute()
    if not tender.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender_text = tender.data[0].get("uploaded_text", "")
    if not tender_text:
        raise HTTPException(status_code=400, detail="Tender has no text content to extract from")

    # Call Gemini for rule extraction
    extraction = extract_tender_rules(tender_text)

    if not extraction["success"]:
        # Update tender status to indicate failure
        sb.table("tenders").update({"status": "draft"}).eq("id", tender_id).execute()
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

    # Update tender status
    sb.table("tenders").update({"status": "rules_pending"}).eq("id", tender_id).execute()

    # Return the inserted rules
    result = sb.table("rules").select("*").eq("tender_id", tender_id).execute()

    return {
        "message": f"Extracted {len(rules_to_insert)} rules",
        "rules": result.data,
    }


@router.get(
    "/{tender_id}/rules",
    response_model=list[RuleResponse],
    dependencies=[Depends(require_role("procurement_officer", "administrator", "auditor"))],
)
def get_rules(tender_id: str):
    sb = get_supabase()
    result = sb.table("rules").select("*").eq("tender_id", tender_id).execute()
    return result.data


@router.patch(
    "/{tender_id}/rules",
    dependencies=[Depends(require_role("procurement_officer", "administrator"))],
)
def update_rules(tender_id: str, body: RuleUpdate):
    sb = get_supabase()

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

    # Update tender status if approving
    if body.approve:
        sb.table("tenders").update({"status": "active"}).eq("id", tender_id).execute()

    result = sb.table("rules").select("*").eq("tender_id", tender_id).execute()
    return {
        "message": "Rules updated" + (" and approved" if body.approve else ""),
        "rules": result.data,
    }

