# BidShield AI

AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement (PS 26100).

Automates tender rule extraction, bidder document processing, cross-document consistency checking, and compliance verification for government procurement officers on the GeM platform.

## Architecture

- **Frontend:** Next.js (App Router, TypeScript) with vanilla CSS design system
- **Backend:** Python (FastAPI) with Gemini API for AI extraction
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (private bucket for bid documents)
- **Auth:** Supabase Auth (single Procurement Officer role)

## Prerequisites

- Node.js 18+
- Python 3.10+
- A Supabase project (free tier works)
- A Google Gemini API key

## Setup

### 1. Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Click **Run**
3. Go to **Storage** and create a new private bucket named `bid-documents`
   - Toggle **Public** OFF
4. Note your project URL and keys from **Settings > API**:
   - Project URL (`SUPABASE_URL`)
   - `anon` public key (`SUPABASE_ANON_KEY`)
   - `service_role` secret key (`SUPABASE_SERVICE_ROLE_KEY`)

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` from the template:

```bash
cp .env.example .env
```

Fill in your credentials:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### 4. Seed Demo Data

The seed script populates the database with a sample tender, 6 rules, and 3 demo bidders:

```bash
cd supabase
pip install supabase python-dotenv
python seed.py
```

The seed creates:

- **Bidder A (Reliable Systems Pvt Ltd):** All documents consistent, all rules pass
- **Bidder B (ABC Engineering):** Deliberate legal name mismatches across GST/PAN/Udyam/Bid Form documents
- **Bidder C (Metro Constructions):** Missing financial statements, low-confidence Udyam extraction

## Usage

1. Open `http://localhost:3000` in your browser
2. Navigate to the seeded tender from the home page
3. Click **Dashboard** to see per-bidder compliance summaries
4. Click **Review** on any finding to see the Evidence Review screen
5. On Issue Detected findings (especially Bidder B), see the side-by-side document comparison
6. Take officer actions: Accept, Reject, Request Clarification, Mark Verified, or Override
7. Check the **Audit Log** to see all recorded actions

## Key Demo Flow (Section 9)

1. Navigate to Bidders page
2. Expand Bidder B
3. Observe uploaded documents with extracted legal names
4. Click **Run Verification**
5. Go to Dashboard -- see "Issue Detected" findings
6. Click **Review** on the cross-document consistency finding
7. See conflicting legal names side-by-side with source documents
8. Click **Request Clarification**
9. Go to Audit Log -- see the new entry

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | Google Gemini API key (server-side only) |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:3000) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:8000) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Project Structure

```
/frontend                 Next.js app (TypeScript, App Router)
  /app
    /components           Shared design system components
    /lib                  API client and utilities
    /tenders              All tender-related pages
    globals.css           CSS design system tokens
    layout.tsx            Root layout with fonts
    page.tsx              Home page (tender list)
/backend                  FastAPI app (Python)
  /app
    main.py               App entry point
    config.py             Environment configuration
    models.py             Pydantic request/response models
    supabase_client.py    Supabase client singleton
    /routes               API endpoint handlers
    /services
      gemini_extraction.py  Gemini API integration
      compliance_engine.py  Deterministic rule evaluation
      matching.py           Legal name normalization + fuzzy matching
      pdf_extraction.py     PDF text extraction
/supabase
  /migrations             SQL schema files
  seed.py                 Demo data seed script
```
# BidShield-AI 
