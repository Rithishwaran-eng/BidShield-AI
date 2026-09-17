"""Legal name normalization and fuzzy matching.

All matching logic is deterministic -- no LLM calls.
Uses Levenshtein distance for string similarity.
"""

import re
from Levenshtein import ratio as levenshtein_ratio


# Common suffixes to strip during normalization
STRIP_SUFFIXES = [
    "private limited",
    "pvt ltd",
    "pvt. ltd.",
    "pvt. ltd",
    "pvt ltd.",
    "private ltd",
    "private ltd.",
    "limited",
    "ltd",
    "ltd.",
    "incorporated",
    "inc",
    "inc.",
    "llp",
    "l.l.p.",
    "llc",
    "l.l.c.",
]

# Common abbreviations to expand for comparison
ABBREVIATIONS = {
    "engg": "engineering",
    "eng": "engineering",
    "pvt": "private",
    "ltd": "limited",
    "mfg": "manufacturing",
    "tech": "technology",
    "intl": "international",
    "corp": "corporation",
    "assoc": "associates",
    "bros": "brothers",
    "co": "company",
    "govt": "government",
    "natl": "national",
    "dept": "department",
}

# Similarity threshold: above this = same entity, below = genuine mismatch
SIMILARITY_THRESHOLD = 0.85


def normalize_legal_name(name: str) -> str:
    """Normalize a legal name for comparison.

    Steps:
    1. Lowercase
    2. Strip common suffixes (Pvt Ltd, Private Limited, etc.)
    3. Expand common abbreviations
    4. Remove punctuation
    5. Collapse whitespace
    """
    if not name:
        return ""

    normalized = name.lower().strip()

    # Remove periods and dots from abbreviations first
    normalized = re.sub(r"\.(?=\s|$)", "", normalized)
    normalized = re.sub(r"\.\s*", " ", normalized)

    # Strip suffixes (longest first to avoid partial matches)
    sorted_suffixes = sorted(STRIP_SUFFIXES, key=len, reverse=True)
    for suffix in sorted_suffixes:
        pattern = r"\s+" + re.escape(suffix) + r"\s*$"
        normalized = re.sub(pattern, "", normalized)

    # Expand abbreviations
    words = normalized.split()
    expanded_words = []
    for word in words:
        clean_word = re.sub(r"[^\w]", "", word)
        if clean_word in ABBREVIATIONS:
            expanded_words.append(ABBREVIATIONS[clean_word])
        else:
            expanded_words.append(word)
    normalized = " ".join(expanded_words)

    # Remove all non-alphanumeric characters except spaces
    normalized = re.sub(r"[^a-z0-9\s]", "", normalized)

    # Collapse whitespace
    normalized = re.sub(r"\s+", " ", normalized).strip()

    return normalized


def compare_names(name_a: str, name_b: str) -> dict:
    """Compare two legal names and determine if they refer to the same entity.

    Returns:
        dict with keys:
            - normalized_a (str)
            - normalized_b (str)
            - similarity (float): 0.0 to 1.0
            - is_match (bool): True if similarity >= threshold
            - explanation (str): plain-language explanation
    """
    norm_a = normalize_legal_name(name_a)
    norm_b = normalize_legal_name(name_b)

    if not norm_a or not norm_b:
        return {
            "normalized_a": norm_a,
            "normalized_b": norm_b,
            "similarity": 0.0,
            "is_match": False,
            "explanation": "One or both names are empty after normalization.",
        }

    # Exact match after normalization
    if norm_a == norm_b:
        return {
            "normalized_a": norm_a,
            "normalized_b": norm_b,
            "similarity": 1.0,
            "is_match": True,
            "explanation": (
                f'"{name_a}" and "{name_b}" are the same entity '
                f"(identical after normalization)."
            ),
        }

    # Token-sort comparison: sort tokens alphabetically before comparing
    tokens_a = sorted(norm_a.split())
    tokens_b = sorted(norm_b.split())
    sorted_a = " ".join(tokens_a)
    sorted_b = " ".join(tokens_b)

    # Use the higher of direct and token-sorted similarity
    direct_sim = levenshtein_ratio(norm_a, norm_b)
    sorted_sim = levenshtein_ratio(sorted_a, sorted_b)
    similarity = max(direct_sim, sorted_sim)

    is_match = similarity >= SIMILARITY_THRESHOLD

    if is_match:
        explanation = (
            f'"{name_a}" and "{name_b}" refer to the same entity '
            f"(similarity: {similarity:.0%}, above threshold of "
            f"{SIMILARITY_THRESHOLD:.0%}). Differences are likely "
            f"formatting or abbreviation variations."
        )
    else:
        explanation = (
            f'"{name_a}" and "{name_b}" appear to be different entities '
            f"(similarity: {similarity:.0%}, below threshold of "
            f"{SIMILARITY_THRESHOLD:.0%}). The legal names differ "
            f"beyond normal formatting variations."
        )

    return {
        "normalized_a": norm_a,
        "normalized_b": norm_b,
        "similarity": round(similarity, 4),
        "is_match": is_match,
        "explanation": explanation,
    }


def cross_document_consistency_check(documents: list[dict]) -> list[dict]:
    """Check legal name consistency across a bidder's documents.

    Args:
        documents: list of document dicts, each with at least
                   'id', 'document_type', 'legal_name', 'page'.

    Returns:
        list of inconsistency findings, each with:
            - status: 'verified' or 'issue_detected'
            - evidence: list of evidence items
            - explanation: plain-language explanation
    """
    # Filter documents that have a legal name
    docs_with_names = [
        d for d in documents
        if d.get("legal_name") and d.get("extraction_status") == "done"
    ]

    if len(docs_with_names) < 2:
        return []

    findings = []
    checked_pairs = set()

    # Compare all pairs
    for i, doc_a in enumerate(docs_with_names):
        for j, doc_b in enumerate(docs_with_names):
            if i >= j:
                continue

            pair_key = tuple(sorted([doc_a["id"], doc_b["id"]]))
            if pair_key in checked_pairs:
                continue
            checked_pairs.add(pair_key)

            result = compare_names(doc_a["legal_name"], doc_b["legal_name"])

            if not result["is_match"]:
                findings.append({
                    "status": "issue_detected",
                    "evidence": [
                        {
                            "document_id": doc_a["id"],
                            "document_type": doc_a["document_type"],
                            "field": "legal_name",
                            "value": doc_a["legal_name"],
                            "page": doc_a.get("page", 1),
                        },
                        {
                            "document_id": doc_b["id"],
                            "document_type": doc_b["document_type"],
                            "field": "legal_name",
                            "value": doc_b["legal_name"],
                            "page": doc_b.get("page", 1),
                        },
                    ],
                    "explanation": result["explanation"],
                    "similarity": result["similarity"],
                })

    # If no issues found, all names are consistent
    if not findings and len(docs_with_names) >= 2:
        all_evidence = [
            {
                "document_id": d["id"],
                "document_type": d["document_type"],
                "field": "legal_name",
                "value": d["legal_name"],
                "page": d.get("page", 1),
            }
            for d in docs_with_names
        ]
        findings.append({
            "status": "verified",
            "evidence": all_evidence,
            "explanation": (
                "Legal name is consistent across all uploaded documents. "
                "All variations are within acceptable formatting differences."
            ),
        })

    return findings
