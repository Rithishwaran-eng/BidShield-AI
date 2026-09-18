#!/usr/bin/env python3
"""
BidShield AI: High-Fidelity Demo Data Seeder for Smart India Hackathon (SIH) Evaluation.
Populates realistic, consistent, government-grade procurement data across Tenders, Rules,
Bidders, Documents, Findings, and Audit Logs.
"""

import os
import sys
import uuid
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, "/tmp/BidShield-AI/backend")

from app.supabase_client import get_supabase

sb = get_supabase()

print("--> Starting BidShield AI Demo Data Curation...")

# 1. Clean up garbage/test tenders
junk_tender_ids = [
    "adad2ddd-a4dd-4172-924d-cb10483f7d4c",  # Test
    "26588b9c-c2c0-441c-90e4-2de1b62aa0e0",  # Test Tender Automation
    "351c699c-b719-48fd-85d4-176eece74c5b",  # Test Tender Automation
    "314907c8-5efe-43d3-9726-e837e830068b",  # asassa
    "a04c882a-51ca-4ad7-9b3a-172bf80b1e85",  # Education
]

for j_id in junk_tender_ids:
    try:
        # Delete dependent bidders, rules, documents, findings first if cascade not active
        bids = sb.table("bidders").select("id").eq("tender_id", j_id).execute().data
        for b in bids:
            sb.table("documents").delete().eq("bidder_id", b["id"]).execute()
            sb.table("findings").delete().eq("bidder_id", b["id"]).execute()
            sb.table("bidders").delete().eq("id", b["id"]).execute()
        sb.table("rules").delete().eq("tender_id", j_id).execute()
        sb.table("tenders").delete().eq("id", j_id).execute()
        print(f"  [Cleaned] Junk tender {j_id}")
    except Exception as e:
        print(f"  [Warning] Could not delete {j_id}: {e}")

# Delete duplicate empty bidder '5382c869-9149-435c-bff0-27bc89c0953b'
try:
    sb.table("documents").delete().eq("bidder_id", "5382c869-9149-435c-bff0-27bc89c0953b").execute()
    sb.table("findings").delete().eq("bidder_id", "5382c869-9149-435c-bff0-27bc89c0953b").execute()
    sb.table("bidders").delete().eq("id", "5382c869-9149-435c-bff0-27bc89c0953b").execute()
    print("  [Cleaned] Duplicate empty bidder")
except Exception as e:
    print(f"  [Warning] Could not clean duplicate bidder: {e}")

# 2. Update Primary Showcase Tender
TENDER_1_ID = "d3e58d52-e7de-4d6f-9376-c930d627750a"
tender_1_title = "Supply, Installation & Maintenance of Enterprise Server Hardware & Storage - GeM Bid No. GEM/2026/B/4521890"

tender_1_text = """GOVERNMENT E-MARKETPLACE (GeM) - BID DOCUMENT
Bid Number: GEM/2026/B/4521890
Ministry: Ministry of Electronics and Information Technology (MeitY)
Department: Digital India Corporation / C-DAC
Estimated Value: INR 14,50,00,000 (Fourteen Crore Fifty Lakhs)

SECTION II - MANDATORY TECHNICAL & FINANCIAL ELIGIBILITY CRITERIA

1. FINANCIAL TURNOVER (TURNOVER_01):
The minimum average annual financial turnover of the bidder during the last three consecutive financial years (FY 2022-23, FY 2023-24, and FY 2024-25) must be at least INR 10.00 Crore. Bidder must submit audited balance sheets and profit & loss statements certified by a practicing Chartered Accountant with a valid Unique Document Identification Number (UDIN).

2. STATUTORY TAX REGISTRATIONS (GST_REG_01):
The bidder must possess an active Goods and Services Tax Identification Number (GSTIN) registration with continuous GSTR-3B filings for the last two quarters.

3. PERMANENT ACCOUNT NUMBER (PAN_01):
The bidder must submit a valid PAN Card issued by the Income Tax Department. The legal entity name must match across all submitted documents.

4. MSME / UDYAM PREFERENCE (UDYAM_01):
Micro and Small Enterprises (MSEs) registered with Udyam are eligible for purchase preference and EMD exemptions under the Public Procurement Policy for MSEs Order 2012.

5. PAST GOVERNMENT CONTRACT EXPERIENCE (EXPERIENCE_01):
The bidder must have successfully executed at least three (3) similar government contracts for supply of IT server/storage equipment valued at not less than INR 2.00 Crore each for any Central/State Ministry, PSU, or Autonomous Institute within the last 5 years.

6. EARNEST MONEY DEPOSIT (EMD_01):
The bidder must submit an Earnest Money Deposit (EMD) of INR 5,00,000 in the form of a Bank Guarantee from a scheduled commercial bank, or valid MSME exemption certificate.
"""

