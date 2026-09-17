"""Bidder routes: create, list bidders for a tender."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_role
from app.models import BidderCreate, BidderResponse
from app.supabase_client import get_supabase

router = APIRouter()


@router.post(
    "/tenders/{tender_id}/bidders",
    response_model=BidderResponse,
    dependencies=[Depends(require_role("procurement_officer", "administrator"))],
)
def create_bidder(tender_id: str, body: BidderCreate):
    sb = get_supabase()

    # Verify tender exists
    tender = sb.table("tenders").select("id").eq("id", tender_id).execute()
    if not tender.data:
        raise HTTPException(status_code=404, detail="Tender not found")

    result = sb.table("bidders").insert({
        "tender_id": tender_id,
        "name": body.name,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create bidder")

    return result.data[0]


@router.get(
    "/tenders/{tender_id}/bidders",
    response_model=list[BidderResponse],
    dependencies=[Depends(require_role("procurement_officer", "administrator", "auditor"))],
)
def list_bidders(tender_id: str):
    sb = get_supabase()
    result = sb.table("bidders").select("*").eq("tender_id", tender_id).order("created_at").execute()
    return result.data


@router.get(
    "/bidders/{bidder_id}",
    response_model=BidderResponse,
    dependencies=[Depends(require_role("procurement_officer", "administrator", "auditor"))],
)
def get_bidder(bidder_id: str):
    sb = get_supabase()
    result = sb.table("bidders").select("*").eq("id", bidder_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Bidder not found")

    return result.data[0]

