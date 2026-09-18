-- BidShield AI: Migration 003 - Two-Actor Workflow & Bidder/Bid Entity Separation
-- Run this in Supabase SQL Editor

-- 1. Enhance Tenders table with metadata & lifecycle
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT 'Ministry of Commerce & Industry';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Goods & Equipment';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS created_by_officer TEXT;

-- 2. Enhance Bidders table (represents vendor / bidder identity)
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 3. Create Bids table (represents a specific submission for a tender)
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES bidders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | processing | verified | issue_detected | clarification_required | reviewed | qualified | not_qualified
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  officer_decision TEXT, -- qualified | not_qualified
  officer_decision_note TEXT,
  decision_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bids_tender_id ON bids(tender_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

-- 4. Update Documents to reference bids
ALTER TABLE documents ADD COLUMN IF NOT EXISTS bid_id UUID REFERENCES bids(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_fields JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_documents_bid_id ON documents(bid_id);

-- 5. Update Findings to reference bids
ALTER TABLE findings ADD COLUMN IF NOT EXISTS bid_id UUID REFERENCES bids(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_findings_bid_id ON findings(bid_id);

-- 6. Update Audit Log for tender and bid tracking
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS bid_id UUID REFERENCES bids(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_audit_log_tender_id ON audit_log(tender_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_bid_id ON audit_log(bid_id);
