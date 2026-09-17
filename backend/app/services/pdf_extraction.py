"""PDF text extraction using pdfplumber."""

import pdfplumber
import io


def extract_text_from_pdf(file_bytes: bytes) -> dict:
    """Extract raw text and page count from a PDF file.

    Args:
        file_bytes: Raw bytes of the PDF file.

    Returns:
        dict with keys: text (str), page_count (int), success (bool), error (str|None)
    """
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)

            full_text = "\n\n".join(pages_text)

            return {
                "text": full_text,
                "page_count": len(pdf.pages),
                "success": True,
                "error": None,
            }
    except Exception as e:
        return {
            "text": "",
            "page_count": 0,
            "success": False,
            "error": str(e),
        }
