-- BidShield AI: Migration 004 - Enable Row-Level Security (RLS) and Concurrency Integrity
-- Run this in Supabase SQL Editor

-- 1. Enforce Row-Level Security (RLS) across all core tables
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Add Unique Constraint on Bids to prevent race condition duplicate submissions (SEC-09)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_bids_tender_bidder'
    ) THEN
        ALTER TABLE bids ADD CONSTRAINT uq_bids_tender_bidder UNIQUE (tender_id, bidder_id);
    END IF;
END $$;

-- 3. Default Revoke on direct anon PostgREST access to protect sensitive audit & evaluation data
-- Note: Backend service communicates via SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
REVOKE ALL ON audit_log FROM anon;
REVOKE ALL ON findings FROM anon;
REVOKE ALL ON rules FROM anon;
REVOKE ALL ON documents FROM anon;
REVOKE ALL ON bidders FROM anon;
REVOKE ALL ON bids FROM anon;
REVOKE ALL ON users FROM anon;

-- 4. Allow public read-only access exclusively to published/active tenders
DROP POLICY IF EXISTS "Public can view published tenders" ON tenders;
CREATE POLICY "Public can view published tenders"
    ON tenders
    FOR SELECT
    TO anon, authenticated
    USING (status IN ('open', 'active', 'bid_submission_closed', 'completed'));

-- 5. Revoke direct insert/update/delete from anon on tenders
REVOKE INSERT, UPDATE, DELETE ON tenders FROM anon;
