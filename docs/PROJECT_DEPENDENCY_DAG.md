# Project Dependency DAG

**Date:** 2026-07-21  
**Purpose:** Every module, every dependency, every downstream consumer. Used to reason about: what must change before X can be built; what breaks if Y is removed or changed.

**Source:** Direct repository inspection. All claims verifiable.

---

## Module Registry

| ID | Module | Location | Status |
|---|---|---|---|
| M01 | Supabase (Auth + DB) | External service | DELETED |
| M02 | Upstash Redis | External service | UNKNOWN |
| M03 | OpenAI GPT-4o-mini | External service | UNKNOWN |
| M04 | SerpAPI | External service | UNKNOWN |
| M05 | Apollo.io | External service | ABSENT (optional) |
| M06 | Resend | External service | KEY EMPTY |
| M07 | Next.js App Router | Framework | LIVE |
| M08 | Root Middleware | `middleware.ts` (missing: `proxy.ts`) | DEAD CODE |
| M09 | Authentication (Supabase Auth) | `app/(auth)/` + `app/auth/callback/` | BLOCKED on M01 |
| M10 | Onboarding Flow | `app/(app)/onboarding/` | BLOCKED on M09 |
| M11 | Dashboard | `app/(app)/dashboard/` | BLOCKED on M09 |
| M12 | Real Estate Intelligence UI | `app/(app)/intelligence/` | BLOCKED on M09 |
| M13 | Lead Finder UI | `app/(app)/leads/` | BLOCKED on M09 |
| M14 | Talent Finder UI | `app/(app)/talent/` | BLOCKED on M09 |
| M15 | Report History UI | `app/(app)/reports/` | BLOCKED on M09 |
| M16 | Settings UI | `app/(app)/settings/` | BLOCKED on M09 |
| M17 | Admin Console UI | `app/(admin)/` | BLOCKED on M09 |
| M18 | Public Demo UI | `app/(public)/demo/` | PARTIAL |
| M19 | Legal Pages | `app/(public)/privacy/`, `app/(public)/terms/` | PLACEHOLDER |
| M20 | Intelligence API Route | `app/api/intelligence/route.ts` | BLOCKED on M01 |
| M21 | Legacy AI Engine | `services/legacy-ai-engine/` | BLOCKED on M03 + M20 |
| M22 | Research Leads API | `app/api/research/leads/route.ts` | BLOCKED on M01, M04 |
| M23 | Research Talent API | `app/api/research/talent/route.ts` | BLOCKED on M01, M04 |
| M24 | Demo API Route | `app/api/demo/route.ts` | PARTIAL (M06 empty) |
| M25 | Demo Generate API | `app/api/demo/generate/route.ts` | BLOCKED on M03 |
| M26 | Admin Users API | `app/api/admin/users/` | BLOCKED on M01 |
| M27 | Account API | `app/api/account/` | BLOCKED on M01 |
| M28 | Health Check | `app/api/health/route.ts` | LIVE |
| M29 | Prisma ORM | `prisma/schema.prisma` | BLOCKED on M01 |
| M30 | Supabase Types | `types/supabase.types.ts` | STUB |
| M31 | Plan Enforcement | `lib/research/plan-enforcement.ts` | PARTIAL (M22/M23 only) |
| M32 | Rate Limiting | `lib/redis/` + `lib/research/rate-limit.ts` | BLOCKED on M02 |
| M33 | SerpAPI Quota | `lib/research/acquisition/quota.ts` | BLOCKED on M02 |
| M34 | Research Pipeline | `lib/research/` (~20 modules) | BLOCKED on M04 |
| M35 | Decision Intelligence Engine | `lib/decision-intelligence/` | COMPLETE (unintegrated) |
| M36 | Billing | Not built | NOT STARTED |
| M37 | APM / Logging | Not built | NOT STARTED |
| M38 | Email Notifications | Not built | BLOCKED on M06 |
| M39 | Supabase Type Generator | `npx supabase gen types` | BLOCKED on M01 |
| M40 | DI Integration (Real Estate) | Not built | BLOCKED on M35 + M20 |
| M41 | DI Integration (Leads) | Not built | BLOCKED on M35 + M22 |
| M42 | DI Integration (Talent) | Not built | BLOCKED on M35 + M23 |

---

## Dependency Graph (What Each Module Needs)

### Infrastructure Layer

```
M01 Supabase
  ← no dependencies (external service; must be created)

M02 Upstash Redis
  ← no dependencies (external service; must be configured)

M03 OpenAI GPT-4o-mini
  ← no dependencies (external service; API key required)

M04 SerpAPI
  ← no dependencies (external service; API key required)

M05 Apollo.io
  ← no dependencies (external service; optional)

M06 Resend
  ← no dependencies (external service; API key + domain verification required)
```

### Application Core

