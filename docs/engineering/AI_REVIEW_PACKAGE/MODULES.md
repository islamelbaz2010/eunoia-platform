# MODULES
**Audit Date:** 2026-07-30  
**Source:** Direct code inspection — not derived from documentation

---

## Active Modules

### M01 — Real Estate Intelligence Engine

| Field | Detail |
|---|---|
| Purpose | Generates 5 AI-powered report types for Egyptian real estate market (Feasibility, Campaign ROI Audit, Market Entry, Lead Gen, Full Analysis). Includes deterministic cashflow engine that computes real numbers before calling AI. |
| Entry point | `app/api/intelligence/route.ts` |
| UI | `app/dashboard/real-estate/page.tsx` |
| Dependencies | OpenAI GPT-4o-mini, Supabase (reports table), plan-enforcement, rate-limit |
| Status | **COMPLETE** — fully functional |
| Used? | Yes |
| Notes | ~1000-line route file. Plan enforcement (`checkPlanLimit`) is active. Egypt 2026 market benchmarks hardcoded. Bilingual Arabic/English output. |

---

### M02 — Lead Finder (Research Intelligence Hub)

| Field | Detail |
|---|---|
| Purpose | Real company discovery via SerpAPI + HTTP collection + normalisation + dedup + ranking + optional Apollo enrichment + AI analysis |
| Entry point | `app/api/research/leads/route.ts` |
| UI | `app/dashboard/research/leads/page.tsx` |
| Dependencies | SerpAPI (required for useful output), OpenAI GPT-4o-mini, Upstash Redis, Supabase, plan-enforcement |
| Status | **COMPLETE** — functional; output quality degrades without SerpAPI key |
| Used? | Yes |
| Notes | Quota-blocked CTA shown to users; failed-request recovery cards in report history |

---

### M03 — Talent Finder (Research Intelligence Hub)

| Field | Detail |
|---|---|
| Purpose | AI-estimated salary range, hiring demand, candidate sources for a given job title/location |
| Entry point | `app/api/research/talent/route.ts` |
| UI | `app/dashboard/research/talent/page.tsx` |
| Dependencies | OpenAI GPT-4o-mini, Supabase, plan-enforcement |
| Status | **COMPLETE** — purely AI-estimated; clearly disclaimered in UI |
| Used? | Yes |
| Notes | No real data pipeline — pure AI estimation |

---

### M04 — Market Intelligence Hub

| Field | Detail |
|---|---|
| Purpose | Static curated Egypt/MENA market insights (Economy, Real Estate, Marketing, Business, Growth) with live per-user research stats |
| Entry point | `app/dashboard/analytics/page.tsx` (server component) |
| UI | `app/dashboard/analytics/analytics-client.tsx` |
| Dependencies | Supabase (research_requests + reports count queries) |
| Status | **COMPLETE** — static content; live stats added in Session 2 |
| Used? | Yes |
| Notes | No external API calls; zero operational cost |

---

### M05 — Report History

| Field | Detail |
|---|---|
| Purpose | Unified history of all 7 report types stored in Supabase `reports` table. Search, filter, expandable cards, CSV export, print. |
| Entry point | `app/dashboard/reports/page.tsx` |
| UI | `app/dashboard/reports/reports-client.tsx` |
| Dependencies | Supabase (reports table) |
| Status | **COMPLETE** |
| Used? | Yes |

---

### M06 — Auth System

| Field | Detail |
|---|---|
| Purpose | Email + password authentication with email verification. Login, signup, forgot-password, auth callback. |
| Entry point | `app/(auth)/` pages + `app/auth/callback/route.ts` |
| Dependencies | Supabase Auth |
| Status | **COMPLETE** — signup is fully open (no invite gate) |
| Used? | Yes |
| Notes | No OAuth (Google/GitHub) support. No 2FA. |

---

### M07 — Plan Enforcement

| Field | Detail |
|---|---|
| Purpose | Monthly report quota enforcement per user plan (STARTER/PROFESSIONAL/AGENCY/ENTERPRISE) |
| Entry point | `lib/research/plan-enforcement.ts` |
| Dependencies | Supabase (user_plans, research_requests tables) |
| Status | **COMPLETE** — active on all research routes AND intelligence route |
| Used? | Yes |
| Notes | Fails open (allows request) on Supabase error. Rate limit: 5 req/hour via Redis. |

---

### M08 — Admin Console

