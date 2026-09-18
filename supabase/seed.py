"""Seed script for BidShield AI prototype.

Loads one realistic GeM tender with 6 rules and 3 submitted demo bids:
- Bidder A (Reliable Systems Pvt Ltd): Clean, all documents consistent (Status: Verified).
- Bidder B (ABC Engineering): Deliberate legal name mismatches across PAN, GST, Udyam, Bid Form (Status: Issue Detected).
- Bidder C (Metro Constructions): Missing mandatory Financials document + low confidence extraction (Status: Missing/Pending).

Usage:
  cd supabase
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

    # Clean existing data
    print("Clearing existing data...")
    for table_name in ["audit_log", "findings", "documents", "bids", "bidders", "rules", "tenders"]:
        try:
            sb.table(table_name).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        except Exception as e:
            # Table might not exist yet if migration hasn't run
            print(f"  Note: cleaning {table_name}: {e}")

    # --- Create Tender ---
    print("Creating CPCL Mechanical Procurement tender (OPEN)...")
    tender_payload = {
        "title": "CPCL Mechanical Procurement - GeM Bid No. GEM/2026/B/8912400",
        "organization": "Chennai Petroleum Corporation Limited (CPCL)",
        "category": "Industrial Mechanical Equipment",
        "description": "Supply, installation, and commissioning of high-pressure industrial valves, piping systems, and mechanical pumps for CPCL Manali Refinery expansion.",
        "uploaded_text": """TENDER SPECIFICATION & ELIGIBILITY CRITERIA
Government e-Marketplace (GeM)
Bid No: GEM/2026/B/8912400
Procuring Entity: Chennai Petroleum Corporation Limited (CPCL)
Subject: Supply of Industrial Mechanical Valves, High-Pressure Pumps & Equipment

MANDATORY ELIGIBILITY REQUIREMENTS:

1. FINANCIAL REQUIREMENT (TURNOVER_01):
The bidder must have an average annual turnover of at least INR 10.00 Crore across the last three audited financial years (FY 2022-23, FY 2023-24, FY 2024-25). Audited financial statements and turnover certificates must be submitted.

2. STATUTORY GST REGISTRATION (GST_REG_01):
The bidder must possess an active GST Registration Certificate with active filing status.

3. PAN VERIFICATION (PAN_01):
The bidder must provide a valid Permanent Account Number (PAN) matching the legal entity name.

4. MSME / UDYAM PREFERENCE (UDYAM_01):
If claiming MSME benefits and purchase preference, a valid Udyam Registration Certificate must be provided.

5. PAST SUPPLY EXPERIENCE (EXPERIENCE_01):
The bidder must have executed at least 3 similar mechanical supply orders (minimum INR 2.00 Crore each) for government PSUs/refineries within the last 5 years. Completion certificates must be submitted.

6. EARNEST MONEY DEPOSIT (EMD_01):
The bidder must submit an Earnest Money Deposit (EMD) of INR 5,00,000 in the form of a valid Bank Guarantee or Demand Draft.

