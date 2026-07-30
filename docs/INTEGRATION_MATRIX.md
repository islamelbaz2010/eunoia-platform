# Integration Matrix

**Date:** 2026-07-21  
**Purpose:** Documents how all modules, services, and data stores connect to each other, what each connection carries, and the failure mode when the connection is unavailable.

---

## 1. Module-to-Module Dependencies

| Consumer | Provider | Interface | Failure Mode |
|---|---|---|---|
| `dashboard/layout.tsx` | `lib/supabase/server.ts` | `getUser()` | Redirect to `/login` |
| `dashboard/layout.tsx` | `lib/prisma/client.ts` | `user.findUnique()` | Redirect to `/onboarding` |
| `dashboard/layout.tsx` | `lib/supabase/middleware.ts` | `updateSession()` | Session not refreshed (soft failure) |
| `app/api/intelligence` | `lib/research/rate-limit.ts` | `checkRateLimit()` | HTTP 429 |
| `app/api/intelligence` | `services/legacy-ai-engine/orchestrator.ts` | `runAnalysis()` | HTTP 500 |
| `app/api/research/*` | `lib/research/rate-limit.ts` | `checkRateLimit()` | HTTP 429 |
| `app/api/research/*` | `lib/research/plan-enforcement.ts` | `checkPlanLimit()` | HTTP 402 |
| `app/api/research/*` | `lib/research/acquisition/research-service.ts` | `ResearchService.run()` | HTTP 500 |
| `app/api/users/init` | `lib/prisma/init-user.ts` | `initUserFromSupabase()` | HTTP 500 |
| `app/api/account/delete` | `lib/supabase/admin.ts` | `deleteUser()` | HTTP 500 |
| `app/api/account/export` | `lib/supabase/server.ts` | Multiple table reads | HTTP 500 |
| `app/api/admin/*` | `lib/admin/auth.ts` | `isAdminUser()` | HTTP 403 |
| `app/api/admin/users/[id]/plan` | `lib/admin/audit.ts` | `writeAuditLog()` | Best-effort; plan change proceeds even if log fails |
| `lib/research/plan-enforcement.ts` | `lib/supabase/server.ts` | `user_plans` table read | HTTP 402 (treated as over-limit) |
| `lib/research/acquisition/research-service.ts` | `lib/research/acquisition/search-provider.ts` | SerpAPI call | Throws; propagates as HTTP 500 |
| `lib/research/acquisition/research-service.ts` | `lib/research/acquisition/ai-analysis.ts` | OpenAI call | Throws; propagates as HTTP 500 |
| `services/legacy-ai-engine/orchestrator.ts` | `lib/research/rate-limit.ts` | Redis cache read/write | Cache miss on Redis failure (falls through to AI) |
| `services/legacy-ai-engine/orchestrator.ts` | `services/legacy-ai-engine/providers/openai.provider.ts` | OpenAI API call | Throws; propagates as HTTP 500 |
| `components/sidebar.tsx` | `app/api/admin/check` | Fetch on mount | Admin link hidden (soft failure) |

---

## 2. External Service Integration Matrix

### 2.1 Supabase

| Consumer Module | Operation | Table / API | Auth Required | Notes |
|---|---|---|---|---|
| Auth pages | `signInWithPassword`, `signUp`, `resetPasswordForEmail` | `auth.users` | No (pre-auth) | |
| `lib/supabase/server.ts` | `getUser()` | `auth.users` | Session cookie | Called on every server request needing identity |
| `lib/research/plan-enforcement.ts` | `SELECT` | `user_plans` | User session | RLS enforces `user_id = auth.uid()` |
| `app/api/research/route.ts` | `INSERT` | `research_requests` | User session | Saves each research run |
| `app/api/reports/route.ts` | `SELECT`, `INSERT` | `reports` | User session | |
| `app/api/account/export` | `SELECT` | `reports`, `research_requests`, `user_plans` | User session | |
| `app/api/account/delete` | `deleteUser()` | Admin API | Service role key | Cascades all app data via FK |
| `app/api/admin/users` | `SELECT` with join | `auth.users`, `user_plans`, `research_requests` | Service role key | |
| `app/api/admin/users/[id]/plan` | `UPSERT` | `user_plans` | Service role key | |
| `lib/admin/audit.ts` | `INSERT` | `audit_log` | Service role key | Best-effort; no throws on failure |

