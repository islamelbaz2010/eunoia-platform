-- Audit log for plan/account changes.
-- Run in Supabase SQL Editor.
-- Captures admin-initiated plan changes so support disputes have a paper trail.
-- Application rows (reports, research_requests) have their own timestamps;
-- this table covers configuration/billing-level events only.

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,   -- admin who made the change
  actor_email text,                                              -- denormalised — survives actor deletion
  target_user_id uuid references auth.users(id) on delete cascade,
  target_email text,                                             -- denormalised
  event_type text not null,                                      -- 'plan_changed' | 'account_deleted' | 'account_exported'
  payload jsonb,                                                 -- { from_plan, to_plan } etc.
  created_at timestamptz default now()
);

create index if not exists audit_log_target_user_idx on audit_log(target_user_id);
create index if not exists audit_log_created_at_idx on audit_log(created_at desc);

-- Only admins (service-role key) write to this table; no RLS insert policy for
-- authenticated users. Admins read via service-role bypassing RLS.
alter table audit_log enable row level security;

-- Allow users to see events where they are the target (for GDPR transparency).
create policy "Users see own audit events" on audit_log
  for select using (auth.uid() = target_user_id);
