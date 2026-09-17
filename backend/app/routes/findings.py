"""Findings routes: get finding detail, officer action."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_role
from app.models import FindingResponse, FindingActionRequest
from app.supabase_client import get_supabase

router = APIRouter()


@router.get(
    "/{finding_id}",
    dependencies=[Depends(require_role("procurement_officer", "administrator", "auditor"))]
)
def get_finding(finding_id: str):
    sb = get_supabase()

    finding = sb.table("findings").select("*").eq("id", finding_id).execute()
    if not finding.data:
        raise HTTPException(status_code=404, detail="Finding not found")

    f = finding.data[0]

    # Get bidder name
    bidder_name = None
    if f.get("bidder_id"):
        bidder = sb.table("bidders").select("name").eq("id", f["bidder_id"]).execute()
        if bidder.data:
            bidder_name = bidder.data[0]["name"]

    # Get rule requirement
    rule_requirement = None
    if f.get("rule_id"):
        rule = sb.table("rules").select("*").eq("id", f["rule_id"]).execute()
        if rule.data:
            rule_requirement = rule.data[0]["requirement"]

    # Parse evidence
    evidence = f.get("evidence", [])
    if isinstance(evidence, str):
        try:
            evidence = json.loads(evidence)
        except (json.JSONDecodeError, TypeError):
            evidence = []

    # Get audit actions for this finding
    audit = sb.table("audit_log").select("*").eq("finding_id", finding_id).order("created_at", desc=True).execute()

    # Get documents for this bidder
    documents = []
    if f.get("bidder_id"):
        docs = sb.table("documents").select("*").eq("bidder_id", f["bidder_id"]).execute()
        documents = docs.data

    return {
        "id": f["id"],
        "bidder_id": f.get("bidder_id"),
        "bidder_name": bidder_name,
        "rule_id": f.get("rule_id"),
        "rule_requirement": rule_requirement,
        "status": f["status"],
        "evidence": evidence,
        "explanation": f["explanation"],
        "officer_action": f.get("officer_action"),
        "officer_note": f.get("officer_note"),
        "action_at": f.get("action_at"),
        "created_at": f["created_at"],
        "audit_history": audit.data,
        "documents": documents,
    }


@router.patch("/{finding_id}/action")
def take_action(
    finding_id: str,
    body: FindingActionRequest,
    current_user: dict = Depends(require_role("procurement_officer", "administrator")),
):
    sb = get_supabase()

    # Verify finding exists
    finding = sb.table("findings").select("*").eq("id", finding_id).execute()
    if not finding.data:
        raise HTTPException(status_code=404, detail="Finding not found")

    # Override requires a note
    if body.action == "override" and not body.note:
        raise HTTPException(
            status_code=400,
            detail="Override action requires a note explaining the rationale."
        )

    # Update finding with officer action
    sb.table("findings").update({
        "officer_action": body.action,
        "officer_note": body.note,
        "action_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", finding_id).execute()

    # Create audit log entry with officer_clerk_id
    officer_clerk_id = current_user.get("sub")
    audit_data = {
        "finding_id": finding_id,
        "officer_name": body.officer_name or current_user.get("email") or "Procurement Officer",
        "action": body.action,
        "note": body.note,
    }
    if officer_clerk_id:
        audit_data["officer_clerk_id"] = officer_clerk_id

    try:
        sb.table("audit_log").insert(audit_data).execute()
    except Exception as e:
        # Fallback if officer_clerk_id column not yet migrated in Supabase
        audit_data.pop("officer_clerk_id", None)
        sb.table("audit_log").insert(audit_data).execute()

    return {
        "message": f"Action '{body.action}' recorded for finding.",
        "finding_id": finding_id,
        "action": body.action,
    }


@router.patch("/{finding_id}/reopen")
def reopen_finding(
    finding_id: str,
    officer_name: str = "Procurement Officer",
    current_user: dict = Depends(require_role("procurement_officer", "administrator")),
):
    sb = get_supabase()

    finding = sb.table("findings").select("*").eq("id", finding_id).execute()
    if not finding.data:
        raise HTTPException(status_code=404, detail="Finding not found")

    # Clear the officer action
    sb.table("findings").update({
        "officer_action": None,
        "officer_note": None,
        "action_at": None,
    }).eq("id", finding_id).execute()

    # Log the reopen action with officer_clerk_id
    officer_clerk_id = current_user.get("sub")
    audit_data = {
        "finding_id": finding_id,
        "officer_name": officer_name or current_user.get("email") or "Procurement Officer",
        "action": "reopen",
        "note": "Finding reopened for further review.",
    }
    if officer_clerk_id:
        audit_data["officer_clerk_id"] = officer_clerk_id

    try:
        sb.table("audit_log").insert(audit_data).execute()
    except Exception as e:
        audit_data.pop("officer_clerk_id", None)
        sb.table("audit_log").insert(audit_data).execute()

    return {"message": "Finding reopened.", "finding_id": finding_id}
