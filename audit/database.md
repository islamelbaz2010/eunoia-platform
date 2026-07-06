# Database Audit

**Score: 38 / 100**

---

## Data Architecture Overview

This project uses **two parallel, disconnected database systems** with no shared migration tooling or type-safety boundary between them.

| System | Tables | Migration tooling | TypeScript types | Used by |
|---|---|---|---|---|
| Prisma/Postgres | User, Workspace, Report (LEGACY), ApiUsage (LEGACY) | **None** | Generated (custom path) | Auth onboarding, user lookup |
| Supabase Direct | reports, research_requests, user_plans, demo_leads | **None** (SQL files run manually) | Partial (`types/supabase.types.ts` incomplete) | All live product features |

---

## Prisma Audit

### Schema File: `prisma/schema.prisma`

**Generator configuration — ROOT CAUSE of NFT build bloat:**
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/prisma/generated"   ← NON-DEFAULT path
}
```
This causes Prisma's generated client to embed a `process.cwd()`-based self-locating fallback (`lib/prisma/generated/index.js:282-296`). Next.js's Node File Trace cannot statically resolve `process.cwd()`, causing all 4 routes that import Prisma to pull the entire project tree (~24.66MB) into their serverless bundles.

**Fix:** Remove the `output` line. Default path (`node_modules/.prisma/client`) uses standard `require()` resolution that NFT handles cleanly.

### Models

| Model | Status | Evidence | Action |
|---|---|---|---|
| `User` | ✅ Active | `init-user.ts`, `dashboard/layout.tsx` | Keep; add `@@index([workspaceId])` |
| `Workspace` | ✅ Active | Same | Keep |
| `Report` | ❌ LEGACY — never written | Schema comment; grep confirms no live writes | Drop after migration baseline |
| `ApiUsage` | ❌ LEGACY — never written | Schema comment; grep confirms no live writes | Drop after migration baseline |

### Missing Indexes [PROVEN]

Postgres **does not** automatically index foreign-key scalar columns. The following are unindexed:

| Table | Column | Risk |
|---|---|---|
| `User` | `workspaceId` | Every `WHERE workspaceId=?` query (workspace member lookup) does a full scan |
| `Report` | `userId`, `workspaceId` | Dead table — low priority, but fix before reviving |
| `ApiUsage` | `userId` | Dead table — same |

**Fix:**
```prisma
model User {
  // ...
  @@index([workspaceId])
}
```

### Migration History: Completely Absent [PROVEN]

```
find . -maxdepth 3 -name "migrations" → no results
ls prisma/ → schema.prisma only
```

**Risk:** The live production database schema was established via one or more `prisma db push` or manual SQL operations. There is no record of what was run, when, or in what order. Any future `prisma migrate dev` will attempt to diff the current schema against an empty migration history and generate a "create table" migration that, if applied, would drop and recreate existing tables.

**Correct approach:**
1. Run `prisma migrate dev --name init --create-only` (generates SQL without running it)
2. Inspect the generated SQL to verify it matches the live schema
3. Run `prisma migrate resolve --applied <migration-name>` against production (marks as applied without re-executing DDL)
4. Commit `prisma/migrations/` to git
5. Update `vercel.json` to run `prisma migrate deploy` before `next build`

### Transactions [PROVEN — PASSING]

`lib/prisma/init-user.ts:31-51`: User + Workspace creation is correctly wrapped in `prisma.$transaction(async (tx) => { ... })`. Atomic. No partial-creation risk.

### Connection Management [PROVEN — PASSING]

`lib/prisma/client.ts`: Correct singleton pattern using `globalThis`. No connection pool exhaustion risk.

### Raw SQL Usage [PROVEN — PASSING]

Zero `$queryRaw` or `$executeRaw` calls found anywhere in the codebase. No SQL injection surface via Prisma.

---

## Supabase Direct Audit

### Tables (defined via manually-applied SQL files in `supabase/`)

#### `reports` (`supabase/reports-table.sql`)
```sql
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  report_type text not null,
  company_name text,
  city text,
  report_data jsonb,
  created_at timestamptz default now()
);
```
**Issues:**
- `report_type` is unconstrained `text` — no CHECK constraint. Any string is accepted.
- `company_name`, `city`, `report_data` are nullable with no default — correct for partial data, but `report_data` being nullable means a "completed" report could have `null` results with no status field to explain why.
- **No `status` column** — reports either succeed (data written) or fail (nothing written). No intermediate states.
- **No index on `user_id`** — every dashboard page load queries `reports WHERE user_id=?`. Without an index, this is a full-table scan.
- RLS: ✅ `auth.uid() = user_id` — correct.

#### `research_requests` (`supabase/research-tables.sql`)
```sql
create table if not exists research_requests (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  module text not null check (module in ('lead_finder','talent_finder','market_intelligence')),
  status text not null default 'draft' check (status in ('draft','submitted','processing','completed','failed')),
  input jsonb not null,
  result_report_id uuid references reports(id) on delete set null,
  error text,
  credits_used integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```
**Issues:**
- ✅ Has CHECK constraints on `module` and `status`.
- ✅ Has `create index if not exists research_requests_user_id_idx on research_requests(user_id)` — correctly indexed.
- `updated_at` has no trigger to auto-update — requires manual update in application code.
- No `updated_at` trigger exists in the SQL file.

#### `user_plans` (`supabase/plan-enforcement.sql`)
```sql
create table if not exists user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'STARTER' check (plan in ('STARTER','PROFESSIONAL','AGENCY','ENTERPRISE')),
  ...
);
```
**Issues:**
- ✅ `ENTERPRISE` tier in Supabase's `user_plans` table.
- ❌ Prisma's `workspace.types.ts` `Plan` type does NOT include `'AGENCY'` or `'ENTERPRISE'` — split-brain confirmed.
- No `INSERT` policy for authenticated users — intentional (plan assignment is admin-only). ✅ Correct design, but must be documented in ops runbook: "To assign a plan, use Supabase service-role key or SQL editor."

#### `demo_leads` (`supabase/leads-table.sql`)
```sql
CREATE POLICY "Service role can insert" ON demo_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can select" ON demo_leads FOR SELECT USING (true);
```
**Issues:**
- ❌ `USING (true)` on SELECT policy means any RLS-executing role (including authenticated users) can read all demo leads. Service-role bypasses RLS entirely — these policies only affect authenticated users, not service-role calls. The SELECT policy is effectively a full public-read to all authenticated users.
- No index on `email` — deduplication queries will be slow at scale.

### Migration Tooling for Supabase Tables [PROVEN — ABSENT]

The 5 SQL files in `supabase/` are manual scripts to be run in the Supabase SQL editor. There is:
- No execution ordering system
- No record of which scripts were run against production
- No rollback scripts
- No idempotency guarantee (some use `IF NOT EXISTS`, some don't check)

**Fix:** Adopt Supabase migrations CLI (`supabase db push` / `supabase migration new`) or store ordered migration files in `supabase/migrations/` with a manifest.

---

## TypeScript Type Coverage

| Table | Covered in `types/supabase.types.ts` | Impact |
|---|---|---|
| `reports` | ✅ Partial | Basic shape used in dashboard |
| `research_requests` | ❌ Missing | Forces `as any` in leads/talent/intelligence routes |
| `user_plans` | ❌ Missing | Forces `as any` in `plan-enforcement.ts` |
| `demo_leads` | ❌ Missing | No type safety on demo route DB operations |

**Root cause:** `types/supabase.types.ts` was not regenerated after the research/plan tables were added.  
**Fix:** `supabase gen types typescript --project-id <project-id> > types/supabase.types.ts` and add to CI.

---

## Split-Brain Plan Model [PROVEN]

| Location | Type | Tiers | Has `members` limit | Used by |
|---|---|---|---|---|
| `types/plan.types.ts` | `UserPlan` | STARTER, PROFESSIONAL, AGENCY, ENTERPRISE | ❌ No | All live research routes, plan enforcement |
| `types/workspace.types.ts` | `Plan` | STARTER, PROFESSIONAL, ENTERPRISE (no AGENCY) | ✅ Yes | Dead `use-workspace.ts` hook only |
| `prisma/schema.prisma` enum `Plan` | STARTER, PROFESSIONAL, ENTERPRISE | N/A (DB constraint) | N/A | Prisma Workspace model |
| `supabase/plan-enforcement.sql` CHECK | STARTER, PROFESSIONAL, AGENCY, ENTERPRISE | N/A | N/A | DB constraint on `user_plans` |

**The live product runs on `plan.types.ts` (4-tier). The Prisma schema and `workspace.types.ts` are on a 3-tier model. These will diverge further as the product evolves unless reconciled.**

---

## Database Performance Assessment

| Query | Issue | Risk |
|---|---|---|
| `reports WHERE user_id=?` | No index on `user_id` | Full-table scan at scale — HIGH |
| `User WHERE email=?` | Has implicit unique index (from `@@unique`) — ✅ | PASS |
| `Workspace WHERE id=?` | PK index — ✅ | PASS |
| `research_requests WHERE user_id=? AND created_at >= ?` | `user_id` indexed ✅; composite index on `(user_id, created_at)` would help | MEDIUM |
| `user_plans WHERE user_id=?` | PK index — ✅ | PASS |

---

## Summary

| Category | Status |
|---|---|
| Prisma migration history | ❌ ABSENT — stop-ship |
| Supabase migration history | ❌ ABSENT — stop-ship |
| Schema-TypeScript alignment | ❌ Stale types, `as any` in 4 places |
| Indexes | ⚠️ Missing on `reports.user_id`, `User.workspaceId` |
| Transactions | ✅ Correct where used |
| Connection management | ✅ Correct singleton |
| RLS | ✅ Enabled; 1 policy too permissive (`demo_leads` SELECT) |
| Plan model consistency | ❌ Split-brain across 4 files |
| Raw SQL injection surface | ✅ None via Prisma |
