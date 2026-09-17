"""Seed script for BidShield AI prototype.

Loads one sample tender with 6 rules and 3 demo bidders:
- Bidder A (Reliable Systems Pvt Ltd): Clean, all documents consistent.
- Bidder B (ABC Engineering): Deliberate legal name mismatches across documents.
- Bidder C (Metro Constructions): Missing document + low confidence extraction.

Usage:
  cd supabase
  pip install supabase python-dotenv
  python seed.py
"""

import os
import json
import sys
from datetime import datetime, timezone

# Add parent and backend dir to path for config and imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

from supabase import create_client


def main():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env")
        sys.exit(1)

    sb = create_client(url, key)
    print("Connected to Supabase.")

    # Clean existing data (order matters due to foreign keys)
    print("Clearing existing data...")
    sb.table("audit_log").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    sb.table("findings").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    sb.table("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    sb.table("bidders").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    sb.table("rules").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    sb.table("tenders").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    # --- Create Tender ---
    print("Creating tender...")
    tender = sb.table("tenders").insert({
        "title": "Supply of IT Equipment - GeM Bid No. GEM/2025/B/4521890",
        "uploaded_text": """TENDER DOCUMENT
Government e-Marketplace (GeM)
Bid No: GEM/2025/B/4521890
Subject: Supply of IT Equipment (Laptops, Desktops, Servers) to Ministry of Electronics and Information Technology

ELIGIBILITY CRITERIA:

1. FINANCIAL REQUIREMENT: The bidder must have a minimum average annual turnover of Rs 10 Crore for the last three financial years (FY 2022-23, FY 2023-24, FY 2024-25). Audited financial statements must be provided as evidence.

2. GST REGISTRATION: The bidder must possess a valid GST Registration Certificate. The GSTIN must be active and not cancelled or suspended.

3. PAN VERIFICATION: The bidder must provide a valid PAN Card. The name on the PAN must match the legal entity name used in the bid.

4. MSME/UDYAM REGISTRATION: If the bidder claims MSME benefits, a valid Udyam Registration Certificate must be provided. The enterprise category and activity must be relevant to IT equipment supply.

5. PRIOR EXPERIENCE: The bidder must have completed at least 3 similar supply orders (IT equipment) in the last 5 years, each valued at minimum Rs 2 Crore. Work orders or completion certificates must be provided.

6. EARNEST MONEY DEPOSIT (EMD): The bidder must submit an EMD of Rs 5,00,000 (Five Lakh Rupees) in the form of a bank guarantee or demand draft.

IMPORTANT NOTES:
- All documents must be self-attested and uploaded in PDF format.
- The legal name across all documents must be consistent.
- Any discrepancy in the bidder's identity across documents may lead to disqualification.
- The procuring entity reserves the right to verify all submitted documents.""",
        "status": "active",
    }).execute()
    tender_id = tender.data[0]["id"]
    print(f"  Tender created: {tender_id}")

    # --- Create Rules ---
    print("Creating rules...")
    rules_data = [
        {
            "tender_id": tender_id,
            "rule_id": "TURNOVER_01",
            "requirement": "Minimum average annual turnover of Rs 10 Crore (FY 2022-25)",
            "mandatory": True,
            "evidence_required": ["Audited financial statements"],
            "threshold": "Rs 10 Crore avg (FY22-25)",
            "approved": True,
        },
        {
            "tender_id": tender_id,
            "rule_id": "GST_REG_01",
            "requirement": "Valid GST Registration Certificate with active GSTIN",
            "mandatory": True,
            "evidence_required": ["GST Certificate"],
            "threshold": None,
            "approved": True,
        },
        {
            "tender_id": tender_id,
            "rule_id": "PAN_01",
            "requirement": "Valid PAN Card matching legal entity name",
            "mandatory": True,
            "evidence_required": ["PAN Card"],
            "threshold": None,
            "approved": True,
        },
        {
            "tender_id": tender_id,
            "rule_id": "UDYAM_01",
            "requirement": "Valid Udyam Registration Certificate for MSME benefits",
            "mandatory": False,
            "evidence_required": ["Udyam Certificate"],
            "threshold": None,
            "approved": True,
        },
        {
            "tender_id": tender_id,
            "rule_id": "EXPERIENCE_01",
            "requirement": "Minimum 3 similar IT equipment supply orders (Rs 2 Cr each) in last 5 years",
            "mandatory": True,
            "evidence_required": ["Experience Certificate"],
            "threshold": "3 orders, Rs 2 Crore each, last 5 years",
            "approved": True,
        },
        {
            "tender_id": tender_id,
            "rule_id": "EMD_01",
            "requirement": "Earnest Money Deposit of Rs 5,00,000",
            "mandatory": True,
            "evidence_required": ["EMD Receipt"],
            "threshold": "Rs 5,00,000",
            "approved": True,
        },
    ]
    rules = sb.table("rules").insert(rules_data).execute()
    rule_map = {r["rule_id"]: r["id"] for r in rules.data}
    print(f"  {len(rules.data)} rules created.")

    # --- Bidder A: Clean (Reliable Systems Pvt Ltd) ---
    print("Creating Bidder A (clean)...")
    bidder_a = sb.table("bidders").insert({
        "tender_id": tender_id,
        "name": "Reliable Systems Pvt Ltd",
    }).execute()
    ba_id = bidder_a.data[0]["id"]

    docs_a = [
        {
            "bidder_id": ba_id,
            "document_type": "GST",
            "filename": "reliable_gst.pdf",
            "storage_path": f"{ba_id}/reliable_gst.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": "27AABCR1234M1Z5",
            "registration_date": "2018-06-15",
            "page": 1,
            "confidence": 0.97,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "document_type": "PAN",
            "filename": "reliable_pan.pdf",
            "storage_path": f"{ba_id}/reliable_pan.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": "AABCR1234M",
            "page": 1,
            "confidence": 0.98,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "document_type": "UDYAM",
            "filename": "reliable_udyam.pdf",
            "storage_path": f"{ba_id}/reliable_udyam.pdf",
            "legal_name": "Reliable Systems Pvt Ltd",
            "id_number": "UDYAM-MH-07-0012345",
            "registration_date": "2021-03-20",
            "page": 1,
            "confidence": 0.95,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "document_type": "FINANCIALS",
            "filename": "reliable_financials.pdf",
            "storage_path": f"{ba_id}/reliable_financials.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.92,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "document_type": "EXPERIENCE",
            "filename": "reliable_experience.pdf",
            "storage_path": f"{ba_id}/reliable_experience.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.91,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "document_type": "EMD",
            "filename": "reliable_emd.pdf",
            "storage_path": f"{ba_id}/reliable_emd.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": "BG/2025/12345",
            "page": 1,
            "confidence": 0.94,
            "extraction_status": "done",
        },
    ]
    sb.table("documents").insert(docs_a).execute()
    print(f"  Bidder A created with {len(docs_a)} documents.")

    # --- Bidder B: Inconsistency (ABC Engineering) ---
    print("Creating Bidder B (name mismatches)...")
    bidder_b = sb.table("bidders").insert({
        "tender_id": tender_id,
        "name": "ABC Engineering Private Limited",
    }).execute()
    bb_id = bidder_b.data[0]["id"]

    docs_b = [
        {
            "bidder_id": bb_id,
            "document_type": "GST",
            "filename": "abc_gst.pdf",
            "storage_path": f"{bb_id}/abc_gst.pdf",
            "legal_name": "ABC Engineering Private Limited",
            "id_number": "29ABCDE1234F1Z5",
            "registration_date": "2017-07-01",
            "page": 1,
            "confidence": 0.96,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "document_type": "PAN",
            "filename": "abc_pan.pdf",
            "storage_path": f"{bb_id}/abc_pan.pdf",
            "legal_name": "ABC Engineering Pvt Ltd",
            "id_number": "ABCDE1234F",
            "page": 1,
            "confidence": 0.97,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "document_type": "UDYAM",
            "filename": "abc_udyam.pdf",
            "storage_path": f"{bb_id}/abc_udyam.pdf",
            "legal_name": "A B C Engineering Limited",
            "id_number": "UDYAM-KA-29-0098765",
            "registration_date": "2020-11-10",
            "page": 1,
            "confidence": 0.93,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "document_type": "BID_FORM",
            "filename": "abc_bidform.pdf",
            "storage_path": f"{bb_id}/abc_bidform.pdf",
            "legal_name": "ABC Engg. Private Ltd",
            "id_number": None,
            "page": 1,
            "confidence": 0.90,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "document_type": "FINANCIALS",
            "filename": "abc_financials.pdf",
            "storage_path": f"{bb_id}/abc_financials.pdf",
            "legal_name": "ABC Engineering Private Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.94,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "document_type": "EXPERIENCE",
            "filename": "abc_experience.pdf",
            "storage_path": f"{bb_id}/abc_experience.pdf",
            "legal_name": "ABC Engineering Private Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.92,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "document_type": "EMD",
            "filename": "abc_emd.pdf",
            "storage_path": f"{bb_id}/abc_emd.pdf",
            "legal_name": "ABC Engineering Private Limited",
            "id_number": "BG/2025/67890",
            "page": 1,
            "confidence": 0.95,
            "extraction_status": "done",
        },
    ]
    sb.table("documents").insert(docs_b).execute()
    print(f"  Bidder B created with {len(docs_b)} documents (deliberate name mismatches).")

    # --- Bidder C: Missing/Incomplete (Metro Constructions) ---
    print("Creating Bidder C (missing + low confidence)...")
    bidder_c = sb.table("bidders").insert({
        "tender_id": tender_id,
        "name": "Metro Constructions India Ltd",
    }).execute()
    bc_id = bidder_c.data[0]["id"]

    docs_c = [
        {
            "bidder_id": bc_id,
            "document_type": "GST",
            "filename": "metro_gst.pdf",
            "storage_path": f"{bc_id}/metro_gst.pdf",
            "legal_name": "Metro Constructions India Limited",
            "id_number": "07AAACM5678G1Z2",
            "registration_date": "2019-04-01",
            "page": 1,
            "confidence": 0.96,
            "extraction_status": "done",
        },
        {
            "bidder_id": bc_id,
            "document_type": "PAN",
            "filename": "metro_pan.pdf",
            "storage_path": f"{bc_id}/metro_pan.pdf",
            "legal_name": "Metro Constructions India Limited",
            "id_number": "AAACM5678G",
            "page": 1,
            "confidence": 0.97,
            "extraction_status": "done",
        },
        {
            "bidder_id": bc_id,
            "document_type": "UDYAM",
            "filename": "metro_udyam.pdf",
            "storage_path": f"{bc_id}/metro_udyam.pdf",
            "legal_name": "Metro Constructions India",
            "id_number": "UDYAM-DL-07-0054321",
            "registration_date": "2022-01-15",
            "page": 1,
            "confidence": 0.42,
            "extraction_status": "pending",
        },
        {
            "bidder_id": bc_id,
            "document_type": "EXPERIENCE",
            "filename": "metro_experience.pdf",
            "storage_path": f"{bc_id}/metro_experience.pdf",
            "legal_name": "Metro Constructions India Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.89,
            "extraction_status": "done",
        },
        {
            "bidder_id": bc_id,
            "document_type": "EMD",
            "filename": "metro_emd.pdf",
            "storage_path": f"{bc_id}/metro_emd.pdf",
            "legal_name": "Metro Constructions India Limited",
            "id_number": "DD/2025/11111",
            "page": 1,
            "confidence": 0.93,
            "extraction_status": "done",
        },
    ]
    # Note: FINANCIALS document is deliberately missing for Bidder C
    sb.table("documents").insert(docs_c).execute()
    print(f"  Bidder C created with {len(docs_c)} documents (missing FINANCIALS, low-confidence UDYAM).")

    # --- Run compliance engine on seeded data ---
    print("\nRunning compliance engine on seeded data...")
    from app.services.compliance_engine import run_compliance_check

    for bidder_label, bidder_id_val in [("A", ba_id), ("B", bb_id), ("C", bc_id)]:
        docs = sb.table("documents").select("*").eq("bidder_id", bidder_id_val).execute()
        findings = run_compliance_check(rules.data, docs.data, bidder_id_val)

        findings_to_insert = []
        for f in findings:
            findings_to_insert.append({
                "bidder_id": f["bidder_id"],
                "rule_id": f["rule_id"],
                "status": f["status"],
                "evidence": json.dumps(f["evidence"]),
                "explanation": f["explanation"],
            })

        if findings_to_insert:
            sb.table("findings").insert(findings_to_insert).execute()

        status_counts = {}
        for f in findings:
            s = f["status"]
            status_counts[s] = status_counts.get(s, 0) + 1

        print(f"  Bidder {bidder_label}: {status_counts}")

    print("\nSeed complete. Tender ID:", tender_id)
    print("You can now start the frontend and backend servers.")


if __name__ == "__main__":
    main()
