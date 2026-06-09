-- Run this in Supabase SQL Editor
-- Project ID: mickjkhjjmskoswqatpl

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  report_type text not null,
  company_name text,
  city text,
  report_data jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table reports enable row level security;

-- Users can only see their own reports
create policy "Users see own reports" on reports
  for all using (auth.uid() = user_id);
