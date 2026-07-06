-- Run this in Supabase SQL Editor
-- Research Intelligence Hub — request/queue/status pipeline
-- Project ID: mickjkhjjmskoswqatpl
--
-- Finished results are written to the existing `reports` table (see
-- reports-table.sql) with report_type 'lead_finder' / 'talent_finder' so they
-- show up in /dashboard/reports automatically — this table only tracks the
-- request lifecycle. Phase 1 executes synchronously (submitted -> processing
-- -> completed/failed in one request), but the status column is designed so
-- a real queue/worker can be slotted in later without a schema change.

create table if not exists research_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  module text not null check (module in ('lead_finder', 'talent_finder', 'market_intelligence')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'processing', 'completed', 'failed')),
  input jsonb not null,
  result_report_id uuid references reports(id) on delete set null,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists research_requests_user_id_idx on research_requests(user_id);

alter table research_requests enable row level security;

create policy "Users see own research requests" on research_requests
  for all using (auth.uid() = user_id);

-- Re-run on an already-deployed database: app/api/intelligence/route.ts (the
-- Market Intelligence module) now writes plan-enforcement rows too, so the
-- module check constraint must allow 'market_intelligence' alongside the
-- original lead_finder/talent_finder values. Safe to re-run any number of
-- times.
alter table research_requests drop constraint if exists research_requests_module_check;
alter table research_requests add constraint research_requests_module_check
  check (module in ('lead_finder', 'talent_finder', 'market_intelligence'));
