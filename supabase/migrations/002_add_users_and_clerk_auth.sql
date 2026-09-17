-- BidShield AI: Clerk Authentication and Role-Based Access Control Migration
-- Run this in Supabase SQL Editor

-- 1. Users table (mirrors Clerk accounts with assigned roles)
create table if not exists users (
  id text primary key,             -- Clerk user id (e.g. user_2xxx)
  name text not null,
  email text not null,
  role text not null,              -- procurement_officer | auditor | administrator
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role on users(role);
create index if not exists idx_users_email on users(email);

-- 2. Link authenticated officer's Clerk user ID to audit log
alter table audit_log add column if not exists officer_clerk_id text references users(id);

create index if not exists idx_audit_log_officer_clerk_id on audit_log(officer_clerk_id);