### 2.2 Prisma / PostgreSQL (via Supabase)

| Consumer Module | Operation | Model | Notes |
|---|---|---|---|
| `dashboard/layout.tsx` | `findUnique` | `User` | Check if Prisma bootstrap completed |
| `lib/prisma/init-user.ts` | `findUnique`, `create` (transaction) | `User`, `Workspace` | findOrCreate pattern |
| `app/api/intelligence` | `create` | `Report` | Saves legacy AI engine output |
| `app/api/reports` | `findMany`, `create` | `Report` | Report CRUD |
| `app/api/workspace` | `findUnique` | `Workspace` | Workspace info for settings page |
| `app/api/users/init` | delegates to `initUserFromSupabase` | `User`, `Workspace` | |

### 2.3 Upstash Redis

| Consumer Module | Operation | Key Pattern | TTL | Notes |
|---|---|---|---|---|
| `lib/research/rate-limit.ts` | Sliding window counter | `ratelimit:{userId}` | 1 hour | 5 req/hr limit |
| `app/api/users/init` | Sliding window counter | `ratelimit:users:init:{userId}` | 1 hour | Init endpoint rate limit |
| `services/legacy-ai-engine/orchestrator.ts` | `GET` / `SET` | `analysis:{hash}` | 24 hours | Cache full analysis response |

**Failure mode:** If Redis is unavailable, rate-limit calls throw an error. There is no graceful degradation — Redis connectivity is a hard dependency.

### 2.4 OpenAI

| Consumer Module | Model | Format | Max Tokens | Purpose |
|---|---|---|---|---|
| `services/legacy-ai-engine/providers/openai.provider.ts` | `gpt-4o-mini` | `json_object` | 8000 | Legacy AI engine — all 35 analysis types |
| `lib/research/acquisition/ai-analysis.ts` | `gpt-4o-mini` | JSON via prompt | ~2000 | Research engine — enrichment step |

**Failure mode:** Both usages throw on API error; errors propagate as HTTP 500.

### 2.5 SerpAPI

| Consumer Module | Search Type | Results | Purpose |
|---|---|---|---|
| `lib/research/acquisition/search-provider.ts` | `google` organic | Up to 10 per page | Lead Finder, Talent Finder, general research |

**Failure mode:** HTTP errors from SerpAPI are re-thrown; propagate as HTTP 500.

### 2.6 Apollo.io (Optional Enrichment)

| Consumer Module | Operation | Required | Notes |
|---|---|---|---|
| `lib/research/acquisition/research-service.ts` | Profile enrichment | No | No-ops when `APOLLO_API_KEY` is absent or empty |

### 2.7 Resend (Email)

| Consumer Module | Operation | Required | Notes |
|---|---|---|---|
| `app/demo/page.tsx` → API route | Send demo confirmation email | No | `RESEND_API_KEY` is empty string in production; no-ops gracefully |

---

## 3. Data Store Integration Matrix

### 3.1 Supabase Tables

| Table | Created by | Read by | Written by | RLS Policy |
|---|---|---|---|---|
| `auth.users` | Supabase Auth on signup | Dashboard layout, admin routes | Auth pages, admin delete | Built-in Supabase Auth RLS |
| `reports` | `supabase/reports-table.sql` | Reports page, account export | `/api/reports` POST, `/api/intelligence` | `auth.uid() = user_id` |
| `research_requests` | `supabase/research-tables.sql` | Analytics page, account export | `/api/research/*` | `auth.uid() = user_id` |
| `user_plans` | `supabase/plan-enforcement.sql` | Plan enforcement, settings, admin | Admin plan change PATCH | `auth.uid() = user_id` (read); service role (write) |
| `demo_leads` | `supabase/leads-table.sql` | (not read in app code) | Demo form submission | `auth.uid() = user_id` |
| `audit_log` | `supabase/audit-log.sql` | (not read in app code) | `lib/admin/audit.ts` | Service role only (write) |
| `usage_tracking` | `supabase/usage-tracking.sql` | (not read in app code) | (SQL trigger-based) | `auth.uid() = user_id` |

