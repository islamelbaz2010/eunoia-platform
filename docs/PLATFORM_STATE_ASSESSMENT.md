# Platform State Assessment

**Date:** 2026-07-21  
**Scope:** Complete read-only technical assessment of the Eunoia Platform repository.  
**Status:** Assessment only — no code modifications.

---

## 1. Executive Summary

The Eunoia Platform is a Next.js 16 / React 19 SaaS application deployed on Vercel at `intelligence.eunoiazones.com`. The platform provides AI-powered business intelligence for the Egypt and MENA market, with modules for general market research, real estate feasibility analysis, lead discovery, and talent search.

**Overall platform health:** Partial. The application code is complete and production-quality across its implemented scope. The platform is currently non-operational due to a deleted Supabase project (infrastructure failure, not a code failure). No application code changes are required to restore operation — only infrastructure provisioning and environment variable configuration.

---

## 2. Operational Status

| Area | Status | Notes |
|---|---|---|
| Authentication | Non-operational | Supabase project `mickjkhjjmskoswqatpl` deleted; DNS NXDOMAIN |
| Dashboard | Non-operational | Depends on Supabase auth |
| Real Estate Analysis | Non-operational | Depends on Supabase auth + OpenAI key |
| Lead Finder | Non-operational | Depends on Supabase auth + SerpAPI key |
| Talent Finder | Non-operational | Depends on Supabase auth + SerpAPI key |
| Research Engine | Non-operational | Depends on Supabase auth + OpenAI key + SerpAPI key |
| Admin Console | Non-operational | Depends on Supabase auth + `SUPABASE_SERVICE_ROLE_KEY` |
| Decision Intelligence Engine | Not integrated | Library is complete; not wired to any route |
| Health endpoint `/api/health` | Operational (no auth) | Returns `{ ok: true }` |
| Demo landing `/demo` | Conditionally operational | Static page; email send requires Resend key |
| Privacy `/privacy`, Terms `/terms` | Operational | Static pages; no auth required |

---

## 3. Infrastructure State

### 3.1 Supabase (Primary Data Store)

- **Project ID:** `mickjkhjjmskoswqatpl` — **DELETED**
- **DNS:** Returns NXDOMAIN for `mickjkhjjmskoswqatpl.supabase.co`
- **Impact:** All authentication, session management, and data persistence are offline
- **Required action:** Create a new Supabase project, update env vars in Vercel (all 3 environments), re-run all SQL migrations

### 3.2 Vercel (Deployment)

