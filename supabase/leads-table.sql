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

CREATE POLICY "Service role can insert" ON demo_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can select" ON demo_leads
  FOR SELECT USING (true);
