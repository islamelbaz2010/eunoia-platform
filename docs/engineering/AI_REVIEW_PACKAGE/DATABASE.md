# DATABASE
**Audit Date:** 2026-07-30  
**Source:** Direct inspection of `prisma/schema.prisma` and `supabase/*.sql`  
**Critical status:** Supabase project is DELETED — DNS returns NXDOMAIN — platform non-operational

---

## Prisma Schema

**File:** `prisma/schema.prisma`  
**Provider:** PostgreSQL (same Supabase DB, different connection string pattern)  
**Output:** `lib/prisma/generated/`  
**Connection:** `DATABASE_URL` (pgbouncer pooled) + `DIRECT_URL` (direct)

### Active Models

#### User
```
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  name         String?
  passwordHash String?
  role         Role       @default(VIEWER)
  workspaceId  String
  workspace    Workspace
  reports      Report[]   ← LEGACY relation
  apiUsages    ApiUsage[] ← LEGACY relation
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

#### Workspace
```
model Workspace {
  id        String   @id @default(cuid())
  name      String
  plan      Plan     @default(STARTER)  ← NOT SYNCED to Supabase user_plans
  ownerId   String
  users     User[]
  reports   Report[] ← LEGACY relation
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Legacy Models (retained for historical data — no active writes)

#### Report (LEGACY)
Powered retired `/dashboard/intelligence` + `/dashboard/feasibility` pages. 30 ReportType enum values. No route writes to this model.

#### ApiUsage (LEGACY)
Usage tracking for the retired Report model's AI engine. No route writes to this model.

### Enums

| Enum | Values |
|---|---|
| `Role` | ADMIN, AGENCY, SALES, VIEWER |
| `Plan` | STARTER, PROFESSIONAL, ENTERPRISE *(note: missing AGENCY — present in Supabase `user_plans` but not Prisma)* |
| `ReportStatus` | QUEUED, PROCESSING, COMPLETED, FAILED (LEGACY) |
| `ReportType` | 30 values (LEGACY) |

### Known Issues

- `Workspace.plan` enum has `STARTER`, `PROFESSIONAL`, `ENTERPRISE` — missing `AGENCY`
- Prisma `Plan` and Supabase `user_plans.plan` are out of sync (4 values vs 3)
- `passwordHash` on `User` model is unused — auth is handled by Supabase Auth
- `Report` and `ApiUsage` are legacy but cannot be dropped without a migration

---

## Supabase Tables

**Note:** Supabase project is DELETED. Tables below are defined in SQL scripts that must be re-applied after creating a new project.

### `reports`
```sql
-- File: supabase/reports-table.sql
reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL,        -- 'feasibility', 'campaign_roi', 'market_entry', 'lead_gen',
                                    -- 'full_analysis', 'lead_finder', 'talent_finder'
  company_name text,
  city        text,
  report_data jsonb,
  created_at  timestamptz DEFAULT now()
)
```
RLS: Users see own reports only.

### `research_requests`
```sql
-- File: supabase/research-tables.sql + supabase/usage-tracking.sql
research_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  module            text CHECK (module IN ('lead_finder', 'talent_finder', 'market_intelligence')),
  status            text DEFAULT 'draft' CHECK (status IN ('draft','submitted','processing','completed','failed')),
  input             jsonb NOT NULL,
  result_report_id  uuid REFERENCES reports(id) ON DELETE SET NULL,
  error             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  credits_used      integer NOT NULL DEFAULT 1    -- added by usage-tracking.sql
)
```
RLS: Users see own requests only. Indexes on `user_id` + `created_at`.

### `user_plans`
```sql
-- File: supabase/plan-enforcement.sql
user_plans (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan       text NOT NULL DEFAULT 'STARTER'
             CHECK (plan IN ('STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```
RLS: Users see own plan. No user self-service insert/update (service-role key only for writes).

### `demo_leads`
```sql
-- File: supabase/leads-table.sql
demo_leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text,
  email       text NOT NULL,
  company     text,
  sector      text,
  city        text,
  report_data jsonb,
  created_at  timestamptz DEFAULT now()
)
```
RLS: All access blocked for public; writes via service-role key only.

### `audit_log`
```sql
-- File: supabase/audit-log.sql
audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email     text,
  target_user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_email    text,
  event_type      text NOT NULL,   -- 'plan_changed' | 'account_deleted' | 'account_exported'
  payload         jsonb,
  created_at      timestamptz DEFAULT now()
)
```
RLS: Users see events where they are the target. Admin writes via service-role.

---

## Supabase SQL Files (Execution Order)

| Order | File | Purpose | Status |
|---|---|---|---|
| 1 | `supabase/reports-table.sql` | Create `reports` table | **Must apply to new project** |
| 2 | `supabase/leads-table.sql` | Create `demo_leads` table | **Must apply** |
| 3 | `supabase/plan-enforcement.sql` | Create `user_plans` table | **Must apply** |
| 4 | `supabase/research-tables.sql` | Create `research_requests` table | **Must apply** |
| 5 | `supabase/usage-tracking.sql` | Add `credits_used` column to `research_requests` | **Must apply AFTER #4** |
| 6 | `supabase/audit-log.sql` | Create `audit_log` table | **Must apply** |

**Note:** These are NOT versioned migrations. There is no Supabase migrations directory. They are manual SQL scripts intended to be run in the Supabase SQL Editor in the order above.

---

## Missing / Not Yet Created

| Item | Notes |
|---|---|
| `decisions` table | Needed for Sprint 4 (DI integration). Not yet defined. Will be `supabase/migrations/007_decisions_table.sql`. |
| Supabase TypeScript types regeneration | `types/supabase.types.ts` was last generated before `research_requests`, `user_plans`, and `audit_log` tables were added. Stale — causes `as any` casts throughout research routes. |
| Supabase Realtime | Not configured. No subscriptions in current code. |
| Supabase Storage | Not configured. No file uploads in current code. |

---

## Views, Functions, and Policies

| Item | Status |
|---|---|
| Views | None defined |
| PostgreSQL functions | None defined |
| Triggers | None defined |
| PITR (Point-in-Time Recovery) | Not confirmed enabled — should be enabled per production checklist |

---

## Dual Database Architecture Issue

The platform has two parallel data models:

1. **Prisma / PostgreSQL** — `User`, `Workspace` (workspace/seat metadata, legacy reports)
2. **Supabase client** — `reports`, `research_requests`, `user_plans`, `demo_leads`, `audit_log`

These use the **same underlying PostgreSQL database** but accessed via different clients. The `Workspace.plan` field (Prisma) and `user_plans.plan` (Supabase) track plans independently and are not synced. The Supabase model is authoritative for enforcement.

This dual architecture is documented as technical debt and will require a billing provider decision (ADR-PENDING-003) before it can be reconciled.
