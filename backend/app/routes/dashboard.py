"""Dashboard route: aggregated compliance data per tender for Officer Review."""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_role
from app.supabase_client import get_supabase

router = APIRouter()


@router.get(
    "/tenders/{tender_id}/dashboard",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def get_dashboard(tender_id: str, bidder_filter: Optional[str] = None, status_filter: Optional[str] = None):
    sb = get_supabase()

    # Get tender
    tender = sb.table("tenders").select("*").eq("id", tender_id).execute()
    if not tender.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender_data = tender.data[0]

    # Get rules for document count
    rules = sb.table("rules").select("*").eq("tender_id", tender_id).execute()
    total_evidence_types = set()
    for rule in (rules.data or []):
        for ev in rule.get("evidence_required", []):
            total_evidence_types.add(ev)
    total_required = max(len(total_evidence_types), 1)

    # Get bidders
    bidders = sb.table("bidders").select("*").eq("tender_id", tender_id).execute()
    bidders_data = bidders.data or []

    bid_summaries = []
    for bidder in bidders_data:
        bidder_id = bidder["id"]

        # Look for corresponding bid record
        try:
            bids_res = sb.table("bids").select("*").eq("tender_id", tender_id).eq("bidder_id", bidder_id).execute()
            bid_record = bids_res.data[0] if bids_res.data else None
        except Exception:
            bid_record = None

        bid_id = bid_record["id"] if bid_record else bidder_id
        submitted_at = bid_record.get("submitted_at") if bid_record else bidder.get("created_at")
        decision = bid_record.get("officer_decision") if bid_record else None

        # Get findings for this bidder
        findings = sb.table("findings").select("*").eq("bidder_id", bidder_id).execute()
        findings_data = findings.data or []

        # Count by status
        counts = {"verified": 0, "issue_detected": 0, "missing": 0, "pending": 0}
        for f in findings_data:
            st = f.get("status", "")
            if st in counts:
                counts[st] += 1

        # Get document count
        docs = sb.table("documents").select("id").eq("bidder_id", bidder_id).execute()
        docs_uploaded = len(docs.data or [])

        # Overall bid status
        if counts["issue_detected"] > 0:
            bid_status = "issue_detected"
        elif counts["missing"] > 0:
            bid_status = "missing"
        elif counts["pending"] > 0:
            bid_status = "pending"
        else:
            bid_status = "verified"

        bid_summaries.append({
            "bid_id": bid_id,
            "bidder_id": bidder_id,
            "bidder_name": bidder["name"],
            "legal_name": bidder.get("legal_name") or bidder["name"],
            "status": bid_status,
            "submitted_at": submitted_at,
            "verified_count": counts["verified"],
            "issue_count": counts["issue_detected"],
            "missing_count": counts["missing"],
            "pending_count": counts["pending"],
            "total_documents_required": total_required,
            "total_documents_uploaded": docs_uploaded,
            "officer_decision": decision,
        })

    # Get all findings with bidder and rule info
    all_findings = []
    for bidder in bidders_data:
        findings_query = sb.table("findings").select("*").eq("bidder_id", bidder["id"])
        if status_filter:
            findings_query = findings_query.eq("status", status_filter)

        findings = findings_query.execute()

        for f in (findings.data or []):
            rule_req = None
            rule_code = "CROSS_DOC"
            if f.get("rule_id"):
                rule = sb.table("rules").select("requirement, rule_id").eq("id", f["rule_id"]).execute()
                if rule.data:
                    rule_req = rule.data[0]["requirement"]
                    rule_code = rule.data[0]["rule_id"]

            ev = f.get("evidence", [])
            if isinstance(ev, str):
                try:
                    ev = json.loads(ev)
                except Exception:
                    ev = []

            all_findings.append({
                "id": f["id"],
                "bid_id": f.get("bid_id") or bidder["id"],
                "bidder_id": f["bidder_id"],
                "rule_id": f.get("rule_id"),
                "rule_code": rule_code,
                "status": f["status"],
                "evidence": ev,
                "explanation": f["explanation"],
                "officer_action": f.get("officer_action"),
                "officer_note": f.get("officer_note"),
                "action_at": f.get("action_at"),
                "created_at": f["created_at"],
                "bidder_name": bidder["name"],
                "rule_requirement": rule_req,
            })

    if bidder_filter:
        all_findings = [f for f in all_findings if f["bidder_id"] == bidder_filter or f["bid_id"] == bidder_filter]

    return {
        "tender_id": tender_id,
        "tender_title": tender_data["title"],
        "status": tender_data.get("status", "draft"),
        "bids": bid_summaries,
        "findings": all_findings,
    }