- **Project:** `eunoia-platform` under team `islam-elbaz-s-projects`
- **Production URL:** `intelligence.eunoiazones.com`
- **Deployment status:** Unknown — last deploy may reference deleted Supabase project
- **Environment variables:** Only `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `RESEND_API_KEY` (empty) confirmed in production pull. Missing: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `SERPAPI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_EMAILS`

### 3.3 Prisma / PostgreSQL

- **Connection:** Points to Supabase-managed PostgreSQL via `DATABASE_URL` (pgBouncer transaction mode) and `DIRECT_URL` (direct connection)
- **Status:** Offline (Supabase deleted)
- **Schema:** 4 models — User, Workspace, Report, ApiUsage — all in `lib/prisma/generated/`

### 3.4 Upstash Redis

- **Purpose:** Rate limiting (5 req/hr per user) and 24-hour research result cache
- **Status:** Unknown (credentials not confirmed in environment)
- **Fallback behavior:** `checkRateLimit` will throw if Redis is unreachable; no graceful degradation path

### 3.5 External APIs

| API | Purpose | Key Present | Fallback |
|---|---|---|---|
| OpenAI GPT-4o-mini | AI analysis (both engines) | Unknown | Hard failure |
| SerpAPI | Lead/Talent Finder search | Unknown | Hard failure |
| Apollo.io | Lead enrichment | Unknown | No-ops gracefully |
| Resend | Demo email | Empty string | No-ops gracefully |

---

## 4. Application Code State

### 4.1 TypeScript Health

- **TypeScript version:** 5.8
- **Strict mode:** Enabled
- **Last verified typecheck:** Passing (0 errors)
- **Notable:** `types/supabase.types.ts` is a stub — all Supabase table types are `Record<string, unknown>` rather than generated from the actual schema

### 4.2 Test Coverage

- **Test framework:** Vitest
- **Test files:** 25
- **Total tests:** 194 (all passing)
- **Coverage areas:** Plan enforcement, rate limiting, research service, AI analysis, search provider, evidence engine, confidence engine, rules engine, validation engine, decision engine
- **Not covered:** All UI page components, API route handlers, Supabase client interactions, Prisma ORM calls, admin console

### 4.3 Build Health

- **Last verified build:** Passing
- **Warning (pre-existing):** Turbopack/Prisma file tracing warning — does not affect runtime

### 4.4 Lint Health

- **ESLint:** Configured for Next.js 16 / ESLint 9 flat config
- **Last verified lint:** Passing

---

## 5. Feature Completeness

### 5.1 Implemented and Functional (when infrastructure is online)

- **Authentication:** Login, signup, forgot password via Supabase Auth (email/password)
- **Onboarding:** 2-step flow — workspace setup → product tour
- **Dashboard home:** Monthly usage display, quota warning banner (≥80% / 100%)
- **Market Research:** Legacy AI engine via `/api/intelligence` — 35 analysis types
- **Real Estate Analysis:** Dedicated module with Egypt/MENA sector data
- **Lead Finder:** SerpAPI-powered search with quota enforcement and upgrade CTA
- **Talent Finder:** SerpAPI-powered search with quota enforcement and upgrade CTA
- **Report History:** Failed-request visibility and retry prefill links
- **Analytics:** Server-rendered live research activity stats
- **Settings:** Plan display, usage display, Download My Data, Delete Account
- **Admin Console:** User list, plan filter, plan change with audit log
- **Account Export:** Full JSON download of reports, research, plan
- **Account Deletion:** Cascade delete via Supabase admin API
- **Plan Enforcement:** Monthly report limits enforced server-side per plan tier
- **Rate Limiting:** 5 requests/hour per user via Upstash Redis
- **Health Endpoint:** `/api/health` for uptime monitoring
- **Legal Pages:** `/privacy`, `/terms` (placeholder content, awaiting legal review)

### 5.2 Implemented but NOT Integrated

- **Decision Intelligence Engine (`lib/decision-intelligence/`):** Complete 15-file library with type system, evidence subsystem, confidence engine, rules engine, validation engine, explainability engine, and decision orchestrator. Not connected to any API route or UI page.

### 5.3 Not Implemented

- **Billing:** No payment provider. Plan changes are admin-only (manual). Upgrade CTAs link to placeholder.
- **Email Notifications:** Resend key is empty; no transactional emails sent to users.
- **APM / Structured Logging:** No error monitoring or observability integration.
- **Supabase Type Generation:** `types/supabase.types.ts` is a hand-written stub.
- **Session Refresh Middleware:** No root `middleware.ts`; sessions are not refreshed on every request.
- **i18n:** `next-intl` is installed and configured, but `messages` object is empty — no translations exist.

---

## 6. Plan Architecture

The platform uses a **two-model plan architecture**:

| Layer | Source | Purpose |
|---|---|---|
| `user_plans` Supabase table | Live enforcement | Plan tier stored per user; RLS enforced |
| `Workspace.plan` Prisma field | Legacy bootstrap | Set to `'STARTER'` on workspace creation; not used for enforcement |
| `types/plan.types.ts` | Authoritative constants | `PLAN_LIMITS`, `PLAN_LABELS`, `PLAN_NAMES` |

The enforcement path is: API route → `checkPlanLimit()` → reads `user_plans` via Supabase client → compares against `PLAN_LIMITS` from `types/plan.types.ts`. The Prisma `Workspace.plan` field is not read during enforcement.

---

## 7. Security Assessment

| Area | Finding | Severity |
|---|---|---|
| Admin identity | `ADMIN_EMAILS` env var (comma-separated) — no database role separation | Low |
| Session refresh | No root `middleware.ts` — session tokens not refreshed on idle navigation | Medium |
| Supabase types stub | `Record<string, unknown>` for all table types — no compile-time schema safety | Low |
| RLS | All Supabase tables have RLS enforcing `auth.uid() = user_id` | Compliant |
| Service role key | `SUPABASE_SERVICE_ROLE_KEY` used only in server-side admin routes | Compliant |
| Rate limiting | 5 req/hr per user enforced via Redis — no IP-level limiting | Low |
| Input validation | No Zod schemas at API boundaries — inputs are parsed and trusted without schema validation | Medium |

---

## 8. Recovery Checklist (Infrastructure)

To restore full platform operation:

1. Create a new Supabase project
2. Note the new project URL, anon key, service role key, and database connection strings
3. Run SQL migrations in the Supabase SQL editor (in order):
   - `supabase/reports-table.sql`
   - `supabase/research-tables.sql`
   - `supabase/plan-enforcement.sql`
   - `supabase/leads-table.sql`
   - `supabase/audit-log.sql`
   - `supabase/usage-tracking.sql`
4. Update Vercel env vars for all 3 environments (Production, Preview, Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `DATABASE_URL` (pgBouncer transaction mode URL)
   - `DIRECT_URL` (direct connection URL)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `SERPAPI_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ADMIN_EMAILS` (comma-separated)
5. Fill in `.env.local` for local development
6. Run `npx prisma db push` or `npx prisma migrate deploy` against the new database
7. Redeploy the Vercel project

---

## 9. Recommendations (Priority Order)

These are observations only — implementation is out of scope for this assessment.

1. **Restore Supabase infrastructure** — Highest priority; blocks everything else.
2. **Add root `middleware.ts`** — Wraps `updateSession()` from `lib/supabase/middleware.ts` to refresh session tokens on every request.
3. **Generate Supabase types** — Run `supabase gen types typescript` to replace the stub in `types/supabase.types.ts`.
4. **Integrate Decision Intelligence Engine** — The library is complete; wire it into at least one module (Real Estate is the most natural fit).
5. **Add Zod validation** at API route boundaries.
6. **Choose billing provider** — Stripe is the standard choice; hooks exist for the upgrade CTA flow.
7. **Add structured error monitoring** — Sentry or equivalent.
8. **Legal review** — Update `/privacy` and `/terms` placeholder content.

---

*Assessment produced 2026-07-21. Read-only — no files modified during this assessment.*
