"""Bidder entity routes: list and get registered bidder profiles."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_role
from app.models import BidderResponse
from app.supabase_client import get_supabase

router = APIRouter()


@router.get(
    "/bidders/{bidder_id}",
    response_model=BidderResponse,
    dependencies=[Depends(require_role("procurement_officer"))],
)
def get_bidder(bidder_id: str):
    sb = get_supabase()
    result = sb.table("bidders").select("*").eq("id", bidder_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Bidder not found")

    return result.data[0]
