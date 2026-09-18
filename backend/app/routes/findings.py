"""Findings routes: detailed evidence inspection and officer human-in-the-loop review actions."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user, require_role
from app.models import FindingActionRequest
from app.supabase_client import get_supabase

router = APIRouter()


@router.get(
    "/{finding_id}",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def get_finding(finding_id: str):
    sb = get_supabase()

    finding = sb.table("findings").select("*").eq("id", finding_id).execute()
    if not finding.data:
        raise HTTPException(status_code=404, detail="Finding not found")

    f = finding.data[0]
    bidder_id = f.get("bidder_id")

    # Get bidder details
    bidder_name = None
    if bidder_id:
        bidder = sb.table("bidders").select("name, legal_name").eq("id", bidder_id).execute()
        if bidder.data:
            bidder_name = bidder.data[0]["name"]

    # Get rule details
    rule_requirement = None
    rule_code = "CROSS_DOC"
    if f.get("rule_id"):
        rule = sb.table("rules").select("*").eq("id", f["rule_id"]).execute()
        if rule.data:
            rule_requirement = rule.data[0]["requirement"]
            rule_code = rule.data[0]["rule_id"]

    # Parse evidence
    evidence = f.get("evidence", [])
    if isinstance(evidence, str):
        try:
            evidence = json.loads(evidence)
        except (json.JSONDecodeError, TypeError):
            evidence = []

    # Get audit history for this finding
    audit = sb.table("audit_log").select("*").eq("finding_id", finding_id).order("created_at", desc=True).execute()

    # Get documents for this bid / bidder
    documents = []
    bid_id = f.get("bid_id")
    if bid_id:
        docs = sb.table("documents").select("*").eq("bid_id", bid_id).execute()
        documents = docs.data or []
    elif bidder_id:
        docs = sb.table("documents").select("*").eq("bidder_id", bidder_id).execute()
        documents = docs.data or []

    return {
        "id": f["id"],
        "bid_id": bid_id or bidder_id,
        "bidder_id": bidder_id,
        "bidder_name": bidder_name,
        "rule_id": f.get("rule_id"),
        "rule_code": rule_code,
        "rule_requirement": rule_requirement,
        "status": f["status"],
        "evidence": evidence,
        "explanation": f["explanation"],
        "officer_action": f.get("officer_action"),
        "officer_note": f.get("officer_note"),
        "action_at": f.get("action_at"),
        "created_at": f["created_at"],
        "audit_history": audit.data or [],
        "documents": documents,
    }


@router.patch(
    "/{finding_id}/action",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def take_action(
    finding_id: str,
    body: FindingActionRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Officer records a review action on a compliance finding:
    - accept: officer concurs with AI finding
    - reject: officer rejects AI finding
    - request_clarification: officer issues clarification request to bidder
    - mark_verified: officer manually validates compliance
    - override: officer overrides check (requires mandatory rationale note)

    Officer identity is validated strictly from the authenticated Clerk user.
    """
    sb = get_supabase()

    # Verify finding exists
    finding = sb.table("findings").select("*").eq("id", finding_id).execute()
    if not finding.data:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding_record = finding.data[0]

    # Override requires a mandatory justification note
    if body.action == "override" and (not body.note or not body.note.strip()):
        raise HTTPException(
            status_code=400,
            detail="Override action requires an explanatory rationale note."
        )

    action_time = datetime.now(timezone.utc).isoformat()

    # Update finding with officer action
    update_res = sb.table("findings").update({
        "officer_action": body.action,
        "officer_note": body.note,
        "action_at": action_time,
    }).eq("id", finding_id).execute()

    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to record officer action in database.")

    # Strictly validate officer identity from authenticated Clerk user (Issue 10)
    officer_clerk_id = current_user.get("sub")
    officer_name = (
        current_user.get("name")
        or current_user.get("email")
        or f"Officer ({officer_clerk_id})"
    )

    audit_data = {
        "finding_id": finding_id,
        "officer_name": officer_name,
        "officer_clerk_id": officer_clerk_id,
        "action": body.action.upper(),
        "note": body.note or f"Finding marked as {body.action.replace('_', ' ')}",
    }
    if finding_record.get("bid_id"):
        audit_data["bid_id"] = finding_record["bid_id"]

    audit_res = sb.table("audit_log").insert(audit_data).execute()
    if not audit_res.data:
        raise HTTPException(status_code=500, detail="Failed to write action to audit log.")

    return {
        "message": f"Action '{body.action}' successfully recorded.",
        "finding_id": finding_id,
        "action": body.action,
        "action_at": action_time,
    }


@router.patch(
    "/{finding_id}/reopen",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def reopen_finding(
    finding_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Reopen a previously acted-upon finding.
    Officer identity is validated strictly from authenticated Clerk user.
    """
    sb = get_supabase()

    finding = sb.table("findings").select("*").eq("id", finding_id).execute()
    if not finding.data:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding_record = finding.data[0]

    # Clear the officer action
    update_res = sb.table("findings").update({
        "officer_action": None,
        "officer_note": None,
        "action_at": None,
    }).eq("id", finding_id).execute()

    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to reopen finding in database.")

    # Log reopen action with verified officer identity (Issue 10)
    officer_clerk_id = current_user.get("sub")
    officer_name = (
        current_user.get("name")
        or current_user.get("email")
        or f"Officer ({officer_clerk_id})"
    )

    audit_data = {
        "finding_id": finding_id,
        "officer_name": officer_name,
        "officer_clerk_id": officer_clerk_id,
        "action": "REOPEN_REVIEW",
        "note": "Finding reopened for reconsideration.",
    }
    if finding_record.get("bid_id"):
        audit_data["bid_id"] = finding_record["bid_id"]

    audit_res = sb.table("audit_log").insert(audit_data).execute()
    if not audit_res.data:
        raise HTTPException(status_code=500, detail="Failed to write reopen action to audit log.")

    return {"message": "Finding reopened for review.", "finding_id": finding_id}