IMPORTANT CLAUSES:
- The legal name across all submitted documents must be strictly consistent.
- Discrepancies in bidder identity across statutory records will require clarification and may lead to disqualification.
- Final qualification decisions remain exclusively with the Procurement Officer.""",
        "status": "open",
    }
    
    try:
        tender = sb.table("tenders").insert(tender_payload).execute()
    except Exception as e:
        # Fallback if extra columns not yet in DB schema
        print(f"  Fallback tender insert without extra columns: {e}")
        tender = sb.table("tenders").insert({
            "title": tender_payload["title"],
            "uploaded_text": tender_payload["uploaded_text"],
            "status": "open",
        }).execute()
        
    tender_id = tender.data[0]["id"]
    print(f"  Tender created: {tender_id} (Status: OPEN)")

    # --- Create Rules ---
    print("Creating approved eligibility rules...")
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
            "requirement": "Minimum 3 similar mechanical equipment supply orders (Rs 2 Cr each) in last 5 years",
            "mandatory": True,
            "evidence_required": ["Experience Certificate"],
            "threshold": "3 orders, Rs 2 Crore each, last 5 years",
            "approved": True,
        },
        {
            "tender_id": tender_id,
            "rule_id": "EMD_01",
            "requirement": "Earnest Money Deposit of Rs 5,00,000 (BG or DD)",
            "mandatory": True,
            "evidence_required": ["EMD Receipt"],
            "threshold": "Rs 5,00,000",
            "approved": True,
        },
    ]
    rules = sb.table("rules").insert(rules_data).execute()
    print(f"  {len(rules.data)} rules created and approved.")

    # Helper function to create bidder and bid
    def create_bidder_and_bid(name: str, legal_name: str, pan: str, gstin: str, email: str, phone: str, status: str):
        bidder_data = {
            "name": name,
            "tender_id": tender_id, # keep backward compatibility
        }
        try:
            bidder = sb.table("bidders").insert({
                **bidder_data,
                "legal_name": legal_name,
                "pan": pan,
                "gstin": gstin,
                "email": email,
                "phone": phone,
            }).execute()
        except Exception:
            bidder = sb.table("bidders").insert(bidder_data).execute()
            
        bidder_id = bidder.data[0]["id"]

        bid_id = bidder_id # fallback
        try:
            bid = sb.table("bids").insert({
                "tender_id": tender_id,
                "bidder_id": bidder_id,
                "status": status,
                "submitted_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            if bid.data:
                bid_id = bid.data[0]["id"]
        except Exception as e:
            print(f"  Note: bids table insert fallback: {e}")

        return bidder_id, bid_id

    # --- Bidder A: Clean (Reliable Systems Pvt Ltd) ---
    print("Creating Bidder A submission (Reliable Systems Pvt Ltd - Clean)...")
    ba_id, ba_bid_id = create_bidder_and_bid(
        name="Reliable Systems Pvt Ltd",
        legal_name="Reliable Systems Private Limited",
        pan="AABCR1234M",
        gstin="27AABCR1234M1Z5",
        email="tenders@reliablesystems.in",
        phone="+91 98201 12345",
        status="verified",
    )

    docs_a = [
        {
            "bidder_id": ba_id,
            "bid_id": ba_bid_id,
            "document_type": "GST",
            "filename": "reliable_gst.pdf",
            "storage_path": f"{ba_id}/reliable_gst.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": "27AABCR1234M1Z5",
            "registration_date": "2018-06-15",
            "page": 1,
            "confidence": 0.98,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "bid_id": ba_bid_id,
            "document_type": "PAN",
            "filename": "reliable_pan.pdf",
            "storage_path": f"{ba_id}/reliable_pan.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": "AABCR1234M",
            "page": 1,
            "confidence": 0.99,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "bid_id": ba_bid_id,
            "document_type": "UDYAM",
            "filename": "reliable_udyam.pdf",
            "storage_path": f"{ba_id}/reliable_udyam.pdf",
            "legal_name": "Reliable Systems Pvt Ltd",
            "id_number": "UDYAM-MH-07-0012345",
            "registration_date": "2021-03-20",
            "page": 1,
            "confidence": 0.96,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "bid_id": ba_bid_id,
            "document_type": "FINANCIALS",
            "filename": "reliable_financials.pdf",
            "storage_path": f"{ba_id}/reliable_financials.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.94,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "bid_id": ba_bid_id,
            "document_type": "EXPERIENCE",
            "filename": "reliable_experience.pdf",
            "storage_path": f"{ba_id}/reliable_experience.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.93,
            "extraction_status": "done",
        },
        {
            "bidder_id": ba_id,
            "bid_id": ba_bid_id,
            "document_type": "EMD",
            "filename": "reliable_emd.pdf",
            "storage_path": f"{ba_id}/reliable_emd.pdf",
            "legal_name": "Reliable Systems Private Limited",
            "id_number": "BG/2026/12345",
            "page": 1,
            "confidence": 0.95,
            "extraction_status": "done",
        },
    ]
    try:
        sb.table("documents").insert(docs_a).execute()
    except Exception:
        # Fallback without bid_id column if not migrated
        for d in docs_a:
            d.pop("bid_id", None)
        sb.table("documents").insert(docs_a).execute()
    print(f"  Bidder A created with {len(docs_a)} documents.")

    # --- Bidder B: Inconsistency (ABC Engineering) ---
    print("Creating Bidder B submission (ABC Engineering - Legal Name Mismatches)...")
    bb_id, bb_bid_id = create_bidder_and_bid(
        name="ABC Engineering Private Limited",
        legal_name="ABC Engineering Private Limited",
        pan="ABCDE1234F",
        gstin="29ABCDE1234F1Z5",
        email="bids@abcengineering.in",
        phone="+91 98450 67890",
        status="issue_detected",
    )

    docs_b = [
        {
            "bidder_id": bb_id,
            "bid_id": bb_bid_id,
            "document_type": "GST",
            "filename": "abc_gst.pdf",
            "storage_path": f"{bb_id}/abc_gst.pdf",
            "legal_name": "ABC Engineering Private Limited",
            "id_number": "29ABCDE1234F1Z5",
            "registration_date": "2017-07-01",
            "page": 1,
            "confidence": 0.97,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "bid_id": bb_bid_id,
            "document_type": "PAN",
            "filename": "abc_pan.pdf",
            "storage_path": f"{bb_id}/abc_pan.pdf",
            "legal_name": "ABC Engineering Pvt Ltd",
            "id_number": "ABCDE1234F",
            "page": 1,
            "confidence": 0.98,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "bid_id": bb_bid_id,
            "document_type": "UDYAM",
            "filename": "abc_udyam.pdf",
            "storage_path": f"{bb_id}/abc_udyam.pdf",
            "legal_name": "A B C Engineering Limited",
            "id_number": "UDYAM-KA-29-0098765",
            "registration_date": "2020-11-10",
            "page": 1,
            "confidence": 0.94,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "bid_id": bb_bid_id,
            "document_type": "BID_FORM",
            "filename": "abc_bidform.pdf",
            "storage_path": f"{bb_id}/abc_bidform.pdf",
            "legal_name": "ABC Engineering Industries",
            "id_number": None,
            "page": 1,
            "confidence": 0.91,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "bid_id": bb_bid_id,
            "document_type": "FINANCIALS",
            "filename": "abc_financials.pdf",
            "storage_path": f"{bb_id}/abc_financials.pdf",
            "legal_name": "ABC Engineering Private Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.95,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "bid_id": bb_bid_id,
            "document_type": "EXPERIENCE",
            "filename": "abc_experience.pdf",
            "storage_path": f"{bb_id}/abc_experience.pdf",
            "legal_name": "ABC Engineering Private Limited",
            "id_number": None,
            "page": 1,
            "confidence": 0.93,
            "extraction_status": "done",
        },
        {
            "bidder_id": bb_id,
            "bid_id": bb_bid_id,
            "document_type": "EMD",
            "filename": "abc_emd.pdf",
            "storage_path": f"{bb_id}/abc_emd.pdf",
            "legal_name": "ABC Engineering Private Limited",
            "id_number": "BG/2026/67890",
            "page": 1,
            "confidence": 0.96,
            "extraction_status": "done",
        },
    ]
    try:
        sb.table("documents").insert(docs_b).execute()
    except Exception:
        for d in docs_b:
            d.pop("bid_id", None)
        sb.table("documents").insert(docs_b).execute()
    print(f"  Bidder B created with {len(docs_b)} documents (name mismatches across PAN, GST, Udyam, Bid Form).")

    # --- Bidder C: Missing/Incomplete (Metro Constructions) ---
    print("Creating Bidder C submission (Metro Constructions - Missing Financials)...")
    bc_id, bc_bid_id = create_bidder_and_bid(
        name="Metro Constructions India Ltd",
        legal_name="Metro Constructions India Limited",
        pan="AAACM5678G",
        gstin="07AAACM5678G1Z2",
        email="procurement@metroconstructions.in",
        phone="+91 98110 54321",
        status="missing",
    )

    docs_c = [
        {
            "bidder_id": bc_id,
            "bid_id": bc_bid_id,
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
            "bid_id": bc_bid_id,
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
            "bid_id": bc_bid_id,
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
            "bid_id": bc_bid_id,
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
            "bid_id": bc_bid_id,
            "document_type": "EMD",
            "filename": "metro_emd.pdf",
            "storage_path": f"{bc_id}/metro_emd.pdf",
            "legal_name": "Metro Constructions India Limited",
            "id_number": "DD/2026/11111",
            "page": 1,
            "confidence": 0.94,
            "extraction_status": "done",
        },
    ]
    # Note: FINANCIALS is intentionally missing for Bidder C
    try:
        sb.table("documents").insert(docs_c).execute()
    except Exception:
        for d in docs_c:
            d.pop("bid_id", None)
        sb.table("documents").insert(docs_c).execute()
    print(f"  Bidder C created with {len(docs_c)} documents (missing FINANCIALS, low-confidence UDYAM).")

    # --- Run Compliance Engine on Seeded Data ---
    print("\nRunning compliance engine and generating automated findings...")
    from app.services.compliance_engine import run_compliance_check

    for bidder_label, bidder_id_val, bid_id_val in [("A", ba_id, ba_bid_id), ("B", bb_id, bb_bid_id), ("C", bc_id, bc_bid_id)]:
        docs = sb.table("documents").select("*").eq("bidder_id", bidder_id_val).execute()
        findings = run_compliance_check(rules.data, docs.data, bidder_id_val, bid_id=bid_id_val)

        findings_to_insert = []
        for f in findings:
            item = {
                "bidder_id": f["bidder_id"],
                "rule_id": f["rule_id"],
                "status": f["status"],
                "evidence": json.dumps(f["evidence"]),
                "explanation": f["explanation"],
            }
            if "bid_id" in f and f["bid_id"]:
                item["bid_id"] = f["bid_id"]
            findings_to_insert.append(item)

        if findings_to_insert:
            try:
                sb.table("findings").insert(findings_to_insert).execute()
            except Exception:
                for item in findings_to_insert:
                    item.pop("bid_id", None)
                sb.table("findings").insert(findings_to_insert).execute()

        status_counts = {}
        for f in findings:
            s = f["status"]
            status_counts[s] = status_counts.get(s, 0) + 1

        print(f"  Bidder {bidder_label} findings: {status_counts}")

    print("\nSeed successfully completed!")
    print(f"  Tender ID: {tender_id}")
    print(f"  Tender Title: {tender_payload['title']}")
    print("  Status: OPEN (Accepting Bids)")
    print("  Submitted Bids: 3 (Ready for Officer Review)")


if __name__ == "__main__":
    main()
