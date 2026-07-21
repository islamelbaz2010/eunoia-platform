# 08 — DATABASE STATUS
*Two databases. One active. One legacy. Both deployed.*

---

## Database Architecture Summary

| Database | Technology | Status | Who Writes to It |
|----------|-----------|--------|-----------------|
| Supabase PostgreSQL | @supabase/ssr + direct SQL | ✅ ACTIVE — primary | All live API routes |
| Prisma PostgreSQL | @prisma/client | ⚠️ LEGACY — never written by live routes | Only `/api/users/init` (historical) |

Both point to the **same PostgreSQL instance** (Supabase manages Prisma's `DATABASE_URL`).

---

## Supabase Database (Primary)

### Active Tables

#### `reports`
**Purpose:** Stores all generated report output
**Schema** (from SQL files + code):
```sql
-- supabase/reports-table.sql
user_id       UUID      references auth.users
report_type   TEXT      -- 'feasibility', 'campaign_roi', 'lead_finder', etc.
company_name  TEXT
city          TEXT
report_data   JSONB     -- full report JSON
created_at    TIMESTAMPTZ
```
**Written by:** `/api/intelligence`, `/api/research/leads`, `/api/research/talent`
**Read by:** `/dashboard/reports`, `/dashboard/page.tsx`
**Verification:** `app/dashboard/page.tsx` lines 37-43 — live Supabase queries

#### `research_requests`
**Purpose:** Per-request usage tracking for plan enforcement
```sql
-- supabase/research-tables.sql
user_id       UUID
module        TEXT      -- 'lead_finder', 'talent_finder', 'market_intelligence'
status        TEXT      -- 'submitted', 'processing', 'completed', 'failed'
input         JSONB
credits_used  INTEGER
result_report_id UUID
created_at    TIMESTAMPTZ
```
**Written by:** All three main AI routes
**Read by:** `lib/research/plan-enforcement.ts` (count this month's credits)
**Verification:** `app/api/intelligence/route.ts` lines 986-993

#### `user_plans`
**Purpose:** Per-user plan assignment
```sql
-- supabase/plan-enforcement.sql
user_id  UUID  references auth.users
plan     TEXT  -- 'STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE'
```
**Read by:** `lib/research/plan-enforcement.ts`
**Written by:** Manual assignment only (no self-serve UI)
**Default:** STARTER if no row exists
**Verification:** `lib/research/plan-enforcement.ts` lines 35-37

#### `demo_leads`
**Purpose:** Exhibition/demo lead capture
```sql
-- supabase/leads-table.sql
name      TEXT
email     TEXT
phone     TEXT
company   TEXT
sector    TEXT
city      TEXT
created_at TIMESTAMPTZ
```
**Written by:** `/api/demo/route.ts`
**Read by:** No read UI in the platform (admin accesses via Supabase dashboard)
**Verification:** `app/api/demo/route.ts` lines 24-33

---

## Prisma Database (Legacy)

### Legacy Tables (Never Written to by Live Routes)

**Schema:** `prisma/schema.prisma`
**Comment on every model:** `/// LEGACY: ... Kept for historical data — do not drop.`

#### `User`
- Has `id`, `email`, `name`, `passwordHash`, `role`, `workspaceId`
- NOT synchronized with Supabase auth users
- Written by: `api/users/init/route.ts` only (legacy initialization)

#### `Workspace`
- Has `id`, `name`, `plan` (STARTER/PROFESSIONAL/ENTERPRISE), `ownerId`
- Workspace-level plan separate from user-level plan in `user_plans`
- Creates **two separate plan systems** that are not reconciled

#### `Report` (28 types)
- Historical report records from the old AI engine
- ALL 28 ReportTypes are marked LEGACY
- **No live route writes to this table**

#### `ApiUsage`
- Historical token/cost tracking
- Not used by any live route

---

## Database Architecture Issues

### Issue 1: Dual Plan Systems
**Severity: HIGH**
- Prisma has `Workspace.plan` (STARTER/PROFESSIONAL/ENTERPRISE — 3 tiers)
- Supabase `user_plans` has `plan` (STARTER/PROFESSIONAL/AGENCY/ENTERPRISE — 4 tiers, different names)
- These are **completely separate and never reconciled**
- `types/plan.types.ts` comment: "Deliberately separate from types/workspace.types.ts's Workspace-level Plan/PLAN_LIMITS, which is a Prisma-backed concept never wired into the live research routes"
- **Risk:** Confusing for investors or engineers joining the team

### Issue 2: Supabase Types Not Generated
**Severity: MEDIUM**
- `types/supabase.types.ts` does not include `reports`, `research_requests`, `user_plans`, or `demo_leads`
- All routes cast `supabase as any` to access these tables
- Comment in code: "`research_requests`/`reports`/`user_plans` aren't in the generated Supabase types yet"
- Creates TypeScript safety gaps

### Issue 3: Prisma Build Overhead
**Severity: LOW**
- `package.json` runs `prisma generate` in `postinstall`
- `vercel.json` explicitly runs `npx prisma generate && npm run build`
- This adds build time for an entirely legacy system
- The custom output (`lib/prisma/generated`) is checked into the repo

---

## Redis (Upstash)

**Purpose:** Rate limiting + query result caching
**Status:** ACTIVE

```typescript
// lib/redis/client.ts
import { Redis } from '@upstash/redis'
// Lazy init — reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
```

**Used for:**
1. Rate limiting: `ratelimit:intelligence:${user.id}`, `ratelimit:research:leads:${user.id}`, etc.
2. Research result caching: `research:acquisition:{sha256-hash-of-query}`
3. Source reputation tracking: `source-quality.ts`
4. Daily search quota: `quota.ts`

**Fail-open:** All Redis-dependent operations fail open (allow on error)

---

## Data Retention / GDPR

**Status: NOT ASSESSED — UNKNOWN**

- No data deletion API
- No GDPR compliance mechanism found
- No privacy policy in the codebase
- Demo leads stored indefinitely (no TTL)
- Report data stored indefinitely

**Risk:** If launching in EU or targeting international companies, GDPR compliance is needed.
