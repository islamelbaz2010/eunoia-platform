# ENGINEERING BASELINE v1.0
**Platform:** Eunoia Intelligence Platform (`eunoia-platform`)  
**Date:** 2026-07-30  
**Baseline commit:** `8dbd6df`  
**Status:** Phase 3 Complete — Phase 4 Ready  
**Purpose:** Authoritative snapshot of platform state at the end of Phase 3. All claims verified from live code.

---

## 1. Architecture

### Runtime Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js App Router | 16.2.12 | Turbopack in dev, Webpack in production |
| Language | TypeScript | 5.8.3 | Strict mode |
| Runtime | Node.js | ≥22 (Vercel default) | Fluid Compute |
| Auth | Supabase SSR | @supabase/ssr 0.5.2 | `updateSession()` pattern via root `middleware.ts` |
| Primary DB | Supabase PostgreSQL | Managed | 6 active tables |
| Secondary ORM | Prisma | 6.19.3 | `User`, `Workspace` models active; `Report`, `ApiUsage` legacy |
| Rate limiting | Upstash Redis | @upstash/ratelimit 2.0.5 | Fail-open on infrastructure error |
| AI inference | OpenAI | openai 4.96.2 | GPT-4o series; streaming for intelligence route |
| AI SDK | Vercel AI SDK | ai 4.3.19 | Direct dependency, currently zero imports in codebase |
| Email | Resend | resend 6.12.4 | Transactional only |
| Web search | SerpAPI | Direct HTTP | Via `lib/research/acquisition/search-provider.ts` |
| Lead data | Apollo.io | Direct HTTP | Via `lib/research/acquisition/apollo-adapter.ts` |
| UI library | Radix UI + Tailwind CSS v4 | Various | shadcn/ui component pattern |
| Deployment | Vercel (Fluid Compute) | — | Auto-deploys from `main` branch |

### Middleware

`middleware.ts` (repo root) — active as of commit `32b3e64`.

Executes on all non-static requests. Delegates to `lib/supabase/middleware.ts` `updateSession()` which:
- Refreshes Supabase session tokens (required by `@supabase/ssr`)
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` and `/signup` to `/dashboard`

Build confirmation: `middleware-manifest.json` → `"sortedMiddleware": ["/"]`

### Authentication Architecture

```
Browser → middleware.ts (updateSession) → Supabase JWT refresh
                                       ↓
                          app/dashboard/layout.tsx (per-layout guard)
                          → prisma.user.findUnique (workspace check)
                          → redirect to /onboarding if new user
```

Two-layer auth guard: middleware (global, stateless token refresh) + layout (per-route, DB-verified identity).

### Data Architecture

```
Supabase PostgreSQL (authoritative for user data)
├── auth.users            (managed by Supabase auth)
├── user_plans            (plan enforcement — authoritative)
├── research_requests     (request/queue lifecycle)
├── reports               (completed research outputs)
├── leads                 (demo leads table)
└── audit_log             (admin action log)

Prisma PostgreSQL (same DB, different access pattern)
├── User                  (mirrors Supabase auth.users ID + email)
├── Workspace             (workspace name, plan, ownerId)
├── Report (LEGACY)       (no active writes)
└── ApiUsage (LEGACY)     (no active writes)
```

### Plan Enforcement Architecture

```
Request → API route → checkPlanLimit(supabase, userId)
                      ├── Query user_plans (Supabase)
                      ├── Default to STARTER if no row
                      ├── ENTERPRISE: skip usage query, return unlimited
                      └── Other plans: COUNT research_requests this month
                          ├── ok: true → proceed
                          └── ok: false → 402 with plan label + limit info