sb.table("tenders").update({
    "title": tender_1_title,
    "uploaded_text": tender_1_text,
    "status": "active",
}).eq("id", TENDER_1_ID).execute()
print(f"  [Updated] Showcase Tender: {tender_1_title}")

# Update Secondary Tender
TENDER_2_ID = "f16d7333-48df-4168-8252-b89a798a6cef"
tender_2_title = "Cloud Infrastructure & Disaster Recovery Services - GeM Bid No. GEM/2026/B/9041280"
sb.table("tenders").update({
    "title": tender_2_title,
    "status": "active",
}).eq("id", TENDER_2_ID).execute()
print(f"  [Updated] Secondary Tender: {tender_2_title}")

# 3. Rename Metro to Vanguard Networks (Illustrates Issue Detected)
VANGUARD_BIDDER_ID = "a50a1462-679c-4045-ad4e-59255ab874bb"
sb.table("bidders").update({
    "name": "Vanguard Networks & Systems Private Limited",
}).eq("id", VANGUARD_BIDDER_ID).execute()
print("  [Updated] Vanguard Networks & Systems Private Limited")

# 4. Set up Apex Data Systems Private Limited as the Primary Showcase Bidder
APEX_BIDDER_ID = "e3b3ffdb-e211-4963-ba31-1c8ba5c3e1e2"
sb.table("bidders").update({
    "name": "Apex Data Systems Private Limited",
}).eq("id", APEX_BIDDER_ID).execute()
print("  [Configured] Apex Data Systems Private Limited")

# Clear existing docs and findings for Apex
sb.table("documents").delete().eq("bidder_id", APEX_BIDDER_ID).execute()
sb.table("findings").delete().eq("bidder_id", APEX_BIDDER_ID).execute()

# 5. Insert realistic verified documents for Apex Data Systems
apex_documents = [
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "document_type": "FINANCIALS",
        "filename": "Apex_Audited_Financials_FY22-25.pdf",
        "storage_path": f"bids/{APEX_BIDDER_ID}/financials.pdf",
        "legal_name": "Apex Data Systems Private Limited",
        "id_number": "UDIN-24045123AAAAAB4567",
        "page": 4,
        "confidence": 0.98,
        "extraction_status": "extracted",
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "document_type": "GST",
        "filename": "Apex_GSTIN_REG06_Active.pdf",
        "storage_path": f"bids/{APEX_BIDDER_ID}/gst.pdf",
        "legal_name": "Apex Data Systems Private Limited",
        "id_number": "33AAACA1234F1Z5",
        "page": 1,
        "confidence": 0.99,
        "extraction_status": "extracted",
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "document_type": "PAN",
        "filename": "Apex_PAN_Card_Corporate.pdf",
        "storage_path": f"bids/{APEX_BIDDER_ID}/pan.pdf",
        "legal_name": "Apex Data Systems Private Limited",
        "id_number": "AAACA1234F",
        "page": 1,
        "confidence": 0.99,
        "extraction_status": "extracted",
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "document_type": "UDYAM",
        "filename": "Apex_Udyam_MSME_Small_Enterprise.pdf",
        "storage_path": f"bids/{APEX_BIDDER_ID}/udyam.pdf",
        "legal_name": "Apex Data Systems Private Limited",
        "id_number": "UDYAM-TN-03-0012345",
        "page": 1,
        "confidence": 0.97,
        "extraction_status": "extracted",
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "document_type": "EXPERIENCE",
        "filename": "Apex_Past_Performance_Completion_Certificates.pdf",
        "storage_path": f"bids/{APEX_BIDDER_ID}/experience.pdf",
        "legal_name": "Apex Data Systems Private Limited",
        "id_number": "WO-CDAC-2023-891",
        "page": 3,
        "confidence": 0.96,
        "extraction_status": "extracted",
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "document_type": "EMD",
        "filename": "SBI_Bank_Guarantee_EMD_5Lakhs.pdf",
        "storage_path": f"bids/{APEX_BIDDER_ID}/emd.pdf",
        "legal_name": "Apex Data Systems Private Limited",
        "id_number": "BG/2026/09041280",
        "page": 1,
        "confidence": 0.99,
        "extraction_status": "extracted",
    },
]

for doc in apex_documents:
    sb.table("documents").insert(doc).execute()
print(f"  [Inserted] {len(apex_documents)} statutory documents for Apex Data Systems")

# 6. Insert rich compliance findings for Apex Data Systems
rules_res = sb.table("rules").select("id, rule_id").eq("tender_id", TENDER_1_ID).execute().data
rule_map = {r["rule_id"]: r["id"] for r in rules_res}

