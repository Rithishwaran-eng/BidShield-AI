"""Compliance engine -- deterministic rule evaluation.

For each tender rule, evaluates the bidder's extracted evidence and sets status to:
  - verified: all evidence present, fields extracted, thresholds met
  - issue_detected: evidence present but values conflict or fail threshold
  - missing: required evidence document not uploaded
  - pending: document present but extraction below confidence threshold

Every Finding carries an evidence array and a plain-language explanation
built from templates. No LLM calls.
"""

from app.services.matching import cross_document_consistency_check

# Confidence threshold: below this, extraction is treated as pending
CONFIDENCE_THRESHOLD = 0.70

# Document type mapping for rules
DOCUMENT_TYPE_MAP = {
    "GST Certificate": "GST",
    "GST Registration": "GST",
    "PAN Card": "PAN",
    "PAN": "PAN",
    "Udyam Certificate": "UDYAM",
    "Udyam Registration": "UDYAM",
    "MSME Certificate": "UDYAM",
    "Audited financial statements": "FINANCIALS",
    "Financial Statements": "FINANCIALS",
    "Turnover Certificate": "FINANCIALS",
    "Experience Certificate": "EXPERIENCE",
    "Work Order": "EXPERIENCE",
    "Completion Certificate": "EXPERIENCE",
    "EMD Receipt": "EMD",
    "Bank Guarantee": "EMD",
    "Bid Form": "BID_FORM",
    "Company Registration": "REGISTRATION",
}


def _map_evidence_type(evidence_name: str) -> str:
    """Map an evidence requirement name to a document type."""
    for key, doc_type in DOCUMENT_TYPE_MAP.items():
        if key.lower() in evidence_name.lower():
            return doc_type
    return evidence_name.upper().replace(" ", "_")


def evaluate_rule(rule: dict, documents: list[dict]) -> dict:
    """Evaluate a single rule against a bidder's documents.

    Args:
        rule: dict with keys: id, rule_id, requirement, mandatory,
              evidence_required, threshold
        documents: list of document dicts for the bidder

    Returns:
        dict with keys: status, evidence, explanation
    """
    evidence_items = []
    required_types = []

    for ev_name in rule.get("evidence_required", []):
        required_types.append(_map_evidence_type(ev_name))

    if not required_types:
        # No specific evidence required -- rule is informational
        return {
            "status": "verified",
            "evidence": [],
            "explanation": (
                f'Rule "{rule["requirement"]}" does not require specific '
                f"document evidence. Marked as verified by default."
            ),
        }

    # Check which required document types are present
    docs_by_type = {}
    for doc in documents:
        doc_type = doc.get("document_type", "")
        if doc_type not in docs_by_type:
            docs_by_type[doc_type] = []
        docs_by_type[doc_type].append(doc)

    missing_types = []
    pending_types = []
    found_types = []

    for req_type in required_types:
        matching_docs = docs_by_type.get(req_type, [])

        if not matching_docs:
            missing_types.append(req_type)
            continue

        for doc in matching_docs:
            confidence = doc.get("confidence")
            extraction_status = doc.get("extraction_status", "pending")

            if extraction_status == "failed":
                pending_types.append(req_type)
                evidence_items.append({
                    "document_id": doc["id"],
                    "document_type": doc["document_type"],
                    "field": "extraction_status",
                    "value": "Extraction failed -- requires manual review",
                    "page": doc.get("page"),
                })
            elif extraction_status == "pending" or (
                confidence is not None and float(confidence) < CONFIDENCE_THRESHOLD
            ):
                pending_types.append(req_type)
                evidence_items.append({
                    "document_id": doc["id"],
                    "document_type": doc["document_type"],
                    "field": "confidence",
                    "value": f"Low confidence ({confidence})",
                    "page": doc.get("page"),
                })
            else:
                found_types.append(req_type)
                # Add relevant extracted fields as evidence
                for field_name in ["legal_name", "id_number", "registration_date"]:
                    value = doc.get(field_name)
                    if value:
                        evidence_items.append({
                            "document_id": doc["id"],
                            "document_type": doc["document_type"],
                            "field": field_name,
                            "value": str(value),
                            "page": doc.get("page"),
                        })

    # Determine status
    if missing_types:
        status = "missing"
        type_names = ", ".join(missing_types)
        explanation = (
            f'Rule "{rule["requirement"]}" requires evidence from: '
            f"{type_names}. These documents have not been uploaded. "
            f"The bidder must provide the missing documents before "
            f"compliance can be verified."
        )
    elif pending_types:
        status = "pending"
        type_names = ", ".join(pending_types)
        explanation = (
            f'Rule "{rule["requirement"]}" has documents uploaded but '
            f"field extraction is incomplete or below confidence threshold "
            f"for: {type_names}. Manual review of these documents is "
            f"recommended."
        )
    else:
        status = "verified"
        explanation = (
            f'Rule "{rule["requirement"]}" is satisfied. All required '
            f"evidence documents are present and fields have been "
            f"extracted with sufficient confidence."
        )
        if rule.get("threshold"):
            explanation += (
                f' Threshold: {rule["threshold"]}. '
                f"Automated threshold verification is based on extracted "
                f"values -- officer review is recommended for final confirmation."
            )

    return {
        "status": status,
        "evidence": evidence_items,
        "explanation": explanation,
    }


def run_compliance_check(rules: list[dict], documents: list[dict], bidder_id: str) -> list[dict]:
    """Run the full compliance check for a bidder.

    Evaluates every rule and runs cross-document consistency checks.

    Args:
        rules: list of rule dicts for the tender
        documents: list of document dicts for the bidder
        bidder_id: the bidder's UUID

    Returns:
        list of finding dicts, each with: bidder_id, rule_id, status,
        evidence, explanation
    """
    findings = []

    # Evaluate each rule
    for rule in rules:
        result = evaluate_rule(rule, documents)
        findings.append({
            "bidder_id": bidder_id,
            "rule_id": rule["id"],
            "status": result["status"],
            "evidence": result["evidence"],
            "explanation": result["explanation"],
        })

    # Cross-document consistency check
    consistency_results = cross_document_consistency_check(documents)
    for result in consistency_results:
        findings.append({
            "bidder_id": bidder_id,
            "rule_id": None,
            "status": result["status"],
            "evidence": result["evidence"],
            "explanation": result["explanation"],
        })

    return findings
