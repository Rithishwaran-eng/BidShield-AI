"""Audit log routes: list audit entries for a tender."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_role
from app.supabase_client import get_supabase

router = APIRouter()


@router.get(
    "/tenders/{tender_id}/audit",
    dependencies=[Depends(require_role("procurement_officer", "administrator", "auditor"))],
)
def get_audit_log(tender_id: str):

    sb = get_supabase()

    # Get all bidders for this tender
    bidders = sb.table("bidders").select("id").eq("tender_id", tender_id).execute()
    bidder_ids = [b["id"] for b in bidders.data]

    if not bidder_ids:
        return []

    # Get all findings for these bidders
    all_findings = []
    for bid_id in bidder_ids:
        findings = sb.table("findings").select("id").eq("bidder_id", bid_id).execute()
        all_findings.extend(findings.data)

    finding_ids = [f["id"] for f in all_findings]

    if not finding_ids:
        return []

    # Get audit log entries for these findings
    all_audit = []
    for fid in finding_ids:
        audit = sb.table("audit_log").select("*").eq("finding_id", fid).execute()
        all_audit.extend(audit.data)

    # Sort by timestamp descending
    all_audit.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Enrich with finding/rule info
    enriched = []
    for entry in all_audit:
        finding_id = entry.get("finding_id")
        finding_info = None
        rule_info = None

        if finding_id:
            finding = sb.table("findings").select("rule_id, status, bidder_id").eq("id", finding_id).execute()
            if finding.data:
                finding_info = finding.data[0]
                if finding_info.get("rule_id"):
                    rule = sb.table("rules").select("requirement, rule_id").eq("id", finding_info["rule_id"]).execute()
                    if rule.data:
                        rule_info = rule.data[0]

                # Get bidder name
                bidder = sb.table("bidders").select("name").eq("id", finding_info["bidder_id"]).execute()
                if bidder.data:
                    entry["bidder_name"] = bidder.data[0]["name"]

        entry["rule_requirement"] = rule_info["requirement"] if rule_info else "Cross-document check"
        entry["rule_code"] = rule_info["rule_id"] if rule_info else "CROSS_DOC"
        entry["finding_status"] = finding_info["status"] if finding_info else None

        enriched.append(entry)

    return enriched