apex_findings = [
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "rule_id": rule_map.get("TURNOVER_01"),
        "status": "verified",
        "explanation": (
            'Rule "TURNOVER_01: Minimum average annual turnover of Rs 10.00 Crore" is verified. '
            'Extracted 3-year financials: FY 2022-23: Rs 12.40 Cr, FY 2023-24: Rs 15.10 Cr, '
            'FY 2024-25: Rs 16.95 Cr. Average Annual Turnover: Rs 14.82 Crore (Threshold: Rs 10.00 Crore). '
            'Certified by Chartered Accountant R. Swaminathan (FCA 045123) with valid UDIN 24045123AAAAAB4567.'
        ),
        "evidence": [
            {
                "label": "Audited Balance Sheets (FY 2022-25)",
                "document": "Apex_Audited_Financials_FY22-25.pdf",
                "page": 4,
                "confidence": 0.98,
                "quote": "Average Annual Turnover for the preceding three fiscal years stands at INR 14,81,66,667.",
            },
            {
                "label": "Statutory CA UDIN Certificate",
                "document": "Apex_Audited_Financials_FY22-25.pdf",
                "page": 6,
                "confidence": 0.99,
                "quote": "UDIN: 24045123AAAAAB4567. Verified active on ICAI UDIN portal.",
            },
        ],
        "officer_action": "verified",
        "officer_note": "Turnover verified against ICAI UDIN portal. Substantially exceeds the Rs 10 Crore minimum requirement.",
        "action_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "rule_id": rule_map.get("GST_REG_01"),
        "status": "verified",
        "explanation": (
            'Rule "GST_REG_01: Valid GST Registration Certificate with active GSTIN" is verified. '
            'Active GSTIN: 33AAACA1234F1Z5 registered in Tamil Nadu. '
            'GSTR-3B filings verified active and timely for the preceding 4 quarters. Legal entity name matches exactly.'
        ),
        "evidence": [
            {
                "label": "Form GST REG-06",
                "document": "Apex_GSTIN_REG06_Active.pdf",
                "page": 1,
                "confidence": 0.99,
                "quote": "Legal Name: Apex Data Systems Private Limited | GSTIN: 33AAACA1234F1Z5 | Status: Active Regular",
            }
        ],
        "officer_action": "verified",
        "officer_note": "GSTIN verified active with jurisdictional tax authority.",
        "action_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "rule_id": rule_map.get("PAN_01"),
        "status": "verified",
        "explanation": (
            'Rule "PAN_01: Valid PAN Card matching legal entity name" is verified. '
            'PAN: AAACA1234F. Entity name "Apex Data Systems Private Limited" matches exactly across PAN and tender application.'
        ),
        "evidence": [
            {
                "label": "Income Tax Department PAN",
                "document": "Apex_PAN_Card_Corporate.pdf",
                "page": 1,
                "confidence": 0.99,
                "quote": "Permanent Account Number: AAACA1234F | Name: APEX DATA SYSTEMS PRIVATE LIMITED",
            }
        ],
        "officer_action": "verified",
        "officer_note": "PAN entity match confirmed.",
        "action_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "rule_id": rule_map.get("UDYAM_01"),
        "status": "verified",
        "explanation": (
            'Rule "UDYAM_01: Valid Udyam Registration Certificate for MSME benefits" is verified. '
            'Udyam Registration: UDYAM-TN-03-0012345. Classification: Small Enterprise (Manufacturing & IT Services). '
            'Eligible for Public Procurement Policy purchase preference.'
        ),
        "evidence": [
            {
                "label": "Udyam Registration Certificate",
                "document": "Apex_Udyam_MSME_Small_Enterprise.pdf",
                "page": 1,
                "confidence": 0.97,
                "quote": "Enterprise Name: Apex Data Systems Private Limited | Classification: Small | NIC 2620 - Computer Manufacturing & Hardware",
            }
        ],
        "officer_action": "verified",
        "officer_note": "MSME Small Enterprise preference verified.",
        "action_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "rule_id": rule_map.get("EXPERIENCE_01"),
        "status": "verified",
        "explanation": (
            'Rule "EXPERIENCE_01: Minimum 3 similar IT equipment supply orders (Rs 2.00 Cr each) in last 5 years" is verified. '
            'Bidder submitted 3 verified government completion certificates: '
            '(1) C-DAC Pune HPC Cluster (Rs 3.85 Cr, 2023), (2) IIT Madras Supercomputing Lab (Rs 4.20 Cr, 2024), '
            '(3) National Informatics Centre Data Node (Rs 3.15 Cr, 2024). All orders meet the criterion.'
        ),
        "evidence": [
            {
                "label": "Past Work Order 1 - C-DAC Pune",
                "document": "Apex_Past_Performance_Completion_Certificates.pdf",
                "page": 1,
                "confidence": 0.97,
                "quote": "Order No: WO-CDAC-2023-891 | Value: INR 3,85,00,000 | Completion Date: 14-Nov-2023",
            },
            {
                "label": "Past Work Order 2 - IIT Madras",
                "document": "Apex_Past_Performance_Completion_Certificates.pdf",
                "page": 2,
                "confidence": 0.96,
                "quote": "Order No: IITM/CSE/2024/044 | Value: INR 4,20,00,000 | Completion Date: 02-May-2024",
            },
            {
                "label": "Past Work Order 3 - NIC MeitY",
                "document": "Apex_Past_Performance_Completion_Certificates.pdf",
                "page": 3,
                "confidence": 0.98,
                "quote": "Order No: NIC/HQ/DC/2024/112 | Value: INR 3,15,00,000 | Completion Date: 19-Aug-2024",
            },
        ],
        "officer_action": "verified",
        "officer_note": "Three major government supply orders confirmed with satisfactory completion certificates.",
        "action_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "rule_id": rule_map.get("EMD_01"),
        "status": "verified",
        "explanation": (
            'Rule "EMD_01: Earnest Money Deposit of Rs 5,00,000" is verified. '
            'Irrevocable Bank Guarantee BG/2026/09041280 issued by State Bank of India for Rs 5,00,000 '
            'valid through 180 days past bid validity. Bank confirmation attached.'
        ),
        "evidence": [
            {
                "label": "State Bank of India - BG",
                "document": "SBI_Bank_Guarantee_EMD_5Lakhs.pdf",
                "page": 1,
                "confidence": 0.99,
                "quote": "Bank Guarantee No: BG/2026/09041280 | Amount: INR 5,00,000 | Beneficiary: Digital India Corporation",
            }
        ],
        "officer_action": "verified",
        "officer_note": "Bank Guarantee validity and SFMS confirmation received.",
        "action_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "bidder_id": APEX_BIDDER_ID,
        "rule_id": None,
        "status": "verified",
        "explanation": (
            'Cross-Document Entity Consistency: Legal name "Apex Data Systems Private Limited" '
            'is 100% consistent across PAN, GSTIN, Udyam, Audited Financials, and Bank Guarantee without variation.'
        ),
        "evidence": [
            {
                "label": "Cross-Document Name Audit",
                "document": "All Submitted Dossiers",
                "page": 1,
                "confidence": 1.0,
                "quote": "Exact character-level match across all 6 statutory compliance documents.",
            }
        ],
        "officer_action": "verified",
        "officer_note": "Zero identity discrepancy detected.",
        "action_at": datetime.now(timezone.utc).isoformat(),
    },
]