### 3.2 Prisma Models

| Model | Schema Location | Written by | Read by | Authoritative for |
|---|---|---|---|---|
| `User` | `prisma/schema.prisma` | `lib/prisma/init-user.ts` | Dashboard layout | User existence check; identity bootstrap |
| `Workspace` | `prisma/schema.prisma` | `lib/prisma/init-user.ts` | `/api/workspace` | Workspace name; legacy `plan` field (not enforced) |
| `Report` | `prisma/schema.prisma` | `/api/intelligence`, `/api/reports` | `/api/reports` GET | Legacy report storage |
| `ApiUsage` | `prisma/schema.prisma` | (not written in active code) | (not read in active code) | Unused — legacy model |

---

## 4. Page-to-API Integration

| Page | API Called | Method | Data Flow |
|---|---|---|---|
| `/login` | Supabase client (direct) | — | Client SDK, no custom API |
| `/signup` | Supabase client (direct) | — | Client SDK, no custom API |
| `/forgot-password` | Supabase client (direct) | — | Client SDK, no custom API |
| `/dashboard` | `/api/workspace`, Supabase (server) | GET | Plan, usage, quota |
| `/dashboard/onboarding` | `/api/users/init` | POST | Bootstrap Prisma user |
| `/dashboard/real-estate` | `/api/intelligence` | POST | Analysis request + response |
| `/dashboard/research` | (none — static hub) | — | Navigation only |
| `/dashboard/research/leads` | `/api/research/leads` | POST | Lead search |
| `/dashboard/research/talent` | `/api/research/talent` | POST | Talent search |
| `/dashboard/reports` | Supabase (server direct) | — | Server-rendered from Supabase |
| `/dashboard/analytics` | Supabase (server direct) | — | Server-rendered stats |
| `/dashboard/settings` | `/api/workspace`, Supabase (server) | GET | Plan + usage |
| `/dashboard/settings` (export) | `/api/account/export` | GET | JSON download |
| `/dashboard/settings` (delete) | `/api/account/delete` | DELETE | Cascade delete |
| `/dashboard/admin` | `/api/admin/users` | GET | User list + usage |
| `/dashboard/admin` (plan change) | `/api/admin/users/[id]/plan` | PATCH | Plan update |
| `components/sidebar` | `/api/admin/check` | GET | Show/hide admin link |

---

## 5. Decision Intelligence — Current Integration Gap

The Decision Intelligence Engine is a complete library with a clean public API (`lib/decision-intelligence/index.ts`). It is currently **not integrated** into any API route or page. The following table shows the integration points that do not yet exist:

| Planned Integration | Target Route | Engine Entry Point | Status |
|---|---|---|---|
| Real Estate Decision | `/api/intelligence` (or new route) | `runDecisionEngine()` | Not started |
| Lead Quality Decision | `/api/research/leads` | `runDecisionEngine()` | Not started |
| Talent Match Decision | `/api/research/talent` | `runDecisionEngine()` | Not started |
| Decision Persistence | New Supabase table | `UniversalDecisionReport` | Not started |
| Decision Report UI | New dashboard page | `UniversalDecisionReport` type | Not started |

---

## 6. Plan Enforcement Flow

```
Request → API route
             │
             ├─► checkRateLimit(userId)
             │      └─► Upstash Redis: sliding window
             │
             └─► checkPlanLimit(userId)
                    └─► Supabase: SELECT from user_plans WHERE user_id = $1
                           └─► PLAN_LIMITS[tier] from types/plan.types.ts
```

**Both checks are independent.** Rate limit fires first (5 req/hr). Plan limit fires second (monthly report count vs tier limit). Both return HTTP 402 or 429 on breach. Neither has automatic billing integration.

---

*Integration matrix produced 2026-07-21. Read-only assessment.*
