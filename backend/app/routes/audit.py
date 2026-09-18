"""Audit log routes: comprehensive officer audit trail for tenders and compliance actions."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends
from app.auth import require_role
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

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

    # Batch enrich entries (SEC-12 fix)
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
        finding_ids = [f["id"] for f in (findings.data or [])]
        if finding_ids:
            f_audits = sb.table("audit_log").select("*").in_("finding_id", finding_ids).execute()
            for fa in (f_audits.data or []):
                if fa["id"] not in seen_ids:
                    seen_ids.add(fa["id"])
                    all_audit_entries.append(fa)

    # Sort descending
    all_audit_entries.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return _enrich_audit_entries(sb, all_audit_entries)


def _enrich_audit_entries(sb, entries: list) -> list:
    """Enrich audit entries using batched lookups to prevent N+1 queries (SEC-12)."""
    if not entries:
        return []

    finding_ids = list({e["finding_id"] for e in entries if e.get("finding_id")})
    bid_ids = list({e["bid_id"] for e in entries if e.get("bid_id")})

    findings_map = {}
    if finding_ids:
        try:
            f_res = sb.table("findings").select("id, rule_id, status, bidder_id, bid_id").in_("id", finding_ids).execute()
            findings_map = {f["id"]: f for f in (f_res.data or [])}
        except Exception as err:
            logger.warning(f"Error fetching findings for audit enrichment: {err}")

    # Collect rule and bidder IDs
    rule_ids = list({f["rule_id"] for f in findings_map.values() if f.get("rule_id")})
    rules_map = {}
    if rule_ids:
        try:
            r_res = sb.table("rules").select("id, requirement, rule_id").in_("id", rule_ids).execute()
            rules_map = {r["id"]: r for r in (r_res.data or [])}
        except Exception as err:
            logger.warning(f"Error fetching rules for audit enrichment: {err}")

    # Combine all bid IDs
    all_bid_ids = set(bid_ids)
    for f in findings_map.values():
        if f.get("bid_id"):
            all_bid_ids.add(f["bid_id"])

    bids_map = {}
    if all_bid_ids:
        try:
            b_res = sb.table("bids").select("id, bidder_id").in_("id", list(all_bid_ids)).execute()
            bids_map = {b["id"]: b for b in (b_res.data or [])}
        except Exception as err:
            logger.warning(f"Error fetching bids for audit enrichment: {err}")

    # Collect all bidder IDs
    bidder_ids = set()
    for f in findings_map.values():
        if f.get("bidder_id"):
            bidder_ids.add(f["bidder_id"])
    for b in bids_map.values():
        if b.get("bidder_id"):
            bidder_ids.add(b["bidder_id"])

    bidders_map = {}
    if bidder_ids:
        try:
            br_res = sb.table("bidders").select("id, name").in_("id", list(bidder_ids)).execute()
            bidders_map = {br["id"]: br for br in (br_res.data or [])}
        except Exception as err:
            logger.warning(f"Error fetching bidders for audit enrichment: {err}")

    enriched = []
    for entry in entries:
        finding_id = entry.get("finding_id")
        bid_id = entry.get("bid_id")

        finding_info = findings_map.get(finding_id) if finding_id else None
        rule_info = rules_map.get(finding_info.get("rule_id")) if finding_info and finding_info.get("rule_id") else None

        bidder_name = None
        target_bidder_id = finding_info.get("bidder_id") if finding_info else None
        if not target_bidder_id and finding_info and finding_info.get("bid_id"):
            target_bidder_id = bids_map.get(finding_info["bid_id"], {}).get("bidder_id")
        if not target_bidder_id and bid_id:
            target_bidder_id = bids_map.get(bid_id, {}).get("bidder_id")

        if target_bidder_id:
            bidder_name = bidders_map.get(target_bidder_id, {}).get("name")

        entry_copy = dict(entry)
        entry_copy["bidder_name"] = bidder_name or entry_copy.get("bidder_name") or "--"
        entry_copy["rule_requirement"] = rule_info["requirement"] if rule_info else entry_copy.get("rule_requirement") or "Cross-document check"
        entry_copy["rule_code"] = rule_info["rule_id"] if rule_info else entry_copy.get("rule_code") or "CROSS_DOC"
        entry_copy["finding_status"] = finding_info["status"] if finding_info else None
        enriched.append(entry_copy)

    return enriched
