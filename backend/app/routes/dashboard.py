"""Dashboard route: aggregated compliance data per tender."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_role
from app.models import DashboardResponse, BidderSummary, FindingResponse
from app.supabase_client import get_supabase

router = APIRouter()


@router.get(
    "/tenders/{tender_id}/dashboard",
    dependencies=[Depends(require_role("procurement_officer", "administrator", "auditor"))],
)
def get_dashboard(tender_id: str, bidder_filter: str = None, status_filter: str = None):

    sb = get_supabase()

    # Get tender
    tender = sb.table("tenders").select("*").eq("id", tender_id).execute()
    if not tender.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender_data = tender.data[0]

    # Get rules for document count
    rules = sb.table("rules").select("*").eq("tender_id", tender_id).execute()
    total_evidence_types = set()
    for rule in rules.data:
        for ev in rule.get("evidence_required", []):
            total_evidence_types.add(ev)
    total_required = max(len(total_evidence_types), 1)

    # Get bidders
    bidders = sb.table("bidders").select("*").eq("tender_id", tender_id).execute()

    bidder_summaries = []

    for bidder in bidders.data:
        bidder_id = bidder["id"]

        # Get findings for this bidder
        findings_query = sb.table("findings").select("*").eq("bidder_id", bidder_id)
        findings = findings_query.execute()

        # Count by status
        counts = {"verified": 0, "issue_detected": 0, "missing": 0, "pending": 0}
        for f in findings.data:
            status = f.get("status", "")
            if status in counts:
                counts[status] += 1

        # Get document count for evidence coverage
        docs = sb.table("documents").select("id").eq("bidder_id", bidder_id).execute()
        docs_uploaded = len(docs.data)
        coverage = min(round((docs_uploaded / total_required) * 100, 1), 100.0)

        bidder_summaries.append({
            "bidder_id": bidder_id,
            "bidder_name": bidder["name"],
            "verified_count": counts["verified"],
            "issue_count": counts["issue_detected"],
            "missing_count": counts["missing"],
            "pending_count": counts["pending"],
            "total_documents_required": total_required,
            "total_documents_uploaded": docs_uploaded,
            "evidence_coverage": coverage,
        })

    # Get all findings with bidder and rule info
    all_findings = []
    for bidder in bidders.data:
        findings_query = sb.table("findings").select("*").eq("bidder_id", bidder["id"])

        if status_filter:
            findings_query = findings_query.eq("status", status_filter)

        findings = findings_query.execute()

        for f in findings.data:
            # Get rule info if available
            rule_req = None
            if f.get("rule_id"):
                rule = sb.table("rules").select("requirement").eq("id", f["rule_id"]).execute()
                if rule.data:
                    rule_req = rule.data[0]["requirement"]

            # Parse evidence if it is a string
            evidence = f.get("evidence", [])
            if isinstance(evidence, str):
                import json
                try:
                    evidence = json.loads(evidence)
                except (json.JSONDecodeError, TypeError):
                    evidence = []

            all_findings.append({
                "id": f["id"],
                "bidder_id": f["bidder_id"],
                "rule_id": f.get("rule_id"),
                "status": f["status"],
                "evidence": evidence,
                "explanation": f["explanation"],
                "created_at": f["created_at"],
                "bidder_name": bidder["name"],
                "rule_requirement": rule_req,
            })

    # Filter by bidder if specified
    if bidder_filter:
        all_findings = [f for f in all_findings if f["bidder_id"] == bidder_filter]

    return {
        "tender_id": tender_id,
        "tender_title": tender_data["title"],
        "bidder_summaries": bidder_summaries,
        "findings": all_findings,
    }
