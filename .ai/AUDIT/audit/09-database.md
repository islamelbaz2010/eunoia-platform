# 09 — Database

**Evidence basis:** `prisma/schema.prisma`, all `supabase/*.sql` files, all API routes, Supabase type file.

---

## Database Overview

The platform uses a **single PostgreSQL instance** (Supabase-managed) but accesses it through two different clients with two different table sets, creating a split schema reality.

---

## Prisma Schema (PostgreSQL via Supabase)

**File:** `prisma/schema.prisma`  
**Access client:** `@prisma/client` via `lib/prisma/client.ts`

| Model | Status | Active Use |
|---|---|---|
| `User` | Active | `/api/workspace`, `/api/users/init` |
| `Workspace` | Active | `/api/workspace`, `/api/users/init` |
| `Report` | **LEGACY** | No active route writes to this model |
| `ApiUsage` | **LEGACY** | No active route writes to this model |

### Prisma Schema Analysis

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  workspaceId  String
  workspace    Workspace  @relation(...)
  role         Role       @default(VIEWER)
  ...
}

model Workspace {
  plan      Plan     @default(STARTER)
  ownerId   String   // NOT a FK to User.id — no referential integrity
  ...
}
```

**Finding 1:** `Workspace.ownerId` is a `String` with no foreign key reference to `User.id`. If an owner is deleted, the workspace has a dangling `ownerId`.

**Finding 2:** `Workspace.plan` is a Prisma enum (`STARTER`, `PROFESSIONAL`, `ENTERPRISE`) that does NOT include `AGENCY`. The Supabase `user_plans` table allows `STARTER`, `PROFESSIONAL`, `AGENCY`, `ENTERPRISE`. These plan sets are out of sync.

**Evidence:** `prisma/schema.prisma:29` (`plan Plan @default(STARTER)`), `types/plan.types.ts:1` (`'AGENCY'`), `supabase/plan-enforcement.sql:8` (`check (plan in ('STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE'))`).

**Finding 3:** The Prisma `User.id` is a CUID. Supabase `auth.users.id` is a UUID. These are different identifiers — the Prisma user is bootstrapped from Supabase auth but maintains a separate primary key. This means there is no direct FK from the Prisma user to the Supabase auth user.

---

## Supabase Tables (Direct SQL / RLS)

**Access client:** `@supabase/ssr` with cookie-based session

| Table | Purpose | RLS | Schema source |
|---|---|---|---|
| `auth.users` | Supabase auth (managed) | ✅ | Supabase managed |
| `reports` | Persisted report outputs | ✅ | `supabase/reports-table.sql` |
| `research_requests` | Request lifecycle tracking | ✅ | `supabase/research-tables.sql` |
| `user_plans` | Plan assignment per user | ✅ | `supabase/plan-enforcement.sql` |
| `demo_leads` | Demo mode lead captures | ✅ (open insert/select) | `supabase/leads-table.sql` |

### Table Analysis

#### `reports`
```sql
-- inferred from usage in routes:
user_id uuid references auth.users(id)
report_type text
company_name text
city text
report_data jsonb
created_at timestamptz
```
**Finding:** `report_data` is a `jsonb` column storing the full AI-generated report as unvalidated JSON. This means no schema enforcement on report content — a malformed AI response could be stored and later fail to parse in the frontend.

**RLS:** Confirmed enabled (all routes check `user_id` match).

#### `research_requests`
```sql
id uuid primary key default gen_random_uuid()
user_id uuid references auth.users(id) on delete cascade
module text check (module in ('lead_finder', 'talent_finder', 'market_intelligence'))
status text check (status in ('draft', 'submitted', 'processing', 'completed', 'failed'))
input jsonb
result_report_id uuid references reports(id) on delete set null
credits_used integer not null default 1
error text
created_at timestamptz
updated_at timestamptz
```
**Assessment:** Well-designed. Has a foreign key to `reports`, status machine is documented, credits_used for plan enforcement. RLS enabled.

**Finding:** `updated_at` has no trigger to auto-update it (unlike Prisma's `@updatedAt`). Manual `.update({ status: '...' })` calls must set it or it stays at insertion time.

#### `user_plans`
```sql
user_id uuid primary key references auth.users(id) on delete cascade
plan text check (plan in ('STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE'))
created_at timestamptz
updated_at timestamptz
```
**Finding:** RLS only allows `SELECT` for authenticated users on their own row. No `INSERT` or `UPDATE` policy for authenticated users — plan assignment is service-role only. This is intentional (documented in SQL comments) but means no self-service upgrades are possible.

#### `demo_leads`
```sql
id uuid primary key
name text not null
email text not null
-- ... other fields
```
**Finding:** RLS policies are effectively open: `FOR INSERT WITH CHECK (true)` and `FOR SELECT USING (true)`. This table is publicly writable and readable by any caller — including unauthenticated callers with the Supabase anon key. If the demo form captures real user emails, those emails are publicly readable via Supabase REST API. **This is a data privacy risk.**

---

## Database Health Summary

| Issue | Severity | Evidence |
|---|---|---|
| `demo_leads` open RLS — publicly readable PII | HIGH | `supabase/leads-table.sql:7–12` |
| Plan enum mismatch (AGENCY missing from Prisma) | MEDIUM | `prisma/schema.prisma:79` vs `types/plan.types.ts` |
| `Workspace.ownerId` no FK constraint | MEDIUM | `prisma/schema.prisma:31` |
| `research_requests.updated_at` not auto-updated | LOW | `supabase/research-tables.sql` |
| Supabase types not regenerated for live tables | MEDIUM | Causes `as any` casts throughout |
| `reports.report_data` jsonb — no schema validation | LOW | Design choice, managed by app layer |
| Prisma LEGACY models not dropped | LOW | Technical debt, no functional impact |

---

## Migrations Status

No formal migration tooling (Supabase CLI migrations) observed. SQL files in `supabase/` are manual "run this in SQL editor" scripts. There is no migration history table or rollback capability.

**Risk:** If a SQL script is run twice, some statements have `IF NOT EXISTS` guards (safe). The `ALTER TABLE research_requests DROP CONSTRAINT ... ADD CONSTRAINT` pattern in `research-tables.sql` is idempotent but requires the constraint name to exist. No CI/automated migration check.