```

Enforced on: `/api/research/leads`, `/api/research/talent`, `/api/intelligence`. Not on `/api/demo` (public demo, no auth).

---

## 2. Module Inventory

### Active — Production Code Path

| Module | Path | Purpose | Status |
|---|---|---|---|
| Supabase server client | `lib/supabase/server.ts` | SSR-safe Supabase client with cookie forwarding | Active |
| Supabase middleware | `lib/supabase/middleware.ts` | Session refresh, auth redirect logic | Active |
| Supabase admin client | `lib/supabase/admin.ts` | Service-role client (bypasses RLS) | Active |
| Supabase browser client | `lib/supabase/client.ts` | Client-side auth session | Active |
| Prisma client | `lib/prisma/client.ts` | Singleton Prisma client | Active |
| User init | `lib/prisma/init-user.ts` | Finds or creates User+Workspace on first login | Active |
| Redis client | `lib/redis/client.ts` | Lazy-init Upstash Redis client | Active |
| Redis cache | `lib/redis/cache.ts` | Typed cache helpers | Active |
| Plan enforcement | `lib/research/plan-enforcement.ts` | Monthly quota check via Supabase | Active |
| Rate limiter | `lib/research/rate-limit.ts` | Per-user sliding-window rate limiter via Redis | Active |
| API error handler | `lib/research/api-error.ts` | Structured 4xx/5xx responses with plan context | Active |
| Research acquisition | `lib/research/acquisition/` | Lead/talent search pipeline (6 files) | Active |
| Admin auth | `lib/admin/auth.ts` | Email-based admin authorization | Active |
| Admin audit | `lib/admin/audit.ts` | Writes to Supabase `audit_log` | Active |
| CSV export | `lib/csv-export.ts` | Report data serialization | Active |
| Utilities | `lib/utils.ts` | `cn()` class merger | Active |

### Active — Decision Intelligence Engine (Library Only — Not Integrated)

| File | Purpose |
|---|---|
| `lib/decision-intelligence/index.ts` | Public API — exports `runDecisionEngine()` and all types |
| `engine/decision-engine.ts` | Top-level orchestrator: accepts `DecisionEngineInput`, returns `DecisionEngineOutput` |
| `engine/confidence-engine.ts` | Computes `ConfidenceScore` (0–100) from evidence and rule outcomes |
| `engine/rules-engine.ts` | Evaluates `ValidationRule[]` against decision options |
| `engine/validation-engine.ts` | Structural validation pipeline for `Decision` input |
| `engine/explainability-engine.ts` | Generates human-readable rationale for recommendations |
| `evidence/evidence-collector.ts` | Normalises and deduplicated raw evidence from multiple sources |
| `evidence/evidence-weighter.ts` | Assigns confidence weights by source type and freshness |
| `types/` (7 files) | All type definitions: decision, evidence, confidence, validation, rules, explainability, report |

**Test coverage:** 6 test files, 61 tests — all passing.  
**Integration status:** Zero imports from any API route or UI component. Library is complete and correct; integration is Phase 4 work.

### Legacy — No Active Writes

| Module | Path | Status | Notes |
|---|---|---|---|
| Prisma Report model | `prisma/schema.prisma` | LEGACY | Historical data only — no writes since reporting moved to Supabase |
| Prisma ApiUsage model | `prisma/schema.prisma` | LEGACY | Historical data only |

---

## 3. Active API Routes

| Method | Path | Auth | Plan Gate | Purpose |
|---|---|---|---|---|
| `GET` | `/api/health` | None | None | Service health (DB, Supabase, Redis, OpenAI) |
| `POST` | `/api/users/init` | Supabase session | None | Create Prisma User+Workspace on first login |
| `GET` | `/api/workspace` | Supabase session | None | Fetch workspace + members |
| `POST` | `/api/intelligence` | Supabase session | ✓ STARTER/PRO/AGENCY/ENT | Market intelligence report (OpenAI streaming) |
| `POST` | `/api/research/leads` | Supabase session | ✓ STARTER/PRO/AGENCY/ENT | Lead finder (Apollo + SerpAPI + OpenAI) |
| `POST` | `/api/research/talent` | Supabase session | ✓ STARTER/PRO/AGENCY/ENT | Talent finder (SerpAPI + OpenAI) |
| `GET` | `/api/demo` | None | None | Public demo data (static) |
| `POST` | `/api/demo/generate` | None | None | Public demo generation |
| `GET` | `/api/admin/check` | Admin email | None | Admin status check |
| `GET` | `/api/admin/users` | Admin email | None | List all users with plans |
| `PATCH` | `/api/admin/users/[id]/plan` | Admin email | None | Update a user's plan |
| `GET` | `/api/account/export` | Supabase session | None | Export user data (GDPR) |
| `DELETE` | `/api/account/delete` | Supabase session | None | Delete account + data (GDPR) |
| `GET` | `/api/debug-env` | None | None | **Returns 404 — empty stub, remove in Phase 4** |

### Dashboard Pages

| Path | Auth | Purpose |
|---|---|---|
| `/dashboard` | Required | Usage overview + plan status |
| `/dashboard/analytics` | Required | Usage analytics |
| `/dashboard/research` | Required | Research hub entry |
| `/dashboard/research/leads` | Required | Lead finder UI |
| `/dashboard/research/talent` | Required | Talent finder UI |
| `/dashboard/real-estate` | Required | Real estate module UI |
| `/dashboard/reports` | Required | Report history |
| `/dashboard/settings` | Required | Account settings |
| `/dashboard/onboarding` | Required | New user onboarding |
| `/dashboard/admin` | Admin only | Admin console (users, plans, audit) |
| `/market-intelligence` | Public | Marketing landing page |
| `/demo` | Public | Live product demo |
| `/login`, `/signup`, `/forgot-password` | Public | Auth flows |
| `/privacy`, `/terms` | Public | Legal pages |

---

## 4. Integrations

| Service | Purpose | Credentials Required | Fail Behavior |
|---|---|---|---|
| **Supabase** | Auth, primary DB, RLS | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth fails → redirect to /login |
| **Prisma/PostgreSQL** | Workspace, user data | `DATABASE_URL`, `DIRECT_URL` | 500 on workspace routes |
| **OpenAI** | AI inference (research + intelligence) | `OPENAI_API_KEY` | 500 on AI routes |
| **Upstash Redis** | Rate limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Fail-open (requests proceed) |
| **SerpAPI** | Web search for research | `SERP_API_KEY` | Fail-open (quota logs warning) |
| **Apollo.io** | B2B lead data | `APOLLO_API_KEY` | Fail-open (returns empty results) |
| **Resend** | Transactional email | `RESEND_API_KEY` | Email not sent, no user impact |
| **Vercel** | Hosting, deployment, env vars | `VERCEL_OIDC_TOKEN` (auto-set) | N/A |
| **Cloudflare** | AI proxy (optional) | `CLOUDFLARE_WORKER_URL`, `AI_PROXY_URL` | Falls back to direct OpenAI |

**Integration status in `.env.local`:** All credentials are empty strings. The platform runs only in production (Vercel has the real credentials). Local development requires manual population of `.env.local` — see `OWNER_ACTIONS.md` ACTION-03.

---

## 5. Technical Debt

### Priority 1 — Immediate (Pre-Phase 4)

| Item | Location | Impact | Resolution |
|---|---|---|---|
| Anthropic key in git history | `a68f9d1^:test.php` | SECURITY — active credential | Revoke key (OWNER_ACTIONS ACTION-01) |
| `types/supabase.types.ts` is a stub | `types/supabase.types.ts` | `as any` casts in all research routes | Regenerate with live Supabase (ACTION-03) |
| `/api/debug-env` returns 404 | `app/api/debug-env/route.ts` | Dead endpoint in router | Remove in Phase 4 |
| No `.env.local` documentation | Root | Local dev non-functional | Document setup in CONTRIBUTING.md |

### Priority 2 — Phase 4

| Item | Location | Impact | Resolution |
|---|---|---|---|
| DI Engine not integrated | `lib/decision-intelligence/` | Core product value not delivered | Phase 4 primary objective |
| `Workspace.plan` always 'STARTER' | `lib/prisma/init-user.ts` | Prisma plan field is misleading — ignored by enforcement | Phase 4 or billing integration |
| `UniversalDecisionReport` missing `TrustScore` | `types/report.types.ts` | DI output incomplete per architecture spec | Phase 4 (add field before integration) |
| No CI/CD pre-deploy gate | Vercel config | Broken commits can reach production | Add Vercel build command: `typecheck && lint && test && build` |

### Priority 3 — Phase 5

| Item | Location | Impact | Resolution |
|---|---|---|---|
| No APM integration | Everywhere | Errors only visible in Vercel logs | Add Sentry or equivalent |
| No structured logging | Everywhere | `console.error()` only — no searchable log data | Add structured JSON logger |
| No CSP headers | `middleware.ts` / `next.config.ts` | XSS mitigation gap | Add via Next.js headers config |
| Audit log not monitored | `lib/admin/audit.ts` | Admin actions logged but no alerting | Add monitoring dashboard or webhook |
| Health endpoint not polled | `/api/health` | No uptime visibility | Add Checkly or UptimeRobot |
| Fail-open on all infrastructure | Multiple routes | Rate limit bypass on Redis failure | Add circuit breaker or alerting |

### Priority 4 — Phase 6 (Commercial)

| Item | Location | Impact | Resolution |
|---|---|---|---|
| No billing integration | Platform-wide | Cannot charge users | Billing provider decision (ACTION-04) |
| No self-service plan upgrade | Dashboard | Manual admin-only plan changes | Implement after billing provider chosen |
| Two plan models not unified | Prisma + Supabase | `Workspace.plan` and `user_plans` diverge | Unify via billing webhook |
| Supabase SQL scripts not versioned | `supabase/` | Manual deployment, no idempotency guarantee | Add migration versioning (Flyway, dbmate, or Supabase migrations) |

---

## 6. ADR Status

| ADR | Title | Status | Key Consequence |
|---|---|---|---|
| ADR-001 | Supabase as Primary Data Store | ACTIVE | All user data in Supabase; platform non-operational if Supabase unavailable |
| ADR-002 | Prisma as Secondary ORM | ACTIVE (partial) | Two data access patterns on same DB; `Workspace.plan` diverges from enforcement |
| ADR-003 | DI Engine as Pure-Function Library | ACTIVE | Engine is pure TypeScript; AI narration is a caller-side concern |
| ADR-004 | DVE as Independent Architectural Component | ACTIVE | Decision Validation Engine is a first-class component, not a module |
| ADR-005 | Platform Sells Validated Decisions | ACTIVE | Core value proposition: auditable decisions, not AI reports |
| ADR-PENDING-001 | Prisma plan vs Supabase user_plans unification | PENDING | Blocked on billing provider decision |
| ADR-PENDING-002 | Real Estate Route Integration Strategy | PENDING | Blocked on founder domain rules input |
| ADR-PENDING-003 | Billing Provider Selection | PENDING | Blocks commercial launch; see OWNER_ACTIONS ACTION-04 |

---

## 7. Production Status

**Production URL:** `https://intelligence.eunoiazones.com`  
**Deployment platform:** Vercel (Fluid Compute)  
**Auto-deploy:** `main` branch → production  

