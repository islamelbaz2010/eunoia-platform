# Technical Debt Register

**Date:** 2026-07-21  
**Purpose:** Catalogue of known technical debt items, gaps, and deferred work. Items are scored by impact and effort. This register is for awareness — no implementation is authorized by this document.

---

## Scoring

**Impact:** How much does this hurt the platform right now?  
**Effort:** How much work to resolve?  
H = High / M = Medium / L = Low

---

## 1. Critical Infrastructure Debt

### DEBT-001 — Supabase Project Deleted

| Field | Value |
|---|---|
| Area | Infrastructure |
| Impact | H — platform entirely non-operational |
| Effort | M — requires provisioning, SQL migration, and env var propagation |
| Status | Unresolved |
| Description | The Supabase project `mickjkhjjmskoswqatpl` has been deleted. DNS returns NXDOMAIN. All authentication, session management, and Supabase data persistence are offline. |
| Resolution | Create new Supabase project, run 6 SQL migrations, update Vercel env vars for all 3 environments, redeploy |

### DEBT-002 — Missing Root Middleware

| Field | Value |
|---|---|
| Area | Authentication |
| Impact | M — sessions can expire during idle navigation without being refreshed |
| Effort | L — ~10 lines; `updateSession()` already exists in `lib/supabase/middleware.ts` |
| Status | Unresolved |
| Description | Next.js requires a root `middleware.ts` to call `updateSession()` on every request. Without it, Supabase session tokens are only refreshed when the dashboard layout server component runs. If a user navigates using client-side routing (no full page load), sessions can expire silently. |
| Resolution | Add `middleware.ts` at repo root that calls `updateSession()` from `lib/supabase/middleware.ts` |

---

## 2. Type Safety Debt

### DEBT-003 — Supabase Types Stub

| Field | Value |
|---|---|
| Area | Type Safety |
| Impact | M — no compile-time validation of Supabase table schemas |
| Effort | L — `supabase gen types typescript` generates the file automatically |
| Status | Unresolved |
| Description | `types/supabase.types.ts` declares all tables, views, functions, and enums as `Record<string, unknown>`. This means the TypeScript compiler cannot catch column name typos, missing fields, or schema mismatches in Supabase client calls. |
| Resolution | After Supabase project is restored, run `npx supabase gen types typescript --project-id <id> > types/supabase.types.ts` |

### DEBT-004 — No Zod Validation at API Boundaries

| Field | Value |
|---|---|
| Area | Input Validation |
| Impact | M — malformed requests may cause unexpected behavior or expose stack traces |
| Effort | M — requires adding Zod schemas to each API route handler |
| Status | Unresolved |
| Description | API route handlers parse request bodies with `req.json()` and access properties directly without schema validation. There are no Zod (or equivalent) schemas enforcing the shape of incoming request data. |
| Resolution | Add Zod schemas for each API route's expected body; validate with `schema.safeParse()` before using data |

---

## 3. Architecture Debt

### DEBT-005 — Decision Intelligence Engine Not Integrated

| Field | Value |
|---|---|
| Area | Architecture |
| Impact | H — the core product feature is implemented but produces no user value |
| Effort | H — requires route wiring, persistence table, and UI component |
| Status | Unresolved (intentionally deferred) |
| Description | `lib/decision-intelligence/` is a complete 15-file library with 61 passing tests. It is not connected to any API route or UI page. The platform still runs the Legacy AI Engine for all analysis. The Decision Intelligence Engine is the intended replacement and product differentiator. |
| Resolution | (1) Wire `runDecisionEngine()` into at least one module (Real Estate is the best candidate). (2) Create a Supabase table for `decisions` and `reports`. (3) Build a `DecisionReportCard` UI component consuming `UniversalDecisionReport`. (4) Add AI narration layer: GPT-4o-mini enriches `aiAnalysis` on options after rule scores are computed. |

### DEBT-006 — Legacy AI Engine Still Active

| Field | Value |
|---|---|
| Area | Architecture |
| Impact | M — dual-engine complexity; legacy engine has no explainability |
| Effort | H — requires migrating all 35 analysis types to the Decision Intelligence framework |
| Status | Unresolved (intentionally deferred) |
| Description | `services/legacy-ai-engine/` with 35 prompt files, an orchestrator, and an OpenAI provider is still the active engine for the Market Research and Real Estate modules. It generates unstructured AI text with no evidence model, no confidence scoring, no business rules, and no explainability. |
| Resolution | After Decision Intelligence integration is complete, migrate each analysis type module-by-module and deprecate the legacy engine |

### DEBT-007 — Two-Model Plan Architecture

