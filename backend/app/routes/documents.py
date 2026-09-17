"""Document upload routes: upload, list, get documents for a bidder."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.auth import require_role
from app.models import DocumentResponse
from app.supabase_client import get_supabase
from app.services.pdf_extraction import extract_text_from_pdf
from app.services.gemini_extraction import extract_document_fields

router = APIRouter()


@router.post(
    "/bidders/{bidder_id}/documents",
    response_model=DocumentResponse,
    dependencies=[Depends(require_role("procurement_officer", "administrator"))],
)
async def upload_document(
    bidder_id: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
):
    sb = get_supabase()

    # Verify bidder exists
    bidder = sb.table("bidders").select("id").eq("id", bidder_id).execute()
    if not bidder.data:
        raise HTTPException(status_code=404, detail="Bidder not found")

    # Read file
    file_bytes = await file.read()
    filename = file.filename or "document.pdf"

    # Upload to Supabase Storage
    storage_path = f"{bidder_id}/{filename}"
    try:
        sb.storage.from_("bid-documents").upload(
            storage_path,
            file_bytes,
            file_options={"content-type": file.content_type or "application/pdf"},
        )
    except Exception as e:
        # If file already exists, try to update it
        if "Duplicate" in str(e) or "already exists" in str(e):
            sb.storage.from_("bid-documents").update(
                storage_path,
                file_bytes,
                file_options={"content-type": file.content_type or "application/pdf"},
            )
        else:
            raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # Insert document record
    doc_data = {
        "bidder_id": bidder_id,
        "document_type": document_type,
        "filename": filename,
        "storage_path": storage_path,
        "extraction_status": "pending",
    }

    result = sb.table("documents").insert(doc_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create document record")

    doc_id = result.data[0]["id"]

    # Extract text from PDF
    pdf_result = extract_text_from_pdf(file_bytes)

    if not pdf_result["success"] or not pdf_result["text"]:
        # Mark as failed extraction
        sb.table("documents").update({
            "extraction_status": "failed",
        }).eq("id", doc_id).execute()

        updated = sb.table("documents").select("*").eq("id", doc_id).execute()
        return updated.data[0]

    # Extract fields using Gemini
    extraction = extract_document_fields(
        pdf_result["text"],
        document_type,
        filename,
    )

    if not extraction["success"]:
        sb.table("documents").update({
            "extraction_status": "failed",
        }).eq("id", doc_id).execute()

        updated = sb.table("documents").select("*").eq("id", doc_id).execute()
        return updated.data[0]

    # Update document with extracted fields
    fields = extraction["fields"]
    update_data = {
        "extraction_status": "done",
        "legal_name": fields.get("legal_name"),
        "id_number": fields.get("id_number"),
        "page": fields.get("page", 1),
        "confidence": fields.get("confidence", 0.0),
    }

    reg_date = fields.get("registration_date")
    if reg_date and reg_date != "null":
        update_data["registration_date"] = reg_date

    sb.table("documents").update(update_data).eq("id", doc_id).execute()

    updated = sb.table("documents").select("*").eq("id", doc_id).execute()
    return updated.data[0]


@router.get(
    "/bidders/{bidder_id}/documents",
    response_model=list[DocumentResponse],
    dependencies=[Depends(require_role("procurement_officer", "administrator", "auditor"))],
)
def list_documents(bidder_id: str):
    sb = get_supabase()
    result = sb.table("documents").select("*").eq("bidder_id", bidder_id).order("created_at").execute()
    return result.data

