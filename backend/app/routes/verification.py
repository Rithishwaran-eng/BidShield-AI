"""Verification route: runs compliance check for a bidder."""

import json
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_role
from app.supabase_client import get_supabase
from app.services.compliance_engine import run_compliance_check

router = APIRouter()


@router.post(
    "/bidders/{bidder_id}/verify",
    dependencies=[Depends(require_role("procurement_officer", "administrator"))],
)
def verify_bidder(bidder_id: str):

    sb = get_supabase()

    # Get bidder
    bidder = sb.table("bidders").select("*").eq("id", bidder_id).execute()
    if not bidder.data:
        raise HTTPException(status_code=404, detail="Bidder not found")

    tender_id = bidder.data[0]["tender_id"]

    # Get approved rules for the tender
    rules = sb.table("rules").select("*").eq("tender_id", tender_id).eq("approved", True).execute()
    if not rules.data:
        raise HTTPException(
            status_code=400,
            detail="No approved rules found for this tender. Approve rules before running verification."
        )

    # Get bidder documents
    documents = sb.table("documents").select("*").eq("bidder_id", bidder_id).execute()

    # Delete existing findings for this bidder (re-run scenario)
    sb.table("findings").delete().eq("bidder_id", bidder_id).execute()

    # Run compliance check
    findings = run_compliance_check(rules.data, documents.data, bidder_id)

    # Insert findings
    findings_to_insert = []
    for finding in findings:
        findings_to_insert.append({
            "bidder_id": finding["bidder_id"],
            "rule_id": finding["rule_id"],
            "status": finding["status"],
            "evidence": json.dumps(finding["evidence"]),
            "explanation": finding["explanation"],
        })

    if findings_to_insert:
        sb.table("findings").insert(findings_to_insert).execute()

    # Return findings
    result = sb.table("findings").select("*").eq("bidder_id", bidder_id).execute()

    # Count by status
    status_counts = {"verified": 0, "issue_detected": 0, "missing": 0, "pending": 0}
    for f in result.data:
        status = f.get("status", "")
        if status in status_counts:
            status_counts[status] += 1

    return {
        "message": f"Verification complete. {len(result.data)} findings generated.",
        "bidder_id": bidder_id,
        "status_counts": status_counts,
        "findings": result.data,
    }
