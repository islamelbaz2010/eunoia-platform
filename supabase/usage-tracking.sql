-- Run this in Supabase SQL Editor
-- Usage-tracking infrastructure for plan enforcement (see plan-enforcement.sql).
--
-- research_requests (see research-tables.sql) already records user_id,
-- created_at, and `module` (lead_finder | talent_finder — this already
-- serves as "report_type"; not duplicated under a second column name).
-- The one new thing needed is a per-request credit cost so monthly usage can
-- be summed per user. Defaults to 1 credit per report — a flat-rate
-- placeholder, not yet cost-weighted by report type or report size.

alter table research_requests
  add column if not exists credits_used integer not null default 1;