| Field | Value |
|---|---|
| Area | Data Architecture |
| Impact | L — risk of divergence between Prisma `Workspace.plan` and Supabase `user_plans` |
| Effort | M — requires deprecating `Workspace.plan` from enforcement paths and removing it from the schema |
| Status | Unresolved (documented, low urgency) |
| Description | Plan tier is stored in two places: `Workspace.plan` (Prisma, set at bootstrap, not used for enforcement) and `user_plans` (Supabase, live enforcement). The Prisma field always reads `'STARTER'` regardless of the user's actual plan. If any code path accidentally reads `Workspace.plan` for enforcement, it will wrongly apply STARTER limits to all users. |
| Resolution | Add a Prisma migration to remove `Workspace.plan`; remove the field from the schema and the `initUserFromSupabase` call |

### DEBT-008 — No Session Middleware + No Route Protection

| Field | Value |
|---|---|
| Area | Security / Architecture |
| Impact | M — dashboard protection relies solely on the layout server component |
| Effort | L — add middleware to protect the `/dashboard` route prefix |
| Status | Unresolved |
| Description | Without a root `middleware.ts`, the only protection for `/dashboard/*` routes is the check inside `app/dashboard/layout.tsx`. API routes that require authentication rely on each route individually calling `supabase.auth.getUser()`. There is no centralised enforcement at the middleware layer. |
| Resolution | Root middleware that (1) calls `updateSession()` and (2) redirects unauthenticated requests to `/login` for the `/dashboard/*` prefix |

---

## 4. Test Coverage Debt

### DEBT-009 — Zero Coverage for API Routes

| Field | Value |
|---|---|
| Area | Testing |
| Impact | M — regressions in API logic are not caught automatically |
| Effort | H — requires test harness setup (mock Supabase, mock Prisma, mock Redis) |
| Status | Unresolved |
| Description | All 15 API route handlers have zero test coverage. The 25 existing test files cover only library code (plan enforcement, rate limiting, research service, decision intelligence). Any regression in an API route is only detectable at runtime. |
| Resolution | Add integration tests for at minimum: `/api/intelligence`, `/api/research/*`, `/api/account/export`, `/api/account/delete`, `/api/admin/users` |

### DEBT-010 — Zero Coverage for UI Components

| Field | Value |
|---|---|
| Area | Testing |
| Impact | L — UI regressions are not caught automatically |
| Effort | H — requires Playwright or similar E2E setup |
| Status | Unresolved |
| Description | No page components, client components, or UI utilities have tests. Dashboard pages, the sidebar, onboarding flow, admin console, and account actions are all untested. |
| Resolution | Add Playwright E2E tests for critical paths: login → dashboard → research → report history → settings |

---

## 5. Operational Debt

### DEBT-011 — No Billing Provider

| Field | Value |
|---|---|
| Area | Commercial |
| Impact | H — no self-serve revenue path exists |
| Effort | H — requires Stripe integration, checkout session, webhook handler, and `user_plans` write |
| Status | BLOCKED — awaiting provider decision |
| Description | Upgrade CTAs exist in the UI (quota warning banner, Lead Finder, Talent Finder) but link to placeholder. Plan changes can only be made by an admin via the Admin Console. There is no self-serve upgrade or payment flow. |
| Resolution | Integrate Stripe: checkout session → webhook → UPSERT `user_plans` → confirm in UI |

### DEBT-012 — No Structured Error Monitoring

| Field | Value |
|---|---|
| Area | Operations |
| Impact | M — production errors are only visible in Vercel function logs |
| Effort | M — Sentry setup is ~1 day including SDK init and source maps |
| Status | BLOCKED — awaiting provider decision |
| Description | There is no APM or error monitoring integration. All errors surface only in Vercel's runtime log viewer. No alerting, grouping, or stack trace aggregation exists. |
| Resolution | Add Sentry (or equivalent): `@sentry/nextjs` with source map upload in CI |

### DEBT-013 — No Transactional Email

| Field | Value |
|---|---|
| Area | Operations |
| Impact | M — no automated user communications (welcome, quota warnings, plan confirmations) |
| Effort | M — Resend SDK is already installed; key is empty |
| Status | BLOCKED — awaiting sender domain and notification policy decision |
| Description | `RESEND_API_KEY` is an empty string. The demo email form uses Resend but it silently no-ops. No welcome email on signup, no quota warning email, no plan change confirmation. |
| Resolution | Verify sender domain in Resend, set `RESEND_API_KEY` in Vercel, implement email templates for core lifecycle events |

### DEBT-014 — Legal Placeholder Content

| Field | Value |
|---|---|
| Area | Compliance |
| Impact | H — privacy policy and terms of service contain placeholder text |
| Effort | M — requires legal review, not engineering |
| Status | BLOCKED — awaiting legal review |
| Description | `/privacy` and `/terms` pages contain placeholder text with explicit legal-review caveats. The platform should not be marketed to the public until these are replaced with reviewed content. |
| Resolution | Legal review; replace placeholder paragraphs with reviewed content |

---

## 6. Performance Debt

### DEBT-015 — Redis Hard Dependency (No Graceful Degradation)

