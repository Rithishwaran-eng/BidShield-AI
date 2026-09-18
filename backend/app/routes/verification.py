"""Verification route: backward-compatibility alias for running compliance check on a bid / bidder."""

from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import require_role
from app.routes.bids import reverify_bid
from app.supabase_client import get_supabase

router = APIRouter()


@router.post(
    "/bidders/{bidder_id}/verify",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def verify_bidder_endpoint(bidder_id: str):
    """
    Backward-compatibility alias to reverify a bidder.
    Resolves authoritative bid_id for the given bidder_id.
    """
    sb = get_supabase()
    # Find active bid for this bidder
    bid_res = sb.table("bids").select("id").eq("bidder_id", bidder_id).order("created_at", desc=True).limit(1).execute()
    if bid_res.data:
        return reverify_bid(bid_res.data[0]["id"])
    
    # Fallback to checking if bidder_id was passed as a bid_id
    bid_by_id = sb.table("bids").select("id").eq("id", bidder_id).execute()
    if bid_by_id.data:
        return reverify_bid(bidder_id)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"No bid submission found for bidder ID '{bidder_id}' to reverify.",
    )