```
M07 Next.js App Router
  ← no dependencies

M08 Root Middleware (currently dead: proxy.ts)
  ← M01 (session refresh requires Supabase client)
  ← M07

M09 Authentication
  ← M01 (Supabase Auth)
  ← M08 (middleware must run for session refresh)
  ← M07

M10 Onboarding
  ← M09
  ← M29 (Prisma: creates User + Workspace on completion)

M11 Dashboard
  ← M09
  ← M01 (fetches usage_tracking)

M29 Prisma ORM
  ← M01 (same PostgreSQL database)
```

### API Routes

```
M20 Intelligence API
  ← M09 (auth check)
  ← M01 (writes reports table)
  ← M21 (legacy AI engine for AI analysis)
  ← M31 (plan enforcement)
  ← M32 (rate limiting)
  [MISSING: plan limit not currently enforced here — see DEBT-009]

M21 Legacy AI Engine
  ← M03 (OpenAI)
  ← M20 (called from intelligence route)
  ← CLOUDFLARE_WORKER_URL env var (fallback proxy)

M22 Research Leads API
  ← M09 (auth check)
  ← M01 (writes research_requests)
  ← M34 (research pipeline)
  ← M31 (plan enforcement: enforced here)
  ← M32 (rate limiting: enforced here)
  ← M33 (SerpAPI quota: enforced here)

M23 Research Talent API
  ← M09
  ← M01
  ← M34
  ← M31
  ← M32
  ← M33

M24 Demo API
  ← M01 (writes demo_leads via service role)
  ← M06 (Resend email — fails silently if key empty)
  [no auth required: public route]

M25 Demo Generate API
  ← M03 (OpenAI via AI_PROXY_URL)
  [no auth required: public route]

M26 Admin Users API
  ← M09 (auth check + admin email check)
  ← M01 (reads/writes user data)
  ← SUPABASE_SERVICE_ROLE_KEY env var

M27 Account API
  ← M09 (auth check)
  ← M01 (reads/deletes user data)
  ← SUPABASE_SERVICE_ROLE_KEY env var (for deletion cascade)
```

### Library Layer

```
M31 Plan Enforcement
  ← M01 (reads user_plans table)
  ← M30 (Supabase types — currently stub)

M32 Rate Limiting
  ← M02 (Upstash Redis)

M33 SerpAPI Quota
  ← M02 (Redis for global quota counter)
  ← M04 (SerpAPI as the guarded resource)

M34 Research Pipeline
  ← M04 (SerpAPI for web search)
  ← M03 (OpenAI for AI analysis step in research)
  ← M05 (Apollo.io for enrichment — optional, no-ops without key)
  ← M32 (rate limiting applied inside pipeline)
  ← M33 (quota applied inside pipeline)

M35 Decision Intelligence Engine
  ← no runtime dependencies (pure TypeScript functions, no I/O)
  ← M03 only at narration layer (not yet built)

M36 Billing
  ← M09 (user identity)
  ← M01 (writes user_plans on webhook)
  ← Stripe (external payment provider — not yet integrated)

M38 Email Notifications
  ← M06 (Resend)
  ← M01 (user email from auth.users)

M39 Supabase Type Generator
  ← M01 (reads schema from live project)
```

### Decision Intelligence Integration Layer (Not Built)

```
M40 DI Real Estate Integration
  ← M35 (Decision Intelligence Engine)
  ← M20 (Intelligence API route — DI runs after legacy AI analysis)
  ← M01 (persist decision to decisions table)
  ← M03 (AI narration: post-scoring GPT-4o-mini call)
  ← Real Estate business rules (not defined)
  ← Data adapter: legacy output → DecisionEngineInput (not written)

M41 DI Leads Integration
  ← M35
  ← M22
  ← M01
  ← M03
  ← Lead Finder business rules (not defined)
  ← Data adapter: research output → DecisionEngineInput (not written)

M42 DI Talent Integration
  ← M35
  ← M23
  ← M01
  ← M03
  ← Talent Finder business rules (not defined)
  ← Data adapter: research output → DecisionEngineInput (not written)
```

---

## Reverse Dependency Graph (What Breaks If X Disappears)

This table answers: "If I remove or change X, what else is affected?"

### If M01 (Supabase) is removed or deleted:

AFFECTED — ALL authenticated routes stop functioning:
- M09 (Authentication) — cannot create/verify sessions
- M10 (Onboarding) — cannot create User/Workspace records
- M11 (Dashboard) — cannot load usage data
- M20 (Intelligence API) — cannot save reports
- M22 (Research Leads API) — cannot save research_requests or check plan limits
- M23 (Research Talent API) — same
- M26 (Admin Users API) — cannot read/write user data
- M27 (Account API) — cannot export or delete account
- M29 (Prisma ORM) — database connection fails
- M31 (Plan Enforcement) — cannot read user_plans
- M40, M41, M42 (DI Integrations) — cannot persist decisions