| Field | Value |
|---|---|
| Area | Resilience |
| Impact | M — Upstash outage takes down all research endpoints |
| Effort | M — requires a fallback strategy (fail-open or in-memory window) |
| Status | Unresolved |
| Description | `checkRateLimit()` will throw if the Upstash Redis connection fails. There is no graceful degradation — an Upstash outage will cause all rate-limited endpoints to return HTTP 500 even if the underlying analysis would succeed. |
| Resolution | Add try/catch around rate limit calls; on Redis failure, choose either fail-open (allow the request and log the incident) or fail-closed with a clear 503 message |

### DEBT-016 — No Apollo.io Key in Production

| Field | Value |
|---|---|
| Area | Feature Completeness |
| Impact | L — enrichment step is skipped for all research results |
| Effort | L — set env var if Apollo account exists |
| Status | BLOCKED — awaiting API key |
| Description | The ResearchService includes an Apollo.io enrichment step but it no-ops gracefully when `APOLLO_API_KEY` is absent. Results are returned without company/contact enrichment. |
| Resolution | Obtain Apollo.io API key; set `APOLLO_API_KEY` in Vercel env vars |

---

## 7. Code Quality Debt

### DEBT-017 — i18n Configured but Empty

| Field | Value |
|---|---|
| Area | Internationalization |
| Impact | L — next-intl adds startup overhead for zero value |
| Effort | L — either populate messages or remove the dependency |
| Status | Unresolved |
| Description | `next-intl` is installed and configured in `i18n/request.ts`. The locale is hardcoded to `'en'` and the `messages` object is empty. No UI strings are internationalised. The dependency adds bundle weight and startup complexity for no current benefit. |
| Resolution | Either (a) add message files and begin using `useTranslations()` in components, or (b) remove next-intl entirely until i18n is a real requirement |

### DEBT-018 — ApiUsage Prisma Model Unused

| Field | Value |
|---|---|
| Area | Code Cleanliness |
| Impact | L — dead schema increases migration surface |
| Effort | L — remove model from schema; run migration |
| Status | Unresolved |
| Description | The `ApiUsage` Prisma model exists in `prisma/schema.prisma` but is not written to or read from anywhere in the application. It appears to be a legacy remnant from an earlier design where API usage was tracked via Prisma rather than Supabase. |
| Resolution | Remove `ApiUsage` from `prisma/schema.prisma`; generate a migration to drop the table |

---

## 8. Debt Summary Table

| ID | Area | Impact | Effort | Blocked? |
|---|---|---|---|---|
| DEBT-001 | Infrastructure | H | M | No |
| DEBT-002 | Authentication | M | L | No |
| DEBT-003 | Type Safety | M | L | No (needs Supabase project) |
| DEBT-004 | Input Validation | M | M | No |
| DEBT-005 | Architecture | H | H | No |
| DEBT-006 | Architecture | M | H | No (after DEBT-005) |
| DEBT-007 | Data Architecture | L | M | No |
| DEBT-008 | Security | M | L | No |
| DEBT-009 | Testing | M | H | No |
| DEBT-010 | Testing | L | H | No |
| DEBT-011 | Commercial | H | H | Yes — provider decision |
| DEBT-012 | Operations | M | M | Yes — provider decision |
| DEBT-013 | Operations | M | M | Yes — sender domain decision |
| DEBT-014 | Compliance | H | M | Yes — legal review |
| DEBT-015 | Resilience | M | M | No |
| DEBT-016 | Feature | L | L | Yes — API key |
| DEBT-017 | Code Quality | L | L | No |
| DEBT-018 | Code Quality | L | L | No |

---

## 9. Recommended Resolution Order

Ordered by: highest impact first, unblocked items before blocked.

1. **DEBT-001** — Restore Supabase infrastructure (prerequisite for everything)
2. **DEBT-002** — Add root middleware (30-minute fix; prevents session bugs)
3. **DEBT-008** — Add middleware-level route protection (same session with DEBT-002)
4. **DEBT-003** — Generate Supabase types (requires DEBT-001; 15-minute fix)
5. **DEBT-005** — Integrate Decision Intelligence Engine (highest-value feature work)
6. **DEBT-004** — Add Zod validation (security hygiene; can be done in parallel)
7. **DEBT-015** — Redis graceful degradation (resilience improvement)
8. **DEBT-009** — API route tests (quality; can be done incrementally)
9. **DEBT-007** — Remove `Workspace.plan` from enforcement paths
10. **DEBT-018** — Remove unused `ApiUsage` model
11. **DEBT-017** — Resolve i18n stance (add messages or remove dependency)
12. **DEBT-006** — Migrate legacy AI engine (after Decision Intelligence is integrated)
13. **DEBT-011** — Billing integration (unblocked when provider decided)
14. **DEBT-012** — Error monitoring (unblocked when provider decided)
15. **DEBT-013** — Transactional email (unblocked when domain verified)
16. **DEBT-014** — Legal content (unblocked when legal review complete)
17. **DEBT-010** — E2E tests (long-term investment; tackle after core debt resolved)
18. **DEBT-016** — Apollo.io enrichment (low priority; no-ops gracefully)

---

*Register produced 2026-07-21. Read-only assessment — no implementations authorized.*