| Capability | Status | Evidence |
|---|---|---|
| Auth (login/signup) | ✅ Functional | `/dashboard` → 307 → `/login` → 200 (verified live) |
| Session management | ✅ Active | `middleware-manifest.json` confirms `sortedMiddleware: ["/"]` |
| Plan enforcement | ✅ Active | `checkPlanLimit()` called on all 3 research routes |
| Admin console | ✅ Functional | Plan CRUD, user list, audit log — verified in code |
| Research routes | ✅ Built | Leads, Talent, Intelligence — active and plan-gated |
| Real-time AI streaming | ✅ Built | Intelligence route uses OpenAI streaming |
| Health endpoint | ✅ Real | `/api/health` checks DB, Supabase, Redis, OpenAI |
| GDPR (export/delete) | ✅ Built | `/api/account/export` and `/api/account/delete` exist |
| DI Engine | ⚠️ Library only | Fully built (61 tests), not exposed to users |
| Billing | ❌ None | Manual plan assignment only |
| Local dev | ❌ Non-functional | `.env.local` has all credentials empty |

---

## 8. Release Readiness

### Current Test Coverage

| Metric | Value |
|---|---|
| Test files | 25 |
| Total tests | 202 |
| Test result | All passing |
| Typecheck errors | 0 |
| Lint warnings | 0 |
| Build result | PASS (33 routes) |

