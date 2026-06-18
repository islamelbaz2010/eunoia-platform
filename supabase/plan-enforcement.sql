-- Run this in Supabase SQL Editor
-- Plan-enforcement infrastructure ONLY — no billing/payment provider is
-- connected here. Every user defaults to STARTER until a plan is explicitly
-- assigned (today: manually; later: by a billing webhook handler using the
-- service-role key, which bypasses RLS).

create table if not exists user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'STARTER' check (plan in ('STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_plans enable row level security;

create policy "Users see own plan" on user_plans
  for select using (auth.uid() = user_id);

-- No insert/update policy for authenticated users: plan assignment is
-- intentionally not self-service in this phase. Writes go through the
-- service-role key (manual admin action today, a billing webhook later),
-- which bypasses RLS by default in Supabase.
