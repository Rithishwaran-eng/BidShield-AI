# BidShield AI

> **AI-Powered Integrated Bid Compliance and Verification Platform for GeM Procurement**  
> *Smart India Hackathon (SIH) — Problem Statement PS 26100*  
> *Ministry of Commerce and Industry | Government e-Marketplace (GeM)*

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-1.5_Pro-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Clerk Auth](https://img.shields.io/badge/Clerk-RBAC_Auth-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Accessibility](https://img.shields.io/badge/Standards-GIGW_3.0_|_WCAG_2.1_AA-FF9933?style=for-the-badge)](https://guidelines.gov.in/)

---

## Executive Summary

Public procurement on the **Government e-Marketplace (GeM)** involves high-stakes evaluations where each tender attracts numerous bidders submitting extensive statutory credentials including GST registrations, PAN cards, MSME Udyam certificates, audited balance sheets, past experience work orders, and Earnest Money Deposit (EMD) guarantees.

### The Operational Challenge
1. **Manual Checklist Fatigue**: Procurement officers must examine dozens of dense multi-page PDFs per bidder, manually validating numbers, legal names, and registration dates across disparate forms.
2. **Siloed Document Checking**: Conventional document verification tools review files in isolation. They fail to identify **cross-document identity fraud**, where a bidder submits a valid PAN card under one legal name and a GST certificate under a slightly modified or associated corporate entity.
3. **The Black-Box AI Fallacy**: Generic machine learning scoring models (e.g., assigning an opaque "82% compliance score") lack explainability and cannot stand up to scrutiny in statutory vigilance inquiries, Right to Information (RTI) petitions, or judicial challenges.

### The BidShield AI Solution
BidShield AI provides an end-to-end, deterministic, evidence-backed verification pipeline. It automatically parses natural language tender clauses into structured rules, runs **cross-document entity consistency checks**, cites source documents down to page numbers and field values, and empowers designated procurement officers with an immutable audit trail.

---

## Core Innovations and Novelty

| Dimension | Conventional Procurement Evaluation | BidShield AI Platform |
| :--- | :--- | :--- |
| **Document Processing** | Manual check per PDF in isolation | **Automated Cross-Document Consistency Intelligence** across all submitted documents |
| **Entity Verification** | Assumed identical if stamps look valid | **Algorithmic Legal Name Normalization and Fuzzy Matching** to detect shell/front entity mismatches |
| **Tender Criteria** | Human reading of narrative tender clauses | **Automated Rule Extraction** turning natural language clauses into structured, executable queries |
| **Explainability** | Subjective officer notes or arbitrary AI score | **Zero Black-Box Evidence Chain**: links requirement to rule, document, page number, and finding |
| **Low-Quality Scans** | Ignored or misread by basic OCR | **Confidence-Aware Processing**: OCR confidence below 70 percent flags `pending` to prevent AI hallucinations |
| **Auditability** | Dispersed physical paperwork and manual records | **Immutable Database Audit Ledger** (`audit_log`) for vigilance and CAG oversight |

---

## System Architecture

### Architectural Flow Diagram

```mermaid
flowchart TB
    %% 1. PRESENTATION LAYER
    subgraph UI ["1. Presentation Layer (Next.js 16 + TypeScript)"]
        direction LR
        U1["Tender Management Portal"]
        U2["Compliance & Risk Dashboard"]
        U3["Evidence Comparison Grid"]
        U4["User Directory & RBAC Portal"]
        U5["Audit Trail & Reports Viewer"]
    end

    %% 2. API & SECURITY GATEWAY
    subgraph GATEWAY ["2. API & Security Layer (FastAPI + Clerk Auth)"]
        direction LR
        G1["Authentication Middleware<br/>(JWT Verification)"]
        G2["Role-Based Access Control<br/>(Admin / Officer / Auditor)"]
        G3["REST API Endpoints<br/>(Tenders, Bidders, Findings)"]
    end

    %% 3. INTELLIGENCE & VERIFICATION PIPELINE
    subgraph ENGINE ["3. BidShield AI Intelligence Engine"]
        direction TB
        subgraph P1 ["Ingestion & Extraction"]
            E1["Tender PDF Parser<br/>(PyPDF / Text Plumber)"]
            E2["Gemini 1.5 Pro<br/>(Rule Structuring)"]
            E3["Bidder Document OCR<br/>(Confidence Scoring)"]
        end
        subgraph P2 ["Deterministic Evaluation"]
            E4["Legal Name Normalizer<br/>(app/services/matching.py)"]
            E5["Cross-Document Consistency Engine<br/>(Token Match / Suffix Stripping)"]
            E6["Deterministic Rule Evaluator<br/>(Thresholds / Confidence >= 70%)"]
        end
        subgraph P3 ["Findings & Recommendations"]
            E7["Evidence Graph Generator<br/>(Requirement -> Doc -> Page -> Snippet)"]
            E8["Advisory Findings Engine<br/>(Verified / Issue / Missing / Pending)"]
        end
    end

    %% 4. PERSISTENCE LAYER
    subgraph DATA ["4. Data & Persistence Layer (Supabase / PostgreSQL)"]
        direction LR
        D1[("Tenders & Rules<br/>Table")]
        D2[("Bidders & Documents<br/>Table")]
        D3[("Compliance Findings<br/>Table")]
        D4[("Immutable Audit Log<br/>Table")]
        D5[("Private Object Store<br/>(bid-documents bucket)")]
    end

    %% 5. DECISION & GOVERNANCE LAYER
    subgraph GOV ["5. Governance & Human-in-the-Loop Decision Layer"]
        direction LR
        H1["Procurement Officer Review<br/>(Accept / Flag / Clarify)"]
        H2["Mandatory Justification Log<br/>(Officer Override Notes)"]
        H3["Auditor Inspection View<br/>(Read-Only Verification Log)"]
        H4["Proactive RTI / Transparency<br/>(Section 4(1)(b) Disclosure)"]
    end

    %% CONNECTIONS
    UI -->|HTTPS / REST API Requests| GATEWAY
    GATEWAY -->|Authorized Route Handlers| ENGINE
    P1 --> P2
    P2 --> P3
    ENGINE <-->|Read / Write Operational State| DATA
    E8 -->|Generate Advisory Grid| H1
    H1 -->|Log Determination & Override Notes| D4
    H3 -.->|Verify Immutable Trails| D4
    H4 -.->|Proactive Reporting| D4
```

### Architectural Component Schematic

```text
+---------------------------------------------------------------------------------------------------+
|                                  1. CLIENT & PRESENTATION LAYER                                    |
|                      Next.js 16 (App Router) | TypeScript | GIGW 3.0 / WCAG 2.1 AA                |
|  [Tender Management]   [Compliance Dashboard]   [Evidence Grid]   [User Admin]   [Audit Explorer]  |
+-------------------------------------------------+-------------------------------------------------+
                                                  | HTTPS / REST API
+-------------------------------------------------v-------------------------------------------------+
|                                 2. API GATEWAY & SECURITY LAYER                                   |
|                     FastAPI (Python 3.13) | Clerk Authentication & RBAC Sync                      |
|  [JWT Token Verification]        [Role Guard: Admin / Officer / Auditor]        [Pydantic Models] |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
+-------------------------------------------------v-------------------------------------------------+
|                                  3. BIDSHIELD INTELLIGENCE ENGINE                                 |
|                                                                                                   |
|  [Tender Ingestion & NLP]     [OCR & Field Extraction]       [Entity Normalization & Matching]    |
|  - Gemini 1.5 Pro Rule Parser - PyPDF Text Extraction         - Corporate Suffix Stripper         |
|  - Clause-to-Rule Mapping     - Confidence Score Calculator   - Token Sort Ratio & Fuzzy Match    |
|                                                                                                   |
|  [Deterministic Rule Engine]  [Cross-Document Checker]       [Evidence Graph Constructor]         |
|  - Financial Turnover Check   - Name Mismatch Detector       - Requirement -> Rule -> Document    |
|  - Statutory Verification     - GST vs PAN vs Udyam vs Form  - Page Number & Snippet Binding      |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
+-------------------------------------------------v-------------------------------------------------+
|                                 4. DATA & PERSISTENCE LAYER                                       |
|                            Supabase (PostgreSQL 15) | Encrypted Storage                           |
|  [(tenders)]   [(rules)]   [(bidders)]   [(documents)]   [(findings)]   [(users)]   [(audit_log)] |
|                     Object Storage: Private 'bid-documents' Bucket (AES-256)                      |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
+-------------------------------------------------v-------------------------------------------------+
|                                5. GOVERNANCE & AUDIT TRAIL LAYER                                  |
|  [Officer Review Decisions: Accept / Flag / Request Clarification / Override with Justification]  |
|  [Immutable Tamper-Evident Audit Ledger (CVC & CAG Ready) | RTI Proactive Disclosure (Sec 4(1)(b))]|
+---------------------------------------------------------------------------------------------------+
```

---

## Key Modules and Capabilities

### 1. Tender-to-Rule Intelligence
- Converts natural language tender eligibility sections into structured rule schemas:
  - Financial turnover thresholds (e.g., Rs 10 Crore average over FY22 to FY25)
  - Statutory registrations (Active GSTIN, PAN Card, MSME Udyam)
  - Prior experience requirements (3 completed orders of at least Rs 2 Crore in the last 5 years)
  - Earnest Money Deposit (EMD) bank guarantee criteria

### 2. Cross-Document Consistency Engine
- Implements specialized legal entity name normalization (`app/services/matching.py`):
  - Normalizes corporate suffixes (`Pvt Ltd`, `Private Limited`, `LLP`, `Inc`, `Co.`)
  - Cleans whitespace, punctuation, and typographical differences
  - Executes fuzzy token-matching across documents to alert officers when a bidder attempts to swap legal entities between filings

### 3. Evidence-First Review and Comparison Grid
- Every compliance observation (Finding) carries structured evidence:
  - Document ID and filename
  - Exact extracted field and value
  - Page number reference
  - Plain-language explanation templates (no unpredictable LLM text generation during evaluation)

### 4. Enterprise Role-Based Access Control (RBAC)
Integrated via **Clerk Authentication** with a synchronized Supabase database:
- **Administrator**: Manages platform users, assigns roles (`procurement_officer`, `auditor`, `administrator`), and configures system parameters.
- **Procurement Officer**: Creates tenders, approves extracted rules, uploads bidder documentation, executes verification pipelines, and takes official review decisions.
- **Auditor**: Dedicated read-only access to live tenders, compliance statistics, evidence comparison grids, and tamper-evident audit trails.

### 5. GIGW 3.0 and WCAG 2.1 AA Design System
- Built to official Government of India web standards:
  - National tricolor visual identity and emblem integration
  - Variable font sizing controls (`A-`, `A`, `A+`)
  - Instant High Contrast accessibility toggle
  - Multilingual header support (English / Hindi)
  - Edge-to-edge modern responsive layout

---

## Technology Stack

```
BidShield-AI/
|-- frontend/                  # Next.js 16 Web Application (App Router, Turbopack)
|   |-- app/
|   |   |-- components/        # Header, Footer, Sidebar, Modals, Status Badges
|   |   |-- manage-users/      # Administrator User Management Portal
|   |   |-- tenders/           # Tender Listings, Creation, Dashboard, Audit Grid
|   |   |-- sign-in/           # Clerk Enterprise Sign-In
|   |   |-- sign-up/           # Clerk Officer Registration
|   |   `-- globals.css        # Government Portal Design Tokens & Base Styles
|   `-- middleware.ts          # Clerk Route Authentication Protection
|
|-- backend/                   # FastAPI High-Performance Python Microservice
|   |-- app/
|   |   |-- routes/            # Tenders, Bidders, Documents, Findings, Audit, Users
|   |   |-- services/
|   |   |   |-- compliance_engine.py  # Deterministic Rule Evaluation Logic
|   |   |   |-- gemini_extraction.py  # Google Gemini 1.5 Pro AI Parsing
|   |   |   |-- matching.py           # Legal Name Normalization & Cross-Doc Check
|   |   |   `-- pdf_extraction.py     # PDF Parsing & Extraction Engine
|   |   `-- supabase_client.py        # Supabase Service Role Integration
|   `-- requirements.txt
|
`-- supabase/                  # PostgreSQL Database Migrations & Seeds
    |-- migrations/
    |   |-- 001_initial_schema.sql         # Tenders, Rules, Bidders, Documents, Findings, Audit
    |   `-- 002_add_users_and_clerk_auth.sql # Users Table & Clerk RBAC Integration
    `-- seed.py                # Synthetic Bidder Evaluation Demo Dataset
```

---

## Quickstart Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 to v3.13
- **Supabase Account**: Free or Pro tier ([supabase.com](https://supabase.com))
- **Google Gemini API Key**: ([ai.google.dev](https://ai.google.dev/))
- **Clerk Account**: For authentication and user roles ([clerk.com](https://clerk.com))

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Rithishwaran-eng/BidShield-AI.git
cd BidShield-AI
```

---

### Step 2: Supabase Database Setup
1. Create a new project in your Supabase dashboard.
2. In the **SQL Editor**, execute the migration scripts in order:
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_add_users_and_clerk_auth.sql`
3. In **Storage**, create a new private bucket named:
   - Bucket Name: `bid-documents` (Public: **OFF**)
4. Retrieve your credentials from **Project Settings > API**:
   - Project URL (`SUPABASE_URL`)
   - `anon` public key (`SUPABASE_ANON_KEY`)
   - `service_role` secret key (`SUPABASE_SERVICE_ROLE_KEY`)

---

### Step 3: Backend Configuration and Launch
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:3000
```

Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
*API documentation is available at: `http://localhost:8000/docs`*

---

### Step 4: Frontend Configuration and Launch
```bash
cd ../frontend

# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Clerk Authentication Keys (From clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

Start the frontend development server:
```bash
npm run dev
```
*Access the portal at: `http://localhost:3000`*

---

### Step 5: Seed Demo Evaluation Dataset
Populate the database with a pre-configured GeM IT hardware procurement tender and 3 distinct evaluation scenarios:

```bash
cd ../supabase
pip install supabase python-dotenv
python seed.py
```

**Seed Scenarios Included:**
- **Bidder A (Reliable Systems Pvt Ltd)**: 100 percent compliant, all documents verified, identical legal names across GST, PAN, and Udyam.
- **Bidder B (ABC Engineering)**: Deliberate cross-document identity discrepancies (*ABC Engineering Pvt Ltd* vs. *A B C Engineering Limited* vs. *ABC Engg. Private Ltd*).
- **Bidder C (Metro Constructions)**: Missing audited financials and low-confidence scanned Udyam certificate requiring manual officer review.

---

## Verification and Demo Walkthrough

1. **Browse Live Tenders**: Visit `http://localhost:3000/tenders` to inspect active procurement bids.
2. **Review Compliance Summary**: Open the seeded tender dashboard (`/tenders/[id]/dashboard`) to view aggregate status cards (`Verified`, `Issue Detected`, `Missing`, `Pending`).
3. **Inspect Cross-Document Mismatch**:
   - Navigate to **Bidder B** (`ABC Engineering`).
   - Click **Review** on the Cross-Document Consistency finding.
   - Observe the **Evidence Grid**: the conflicting legal names are highlighted side-by-side with exact document links.
4. **Take Officer Action**:
   - Select **Request Clarification** or **Override**.
   - Input the required official justification note.
5. **Inspect Tamper-Evident Audit Trail**:
   - Navigate to the **Audit Log** (`/tenders/[id]/audit`).
   - Verify that your officer action, timestamp, and justification remarks have been permanently logged.
6. **Administrator Portal**:
   - Sign in with an Administrator account and navigate to `/manage-users` to promote officers or configure audit roles.

---

## Security and Data Governance

- **Data Protection**: Designed in strict compliance with the **Digital Personal Data Protection (DPDP) Act, 2023** and Government of India Cybersecurity Directives.
- **Encryption**: AES-256 encryption at rest for all uploaded bid documents and TLS 1.3 encryption in transit.
- **Role Isolation**: Strict separation of concerns: procurement officers cannot delete audit entries; auditors have tamper-proof read-only access.
- **Statutory Transparency**: Integrated RTI / FOIA proactive disclosure alignment under Section 4(1)(b) of the Right to Information Act, 2005.

---

## Future Roadmap

- [x] **Phase 1**: Tender NLP parsing, automated rule formulation, deterministic cross-document matching, and immutable audit logs.
- [ ] **Phase 2**: Direct API adapters to national registries (**MCA21**, **GSTN**, **MSME Udyam**, **PAN/CBDT**, and **DigiLocker**).
- [ ] **Phase 3**: OEM Direct Authorization verification and central debarment/blacklist automated screening.
- [ ] **Phase 4**: Multi-CPSE (Central Public Sector Enterprises) federated compliance knowledge base with cross-tender procurement analytics.

---

## License and Attribution

Developed for the **Smart India Hackathon (SIH)**.  
Repository maintained by [Rithishwaran-eng](https://github.com/Rithishwaran-eng).  
Licensed under the [MIT License](LICENSE).