for finding in apex_findings:
    sb.table("findings").insert(finding).execute()
print(f"  [Inserted] {len(apex_findings)} verified findings for Apex Data Systems")

# 7. Add Audit Log Entries
audit_entries = [
    {
        "id": str(uuid.uuid4()),
        "finding_id": apex_findings[0]["id"],
        "officer_name": "SARATHI S",
        "action": "VERIFIED_CRITERIA",
        "note": "Confirmed Chartered Accountant UDIN 24045123AAAAAB4567 on ICAI portal. Financial turnover of Rs 14.82 Cr accepted.",
        "officer_clerk_id": "user_3JSOevTG6bQnw7VlgEUM85xMRMM",
    },
    {
        "id": str(uuid.uuid4()),
        "finding_id": apex_findings[4]["id"],
        "officer_name": "SARATHI S",
        "action": "VERIFIED_EXPERIENCE",
        "note": "Verified 3 past government completion certificates (C-DAC, IIT Madras, NIC). Substantial compliance verified.",
        "officer_clerk_id": "user_3JSOevTG6bQnw7VlgEUM85xMRMM",
    },
    {
        "id": str(uuid.uuid4()),
        "finding_id": "3dabaa9a-182d-4f3e-8b20-38f170767307",  # Vanguard missing turnover finding
        "officer_name": "SARATHI S",
        "action": "CLARIFICATION_REQUESTED",
        "note": "Issued formal clarification notice under GFR 173(iv) regarding missing FY 2024-25 audited balance sheet.",
        "officer_clerk_id": "user_3JSOevTG6bQnw7VlgEUM85xMRMM",
    },
]

for entry in audit_entries:
    try:
        sb.table("audit_log").insert(entry).execute()
        print(f"  [Inserted] Audit log: {entry['action']}")
    except Exception as e:
        print(f"  [Warning] Audit log insert: {e}")

print("--> BidShield AI Demo Data Setup Complete!")
