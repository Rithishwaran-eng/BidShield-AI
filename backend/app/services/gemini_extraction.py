"""Gemini API extraction service.

Two extraction jobs only:
1. Tender rule extraction -- extracts structured eligibility rules from tender text.
2. Document field extraction -- extracts structured fields from document text.

The Gemini API key is used only server-side. Responses are parsed defensively.
"""

import json
import re
import google.generativeai as genai
from app.config import GEMINI_API_KEY

_model = None


def _get_model():
    global _model
    if _model is None:
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-3.6-flash")
    return _model


def _parse_json_response(text: str) -> list | dict | None:
    """Parse JSON from Gemini response, stripping code fences if present."""
    cleaned = text.strip()

    # Strip markdown code fences
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find JSON array or object in the response
        array_match = re.search(r"\[[\s\S]*\]", cleaned)
        if array_match:
            try:
                return json.loads(array_match.group())
            except json.JSONDecodeError:
                pass

        obj_match = re.search(r"\{[\s\S]*\}", cleaned)
        if obj_match:
            try:
                return json.loads(obj_match.group())
            except json.JSONDecodeError:
                pass

    return None


def extract_tender_rules(tender_text: str) -> dict:
    """Extract eligibility rules from tender text using Gemini.

    Returns:
        dict with keys: rules (list), success (bool), error (str|None)
    """
    model = _get_model()

    prompt = f"""You are a government procurement compliance analyst. Analyze the following tender document text and extract ALL eligibility requirements that bidders must satisfy.

For each requirement, return a JSON object with these exact fields:
- rule_id: A short uppercase identifier like "TURNOVER_01", "GST_REG_01", "EXPERIENCE_01", etc.
- requirement: A clear description of what the bidder must demonstrate.
- mandatory: true if the requirement is mandatory, false if optional/preferred.
- evidence_required: An array of document types the bidder must provide as evidence (e.g., ["Audited financial statements"], ["GST Certificate"], ["PAN Card"], ["Udyam Certificate"]).
- threshold: The specific threshold or criteria if applicable (e.g., "Rs 10 Crore avg (FY23-25)"), or null if no specific threshold.

Return ONLY a JSON array of these objects. No explanation, no markdown, no extra text.

Tender document:
{tender_text}"""

    try:
        response = model.generate_content(prompt)
        parsed = _parse_json_response(response.text)

        if parsed is None:
            return {
                "rules": [],
                "success": False,
                "error": "Failed to parse Gemini response as JSON",
            }

        if isinstance(parsed, dict):
            parsed = [parsed]

        return {
            "rules": parsed,
            "success": True,
            "error": None,
        }

    except Exception as e:
        return {
            "rules": [],
            "success": False,
            "error": str(e),
        }


def extract_document_fields(document_text: str, document_type: str, filename: str) -> dict:
    """Extract structured fields from a document using Gemini.

    Returns:
        dict with keys: fields (dict), success (bool), error (str|None)
    """
    model = _get_model()

    prompt = f"""You are a document analysis system for government procurement compliance. Extract structured fields from the following {document_type} document.

Return a single JSON object with these exact fields:
- document: "{filename}"
- type: "{document_type}"
- legal_name: The legal name of the entity/person as it appears in the document (exact text, do not normalize).
- id_number: The primary identification number (GSTIN for GST, PAN number for PAN, Udyam Registration Number for Udyam, CIN for company registration, etc.), or null if not found.
- registration_date: The date of registration or issue in YYYY-MM-DD format, or null if not found.
- page: 1
- confidence: A float between 0.0 and 1.0 indicating your confidence in the accuracy of the extraction.

Return ONLY the JSON object. No explanation, no markdown, no extra text.

Document text:
{document_text}"""

    try:
        response = model.generate_content(prompt)
        parsed = _parse_json_response(response.text)

        if parsed is None:
            return {
                "fields": {},
                "success": False,
                "error": "Failed to parse Gemini response as JSON",
            }

        if isinstance(parsed, list) and len(parsed) > 0:
            parsed = parsed[0]

        return {
            "fields": parsed,
            "success": True,
            "error": None,
        }

    except Exception as e:
        return {
            "fields": {},
            "success": False,
            "error": str(e),
        }
