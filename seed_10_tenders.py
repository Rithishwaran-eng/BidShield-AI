#!/usr/bin/env python3
"""
BidShield AI: 10 Realistic Government e-Marketplace (GeM) Tenders Seeder.
Creates 10 distinct, government-grade tenders across 10 Ministries/Agencies
with authentic technical & financial rules, unique bidders, statutory documents,
and comprehensive compliance findings for hackathon demonstration.
"""

import os
import sys
import uuid
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, "/tmp/BidShield-AI/backend")

from dotenv import load_dotenv
load_dotenv("/tmp/BidShield-AI/backend/.env")

from app.supabase_client import get_supabase

sb = get_supabase()

print("=" * 70)
print("--> BidShield AI: Seeding 10 Real-World Procurement Tenders")
print("=" * 70)

# Tenders Definition
TENDERS_DATA = [
    # -------------------------------------------------------------
    # TENDER 1: MeitY / C-DAC - Server Hardware (Existing Primary Showcase)
    # -------------------------------------------------------------
    {
        "id": "d3e58d52-e7de-4d6f-9376-c930d627750a",
        "title": "Supply, Installation & Maintenance of Enterprise Server Hardware & Storage - GeM Bid No. GEM/2026/B/4521890",
        "status": "under_evaluation",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - BID DOCUMENT
Bid Number: GEM/2026/B/4521890
Ministry: Ministry of Electronics and Information Technology (MeitY)
Department: Digital India Corporation / C-DAC
Estimated Value: INR 14,50,00,000 (Fourteen Crore Fifty Lakhs)

MANDATORY TECHNICAL & FINANCIAL ELIGIBILITY CRITERIA:
1. FINANCIAL TURNOVER (TURNOVER_01): Minimum average annual turnover of Rs 10.00 Crore during FY 2022-23, FY 2023-24, and FY 2024-25. Must submit audited balance sheets with valid CA UDIN.
2. STATUTORY TAX REGISTRATIONS (GST_REG_01): Active GSTIN registration with continuous GSTR-3B filings for the last two quarters.
3. PERMANENT ACCOUNT NUMBER (PAN_01): Valid PAN Card matching legal entity name across all documents.
4. MSME PREFERENCE (UDYAM_01): Valid Udyam registration for MSE purchase preference and EMD exemption.
5. PAST EXPERIENCE (EXPERIENCE_01): Minimum 3 similar government contracts for supply of IT server/storage equipment (min Rs 2.00 Crore each) within last 5 years.
6. EARNEST MONEY DEPOSIT (EMD_01): EMD of Rs 5,00,000 via Bank Guarantee or valid MSME exemption.""",
    },
    # -------------------------------------------------------------
    # TENDER 2: MeitY / NIC - Sovereign Cloud Infrastructure
    # -------------------------------------------------------------
    {
        "id": "f16d7333-48df-4168-8252-b89a798a6cef",
        "title": "Establishment of Sovereign Cloud Infrastructure & Automated Disaster Recovery - GeM Bid No. GEM/2026/B/9041280",
        "status": "under_evaluation",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - BID SPECIFICATION
Bid Number: GEM/2026/B/9041280
Ministry: Ministry of Electronics and Information Technology (MeitY)
Department: National Informatics Centre (NIC)
Subject: Sovereign Cloud Hosting & Automated Disaster Recovery
Estimated Value: INR 28,00,00,000 (Twenty Eight Crore)

SECTION II - MANDATORY TECHNICAL & CLOUD SECURITY CRITERIA:
1. ISO 27001 & ISO 27017 CLOUD SECURITY (NIC_SEC_01): The Cloud Service Provider (CSP) must hold active ISO/IEC 27001:2022 and ISO/IEC 27017 cloud security certifications empanelled with MeitY.
2. TIER-IV DATA CENTRE REQUIREMENT (NIC_TIER_02): Primary and secondary Disaster Recovery data centers must hold TIA-942 Rated 4 or Uptime Institute Tier-IV Design and Facility certification within Indian territorial borders.
3. RTO & RPO SLA (NIC_RTO_03): Demonstrated failover capabilities with Recovery Time Objective (RTO) <= 15 minutes and Recovery Point Objective (RPO) <= 5 minutes.
4. FINANCIAL TURNOVER (NIC_TURNOVER_04): Minimum average annual turnover of INR 25.00 Crore over the last 3 financial years (FY 2022-25) certified by practicing CA with valid UDIN.
5. BID SECURITY / EMD (NIC_EMD_05): Earnest Money Deposit of INR 12,50,000 in form of Bank Guarantee from any Scheduled Commercial Bank.""",
    },
    # -------------------------------------------------------------
    # TENDER 3: MoHFW / AIIMS New Delhi - Linear Accelerator & Oncology Radiography
    # -------------------------------------------------------------
    {
        "id": "a1111111-1111-4111-8111-111111111103",
        "title": "Turnkey Supply, Installation & 5-Year CMC of High-Energy Linear Accelerator & Digital Radiography - GeM Bid No. GEM/2026/B/2183902",
        "status": "under_evaluation",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - GLOBAL TENDER NOTICE
Bid Number: GEM/2026/B/2183902
Ministry: Ministry of Health & Family Welfare (MoHFW)
Department: All India Institute of Medical Sciences (AIIMS), New Delhi
Category: Advanced Medical Diagnostic & Radiation Oncology Equipment
Estimated Value: INR 48,00,00,000 (Forty Eight Crore)

TECHNICAL & REGULATORY ELIGIBILITY CRITERIA:
1. AERB STATULATORY CLEARANCE (AIIMS_AERB_01): Equipment must possess valid Type Approval and Site Clearance NOC issued by the Atomic Energy Regulatory Board (AERB), Govt. of India.
2. MEDICAL DEVICE REGULATORY APPROVAL (AIIMS_FDA_02): Bidder must furnish valid US-FDA 510(k) or European CE (Medical Device Regulation MDR 2017/745 Class IIb/III) certification.
3. 5-YEAR COMPREHENSIVE MAINTENANCE CONTRACT (AIIMS_CMC_03): Mandatory commitment for 5-year CMC post 2-year warranty with 98% guaranteed clinical uptime and 4-hour breakdown response.
4. FINANCIAL TURNOVER (AIIMS_TURNOVER_04): Minimum average annual turnover of INR 40.00 Crore in medical devices during FY 2022-23, 2023-24, and 2024-25.
5. PAST CLINICAL INSTALLATIONS (AIIMS_EXP_05): Minimum 5 successful turnkey installations of Linear Accelerators in Central/State Government Medical Colleges or Apex Cancer Hospitals.""",
    },
    # -------------------------------------------------------------
    # TENDER 4: Ministry of Defence / Indian Coast Guard - Coastal Surveillance Radars
    # -------------------------------------------------------------
    {
        "id": "a2222222-2222-4222-8222-222222222204",
        "title": "Supply & Turnkey Commissioning of X-Band Coastal Surveillance Radars & Automatic Identification Systems - GeM Bid No. GEM/2026/B/3910283",
        "status": "under_evaluation",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - DEFENCE PROCUREMENT DOCUMENT
Bid Number: GEM/2026/B/3910283
Ministry: Ministry of Defence
Department: Indian Coast Guard (ICG) Headquarters
Category: Maritime Defence Electronics & Surveillance
Estimated Value: INR 65,00,00,000 (Sixty Five Crore)

MANDATORY STRATEGIC & TECHNICAL REQUIREMENTS:
1. MAKE IN INDIA CLASS-I SUPPLIER (DEF_MII_01): DPIIT Class-I Local Supplier certificate showing minimum 60% indigenous local value addition certified by statutory auditor.
2. MIL-STD-810G ENVIRONMENTAL RESILIENCE (DEF_MIL_02): Test compliance certificate for MIL-STD-810G (marine salt spray corrosion, wind load 150 km/h, temperature -20°C to +55°C) from NABL/CQAE/ILAC lab.
3. DEFENCE INDUSTRIAL LICENSE & SECURITY (DEF_CLEAR_03): Valid Defence Industrial License issued by DPIIT under IDRA 1951 and valid Security Clearance from Ministry of Home Affairs.
4. DEFENCE TURNOVER (DEF_TURNOVER_04): Minimum average annual turnover of INR 35.00 Crore in radar/defense electronics for the preceding three fiscal years.
5. EARNEST MONEY DEPOSIT (DEF_EMD_05): EMD of INR 18,00,000 in form of Bank Guarantee in favour of PCDA (Navy/Coast Guard).""",
    },
    # -------------------------------------------------------------
    # TENDER 5: Ministry of Railways / DFCCIL - Kavach & Electronic Interlocking
    # -------------------------------------------------------------
    {
        "id": "a3333333-3333-4333-8333-333333333305",
        "title": "Design, Supply & Commissioning of Electronic Interlocking Signaling & Train Collision Avoidance System (Kavach) - GeM Bid No. GEM/2026/B/4819204",
        "status": "open",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - RAILWAY INFRASTRUCTURE BID
Bid Number: GEM/2026/B/4819204
Ministry: Ministry of Railways
Department: Dedicated Freight Corridor Corporation of India Limited (DFCCIL)
Category: Railway Signaling & Safety Systems
Estimated Value: INR 92,00,00,000 (Ninety Two Crore)

TECHNICAL & SAFETY COMPLIANCE MANDATES:
1. RDSO APPROVED VENDOR LIST (RDSO_APPR_01): Bidder must be an active, approved developmental or regular vendor listed with RDSO Lucknow for TCAS / Kavach equipment.
2. SIL-4 SAFETY INTEGRITY CERTIFICATION (SIL4_CERT_02): Safety Integrity Level 4 (SIL-4) third-party functional safety certification in compliance with CENELEC EN 50126, EN 50128, and EN 50129.
3. ROUTE COMMISSIONING TRACK RECORD (RAIL_EXP_03): Successful past commissioning of minimum 150 Route Kilometers (RKm) of modern electronic interlocking on Indian Railways.
4. FINANCIAL TURNOVER (RAIL_TURNOVER_04): Minimum average annual turnover of INR 50.00 Crore over the last 3 financial years.
5. BANK GUARANTEE EMD (RAIL_EMD_05): Bid security of INR 25,00,000 via irrevocable Bank Guarantee.""",
    },
    # -------------------------------------------------------------
    # TENDER 6: Ministry of Education / IIT Delhi - Smart Campus Wi-Fi 6E & SDN
    # -------------------------------------------------------------
    {
        "id": "a4444444-4444-4444-8444-444444444406",
        "title": "Deployment of High-Density Campus Wi-Fi 6E Wireless Infrastructure & Centralized SDN Core - GeM Bid No. GEM/2026/B/5728190",
        "status": "open",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - HIGHER EDUCATION TENDER
Bid Number: GEM/2026/B/5728190
Ministry: Ministry of Education
Department: Indian Institute of Technology (IIT) Delhi
Category: Campus Enterprise Networking & IT Infrastructure
Estimated Value: INR 11,50,00,000 (Eleven Crore Fifty Lakhs)

CRITERIA:
1. OEM MANUFACTURER AUTHORIZATION FORM (WIFI_OEM_01): Dedicated Manufacturer Authorization Form (MAF) from Tier-1 Networking OEM with specific tender bid reference and 5-year hardware replacement SLA.
2. CONCURRENT HIGH-DENSITY EXPERIENCE (WIFI_SCALE_02): Proven track record of deploying campus Wi-Fi infrastructure supporting >= 10,000 concurrent active wireless users in a university or research campus.
3. WI-FI 6E & WPA3 CERTIFICATION (WIFI_CERT_03): Indoor and outdoor APs must be Wi-Fi Alliance certified for Wi-Fi 6E (802.11ax 6GHz) and WPA3-Enterprise security.
4. FINANCIAL TURNOVER (WIFI_TURNOVER_04): Minimum average annual turnover of INR 8.00 Crore during FY 2022-23, 2023-24, and 2024-25.
5. UDYAM MSME PREFERENCE (WIFI_MSME_05): MSE purchase preference admissible for registered Udyam enterprises.""",
    },
    # -------------------------------------------------------------
    # TENDER 7: ISRO / URSC - Satellite Structural Fabrication & 5-Axis CNC
    # -------------------------------------------------------------
    {
        "id": "a5555555-5555-4555-8555-555555555507",
        "title": "Precision 5-Axis CNC Machining & CMM Inspection of Satellite Structural Bus Subsystems - GeM Bid No. GEM/2026/B/6829103",
        "status": "open",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - AEROSPACE MANUFACTURING DOSSIER
Bid Number: GEM/2026/B/6829103
Ministry: Department of Space / Indian Space Research Organisation (ISRO)
Department: U R Rao Satellite Centre (URSC), Bengaluru
Category: Aerospace Precision Engineering & Spacecraft Structures
Estimated Value: INR 16,80,00,000 (Sixteen Crore Eighty Lakhs)

MANDATORY AEROSPACE QUALITY & FACILITY CRITERIA:
1. AS9100D AEROSPACE CERTIFICATION (AERO_AS9100_01): Valid AS9100 Rev D Aerospace Quality Management System certification from an accredited registrar.
2. ISO CLASS 7 CLEANROOM FACILITY (AERO_CLEAN_02): In-house ISO 14644-1 Class 7 (Class 10,000) cleanroom for aerospace component assembly, cleaning, and vacuum-sealed packaging.
3. NABL TRACEABLE CMM INSPECTION (AERO_NABL_03): In-house high-accuracy 3D Coordinate Measuring Machine (CMM) with volumetric accuracy <= (1.5 + L/300) um and valid NABL calibration certificate.
4. SPACE-GRADE FLIGHT HARDWARE EXPERIENCE (AERO_EXP_04): Successful delivery of at least 2 flight-grade structural component packages for ISRO launch vehicle or satellite missions.
5. FINANCIAL TURNOVER (AERO_TURNOVER_05): Minimum average annual turnover of INR 12.00 Crore over the last 3 financial years.""",
    },
    # -------------------------------------------------------------
    # TENDER 8: MoRTH / NHAI - FASTag RFID & ANPR Multi-Lane Toll Systems
    # -------------------------------------------------------------
    {
        "id": "a6666666-6666-4666-8666-666666666608",
        "title": "Supply, Commissioning & Maintenance of FASTag RFID Transceivers & AI-Based ANPR Cameras - GeM Bid No. GEM/2026/B/7918234",
        "status": "open",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - HIGHWAY INFRASTRUCTURE BID
Bid Number: GEM/2026/B/7918234
Ministry: Ministry of Road Transport and Highways (MoRTH)
Department: National Highways Authority of India (NHAI)
Category: Intelligent Transportation & Electronic Toll Collection
Estimated Value: INR 21,50,00,000 (Twenty One Crore Fifty Lakhs)

CRITERIA:
1. IHMCL HOMOLOGATION APPROVAL (NHAI_IHMCL_01): RFID readers must possess valid Product Homologation & Type Approval issued by Indian Highway Management Company Limited (IHMCL).
2. HIGH-ACCURACY ANPR CAMERA (NHAI_ANPR_02): Automatic Number Plate Recognition (ANPR) cameras with minimum 95% recognition accuracy tested by ARAI or ICAT under high-speed and adverse weather conditions.
3. IP67 & IK10 ENCLOSURE CERTIFICATE (NHAI_IP67_03): Enclosures certified for IP67 Ingress Protection and IK10 impact resistance from a NABL accredited laboratory.
4. FINANCIAL TURNOVER (NHAI_TURNOVER_04): Minimum average annual turnover of INR 15.00 Crore during FY 2022-25.
5. ON-SITE 4-HOUR MTTR SLA (NHAI_SLA_05): Mandatory SLA undertaking guaranteeing 4-hour Mean Time To Restore (MTTR) at designated toll plazas with 24x7 local support teams.""",
    },
    # -------------------------------------------------------------
    # TENDER 9: Ministry of Power / NTPC - IEC 61850 Substation Automation
    # -------------------------------------------------------------
    {
        "id": "a7777777-7777-4777-8777-777777777709",
        "title": "Engineering, Supply & Retrofit of IEC-61850 Substation Automation Systems & SCADA RTUs - GeM Bid No. GEM/2026/B/8291045",
        "status": "rules_approved",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - POWER SECTOR PROCUREMENT
Bid Number: GEM/2026/B/8291045
Ministry: Ministry of Power
Department: NTPC Limited, Corporate Engineering
Category: Substation Automation, SCADA & Grid Protection
Estimated Value: INR 36,00,00,000 (Thirty Six Crore)

ELIGIBILITY MANDATES:
1. IEC 61850 ED 2 LEVEL-A CERTIFICATION (NTPC_IEC_01): Complete SAS solution and Bay Control Units must hold Level-A conformance certification from KEMA (Netherlands) or CPRI India for IEC 61850 Edition 2.
2. CEA CYBER SECURITY COMPLIANCE (NTPC_CYBER_02): Strict compliance with Central Electricity Authority (Cyber Security in Power Sector) Guidelines 2021 with VAPT audit report from CERT-In empanelled auditor.
3. EHV SUBSTATION EXPERIENCE (NTPC_EXP_03): Successful commissioning of SAS in at least two 400kV or higher Extra High Voltage (EHV) substations in India within the last 7 years.
4. FINANCIAL TURNOVER (NTPC_TURNOVER_04): Minimum average annual turnover of INR 30.00 Crore during the preceding 3 fiscal years.
5. BID SECURITY EMD (NTPC_EMD_05): Earnest Money Deposit of INR 15,00,000 via irrevocable Bank Guarantee.""",
    },
    # -------------------------------------------------------------
    # TENDER 10: MoEFCC / CPCB - CAAQMS Continuous Air Quality Monitoring
    # -------------------------------------------------------------
    {
        "id": "a8888888-8888-4888-8888-888888888810",
        "title": "Supply, Turnkey Commissioning & Cloud Telemetry of Continuous Ambient Air Quality Monitoring Systems - GeM Bid No. GEM/2026/B/9182301",
        "status": "open",
        "uploaded_text": """GOVERNMENT E-MARKETPLACE (GeM) - ENVIRONMENTAL SURVEILLANCE
Bid Number: GEM/2026/B/9182301
Ministry: Ministry of Environment, Forest and Climate Change (MoEFCC)
Department: Central Pollution Control Board (CPCB)
Category: Environmental Instrumentation & Real-time Telemetry
Estimated Value: INR 18,20,00,000 (Eighteen Crore Twenty Lakhs)

CRITERIA:
1. US-EPA / MCERTS CERTIFIED ANALYZERS (CPCB_USEPA_01): All continuous gas and particulate analyzers (PM2.5, PM10, SO2, NOx, CO, O3) must be certified by US-EPA (Federal Reference Method) or TUV / MCERTS.
2. NPL TRACEABLE CALIBRATION (CPCB_NABL_02): Gas calibration cylinders and dynamic diluters must possess calibration certificates traceable to National Physical Laboratory (NPL) India or equivalent national metrology institute.
3. REAL-TIME CPCB TELEMETRY PROTOCOL (CPCB_TELEMETRY_03): Data acquisition system must support continuous 15-minute averaged encryption telemetry directly pushing data to the CPCB Central Server via standard REST APIs.
4. FINANCIAL TURNOVER (CPCB_TURNOVER_04): Minimum average annual turnover of INR 10.00 Crore during FY 2022-25.
5. 5-YEAR O&M CONTRACT (CPCB_OANDM_05): Commitment for 5-year Comprehensive Operations & Maintenance ensuring minimum 95% continuous valid data availability.""",
    },
]

# Clean dummy company A from Tender 2
try:
    c_a_bidders = sb.table("bidders").select("id").eq("tender_id", "f16d7333-48df-4168-8252-b89a798a6cef").eq("name", "company A").execute().data
    for ca in c_a_bidders:
        sb.table("documents").delete().eq("bidder_id", ca["id"]).execute()
        sb.table("findings").delete().eq("bidder_id", ca["id"]).execute()
        sb.table("bidders").delete().eq("id", ca["id"]).execute()
        print("  [Cleaned] Dummy 'company A' bidder from Tender 2")
except Exception as e:
    print(f"  [Notice] Dummy company A clean: {e}")

# Upsert all 10 Tenders
for t_data in TENDERS_DATA:
    try:
        # Check if tender exists
        existing = sb.table("tenders").select("id").eq("id", t_data["id"]).execute().data
        if existing:
            sb.table("tenders").update({
                "title": t_data["title"],
                "uploaded_text": t_data["uploaded_text"],
                "status": t_data["status"],
            }).eq("id", t_data["id"]).execute()
            print(f"  [Tender Updated] {t_data['title'][:65]}...")
        else:
            sb.table("tenders").insert({
                "id": t_data["id"],
                "title": t_data["title"],
                "uploaded_text": t_data["uploaded_text"],
                "status": t_data["status"],
            }).execute()
            print(f"  [Tender Created] {t_data['title'][:65]}...")
    except Exception as e:
        print(f"  [Error] Tender {t_data['id']}: {e}")

# -------------------------------------------------------------
# RULES DEFINITION FOR TENDERS 2 THROUGH 10
# -------------------------------------------------------------
TENDERS_RULES = {
    # TENDER 2: NIC Sovereign Cloud
    "f16d7333-48df-4168-8252-b89a798a6cef": [
        {
            "rule_id": "NIC_SEC_01",
            "requirement": "Cloud Service Provider (CSP) must hold active ISO/IEC 27001:2022 and ISO/IEC 27017 cloud security certifications empanelled with MeitY.",
            "mandatory": True,
            "evidence_required": ["ISO 27001 Certificate", "ISO 27017 Certificate", "MeitY Empanelment Letter"],
            "threshold": "Valid accreditation through 2026",
            "approved": True,
        },
        {
            "rule_id": "NIC_TIER_02",
            "requirement": "Primary and DR Data Centres must hold TIA-942 Rated 4 or Uptime Institute Tier-IV Design and Facility certification located in India.",
            "mandatory": True,
            "evidence_required": ["Tier-IV Facility Certificate", "Data Centre Physical Address Verification"],
            "threshold": "Tier-IV / Rated 4 certified facility",
            "approved": True,
        },
        {
            "rule_id": "NIC_RTO_03",
            "requirement": "Demonstrated automated DR failover capability with RTO <= 15 minutes and RPO <= 5 minutes.",
            "mandatory": True,
            "evidence_required": ["Disaster Recovery Drill Report", "Automated Replication Architecture Doc"],
            "threshold": "RTO <= 15m, RPO <= 5m",
            "approved": True,
        },
        {
            "rule_id": "NIC_TURNOVER_04",
            "requirement": "Minimum average annual financial turnover of INR 25.00 Crore over the last 3 financial years (FY 2022-25) certified by CA with valid UDIN.",
            "mandatory": True,
            "evidence_required": ["Audited Financial Statements", "CA Turnover Certificate with UDIN"],
            "threshold": "INR 25.00 Crore average",
            "approved": True,
        },
        {
            "rule_id": "NIC_EMD_05",
            "requirement": "Earnest Money Deposit (EMD) of INR 12,50,000 via Bank Guarantee from any Scheduled Commercial Bank or valid MSME exemption.",
            "mandatory": True,
            "evidence_required": ["Bank Guarantee Document", "SFMS Confirmation Advice"],
            "threshold": "INR 12,50,000",
            "approved": True,
        },
    ],
    # TENDER 3: AIIMS New Delhi - Linear Accelerator
    "a1111111-1111-4111-8111-111111111103": [
        {
            "rule_id": "AIIMS_AERB_01",
            "requirement": "Equipment must possess valid Type Approval and Site Clearance NOC issued by Atomic Energy Regulatory Board (AERB), Govt. of India.",
            "mandatory": True,
            "evidence_required": ["AERB Type Approval Certificate", "Radiation Safety Committee Clearance"],
            "threshold": "Valid AERB Type Approval for quoted model",
            "approved": True,
        },
        {
            "rule_id": "AIIMS_FDA_02",
            "requirement": "Must furnish valid US-FDA 510(k) or European CE (Medical Device Regulation MDR 2017/745 Class IIb/III) certificate.",
            "mandatory": True,
            "evidence_required": ["US-FDA 510(k) Letter", "European CE MDR Class IIb/III Certificate"],
            "threshold": "Active regulatory device approval",
            "approved": True,
        },
        {
            "rule_id": "AIIMS_CMC_03",
            "requirement": "Mandatory commitment for 5-Year Comprehensive Maintenance Contract (CMC) with 98% guaranteed clinical uptime.",
            "mandatory": True,
            "evidence_required": ["CMC Commitment Undertaking", "Service Support SLA Plan"],
            "threshold": "98% clinical uptime with 4hr response",
            "approved": True,
        },
        {
            "rule_id": "AIIMS_TURNOVER_04",
            "requirement": "Minimum average annual turnover of INR 40.00 Crore in medical devices during FY 2022-25 with CA UDIN.",
            "mandatory": True,
            "evidence_required": ["Audited Balance Sheets", "CA Certificate with UDIN"],
            "threshold": "INR 40.00 Crore average",
            "approved": True,
        },
        {
            "rule_id": "AIIMS_EXP_05",
            "requirement": "Minimum 5 successful turnkey installations of Linear Accelerators in Central/State Government Medical Colleges or Apex Hospitals.",
            "mandatory": True,
            "evidence_required": ["Installation Certificates", "Satisfactory Clinical Performance Reports"],
            "threshold": "5 successful turnkey installations",
            "approved": True,
        },
    ],
    # TENDER 4: Coast Guard - Radar
    "a2222222-2222-4222-8222-222222222204": [
        {
            "rule_id": "DEF_MII_01",
            "requirement": "Make in India (DPIIT) Class-I Local Supplier certificate showing minimum 60% indigenous local value addition.",
            "mandatory": True,
            "evidence_required": ["DPIIT Local Content Certificate", "Statutory Auditor Verification"],
            "threshold": "Minimum 60% local content (Class-I)",
            "approved": True,
        },
        {
            "rule_id": "DEF_MIL_02",
            "requirement": "Test compliance certificate for MIL-STD-810G (marine salt spray corrosion, wind load 150 km/h, -20C to +55C) from NABL/CQAE lab.",
            "mandatory": True,
            "evidence_required": ["MIL-STD-810G Environmental Test Report", "CQAE / NABL Lab Accreditation"],
            "threshold": "Complete MIL-STD-810G pass report",
            "approved": True,
        },
        {
            "rule_id": "DEF_CLEAR_03",
            "requirement": "Valid Defence Industrial License issued by DPIIT and valid Security Clearance from Ministry of Home Affairs.",
            "mandatory": True,
            "evidence_required": ["DPIIT Defence Industrial License", "MHA Security Clearance Letter"],
            "threshold": "Active Industrial License",
            "approved": True,
        },
        {
            "rule_id": "DEF_TURNOVER_04",
            "requirement": "Minimum average annual turnover of INR 35.00 Crore in defense/maritime electronics during FY 2022-25.",
            "mandatory": True,
            "evidence_required": ["Audited Financials", "CA Turnover Certificate with UDIN"],
            "threshold": "INR 35.00 Crore average",
            "approved": True,
        },
        {
            "rule_id": "DEF_EMD_05",
            "requirement": "Earnest Money Deposit of INR 18,00,000 in form of Bank Guarantee in favour of PCDA (Navy/Coast Guard).",
            "mandatory": True,
            "evidence_required": ["Bank Guarantee Document", "EMD Undertaking"],
            "threshold": "INR 18,00,000",
            "approved": True,
        },
    ],
    # TENDER 5: DFCCIL - Kavach & Signaling
    "a3333333-3333-4333-8333-333333333305": [
        {
            "rule_id": "RDSO_APPR_01",
            "requirement": "Bidder must be an active, approved developmental or regular vendor listed with RDSO Lucknow for TCAS / Kavach equipment.",
            "mandatory": True,
            "evidence_required": ["RDSO Vendor Approval Directory", "RDSO Quality Audit Clearance"],
            "threshold": "Active RDSO Approved Vendor",
            "approved": True,
        },
        {
            "rule_id": "SIL4_CERT_02",
            "requirement": "Safety Integrity Level 4 (SIL-4) third-party functional safety certification complying with CENELEC EN 50126/50128/50129.",
            "mandatory": True,
            "evidence_required": ["SIL-4 Functional Safety Certificate", "Third-Party Assessment Report"],
            "threshold": "CENELEC SIL-4 Certificate",
            "approved": True,
        },
        {
            "rule_id": "RAIL_EXP_03",
            "requirement": "Successful past commissioning of minimum 150 Route Kilometers (RKm) of electronic interlocking on Indian Railways network.",
            "mandatory": True,
            "evidence_required": ["Commissioning Certificates", "Client Satisfaction Letters from Zonal Railways"],
            "threshold": "150 Route Kilometers (RKm)",
            "approved": True,
        },
        {
            "rule_id": "RAIL_TURNOVER_04",
            "requirement": "Minimum average annual turnover of INR 50.00 Crore over the last 3 financial years.",
            "mandatory": True,
            "evidence_required": ["Audited Financial Statements", "CA Certificate with UDIN"],
            "threshold": "INR 50.00 Crore average",
            "approved": True,
        },
        {
            "rule_id": "RAIL_EMD_05",
            "requirement": "Bid security of INR 25,00,000 via irrevocable Bank Guarantee.",
            "mandatory": True,
            "evidence_required": ["Bank Guarantee Document"],
            "threshold": "INR 25,00,000",
            "approved": True,
        },
    ],
    # TENDER 6: IIT Delhi - Wi-Fi 6E
    "a4444444-4444-4444-8444-444444444406": [
        {
            "rule_id": "WIFI_OEM_01",
            "requirement": "Manufacturer Authorization Form (MAF) from Tier-1 Networking OEM with specific tender bid reference and 5-year hardware replacement SLA.",
            "mandatory": True,
            "evidence_required": ["Tender-Specific OEM MAF Letter", "OEM Escalation Matrix"],
            "threshold": "Bid-specific OEM MAF signed by Country Head",
            "approved": True,
        },
        {
            "rule_id": "WIFI_SCALE_02",
            "requirement": "Proven past deployment experience of enterprise Wi-Fi supporting >= 10,000 concurrent active wireless users in a university or research campus.",
            "mandatory": True,
            "evidence_required": ["Client Completion Certificate", "Network Architecture & Concurrency Audit"],
            "threshold": ">= 10,000 concurrent active users",
            "approved": True,
        },
        {
            "rule_id": "WIFI_CERT_03",
            "requirement": "Access points must be Wi-Fi Alliance certified for Wi-Fi 6E (802.11ax 6GHz) and WPA3-Enterprise security.",
            "mandatory": True,
            "evidence_required": ["Wi-Fi Alliance Certificate", "WPA3 Security Conformance Spec"],
            "threshold": "Wi-Fi Alliance 6E Certified",
            "approved": True,
        },
        {
            "rule_id": "WIFI_TURNOVER_04",
            "requirement": "Minimum average annual turnover of INR 8.00 Crore during FY 2022-25 with CA UDIN.",
            "mandatory": True,
            "evidence_required": ["Audited Balance Sheets", "CA Certificate with UDIN"],
            "threshold": "INR 8.00 Crore average",
            "approved": True,
        },
        {
            "rule_id": "WIFI_MSME_05",
            "requirement": "MSE purchase preference admissible for registered Udyam enterprises.",
            "mandatory": False,
            "evidence_required": ["Udyam Registration Certificate"],
            "threshold": "Valid MSME Registration",
            "approved": True,
        },
    ],
    # TENDER 7: ISRO - Aerospace Precision CNC
    "a5555555-5555-4555-8555-555555555507": [
        {
            "rule_id": "AERO_AS9100_01",
            "requirement": "Valid AS9100 Rev D Aerospace Quality Management System certification from an accredited registrar.",
            "mandatory": True,
            "evidence_required": ["AS9100 Rev D Certificate", "OASIS Database Verification"],
            "threshold": "Active AS9100 Rev D Certification",
            "approved": True,
        },
        {
            "rule_id": "AERO_CLEAN_02",
            "requirement": "In-house ISO 14644-1 Class 7 (Class 10,000) cleanroom for aerospace component assembly, cleaning, and packaging.",
            "mandatory": True,
            "evidence_required": ["Cleanroom Certification Report", "Periodic Particulate Count Audit"],
            "threshold": "ISO Class 7 (Class 10,000)",
            "approved": True,
        },
        {
            "rule_id": "AERO_NABL_03",
            "requirement": "In-house 3D CMM with volumetric accuracy <= (1.5 + L/300) um and valid NABL calibration certificate.",
            "mandatory": True,
            "evidence_required": ["CMM Specification Sheet", "NABL Calibration Certificate"],
            "threshold": "Volumetric accuracy <= (1.5 + L/300) um",
            "approved": True,
        },
        {
            "rule_id": "AERO_EXP_04",
            "requirement": "Successful delivery of at least 2 flight-grade structural component packages for ISRO launch vehicle or satellite missions.",
            "mandatory": True,
            "evidence_required": ["ISRO Quality Acceptance Inspection Reports", "Purchase Order Copies"],
            "threshold": "2 space flight-grade packages delivered",
            "approved": True,
        },
        {
            "rule_id": "AERO_TURNOVER_05",
            "requirement": "Minimum average annual turnover of INR 12.00 Crore over the last 3 financial years.",
            "mandatory": True,
            "evidence_required": ["Audited Financial Statements", "CA Certificate with UDIN"],
            "threshold": "INR 12.00 Crore average",
            "approved": True,
        },
    ],
    # TENDER 8: NHAI - FASTag & ANPR
    "a6666666-6666-4666-8666-666666666608": [
        {
            "rule_id": "NHAI_IHMCL_01",
            "requirement": "RFID readers must possess valid Product Homologation & Type Approval issued by Indian Highway Management Company Limited (IHMCL).",
            "mandatory": True,
            "evidence_required": ["IHMCL Homologation Certificate", "ARAI Conformance Test Report"],
            "threshold": "Active IHMCL Homologation Approval",
            "approved": True,
        },
        {
            "rule_id": "NHAI_ANPR_02",
            "requirement": "ANPR cameras with minimum 95% recognition accuracy tested by ARAI or ICAT under high-speed and adverse conditions.",
            "mandatory": True,
            "evidence_required": ["ARAI / ICAT ANPR Accuracy Test Report", "Optical Sensor Spec Sheet"],
            "threshold": ">= 95% recognition accuracy",
            "approved": True,
        },
        {
            "rule_id": "NHAI_IP67_03",
            "requirement": "Enclosures certified for IP67 Ingress Protection and IK10 impact resistance from a NABL accredited laboratory.",
            "mandatory": True,
            "evidence_required": ["IP67 Ingress Test Report", "IK10 Vandal-Proof Certificate"],
            "threshold": "IP67 & IK10 Certified",
            "approved": True,
        },
        {
            "rule_id": "NHAI_TURNOVER_04",
            "requirement": "Minimum average annual turnover of INR 15.00 Crore during FY 2022-25 with CA UDIN.",
            "mandatory": True,
            "evidence_required": ["Audited Balance Sheets", "CA Certificate with UDIN"],
            "threshold": "INR 15.00 Crore average",
            "approved": True,
        },
        {
            "rule_id": "NHAI_SLA_05",
            "requirement": "Mandatory SLA undertaking guaranteeing 4-hour Mean Time To Restore (MTTR) at designated toll plazas.",
            "mandatory": True,
            "evidence_required": ["SLA Commitment Letter", "Pan-India Field Support Depot Map"],
            "threshold": "4-hour MTTR on-site support SLA",
            "approved": True,
        },
    ],
    # TENDER 9: NTPC - IEC 61850 Substation Automation
    "a7777777-7777-4777-8777-777777777709": [
        {
            "rule_id": "NTPC_IEC_01",
            "requirement": "Complete SAS solution and Bay Control Units must hold Level-A conformance certification from KEMA or CPRI for IEC 61850 Edition 2.",
            "mandatory": True,
            "evidence_required": ["KEMA / CPRI Level-A Certificate", "UCA International Users Group Conformance"],
            "threshold": "Level-A Conformance Certificate",
            "approved": True,
        },
        {
            "rule_id": "NTPC_CYBER_02",
            "requirement": "Strict compliance with CEA (Cyber Security in Power Sector) Guidelines 2021 with VAPT audit report from CERT-In empanelled auditor.",
            "mandatory": True,
            "evidence_required": ["CERT-In Empanelled VAPT Audit Report", "CEA Cyber Compliance Sign-off"],
            "threshold": "Zero Critical / High Vulnerabilities",
            "approved": True,
        },
        {
            "rule_id": "NTPC_EXP_03",
            "requirement": "Successful commissioning of SAS in at least two 400kV or higher Extra High Voltage (EHV) substations in India within last 7 years.",
            "mandatory": True,
            "evidence_required": ["PowerGrid / State Transco Commissioning Certificate", "Client Endorsement"],
            "threshold": "2 or more 400kV+ EHV substations",
            "approved": True,
        },
        {
            "rule_id": "NTPC_TURNOVER_04",
            "requirement": "Minimum average annual turnover of INR 30.00 Crore during preceding 3 fiscal years.",
            "mandatory": True,
            "evidence_required": ["Audited Balance Sheets", "CA Certificate with UDIN"],
            "threshold": "INR 30.00 Crore average",
            "approved": True,
        },
        {
            "rule_id": "NTPC_EMD_05",
            "requirement": "Earnest Money Deposit of INR 15,00,000 via irrevocable Bank Guarantee.",
            "mandatory": True,
            "evidence_required": ["Bank Guarantee Document"],
            "threshold": "INR 15,00,000",
            "approved": True,
        },
    ],
    # TENDER 10: CPCB - CAAQMS Air Quality Monitoring
    "a8888888-8888-4888-8888-888888888810": [
        {
            "rule_id": "CPCB_USEPA_01",
            "requirement": "All continuous gas and particulate analyzers (PM2.5, PM10, SO2, NOx, CO, O3) must be certified by US-EPA or TUV / MCERTS.",
            "mandatory": True,
            "evidence_required": ["US-EPA FRM / FEM Certificate", "TUV Rheinland / MCERTS Product Certificate"],
            "threshold": "US-EPA or MCERTS Certified",
            "approved": True,
        },
        {
            "rule_id": "CPCB_NABL_02",
            "requirement": "Gas calibration cylinders and dynamic diluters must possess calibration certificates traceable to National Physical Laboratory (NPL) India.",
            "mandatory": True,
            "evidence_required": ["NPL Traceability Calibration Certificate", "NABL Gas Lab Test Report"],
            "threshold": "Traceable to NPL / NIST standards",
            "approved": True,
        },
        {
            "rule_id": "CPCB_TELEMETRY_03",
            "requirement": "Data acquisition system must support continuous 15-minute averaged encryption telemetry directly pushing data to CPCB Central Server.",
            "mandatory": True,
            "evidence_required": ["CPCB Telemetry Integration Test Certificate", "API Protocol Validation Doc"],
            "threshold": "CPCB Telemetry Protocol Compliant",
            "approved": True,
        },
        {
            "rule_id": "CPCB_TURNOVER_04",
            "requirement": "Minimum average annual turnover of INR 10.00 Crore during FY 2022-25 with CA UDIN.",
            "mandatory": True,
            "evidence_required": ["Audited Balance Sheets", "CA Certificate with UDIN"],
            "threshold": "INR 10.00 Crore average",
            "approved": True,
        },
        {
            "rule_id": "CPCB_OANDM_05",
            "requirement": "Commitment for 5-year Comprehensive Operations & Maintenance ensuring minimum 95% continuous valid data availability.",
            "mandatory": True,
            "evidence_required": ["5-Year O&M Service Agreement", "Data Availability Guarantee Undertaking"],
            "threshold": ">= 95% continuous valid data uptime",
            "approved": True,
        },
    ],
}

# Clean and re-insert rules for Tenders 2-10
for t_id, rules_list in TENDERS_RULES.items():
    try:
        # Delete existing rules for this tender
        sb.table("rules").delete().eq("tender_id", t_id).execute()
        for r in rules_list:
            rule_entry = {
                "id": str(uuid.uuid4()),
                "tender_id": t_id,
                "rule_id": r["rule_id"],
                "requirement": r["requirement"],
                "mandatory": r["mandatory"],
                "evidence_required": r["evidence_required"],
                "threshold": r["threshold"],
                "approved": r["approved"],
            }
            sb.table("rules").insert(rule_entry).execute()
        print(f"  [Rules Seeded] {len(rules_list)} rules for tender {t_id}")
    except Exception as e:
        print(f"  [Rules Error] Tender {t_id}: {e}")

# -------------------------------------------------------------
# BIDDERS, DOCUMENTS, AND COMPLIANCE FINDINGS
# -------------------------------------------------------------
DEMO_BIDDERS_DATA = [
    # -------------------------------------------------------------
    # TENDER 2: NIC Sovereign Cloud
    # -------------------------------------------------------------
    {
        "tender_id": "f16d7333-48df-4168-8252-b89a798a6cef",
        "name": "MeghData Cloud Services Private Limited",
        "docs": [
            {
                "document_type": "SECURITY",
                "filename": "MeghData_ISO27001_27017_Audit_Certificates.pdf",
                "legal_name": "MeghData Cloud Services Private Limited",
                "id_number": "BSI-ISMS-719402",
                "page": 2,
                "confidence": 0.99,
            },
            {
                "document_type": "DATA_CENTRE",
                "filename": "MeghData_Tier_IV_Uptime_Certificate_Mumbai_Noida.pdf",
                "legal_name": "MeghData Cloud Services Private Limited",
                "id_number": "UPTIME-T4-FAC-2024-88",
                "page": 1,
                "confidence": 0.98,
            },
            {
                "document_type": "FINANCIALS",
                "filename": "MeghData_Audited_Accounts_FY22-25.pdf",
                "legal_name": "MeghData Cloud Services Private Limited",
                "id_number": "UDIN-24089123BBBBB1298",
                "page": 5,
                "confidence": 0.97,
            },
        ],
        "findings": [
            {
                "rule_ref": "NIC_SEC_01",
                "status": "verified",
                "explanation": "Rule NIC_SEC_01 verified: MeghData holds active BSI-accredited ISO/IEC 27001:2022 and ISO/IEC 27017:2015 certifications, empanelled under MeitY Cloud Services list.",
                "evidence": [{"label": "BSI Certification", "document": "MeghData_ISO27001_27017_Audit_Certificates.pdf", "page": 2, "confidence": 0.99, "quote": "Accredited for Sovereign Cloud Infrastructure and Data Protection under MeitY Cloud Panel."}],
            },
            {
                "rule_ref": "NIC_TIER_02",
                "status": "verified",
                "explanation": "Rule NIC_TIER_02 verified: Primary facility in Navi Mumbai and Secondary DR in Greater Noida both hold Uptime Institute Tier-IV Facility certifications.",
                "evidence": [{"label": "Uptime Tier-IV Certificate", "document": "MeghData_Tier_IV_Uptime_Certificate_Mumbai_Noida.pdf", "page": 1, "confidence": 0.98, "quote": "Certified Tier-IV Fault Tolerant Data Center with 99.995% availability within India."}],
            },
            {
                "rule_ref": "NIC_TURNOVER_04",
                "status": "verified",
                "explanation": "Rule NIC_TURNOVER_04 verified: 3-year average annual turnover is INR 38.45 Crore, substantially exceeding the INR 25.00 Crore threshold. Certified by CA with UDIN 24089123BBBBB1298.",
                "evidence": [{"label": "Audited Financials", "document": "MeghData_Audited_Accounts_FY22-25.pdf", "page": 5, "confidence": 0.97, "quote": "FY 2024-25 Turnover: INR 42,10,00,000 | 3-Year Average: INR 38,45,00,000."}],
            },
        ],
    },
    {
        "tender_id": "f16d7333-48df-4168-8252-b89a798a6cef",
        "name": "Altis Cloud Infrastructure LLP",
        "docs": [
            {
                "document_type": "SECURITY",
                "filename": "Altis_ISO27001_Certificate.pdf",
                "legal_name": "Altis Cloud Infrastructure LLP",
                "id_number": "TUV-ISMS-2023-112",
                "page": 1,
                "confidence": 0.95,
            },
            {
                "document_type": "DATA_CENTRE",
                "filename": "Altis_Tier_III_Facility_Specification.pdf",
                "legal_name": "Altis Cloud Infrastructure LLP",
                "id_number": "FAC-BLR-T3-091",
                "page": 3,
                "confidence": 0.94,
            },
        ],
        "findings": [
            {
                "rule_ref": "NIC_SEC_01",
                "status": "verified",
                "explanation": "Rule NIC_SEC_01 verified: Active ISO/IEC 27001 certificate issued by TUV SUD.",
                "evidence": [{"label": "TUV ISO Certificate", "document": "Altis_ISO27001_Certificate.pdf", "page": 1, "confidence": 0.95, "quote": "Scope: Managed Cloud Hosting & Virtual Machine Provisioning."}],
            },
            {
                "rule_ref": "NIC_TIER_02",
                "status": "issue_detected",
                "explanation": "Discrepancy in Rule NIC_TIER_02: Facility specification confirms Tier-III Concurrently Maintainable data center (99.982% uptime), failing to meet the mandatory Tier-IV (Fault Tolerant, 99.995%) requirement.",
                "evidence": [{"label": "Data Centre Facility Spec", "document": "Altis_Tier_III_Facility_Specification.pdf", "page": 3, "confidence": 0.94, "quote": "Facility Classification: TIA-942 Rated 3 / Tier-III Concurrently Maintainable."}],
            },
        ],
    },

    # -------------------------------------------------------------
    # TENDER 3: AIIMS New Delhi - Linear Accelerator
    # -------------------------------------------------------------
    {
        "tender_id": "a1111111-1111-4111-8111-111111111103",
        "name": "MedTech OncoSystems India Private Limited",
        "docs": [
            {
                "document_type": "AERB_APPROVAL",
                "filename": "MedTech_AERB_Type_Approval_TrueBeam.pdf",
                "legal_name": "MedTech OncoSystems India Private Limited",
                "id_number": "AERB/RSD/MD/2024/7821",
                "page": 1,
                "confidence": 0.99,
            },
            {
                "document_type": "REGULATORY",
                "filename": "MedTech_USFDA_510k_MDR_CE_Approval.pdf",
                "legal_name": "MedTech OncoSystems India Private Limited",
                "id_number": "FDA-K210492-CE-0123",
                "page": 2,
                "confidence": 0.98,
            },
            {
                "document_type": "FINANCIALS",
                "filename": "MedTech_Audited_Financials_FY22-25.pdf",
                "legal_name": "MedTech OncoSystems India Private Limited",
                "id_number": "UDIN-24012984AAAAAC7821",
                "page": 4,
                "confidence": 0.97,
            },
        ],
        "findings": [
            {
                "rule_ref": "AIIMS_AERB_01",
                "status": "verified",
                "explanation": "Rule AIIMS_AERB_01 verified: Valid Atomic Energy Regulatory Board (AERB) Type Approval No. AERB/RSD/MD/2024/7821 active through 2029 for medical radiation equipment.",
                "evidence": [{"label": "AERB Approval", "document": "MedTech_AERB_Type_Approval_TrueBeam.pdf", "page": 1, "confidence": 0.99, "quote": "Type Approval issued under Radiation Protection Rules 2004 for High Energy Dual Photon Medical LINAC."}],
            },
            {
                "rule_ref": "AIIMS_FDA_02",
                "status": "verified",
                "explanation": "Rule AIIMS_FDA_02 verified: US-FDA 510(k) K210492 and European CE Class IIb Medical Device Regulation certificate verified valid.",
                "evidence": [{"label": "FDA & CE Certificate", "document": "MedTech_USFDA_510k_MDR_CE_Approval.pdf", "page": 2, "confidence": 0.98, "quote": "Device Class: Class IIb High-Risk Radiation Oncology Therapy System."}],
            },
            {
                "rule_ref": "AIIMS_TURNOVER_04",
                "status": "verified",
                "explanation": "Rule AIIMS_TURNOVER_04 verified: Average annual turnover of INR 52.30 Crore against mandatory threshold of INR 40.00 Crore.",
                "evidence": [{"label": "CA Turnover Report", "document": "MedTech_Audited_Financials_FY22-25.pdf", "page": 4, "confidence": 0.97, "quote": "UDIN: 24012984AAAAAC7821 | Certified 3-Year Average Turnover: INR 52,30,15,000."}],
            },
        ],
    },
    {
        "tender_id": "a1111111-1111-4111-8111-111111111103",
        "name": "SurgiCore Diagnostic Devices Private Limited",
        "docs": [
            {
                "document_type": "AERB_APPROVAL",
                "filename": "SurgiCore_AERB_Expired_Type_Approval.pdf",
                "legal_name": "SurgiCore Diagnostic Devices Private Limited",
                "id_number": "AERB/RSD/MD/2020/3312",
                "page": 1,
                "confidence": 0.96,
            },
            {
                "document_type": "FINANCIALS",
                "filename": "SurgiCore_Financials_FY22-25.pdf",
                "legal_name": "SurgiCore Diagnostic Devices Private Limited",
                "id_number": "UDIN-24098712CCCCCD8812",
                "page": 3,
                "confidence": 0.95,
            },
        ],
        "findings": [
            {
                "rule_ref": "AIIMS_AERB_01",
                "status": "issue_detected",
                "explanation": "Critical Regulatory Discrepancy in Rule AIIMS_AERB_01: AERB Type Approval expired on 31-December-2025. Bidder enclosed an acknowledgement for renewal application, but valid statutory approval is not active.",
                "evidence": [{"label": "Expired AERB License", "document": "SurgiCore_AERB_Expired_Type_Approval.pdf", "page": 1, "confidence": 0.96, "quote": "Valid Through: 31-Dec-2025 | Note: Renewal receipt submitted without clearance certificate."}],
            },
            {
                "rule_ref": "AIIMS_TURNOVER_04",
                "status": "verified",
                "explanation": "Rule AIIMS_TURNOVER_04 verified: Average turnover is INR 44.10 Crore, meeting the INR 40.00 Crore requirement.",
                "evidence": [{"label": "Financial Statements", "document": "SurgiCore_Financials_FY22-25.pdf", "page": 3, "confidence": 0.95, "quote": "3-Year Average Turnover: INR 44,10,00,000 with valid CA UDIN."}],
            },
        ],
    },

    # -------------------------------------------------------------
    # TENDER 4: Coast Guard - Surveillance Radars
    # -------------------------------------------------------------
    {
        "tender_id": "a2222222-2222-4222-8222-222222222204",
        "name": "Bharat Radar & Defence Systems Limited",
        "docs": [
            {
                "document_type": "LOCAL_CONTENT",
                "filename": "BharatRadar_DPIIT_MakeInIndia_Auditor_Cert.pdf",
                "legal_name": "Bharat Radar & Defence Systems Limited",
                "id_number": "DPIIT-MII-2026-00412",
                "page": 1,
                "confidence": 0.99,
            },
            {
                "document_type": "MIL_SPEC",
                "filename": "BharatRadar_MIL-STD-810G_BEL_CQAE_Test_Report.pdf",
                "legal_name": "Bharat Radar & Defence Systems Limited",
                "id_number": "CQAE-ENV-2025-992",
                "page": 8,
                "confidence": 0.98,
            },
            {
                "document_type": "DEFENCE_LICENSE",
                "filename": "BharatRadar_DPIIT_Defence_Industrial_License.pdf",
                "legal_name": "Bharat Radar & Defence Systems Limited",
                "id_number": "DIL-MHA-DEF-2018-091",
                "page": 1,
                "confidence": 0.99,
            },
        ],
        "findings": [
            {
                "rule_ref": "DEF_MII_01",
                "status": "verified",
                "explanation": "Rule DEF_MII_01 verified: Statutory auditor certified Make in India Class-I local supplier status with 72.4% indigenous value addition (threshold: 60%).",
                "evidence": [{"label": "Make In India Certificate", "document": "BharatRadar_DPIIT_MakeInIndia_Auditor_Cert.pdf", "page": 1, "confidence": 0.99, "quote": "Indigenous Local Content calculated as per DPIIT Public Procurement Order stands at 72.4%."}],
            },
            {
                "rule_ref": "DEF_MIL_02",
                "status": "verified",
                "explanation": "Rule DEF_MIL_02 verified: Comprehensive environmental qualification test report from CQAE (BEL Bangalore) confirms complete compliance with MIL-STD-810G marine specifications.",
                "evidence": [{"label": "MIL-STD-810G Report", "document": "BharatRadar_MIL-STD-810G_BEL_CQAE_Test_Report.pdf", "page": 8, "confidence": 0.98, "quote": "Method 509.5 Salt Fog, Method 501.5 High Temp (+55C), Method 502.5 Low Temp (-20C) passed without degradation."}],
            },
            {
                "rule_ref": "DEF_CLEAR_03",
                "status": "verified",
                "explanation": "Rule DEF_CLEAR_03 verified: Valid Defence Industrial License DIL-MHA-DEF-2018-091 with active security clearance from MHA.",
                "evidence": [{"label": "Defence License", "document": "BharatRadar_DPIIT_Defence_Industrial_License.pdf", "page": 1, "confidence": 0.99, "quote": "Licensed Category: Radar & Electronic Warfare Equipment for Armed Forces."}],
            },
        ],
    },
    {
        "tender_id": "a2222222-2222-4222-8222-222222222204",
        "name": "Garuda Navigational Sensors LLP",
        "docs": [
            {
                "document_type": "LOCAL_CONTENT",
                "filename": "Garuda_Local_Content_Self_Declaration.pdf",
                "legal_name": "Garuda Navigational Sensors LLP",
                "id_number": "SLF-MII-2026-091",
                "page": 1,
                "confidence": 0.93,
            },
            {
                "document_type": "DEFENCE_LICENSE",
                "filename": "Garuda_DPIIT_Industrial_License.pdf",
                "legal_name": "Garuda Navigational Sensors LLP",
                "id_number": "DIL-DPIIT-2023-441",
                "page": 1,
                "confidence": 0.96,
            },
        ],
        "findings": [
            {
                "rule_ref": "DEF_MII_01",
                "status": "issue_detected",
                "explanation": "Non-Compliance with Rule DEF_MII_01: Bidder achieves only 48.2% local value addition, categorizing them as Class-II Local Supplier. The mandatory tender condition stipulates minimum 60% Class-I status.",
                "evidence": [{"label": "Local Content Calculation", "document": "Garuda_Local_Content_Self_Declaration.pdf", "page": 1, "confidence": 0.93, "quote": "Total Indigenous Local Content: 48.2% (Imports comprise 51.8% of BOM). Class-II Local Supplier."}],
            },
            {
                "rule_ref": "DEF_CLEAR_03",
                "status": "verified",
                "explanation": "Rule DEF_CLEAR_03 verified: Valid Defence Industrial License held under DPIIT.",
                "evidence": [{"label": "Industrial License", "document": "Garuda_DPIIT_Industrial_License.pdf", "page": 1, "confidence": 0.96, "quote": "DIL-DPIIT-2023-441 for maritime surveillance sensors."}],
            },
        ],
    },

    # -------------------------------------------------------------
    # TENDER 5: DFCCIL - Kavach & Signaling
    # -------------------------------------------------------------
    {
        "tender_id": "a3333333-3333-4333-8333-333333333305",
        "name": "IndoSignaling Automation Systems Private Limited",
        "docs": [
            {
                "document_type": "RDSO_APPROVAL",
                "filename": "IndoSignaling_RDSO_TCAS_Kavach_Approval.pdf",
                "legal_name": "IndoSignaling Automation Systems Private Limited",
                "id_number": "RDSO/2024/SIG/TCAS/088",
                "page": 2,
                "confidence": 0.99,
            },
            {
                "document_type": "SIL4_CERT",
                "filename": "IndoSignaling_TUV_Rheinland_SIL4_Certificate.pdf",
                "legal_name": "IndoSignaling Automation Systems Private Limited",
                "id_number": "TUV-RH-SIL4-EN50128-9901",
                "page": 1,
                "confidence": 0.98,
            },
            {
                "document_type": "COMMISSIONING",
                "filename": "IndoSignaling_NCR_WCR_220RKm_Completion_Cert.pdf",
                "legal_name": "IndoSignaling Automation Systems Private Limited",
                "id_number": "WCR/S&T/COMM/2024/11",
                "page": 3,
                "confidence": 0.97,
            },
        ],
        "findings": [
            {
                "rule_ref": "RDSO_APPR_01",
                "status": "verified",
                "explanation": "Rule RDSO_APPR_01 verified: Active approved vendor on RDSO TCAS/Kavach Directory (Approval Ref: RDSO/2024/SIG/TCAS/088).",
                "evidence": [{"label": "RDSO Approval", "document": "IndoSignaling_RDSO_TCAS_Kavach_Approval.pdf", "page": 2, "confidence": 0.99, "quote": "Vendor Name: IndoSignaling Automation Systems Pvt Ltd | Product: Station & Loco TCAS Unit (Kavach)."}],
            },
            {
                "rule_ref": "SIL4_CERT_02",
                "status": "verified",
                "explanation": "Rule SIL4_CERT_02 verified: Independent Safety Assessment by TÜV Rheinland confirms compliance with CENELEC EN 50126, EN 50128, and EN 50129 to SIL-4 safety integrity level.",
                "evidence": [{"label": "TÜV SIL-4 Certificate", "document": "IndoSignaling_TUV_Rheinland_SIL4_Certificate.pdf", "page": 1, "confidence": 0.98, "quote": "Certified Safety Integrity Level: SIL-4 for Vital Railway Interlocking Software & Hardware."}],
            },
            {
                "rule_ref": "RAIL_EXP_03",
                "status": "verified",
                "explanation": "Rule RAIL_EXP_03 verified: Documented completion certificate for 220 Route Kilometers on Western Central Railway, exceeding the 150 RKm threshold.",
                "evidence": [{"label": "WCR Commissioning Certificate", "document": "IndoSignaling_NCR_WCR_220RKm_Completion_Cert.pdf", "page": 3, "confidence": 0.97, "quote": "Successfully commissioned 220 RKm of electronic interlocking and Kavach system with zero safety infringements."}],
            },
        ],
    },

    # -------------------------------------------------------------
    # TENDER 6: IIT Delhi - Wi-Fi 6E
    # -------------------------------------------------------------
    {
        "tender_id": "a4444444-4444-4444-8444-444444444406",
        "name": "NetPulse Communications Private Limited",
        "docs": [
            {
                "document_type": "OEM_MAF",
                "filename": "NetPulse_Aruba_HPE_Tender_Specific_MAF.pdf",
                "legal_name": "NetPulse Communications Private Limited",
                "id_number": "HPE-MAF-IITD-2026-091",
                "page": 1,
                "confidence": 0.99,
            },
            {
                "document_type": "EXPERIENCE",
                "filename": "NetPulse_BITS_Pilani_14000_Users_Completion.pdf",
                "legal_name": "NetPulse Communications Private Limited",
                "id_number": "BP/IT/WIFI/2024/09",
                "page": 2,
                "confidence": 0.98,
            },
            {
                "document_type": "UDYAM",
                "filename": "NetPulse_Udyam_MSME_Certificate.pdf",
                "legal_name": "NetPulse Communications Private Limited",
                "id_number": "UDYAM-DL-02-0049182",
                "page": 1,
                "confidence": 0.97,
            },
        ],
        "findings": [
            {
                "rule_ref": "WIFI_OEM_01",
                "status": "verified",
                "explanation": "Rule WIFI_OEM_01 verified: Authentic bid-specific Manufacturer Authorization Form (MAF) from HPE Aruba India with full 5-year advance hardware replacement guarantee.",
                "evidence": [{"label": "OEM MAF Letter", "document": "NetPulse_Aruba_HPE_Tender_Specific_MAF.pdf", "page": 1, "confidence": 0.99, "quote": "Directly authorizes NetPulse Communications Pvt Ltd for IIT Delhi Tender GEM/2026/B/5728190."}],
            },
            {
                "rule_ref": "WIFI_SCALE_02",
                "status": "verified",
                "explanation": "Rule WIFI_SCALE_02 verified: Past performance certificate from BITS Pilani confirms deployment supporting 14,200 concurrent active wireless devices.",
                "evidence": [{"label": "BITS Pilani Completion Certificate", "document": "NetPulse_BITS_Pilani_14000_Users_Completion.pdf", "page": 2, "confidence": 0.98, "quote": "Campus-wide Wi-Fi 6 deployment supporting over 14,000 peak concurrent wireless clients."}],
            },
            {
                "rule_ref": "WIFI_MSME_05",
                "status": "verified",
                "explanation": "Rule WIFI_MSME_05 verified: Valid Udyam Registration as Small Enterprise in ICT infrastructure services.",
                "evidence": [{"label": "Udyam Certificate", "document": "NetPulse_Udyam_MSME_Certificate.pdf", "page": 1, "confidence": 0.97, "quote": "Enterprise: NetPulse Communications Pvt Ltd | Type: Small Enterprise."}],
            },
        ],
    },

    # -------------------------------------------------------------
    # TENDER 7: ISRO - Satellite Structural Fabrication
    # -------------------------------------------------------------
    {
        "tender_id": "a5555555-5555-4555-8555-555555555507",
        "name": "AeroMech Precision Components Private Limited",
        "docs": [
            {
                "document_type": "AS9100D",
                "filename": "AeroMech_AS9100D_Aerospace_Certification.pdf",
                "legal_name": "AeroMech Precision Components Private Limited",
                "id_number": "DNV-AS9100D-2024-819",
                "page": 1,
                "confidence": 0.99,
            },
            {
                "document_type": "CLEANROOM",
                "filename": "AeroMech_ISO_Class7_Cleanroom_Particulate_Audit.pdf",
                "legal_name": "AeroMech Precision Components Private Limited",
                "id_number": "ISO14644-C7-2025-04",
                "page": 2,
                "confidence": 0.98,
            },
            {
                "document_type": "CMM_NABL",
                "filename": "AeroMech_Carl_Zeiss_CMM_NABL_Traceability_Cert.pdf",
                "legal_name": "AeroMech Precision Components Private Limited",
                "id_number": "NABL-CAL-CMM-2025-991",
                "page": 1,
                "confidence": 0.99,
            },
        ],
        "findings": [
            {
                "rule_ref": "AERO_AS9100_01",
                "status": "verified",
                "explanation": "Rule AERO_AS9100_01 verified: AS9100 Rev D Aerospace Management Certification verified on IAQG OASIS directory.",
                "evidence": [{"label": "DNV AS9100D Certificate", "document": "AeroMech_AS9100D_Aerospace_Certification.pdf", "page": 1, "confidence": 0.99, "quote": "Certification for Precision Machining and Structural Assemblies for Space Launch Vehicles and Satellites."}],
            },
            {
                "rule_ref": "AERO_CLEAN_02",
                "status": "verified",
                "explanation": "Rule AERO_CLEAN_02 verified: In-house 1,200 sq ft ISO 14644-1 Class 7 cleanroom certified with periodic HEPA filter validation.",
                "evidence": [{"label": "Cleanroom Audit Report", "document": "AeroMech_ISO_Class7_Cleanroom_Particulate_Audit.pdf", "page": 2, "confidence": 0.98, "quote": "Cleanroom particulate count verified < 352,000 particles/m3 at 0.5 um (ISO Class 7 compliant)."}],
            },
            {
                "rule_ref": "AERO_NABL_03",
                "status": "verified",
                "explanation": "Rule AERO_NABL_03 verified: Carl Zeiss Accura CMM with volumetric accuracy of (1.2 + L/350) um, superior to the required (1.5 + L/300) um.",
                "evidence": [{"label": "Zeiss CMM Calibration", "document": "AeroMech_Carl_Zeiss_CMM_NABL_Traceability_Cert.pdf", "page": 1, "confidence": 0.99, "quote": "Maximum Permissible Error (MPE_E): 1.2 + L/350 um calibrated against NABL physical standards."}],
            },
        ],
    },

    # -------------------------------------------------------------
    # TENDER 8: NHAI - FASTag & ANPR
    # -------------------------------------------------------------
    {
        "tender_id": "a6666666-6666-4666-8666-666666666608",
        "name": "CyberShield Telematics India Private Limited",
        "docs": [
            {
                "document_type": "IHMCL_APPROVAL",
                "filename": "CyberShield_IHMCL_Homologation_RFID_Reader.pdf",
                "legal_name": "CyberShield Telematics India Private Limited",
                "id_number": "IHMCL/ETC/HOMO/2024/49",
                "page": 1,
                "confidence": 0.99,
            },
            {
                "document_type": "ANPR_TEST",
                "filename": "CyberShield_ARAI_ANPR_High_Speed_Test_Report.pdf",
                "legal_name": "CyberShield Telematics India Private Limited",
                "id_number": "ARAI/ETC/ANPR/2025/112",
                "page": 4,
                "confidence": 0.98,
            },
            {
                "document_type": "INGRESS_TEST",
                "filename": "CyberShield_IP67_IK10_NABL_Test_Certificate.pdf",
                "legal_name": "CyberShield Telematics India Private Limited",
                "id_number": "ERDA/NABL/IP67/2025/89",
                "page": 1,
                "confidence": 0.97,
            },
        ],
        "findings": [
            {
                "rule_ref": "NHAI_IHMCL_01",
                "status": "verified",
                "explanation": "Rule NHAI_IHMCL_01 verified: Active IHMCL product homologation certificate IHMCL/ETC/HOMO/2024/49 for UHF RFID Transceivers.",
                "evidence": [{"label": "IHMCL Certificate", "document": "CyberShield_IHMCL_Homologation_RFID_Reader.pdf", "page": 1, "confidence": 0.99, "quote": "Product Homologation granted for Multi-Lane Free-Flow FASTag Transceivers."}],
            },
            {
                "rule_ref": "NHAI_ANPR_02",
                "status": "verified",
                "explanation": "Rule NHAI_ANPR_02 verified: Automotive Research Association of India (ARAI) test report certifies 97.8% license plate recognition accuracy at vehicle speeds up to 130 km/h.",
                "evidence": [{"label": "ARAI ANPR Test Report", "document": "CyberShield_ARAI_ANPR_High_Speed_Test_Report.pdf", "page": 4, "confidence": 0.98, "quote": "Overall Recognition Accuracy across 10,000 High-Speed Vehicle Passes: 97.8% (Benchmark: >= 95.0%)."}],
            },
            {
                "rule_ref": "NHAI_IP67_03",
                "status": "verified",
                "explanation": "Rule NHAI_IP67_03 verified: ERDA test certificates confirm IP67 weather sealing and IK10 vandal resistance.",
                "evidence": [{"label": "ERDA IP67 Certificate", "document": "CyberShield_IP67_IK10_NABL_Test_Certificate.pdf", "page": 1, "confidence": 0.97, "quote": "IP67 Submersion & Dust Ingress Protection test passed."}],
            },
        ],
    },

    # -------------------------------------------------------------
    # TENDER 9: NTPC - Substation Automation
    # -------------------------------------------------------------
    {
        "tender_id": "a7777777-7777-4777-8777-777777777709",
        "name": "GridTech Automation India Private Limited",
        "docs": [
            {
                "document_type": "KEMA_CERT",
                "filename": "GridTech_KEMA_Level_A_IEC61850_Ed2_Certificate.pdf",
                "legal_name": "GridTech Automation India Private Limited",
                "id_number": "KEMA-UCA-61850-2024-91",
                "page": 1,
                "confidence": 0.99,
            },
            {
                "document_type": "CYBER_SECURITY",
                "filename": "GridTech_CERT-In_VAPT_Audit_CEA_Report.pdf",
                "legal_name": "GridTech Automation India Private Limited",
                "id_number": "CERT-VAPT-PWR-2025-012",
                "page": 6,
                "confidence": 0.98,
            },
            {
                "document_type": "EXPERIENCE",
                "filename": "GridTech_PowerGrid_400kV_Substation_Commissioning.pdf",
                "legal_name": "GridTech Automation India Private Limited",
                "id_number": "PGCIL/SR-II/COMM/2023/88",
                "page": 2,
                "confidence": 0.97,
            },
        ],
        "findings": [
            {
                "rule_ref": "NTPC_IEC_01",
                "status": "verified",
                "explanation": "Rule NTPC_IEC_01 verified: KEMA Level-A conformance certificate verified for IEC 61850 Edition 2 SAS Controller and Merging Units.",
                "evidence": [{"label": "KEMA Certificate", "document": "GridTech_KEMA_Level_A_IEC61850_Ed2_Certificate.pdf", "page": 1, "confidence": 0.99, "quote": "Full Level-A Conformance Certificate for IEC 61850 Ed 2 Server and GOOSE Publisher."}],
            },
            {
                "rule_ref": "NTPC_CYBER_02",
                "status": "verified",
                "explanation": "Rule NTPC_CYBER_02 verified: Comprehensive VAPT audit report from CERT-In empanelled auditor confirms zero high/critical vulnerabilities, adhering to CEA 2021 guidelines.",
                "evidence": [{"label": "CERT-In Audit Report", "document": "GridTech_CERT-In_VAPT_Audit_CEA_Report.pdf", "page": 6, "confidence": 0.98, "quote": "All SCADA nodes conform to CEA Power Sector Cyber Security Guidelines 2021."}],
            },
            {
                "rule_ref": "NTPC_EXP_03",
                "status": "verified",
                "explanation": "Rule NTPC_EXP_03 verified: Successful commissioning certificate from Power Grid Corporation for 400kV Raichur and 765kV Kurnool substations.",
                "evidence": [{"label": "PGCIL Commissioning", "document": "GridTech_PowerGrid_400kV_Substation_Commissioning.pdf", "page": 2, "confidence": 0.97, "quote": "Successfully commissioned Substation Automation System on 400kV Raichur Substation."}],
            },
        ],
    },

    # -------------------------------------------------------------
    # TENDER 10: CPCB - CAAQMS Air Quality
    # -------------------------------------------------------------
    {
        "tender_id": "a8888888-8888-4888-8888-888888888810",
        "name": "EnviroTech Analytics India Private Limited",
        "docs": [
            {
                "document_type": "USEPA_CERT",
                "filename": "EnviroTech_USEPA_TUV_MCERTS_Certificates.pdf",
                "legal_name": "EnviroTech Analytics India Private Limited",
                "id_number": "EPA-FRM-PM-2024-912",
                "page": 2,
                "confidence": 0.99,
            },
            {
                "document_type": "NPL_CALIBRATION",
                "filename": "EnviroTech_NPL_Traceable_Gas_Calibration_Cylinder_Cert.pdf",
                "legal_name": "EnviroTech Analytics India Private Limited",
                "id_number": "NPL/CHEM/GAS/2025/441",
                "page": 1,
                "confidence": 0.98,
            },
            {
                "document_type": "CPCB_TELEMETRY",
                "filename": "EnviroTech_CPCB_Cloud_Telemetry_Validation_Letter.pdf",
                "legal_name": "EnviroTech Analytics India Private Limited",
                "id_number": "CPCB/IT/TEL/2024/99",
                "page": 1,
                "confidence": 0.98,
            },
        ],
        "findings": [
            {
                "rule_ref": "CPCB_USEPA_01",
                "status": "verified",
                "explanation": "Rule CPCB_USEPA_01 verified: PM2.5/PM10 Beta Attenuation Monitors hold US-EPA Designated Federal Reference Method (FRM) and TÜV Rheinland MCERTS certificates.",
                "evidence": [{"label": "US-EPA & TÜV Certification", "document": "EnviroTech_USEPA_TUV_MCERTS_Certificates.pdf", "page": 2, "confidence": 0.99, "quote": "US-EPA Designated Federal Reference Method (FRM) Eq. EQPM-0308-170 for Ambient Particulate Monitoring."}],
            },
            {
                "rule_ref": "CPCB_NABL_02",
                "status": "verified",
                "explanation": "Rule CPCB_NABL_02 verified: Calibration gas standards possess direct traceability to National Physical Laboratory (NPL) India metrology standards.",
                "evidence": [{"label": "NPL Calibration Report", "document": "EnviroTech_NPL_Traceable_Gas_Calibration_Cylinder_Cert.pdf", "page": 1, "confidence": 0.98, "quote": "Calibration cylinders certified against NPL Primary Gas Standards under certificate NPL/CHEM/GAS/2025/441."}],
            },
            {
                "rule_ref": "CPCB_TELEMETRY_03",
                "status": "verified",
                "explanation": "Rule CPCB_TELEMETRY_03 verified: Real-time CPCB JSON REST API telemetry successfully tested and validated with Central Pollution Control Board IT wing.",
                "evidence": [{"label": "CPCB Telemetry Validation", "document": "EnviroTech_CPCB_Cloud_Telemetry_Validation_Letter.pdf", "page": 1, "confidence": 0.98, "quote": "Successfully tested continuous automated telemetry integration with CPCB CAAQMS Central Portal."}],
            },
        ],
    },
    {
        "tender_id": "a8888888-8888-4888-8888-888888888810",
        "name": "EcoSense Monitoring Systems LLP",
        "docs": [
            {
                "document_type": "USEPA_CERT",
                "filename": "EcoSense_TUV_Product_Certificate.pdf",
                "legal_name": "EcoSense Monitoring Systems LLP",
                "id_number": "TUV-ENV-2023-091",
                "page": 1,
                "confidence": 0.95,
            },
        ],
        "findings": [
            {
                "rule_ref": "CPCB_USEPA_01",
                "status": "verified",
                "explanation": "Rule CPCB_USEPA_01 verified: Particulate analyzer holds valid TÜV Rheinland air quality certificate.",
                "evidence": [{"label": "TÜV Certificate", "document": "EcoSense_TUV_Product_Certificate.pdf", "page": 1, "confidence": 0.95, "quote": "TÜV Rheinland certified ambient air monitoring unit."}],
            },
            {
                "rule_ref": "CPCB_NABL_02",
                "status": "missing",
                "explanation": "Missing Mandatory Compliance Evidence for Rule CPCB_NABL_02: Bidder did not enclose NPL traceable gas calibration certificates for SO2 and NOx analyzers.",
                "evidence": [],
            },
        ],
    },
]

# Insert Bidders, Documents, and Findings
for b_data in DEMO_BIDDERS_DATA:
    tender_id = b_data["tender_id"]
    name = b_data["name"]

    # Check if bidder already exists under this tender
    existing_b = sb.table("bidders").select("id").eq("tender_id", tender_id).eq("name", name).execute().data
    if existing_b:
        bidder_id = existing_b[0]["id"]
        # Clear old docs & findings for clean state
        sb.table("documents").delete().eq("bidder_id", bidder_id).execute()
        sb.table("findings").delete().eq("bidder_id", bidder_id).execute()
        print(f"  [Bidder Updated] {name}")
    else:
        bidder_id = str(uuid.uuid4())
        sb.table("bidders").insert({
            "id": bidder_id,
            "tender_id": tender_id,
            "name": name,
        }).execute()
        print(f"  [Bidder Created] {name}")

    # Insert Documents
    for doc in b_data.get("docs", []):
        doc_entry = {
            "id": str(uuid.uuid4()),
            "bidder_id": bidder_id,
            "document_type": doc["document_type"],
            "filename": doc["filename"],
            "storage_path": f"bids/{bidder_id}/{doc['filename']}",
            "legal_name": doc.get("legal_name", name),
            "id_number": doc.get("id_number", "REG-2026"),
            "page": doc.get("page", 1),
            "confidence": doc.get("confidence", 0.98),
            "extraction_status": "extracted",
        }
        sb.table("documents").insert(doc_entry).execute()

    # Get rules map for tender to resolve rule_ref -> rule UUID
    rules_res = sb.table("rules").select("id, rule_id").eq("tender_id", tender_id).execute().data
    rule_map = {r["rule_id"]: r["id"] for r in (rules_res or [])}

    # Insert Findings
    for f in b_data.get("findings", []):
        r_uuid = rule_map.get(f.get("rule_ref"))
        finding_id = str(uuid.uuid4())
        finding_entry = {
            "id": finding_id,
            "bidder_id": bidder_id,
            "rule_id": r_uuid,
            "status": f["status"],
            "explanation": f["explanation"],
            "evidence": f.get("evidence", []),
            "officer_action": f["status"] if f["status"] in ("verified", "issue_detected") else None,
            "officer_note": f"Evaluated by Procurement Officer SARATHI S against GeM Bid conditions." if f["status"] == "verified" else "Discrepancy noted during SIH compliance verification.",
            "action_at": datetime.now(timezone.utc).isoformat(),
        }
        sb.table("findings").insert(finding_entry).execute()

        # Insert Audit Log entry
        try:
            sb.table("audit_log").insert({
                "id": str(uuid.uuid4()),
                "finding_id": finding_id,
                "officer_name": "SARATHI S",
                "action": "EVALUATION_" + f["status"].upper(),
                "note": f"Rule {f.get('rule_ref')}: {f['status']}",
                "officer_clerk_id": "user_3JSOevTG6bQnw7VlgEUM85xMRMM",
            }).execute()
        except Exception:
            pass

print("=" * 70)
print("--> ALL 10 TENDERS, RULES, BIDDERS & FINDINGS SEEDED SUCCESSFULLY!")
print("=" * 70)
