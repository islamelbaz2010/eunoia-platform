-- Eunoia Intelligence Platform — Initial Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- This matches database/schema.prisma exactly

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENCY', 'SALES', 'VIEWER');
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "ReportStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "ReportType" AS ENUM (
  'COMPETITOR',
  'PRICING',
  'CAMPAIGN',
  'FULL_ANALYSIS',
  'CLV_RETENTION',
  'TREND_RESEARCH',
  'MEDIA_MIX',
  'OPPORTUNITY_SCORING'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Workspaces (tenants)
CREATE TABLE IF NOT EXISTS "workspaces" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"       TEXT NOT NULL,
  "plan"       "Plan" NOT NULL DEFAULT 'STARTER',
  "owner_id"   TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (linked to Supabase auth.users via email)
CREATE TABLE IF NOT EXISTS "users" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email"         TEXT NOT NULL UNIQUE,
  "name"          TEXT,
  "password_hash" TEXT,
  "role"          "Role" NOT NULL DEFAULT 'VIEWER',
  "workspace_id"  TEXT NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS "reports" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type"         "ReportType" NOT NULL,
  "status"       "ReportStatus" NOT NULL DEFAULT 'QUEUED',
  "input"        JSONB NOT NULL DEFAULT '{}',
  "output"       JSONB,
  "error"        TEXT,
  "user_id"      TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" TEXT NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completed_at" TIMESTAMPTZ,
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Usage tracking
CREATE TABLE IF NOT EXISTS "api_usage" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider"   TEXT NOT NULL,
  "model"      TEXT NOT NULL DEFAULT '',
  "tokens"     INTEGER NOT NULL DEFAULT 0,
  "cost"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "report_id"  TEXT REFERENCES "reports"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS "users_workspace_id_idx" ON "users"("workspace_id");
CREATE INDEX IF NOT EXISTS "reports_user_id_idx" ON "reports"("user_id");
CREATE INDEX IF NOT EXISTS "reports_workspace_id_idx" ON "reports"("workspace_id");
CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");
CREATE INDEX IF NOT EXISTS "api_usage_user_id_idx" ON "api_usage"("user_id");

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "workspaces_updated_at"
  BEFORE UPDATE ON "workspaces"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER "users_updated_at"
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER "reports_updated_at"
  BEFORE UPDATE ON "reports"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_usage" ENABLE ROW LEVEL SECURITY;

-- Helper function: get workspace_id for the current authenticated user
-- Uses email from Supabase auth.users to find the app user
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS TEXT AS $$
  SELECT workspace_id FROM users
  WHERE email = auth.jwt() ->> 'email'
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Workspaces: user can only see their own workspace
CREATE POLICY "workspace_isolation"
  ON "workspaces"
  FOR ALL
  USING ("id" = get_user_workspace_id());

-- Users: user can see only members of their workspace
CREATE POLICY "users_workspace_isolation"
  ON "users"
  FOR ALL
  USING ("workspace_id" = get_user_workspace_id());

-- Reports: scoped to workspace
CREATE POLICY "reports_workspace_isolation"
  ON "reports"
  FOR ALL
  USING ("workspace_id" = get_user_workspace_id());

-- API usage: scoped to workspace
CREATE POLICY "api_usage_workspace_isolation"
  ON "api_usage"
  FOR ALL
  USING (
    "user_id" IN (
      SELECT id FROM users WHERE workspace_id = get_user_workspace_id()
    )
  );

-- ============================================================
-- SERVICE ROLE BYPASS (for Prisma server-side writes)
-- Prisma uses service_role key which bypasses RLS — no extra policy needed
-- ============================================================

-- ============================================================
-- PRISMA SHADOW DB NOTE
-- ============================================================
-- When running prisma migrate dev, Prisma needs a shadow database.
-- In Supabase, create a second project or use --create-only flag.
-- For production deploys: npx prisma db push --schema=../../database/schema.prisma
-- ============================================================
