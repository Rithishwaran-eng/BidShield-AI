"""Dashboard route: aggregated compliance data per tender for Officer Review."""

import json
from typing import Optional
from collections import defaultdict
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

    # 1. Get tender
    tender = sb.table("tenders").select("*").eq("id", tender_id).execute()
    if not tender.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender_data = tender.data[0]

    # 2. Get rules for tender once & index by ID (Eliminates N+1 queries)
    rules_res = sb.table("rules").select("*").eq("tender_id", tender_id).execute()
    rules_data = rules_res.data or []
    rules_by_id = {r["id"]: r for r in rules_data}

    total_evidence_types = set()
    for rule in rules_data:
        for ev in rule.get("evidence_required", []):
            total_evidence_types.add(ev)
    total_required = max(len(total_evidence_types), 1)

    # 3. Get all bidders for this tender
    bidders_res = sb.table("bidders").select("*").eq("tender_id", tender_id).execute()
    bidders_data = bidders_res.data or []
    bidder_ids = [b["id"] for b in bidders_data]

    if not bidder_ids:
        return {
            "tender_id": tender_id,
            "tender_title": tender_data["title"],
            "status": tender_data.get("status", "draft"),
            "bids": [],
            "findings": [],
        }

    # 4. Batch query bids, documents, and findings in parallel/bulk (SEC-12 fix)
    bids_res = sb.table("bids").select("*").eq("tender_id", tender_id).execute()
    bids_by_bidder = {b["bidder_id"]: b for b in (bids_res.data or [])}

    docs_res = sb.table("documents").select("id, bidder_id, bid_id").in_("bidder_id", bidder_ids).execute()
    docs_by_bidder = defaultdict(list)
    for d in (docs_res.data or []):
        docs_by_bidder[d.get("bidder_id")].append(d)

    findings_query = sb.table("findings").select("*").in_("bidder_id", bidder_ids)
    if status_filter:
        findings_query = findings_query.eq("status", status_filter)
    findings_res = findings_query.execute()
    findings_raw = findings_res.data or []

    findings_by_bidder = defaultdict(list)
    for f in findings_raw:
        findings_by_bidder[f.get("bidder_id")].append(f)

    # 5. Build summary cards in memory without further DB round-trips
    bid_summaries = []
    for bidder in bidders_data:
        bidder_id = bidder["id"]
        bid_record = bids_by_bidder.get(bidder_id)

        bid_id = bid_record["id"] if bid_record else bidder_id
        submitted_at = bid_record.get("submitted_at") if bid_record else bidder.get("created_at")
        decision = bid_record.get("officer_decision") if bid_record else None

        f_list = findings_by_bidder.get(bidder_id, [])
        counts = {"verified": 0, "issue_detected": 0, "missing": 0, "pending": 0}
        for f in f_list:
            st = f.get("status", "")
            if st in counts:
                counts[st] += 1

        docs_uploaded = len(docs_by_bidder.get(bidder_id, []))

        # Determine overall bid status
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

    # 6. Build enriched findings using in-memory rules map
    bidders_map = {b["id"]: b for b in bidders_data}
    all_findings = []
    for f in findings_raw:
        bidder_info = bidders_map.get(f.get("bidder_id"), {})
        rule_info = rules_by_id.get(f.get("rule_id"))

        ev = f.get("evidence", [])
        if isinstance(ev, str):
            try:
                ev = json.loads(ev)
            except Exception:
                ev = []

        all_findings.append({
            "id": f["id"],
            "bid_id": f.get("bid_id") or f.get("bidder_id"),
            "bidder_id": f.get("bidder_id"),
            "rule_id": f.get("rule_id"),
            "rule_code": rule_info.get("rule_id") if rule_info else "CROSS_DOC",
            "status": f["status"],
            "evidence": ev,
            "explanation": f["explanation"],
            "officer_action": f.get("officer_action"),
            "officer_note": f.get("officer_note"),
            "action_at": f.get("action_at"),
            "created_at": f["created_at"],
            "bidder_name": bidder_info.get("name", "Bidder"),
            "rule_requirement": rule_info.get("requirement") if rule_info else None,
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
