CREATE TABLE IF NOT EXISTS demo_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text NOT NULL,
  company text,
  sector text,
  city text,
  report_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert" ON demo_leads;
DROP POLICY IF EXISTS "Service role can select" ON demo_leads;
DROP POLICY IF EXISTS "No public demo lead access" ON demo_leads;

CREATE POLICY "No public demo lead access" ON demo_leads
  FOR ALL USING (false) WITH CHECK (false);
