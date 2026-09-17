-- BidShield AI: Initial Schema Migration
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Tenders table
create table if not exists tenders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  uploaded_text text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

-- Rules table
create table if not exists rules (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id) on delete cascade,
  rule_id text not null,
  requirement text not null,
  mandatory boolean not null default true,
  evidence_required text[] not null default '{}',
  threshold text,
  approved boolean not null default false
);

create index if not exists idx_rules_tender_id on rules(tender_id);

-- Bidders table
create table if not exists bidders (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_bidders_tender_id on bidders(tender_id);

-- Documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  bidder_id uuid references bidders(id) on delete cascade,
  document_type text not null,
  filename text not null,
  storage_path text not null,
  legal_name text,
  id_number text,
  registration_date date,
  page int,
  confidence numeric,
  extraction_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_bidder_id on documents(bidder_id);

-- Findings table
create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  bidder_id uuid references bidders(id) on delete cascade,
  rule_id uuid references rules(id),
  status text not null,
  evidence jsonb not null default '[]',
  explanation text not null,
  officer_action text,
  officer_note text,
  action_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_findings_bidder_id on findings(bidder_id);
create index if not exists idx_findings_rule_id on findings(rule_id);

-- Audit log table
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid references findings(id),
  officer_name text not null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_finding_id on audit_log(finding_id);
