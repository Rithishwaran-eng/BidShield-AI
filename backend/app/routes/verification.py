"""Verification route: alias for running compliance check on a bid / bidder."""

from fastapi import APIRouter, Depends
from app.auth import require_role
from app.routes.bids import reverify_bid

router = APIRouter()


@router.post(
    "/bidders/{bidder_id}/verify",
    dependencies=[Depends(require_role("procurement_officer"))],
)
def verify_bidder_endpoint(bidder_id: str):
    return reverify_bid(bidder_id)