**This already happened.** This is the current state of the platform. See `docs/PLATFORM_STATE_ASSESSMENT.md`.

---

### If M02 (Upstash Redis) fails:

AFFECTED:
- M32 (Rate Limiting) — rate limiting disabled; all users have unlimited requests
- M33 (SerpAPI Quota) — daily quota removed; SerpAPI may be exhausted
- M22, M23 (Research routes) — quota enforcement fails; fail-open behavior

NOT AFFECTED: Authentication, Dashboard, Intelligence (legacy AI), Admin, Billing

---

### If M03 (OpenAI) fails:

AFFECTED:
- M21 (Legacy AI Engine) — no AI analysis in Real Estate
- M25 (Demo Generate) — demo report generation fails
- Research pipeline AI analysis step (inside M34)
- M40, M41, M42 (AI narration layer — when built)

NOT AFFECTED: Authentication, Dashboard, Lead Finder search step (SerpAPI only), Plan Enforcement, Billing

---

### If M04 (SerpAPI) fails:

AFFECTED:
- M34 (Research Pipeline) — no web search → no leads or talent results
- M22 (Research Leads API) — returns empty or error
- M23 (Research Talent API) — returns empty or error

NOT AFFECTED: Authentication, Dashboard, Intelligence (Real Estate), Admin, Billing

---

### If M08 (Root Middleware) is missing (current state):

AFFECTED:
- Session refresh on every request — not happening
- `/dashboard` and all protected routes rely solely on layout server component auth check
- Attacker who obtains a stale JWT can access protected routes until token expires

NOT AFFECTED: Individual route-level auth (each route still checks session independently)

---

### If M35 (Decision Intelligence Engine) is changed:

AFFECTED (when built):
- M40, M41, M42 (DI Integrations) — all callers use the `runDecisionEngine()` public API

NOT AFFECTED: Authentication, Legacy AI Engine, Research Pipeline, Billing

**Risk:** The engine has 61 tests. Changes that break tests will break future integration. The pure-function design means no other module currently depends on it — safe to change in isolation.

---

### If M21 (Legacy AI Engine) is deprecated:

AFFECTED:
- M20 (Intelligence API) — needs replacement AI analysis layer; DI narration layer would replace this
- M12 (Real Estate Intelligence UI) — would need to render DI output instead of legacy AI text

NOT AFFECTED: Research pipeline, Lead Finder, Talent Finder, Billing, Auth

**This is the intended future state:** DI integration (M40) replaces M21 for Real Estate. Sprint 10 in `docs/CRITICAL_PATH.md` retires M21 after all modules are DI-integrated.

---

### If M36 (Billing) is removed:

AFFECTED:
- Platform cannot accept payment
- Plan upgrades require manual operator action (Admin Console)

NOT AFFECTED: Platform functionality for existing users; research; DI engine

---

## Critical Single Points of Failure

| Module | SPoF Severity | Mitigation |
|---|---|---|
| M01 Supabase | CATASTROPHIC | Already failed. Restore + enable PITR (Point-in-Time Recovery) in Supabase settings |
| M03 OpenAI | HIGH — affects AI features | Vercel AI SDK supports multi-provider failover; could add Anthropic fallback |
| M04 SerpAPI | HIGH — affects all research | Consider Apollo as backup; DI engine can degrade gracefully without search step |
| M02 Upstash Redis | MEDIUM — rate limiting fails open | Redis cluster mode or Upstash replica |
| M08 Middleware (missing) | MEDIUM — session security | Fix: rename proxy.ts → middleware.ts (trivial code change) |

---

## Build Order (From Zero)

If rebuilding from scratch, the correct build order is:

1. M01 (Supabase) — all else depends on this
2. M29 (Prisma) — same database, configure after M01
3. M30 (Supabase Types) — generate after M01 schema is applied
4. M08 (Root Middleware) — must exist before auth is tested
5. M09 (Authentication) — session management
6. M10 (Onboarding) — creates Prisma records
7. M02 (Upstash Redis) — rate limiting
8. M32 (Rate Limiting library) — depends on M02
9. M31 (Plan Enforcement) — depends on M01
10. M04 (SerpAPI) — research inputs
11. M34 (Research Pipeline) — depends on M04, M32
12. M33 (SerpAPI Quota) — depends on M02
13. M22, M23 (Research APIs) — depends on M34, M31, M32, M33
14. M03 (OpenAI) — AI features
15. M21 (Legacy AI Engine) — depends on M03
16. M20 (Intelligence API) — depends on M21, M31
17. M35 (Decision Intelligence Engine) — pure functions, no runtime deps
18. M40 (DI Real Estate) — depends on M35, M20, M01
19. M06 (Resend) — email
20. M36 (Billing) — self-serve revenue
21. M41, M42 (DI Leads, DI Talent) — post-MVP DI expansion

---

*DAG produced 2026-07-21. Read-only assessment — no code changes made.*
