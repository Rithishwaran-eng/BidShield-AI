"""Document routes: legacy bidder document endpoints removed per Issue 5."""

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.post("/bidders/{bidder_id}/documents")
async def upload_document(bidder_id: str):
    """Legacy endpoint removed: documents must be uploaded via POST /tenders/{tender_id}/apply."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Legacy bidder document upload endpoint has been removed. Documents must be submitted with the bid via POST /tenders/{tender_id}/apply.",
    )


@router.get("/bidders/{bidder_id}/documents")
def list_documents(bidder_id: str):
    """Legacy endpoint removed: documents are retrieved via bid dossiers (/bids/{bid_id} or /bidder/submissions/{bid_id})."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Legacy bidder document list endpoint has been removed. Documents are accessible through bid dossiers.",
    )