| Field | Detail |
|---|---|
| Purpose | Internal ops panel — user list, per-user usage stats, plan management dropdown, audit log |
| Entry point | `app/dashboard/admin/page.tsx` + `app/api/admin/` |
| Dependencies | `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, Supabase (auth.users, user_plans, research_requests, audit_log) |
| Status | **COMPLETE** — requires env vars not yet set in Vercel |
| Used? | Yes — once env vars are configured |

---

### M09 — Account Management (Settings)

| Field | Detail |
|---|---|
| Purpose | Plan display, monthly usage summary, Download My Data (JSON export), Delete Account (with cascade) |
| Entry point | `app/dashboard/settings/page.tsx` + `app/dashboard/settings/account-actions.tsx` |
| API | `/api/account/export`, `/api/account/delete` |
| Dependencies | `SUPABASE_SERVICE_ROLE_KEY` |
| Status | **COMPLETE** |
| Used? | Yes |

---

### M10 — Onboarding Flow

| Field | Detail |
|---|---|
| Purpose | 2-step onboarding: workspace setup → product tour (3 module cards + CTA) |
| Entry point | `app/dashboard/onboarding/page.tsx` |
| Dependencies | `/api/users/init` |
| Status | **COMPLETE** |
| Used? | Yes |

---

### M11 — Public Demo

| Field | Detail |
|---|---|
| Purpose | Unauthenticated lead-capture form; generates AI report via Cloudflare Worker proxy; sends branded email; saves to `demo_leads` table |
| Entry point | `app/demo/page.tsx` + `app/api/demo/` |
| Dependencies | `CLOUDFLARE_WORKER_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` |
| Status | **COMPLETE** |
| Used? | Yes (investor demo flow) |

---

### M12 — Health Check

| Field | Detail |
|---|---|
| Purpose | Lightweight uptime endpoint — returns `{ status, env_check, timestamp }` without exposing key values |
| Entry point | `app/api/health/route.ts` |
| Status | **COMPLETE** — 1 test file |
| Used? | Yes |

---

### M13 — Audit Log

| Field | Detail |
|---|---|
| Purpose | Best-effort audit trail for plan changes and account deletions |
| Entry point | `lib/admin/audit.ts` |
| Dependencies | Supabase service-role client, `supabase/audit-log.sql` (must be applied manually) |
| Status | **COMPLETE** — SQL migration NOT yet applied to production |
| Used? | Code is wired; SQL not applied |

---

### M14 — Decision Intelligence Engine (Library)

| Field | Detail |
|---|---|
| Purpose | Pure-function library for evidence-backed deterministic business decisions. Evidence collection + weighting, confidence scoring (5 dimensions), rules engine (11 operators), validation pipeline (5 stages), explainability (4 types), Universal Decision Report. |
| Entry point | `lib/decision-intelligence/index.ts` |
| Dependencies | None (pure TypeScript, no I/O) |
| Status | **LIBRARY COMPLETE — NOT INTEGRATED** — zero imports from any API route or UI component |
| Used? | No — library only; not called by any production code path |
| Notes | 15 source files, 6 test files, 61 tests passing. Integration is Sprint 4 work. |

---

## Dead / Legacy Modules

### L01 — Legacy AI Engine

| Field | Detail |
|---|---|
| Location | `services/legacy-ai-engine/` |
| Purpose | Original general-purpose AI engine (30+ prompt types, provider pattern) |
| Status | **DEAD** — explicitly excluded from `tsconfig.json`; no active route imports it |
| Notes | 368KB of code. Replace with Decision Intelligence Engine in Sprint 4. |

---

### L02 — PHP Authentication System

| Field | Detail |
|---|---|
| Location | `auth.php`, `api.php`, `config.example.php`, `test.php` |
| Purpose | Legacy PHP-based auth and API for a pre-Next.js version of the platform |
| Status | **DEAD** — not executed by any current system |
| Notes | `test.php` contains a **hardcoded Anthropic API key** — CRITICAL SECURITY RISK |

---

### L03 — Legacy HTML Frontend

| Field | Detail |
|---|---|
| Location | `index.html`, `feasibility.html` |
| Purpose | PHP-era browser frontends |
| Status | **DEAD** — not served by Next.js |

---

### L04 — Cloudflare Worker

| Field | Detail |
|---|---|
| Location | `eunoia-worker.js` |
| Purpose | Deployed separately to Cloudflare Workers; proxies requests to OpenAI/Anthropic for the demo flow |
| Status | **SEPARATE DEPLOYMENT** — not part of Next.js build; not dead but not managed here |

---

### L05 — Prisma Report + ApiUsage Models

| Field | Detail |
|---|---|
| Location | `prisma/schema.prisma` — `Report`, `ApiUsage` models |
| Purpose | Powered retired `/dashboard/intelligence` + `/dashboard/feasibility` pages |
| Status | **LEGACY** — no route writes to these; kept for historical data. Schema comment says "do not drop." |

---

### L06 — Database Folder

| Field | Detail |
|---|---|
| Location | `database/` |
| Contents | Empty (only `.DS_Store`) |
| Status | **EMPTY** — vestigial directory |

---

### L07 — Investor Review Folders

| Field | Detail |
|---|---|
| Location | `investor-package/`, `Investor Package/`, `investor-review/`, `investor-review-v2/` |
| Contents | 50+ markdown files total (executive summaries, product docs, pitch materials) |
| Status | **NOT CODE** — documentation/pitch materials not part of the application |
| Notes | Should be moved outside the repository or into a `/docs` sub-path |

---

### L08 — Scratch Files

| Field | Detail |
|---|---|
| Location | `text.txt`, `text 2.txt` ... `text 6.txt`, `.Documentation:.swp`, `Eunoia_Platform_Analysis_Final.xlsx`, `IMG_0070-73.jpeg` |
| Status | **CLUTTER** — should be removed from git history |

---

## Partially Used Modules

### P01 — Vercel AI SDK (`ai` package)

| Field | Detail |
|---|---|
| Status | Installed (^4.3.16) but **not actively used** in any route |
| Notes | Routes use raw `openai` SDK. The AI SDK provides streaming, multi-provider, and structured output benefits not yet leveraged. |

### P02 — next-intl (i18n)

| Field | Detail |
|---|---|
| Status | Installed and configured (`i18n/request.ts`, `withNextIntl` wrapper in next.config.ts) |
| Notes | No locale route segments exist (`/[locale]/`). Bilingual content is handled manually in the Real Estate route (Arabic/English toggle). The library is configured but underutilized. |

### P03 — Supabase TypeScript Types

| Field | Detail |
|---|---|
| Location | `types/supabase.types.ts` |
| Status | Exists but likely stale — `research_requests` and `user_plans` tables reference `as any` casts throughout research routes, indicating the type file has not been regenerated since these tables were added |