### Gate Checklist for Phase 4 Entry

- [x] Typecheck PASS
- [x] Lint PASS
- [x] 202 tests PASS
- [x] Build PASS
- [x] Middleware active (`sortedMiddleware: ["/"]`)
- [x] Phase reports in `docs/engineering/`
- [x] Dead files removed
- [x] Engineering baseline documented (this document)
- [ ] **Anthropic key revoked** (OWNER_ACTIONS ACTION-01)
- [ ] **DB migration applied** (OWNER_ACTIONS ACTION-02)
- [ ] **Supabase credentials provided** (OWNER_ACTIONS ACTION-03)
- [ ] **Supabase project identity confirmed** (OWNER_ACTIONS ACTION-05)

### Engineering Readiness Summary

| Dimension | Rating | Justification |
|---|---|---|
| Architecture | 7/10 | Sound; DI Engine library-only; dual plan models |
| Security | 6/10 | Auth active; exposed key in history is blocking item |
| Maintainability | 7/10 | 202 tests, 0 errors, clean codebase, EPOS governance |
| Production | 7/10 | Deployable; DB migration pending; no CI gate |
| Commercial | 5/10 | Plan enforcement works; no billing; DI not user-facing |
| Developer Experience | 4/10 | Local dev non-functional; no setup docs |
| Observability | 5/10 | Real health endpoint; no APM; no structured logging |
| **Overall** | **6/10** | Solid foundation; known gaps are documented and owned |
