"""Audit log routes: comprehensive officer audit trail for tenders and compliance actions."""

from typing import Optional
from fastapi import APIRouter, Depends
from app.auth import require_role
from app.supabase_client import get_supabase

router = APIRouter()


@router.get(
    "/officer/audit",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def get_global_audit_log(limit: int = 100):
    """Officer views system-wide compliance audit trail across all tenders."""
    sb = get_supabase()
    res = sb.table("audit_log").select("*").order("created_at", desc=True).limit(limit).execute()
    entries = res.data or []

    # Enrich entries
    return _enrich_audit_entries(sb, entries)


@router.get(
    "/tenders/{tender_id}/audit",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def get_tender_audit_log(tender_id: str):
    """Officer views audit history specific to a tender."""
    sb = get_supabase()

    # 1. Query audit log directly with tender_id
    tender_audits = sb.table("audit_log").select("*").eq("tender_id", tender_id).execute()
    all_audit_entries = list(tender_audits.data or [])
    seen_ids = {a["id"] for a in all_audit_entries}

    # 2. Get bids for this tender
    bids = sb.table("bids").select("id").eq("tender_id", tender_id).execute()
    bid_ids = [b["id"] for b in (bids.data or [])]

    # 3. Get findings for these bids
    if bid_ids:
        findings = sb.table("findings").select("id").in_("bid_id", bid_ids).execute()
        for f in (findings.data or []):
            f_audits = sb.table("audit_log").select("*").eq("finding_id", f["id"]).execute()
            for fa in (f_audits.data or []):
                if fa["id"] not in seen_ids:
                    seen_ids.add(fa["id"])
                    all_audit_entries.append(fa)

    # Sort descending
    all_audit_entries.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return _enrich_audit_entries(sb, all_audit_entries)



def _enrich_audit_entries(sb, entries: list) -> list:
    enriched = []
    for entry in entries:
        finding_id = entry.get("finding_id")
        bid_id = entry.get("bid_id")
        finding_info = None
        rule_info = None
        bidder_name = None

        if finding_id:
            try:
                finding = sb.table("findings").select("rule_id, status, bidder_id, bid_id").eq("id", finding_id).execute()
                if finding.data:
                    finding_info = finding.data[0]
                    if finding_info.get("rule_id"):
                        rule = sb.table("rules").select("requirement, rule_id").eq("id", finding_info["rule_id"]).execute()
                        if rule.data:
                            rule_info = rule.data[0]

                    target_bidder_id = finding_info.get("bidder_id")
                    if not target_bidder_id and finding_info.get("bid_id"):
                        bid_res = sb.table("bids").select("bidder_id").eq("id", finding_info["bid_id"]).execute()
                        if bid_res.data:
                            target_bidder_id = bid_res.data[0].get("bidder_id")

                    if target_bidder_id:
                        bidder = sb.table("bidders").select("name").eq("id", target_bidder_id).execute()
                        if bidder.data:
                            bidder_name = bidder.data[0]["name"]
            except Exception:
                pass

        if not bidder_name and bid_id:
            try:
                bid_res = sb.table("bids").select("bidder_id").eq("id", bid_id).execute()
                if bid_res.data and bid_res.data[0].get("bidder_id"):
                    bidder = sb.table("bidders").select("name").eq("id", bid_res.data[0]["bidder_id"]).execute()
                    if bidder.data:
                        bidder_name = bidder.data[0]["name"]
            except Exception:
                pass

        entry["bidder_name"] = bidder_name or entry.get("bidder_name") or "--"
        entry["rule_requirement"] = rule_info["requirement"] if rule_info else entry.get("rule_requirement") or "Cross-document check"
        entry["rule_code"] = rule_info["rule_id"] if rule_info else entry.get("rule_code") or "CROSS_DOC"
        entry["finding_status"] = finding_info["status"] if finding_info else None
        enriched.append(entry)

    return enriched

