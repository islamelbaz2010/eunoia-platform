# Feature Matrix

**Date:** 2026-07-21  
**Source of truth:** Direct repository inspection — all claims verified against actual files.

---

## Column Definitions

| Column | Meaning |
|---|---|
| Feature | User-visible capability |
| Domain | Business area |
| UI | Verified page path |
| API | Verified route path |
| Database | Supabase tables and/or Prisma models |
| AI | AI provider and model |
| Authentication | Whether Supabase auth is required |
| Authorization | Plan/role checks |
| Plan Enforcement | `checkPlanLimit()` called |
| Decision Engine | `lib/decision-intelligence` used |
| Status | LIVE / PARTIAL / NOT STARTED / BLOCKED |
| Completion % | Estimated completeness |
| Missing Pieces | What prevents production-readiness |

---

## Feature Matrix

### 1 — Real Estate Intelligence

| Field | Value |
|---|---|
| **Feature** | Real Estate Intelligence Engine |
| **Domain** | Real Estate |
| **UI** | `/dashboard/real-estate` |
| **API** | `POST /api/intelligence` |
| **Database** | Supabase: `reports`; Prisma: none (reports not written to Prisma model) |
| **AI** | OpenAI GPT-4o-mini via legacy orchestrator; falls back to `CLOUDFLARE_WORKER_URL` proxy |
| **Authentication** | Required (Supabase session) |
| **Authorization** | User must be authenticated |
| **Plan Enforcement** | Rate limit only (5 req/hr Redis); plan limit NOT enforced on `/api/intelligence` |
| **Decision Engine** | Not integrated |
| **Status** | PARTIAL |
| **Completion %** | 70% |
| **Missing Pieces** | Plan limit enforcement on `/api/intelligence`; Decision Engine integration; legacy engine migration path |

---

### 2 — Lead Finder

| Field | Value |
|---|---|
| **Feature** | B2B Lead Discovery (company search) |
| **Domain** | Research |
| **UI** | `/dashboard/research/leads` |
| **API** | `POST /api/research/leads` |
| **Database** | Supabase: `research_requests` |
| **AI** | OpenAI GPT-4o-mini (AI analysis step after SerpAPI search) |
| **Authentication** | Required |
| **Authorization** | Authenticated user |
| **Plan Enforcement** | `checkRateLimit()` + `checkPlanLimit()` both called |
| **Decision Engine** | Not integrated |
| **Status** | LIVE |
| **Completion %** | 80% |
| **Missing Pieces** | Company-size filter not wired into search query; decision-maker enrichment is title echo not real discovery; Decision Engine integration for lead quality scoring |

---

### 3 — Talent Finder

| Field | Value |
|---|---|
| **Feature** | Talent Market Analysis (salary, demand, candidate archetypes) |
| **Domain** | Research |
| **UI** | `/dashboard/research/talent` |
| **API** | `POST /api/research/talent` |
| **Database** | Supabase: `research_requests` |
| **AI** | OpenAI GPT-4o-mini (pure AI generation — no SerpAPI) |
| **Authentication** | Required |
| **Authorization** | Authenticated user |
| **Plan Enforcement** | `checkRateLimit()` + `checkPlanLimit()` both called |
| **Decision Engine** | Not integrated |
| **Status** | LIVE |
| **Completion %** | 75% |
| **Missing Pieces** | Talent Finder produces AI-estimated results with no real data backing; candidate sources are static job-board URL builders; Decision Engine integration for hire/no-hire scoring |

---

### 4 — Market Intelligence Hub

| Field | Value |
|---|---|
| **Feature** | Egypt/MENA curated market data + live per-user research stats |
| **Domain** | Analytics |
| **UI** | `/dashboard/analytics` |
| **API** | Supabase direct read (server component) |
| **Database** | Supabase: `research_requests` (for live stats) |
| **AI** | None |
| **Authentication** | Required |
| **Authorization** | Authenticated user |
| **Plan Enforcement** | None |
| **Decision Engine** | Not integrated |
| **Status** | PARTIAL |
| **Completion %** | 50% |
| **Missing Pieces** | Static curated insights are hardcoded, not a live data feed; inconsistency between static insights and evidence-based Lead/Talent Finder undermines product credibility |

---

### 5 — Report History

| Field | Value |
|---|---|
| **Feature** | View, search, export all generated reports |
| **Domain** | Reports |
| **UI** | `/dashboard/reports` |
| **API** | Supabase direct read (server component) |
| **Database** | Supabase: `reports`, `research_requests` |
| **AI** | None |
| **Authentication** | Required |
| **Authorization** | RLS: `auth.uid() = user_id` |
| **Plan Enforcement** | None |
| **Decision Engine** | Not integrated |
| **Status** | LIVE |
| **Completion %** | 85% |
| **Missing Pieces** | No async retry for failed reports; no download of individual report as PDF (print only) |

---

### 6 — Authentication (Login / Signup / Password Reset)

| Field | Value |
|---|---|
| **Feature** | User identity management |
| **Domain** | Authentication |
| **UI** | `/login`, `/signup`, `/forgot-password` |
| **API** | Supabase Auth (client SDK direct — no custom API route) |
| **Database** | Supabase: `auth.users` |
| **AI** | None |
| **Authentication** | Pre-auth (public pages) |
| **Authorization** | N/A |
| **Plan Enforcement** | None |
| **Decision Engine** | Not integrated |
| **Status** | LIVE |
| **Completion %** | 90% |
| **Missing Pieces** | No email verification enforcement; `proxy.ts` does not execute as Next.js middleware — no centralized session refresh; no root `middleware.ts` |

---

### 7 — Auth Callback

| Field | Value |
|---|---|
| **Feature** | Supabase OAuth code exchange handler |
| **Domain** | Authentication |
| **UI** | None |
| **API** | `GET /auth/callback` (at `app/auth/callback/route.ts`) |
| **Database** | Supabase Auth |
| **AI** | None |
| **Authentication** | Public (handles the transition from unauthenticated to authenticated) |
| **Authorization** | N/A |
| **Plan Enforcement** | None |
| **Decision Engine** | Not integrated |
| **Status** | LIVE |
| **Completion %** | 100% |
| **Missing Pieces** | None |

---

### 8 — Onboarding

| Field | Value |
|---|---|
| **Feature** | First-run workspace setup and product tour |
| **Domain** | Authentication |
| **UI** | `/dashboard/onboarding` |
| **API** | `POST /api/users/init` |
| **Database** | Prisma: User, Workspace |
| **AI** | None |
| **Authentication** | Required |
| **Authorization** | Rate limited (5 req/hr per user via Redis) |
| **Plan Enforcement** | None (sets plan to STARTER at Workspace creation) |
| **Decision Engine** | Not integrated |
| **Status** | LIVE |
| **Completion %** | 85% |
| **Missing Pieces** | No guided first-search walkthrough; no welcome email |

---

### 9 — Dashboard Home

| Field | Value |
|---|---|
| **Feature** | Usage overview, quota warning, module navigation |
| **Domain** | Dashboard |
| **UI** | `/dashboard` |
| **API** | Supabase direct (server component) + `/api/workspace` |
| **Database** | Supabase: `user_plans`, `research_requests`; Prisma: Workspace |
| **AI** | None |
| **Authentication** | Required |
| **Authorization** | Authenticated user |
| **Plan Enforcement** | Display only (reads usage for quota warning banner at ≥80%/100%) |
| **Decision Engine** | Not integrated |
| **Status** | LIVE |
| **Completion %** | 90% |
| **Missing Pieces** | None critical |

---

### 10 — Settings

| Field | Value |
|---|---|
| **Feature** | Plan display, usage display, account data export, account deletion |
| **Domain** | Settings |
| **UI** | `/dashboard/settings` |
| **API** | `GET /api/account/export`, `DELETE /api/account/delete`, `GET /api/workspace` |
| **Database** | Supabase: `reports`, `research_requests`, `user_plans`; Supabase Admin: `auth.users` |
| **AI** | None |
| **Authentication** | Required |
| **Authorization** | Authenticated user (delete/export own data only) |
| **Plan Enforcement** | None |
| **Decision Engine** | Not integrated |
| **Status** | LIVE |
| **Completion %** | 80% |
| **Missing Pieces** | No self-serve plan upgrade; no notification preferences; no email/password change UI |

---

### 11 — Admin Console

| Field | Value |
|---|---|
| **Feature** | User list, plan management, usage visibility for admins |
| **Domain** | Administration |
| **UI** | `/dashboard/admin` |
| **API** | `GET /api/admin/users`, `PATCH /api/admin/users/[id]/plan`, `GET /api/admin/check` |
| **Database** | Supabase (service role): `auth.users`, `user_plans`, `research_requests`, `audit_log` |
| **AI** | None |
| **Authentication** | Required |
| **Authorization** | Admin only — `ADMIN_EMAILS` env var check |
| **Plan Enforcement** | None (admin bypass) |
| **Decision Engine** | Not integrated |
| **Status** | PARTIAL |
| **Completion %** | 70% |
| **Missing Pieces** | Requires `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_EMAILS` in production env; no audit log viewer UI; no per-user report viewer |

---

### 12 — Public Demo

| Field | Value |
|---|---|
| **Feature** | Lead capture + free AI report demo for prospective customers |
| **Domain** | Marketing |
| **UI** | `/demo` |
| **API** | `POST /api/demo` (lead capture + email), `POST /api/demo/generate` (AI report) |
| **Database** | Supabase: `demo_leads` (service role, RLS bypass intentionally) |
| **AI** | OpenAI GPT-4o-mini via `AI_PROXY_URL` proxy (env var undocumented) |
| **Authentication** | None (public) |
| **Authorization** | Rate-limited only (Redis, per IP/session) |
| **Plan Enforcement** | None |
| **Decision Engine** | Not integrated |
| **Status** | PARTIAL |
| **Completion %** | 65% |
| **Missing Pieces** | `RESEND_API_KEY` is empty — email never sends; `AI_PROXY_URL` env var not documented anywhere; no confirmation that proxy is still operational |

---

### 13 — Decision Intelligence Engine (Library)

| Field | Value |
|---|---|
| **Feature** | Explainable business decision framework |
| **Domain** | Decision Intelligence |
| **UI** | Not yet built |
| **API** | Not yet wired |
| **Database** | Not yet persisted |
| **AI** | None in engine itself (AI narration is caller's responsibility) |
| **Authentication** | N/A |
| **Authorization** | N/A |
| **Plan Enforcement** | N/A |
| **Decision Engine** | IS the engine — `lib/decision-intelligence/` |
| **Status** | PARTIAL (library complete; no integration) |
| **Completion %** | 40% (library 100%; integration 0%; persistence 0%; UI 0%) |
| **Missing Pieces** | Route wiring into Real Estate / Lead Finder / Talent Finder; Supabase `decisions` table; `DecisionReportCard` UI component; AI narration layer (GPT-4o-mini post-scoring) |

---

### 14 — Billing / Plan Upgrade

| Field | Value |
|---|---|
| **Feature** | Self-serve plan upgrade and payment |
| **Domain** | Billing |
| **UI** | None (upgrade CTAs link to placeholder) |
| **API** | None |
| **Database** | Supabase: `user_plans` (structure ready; no billing webhook wired) |
| **AI** | None |
| **Authentication** | Would require auth |
| **Authorization** | Would require user owns plan |
| **Plan Enforcement** | N/A |
| **Decision Engine** | Not applicable |
| **Status** | NOT STARTED |
| **Completion %** | 5% (enforcement infrastructure exists; payment does not) |
| **Missing Pieces** | Billing provider (Stripe or equivalent); checkout session; webhook to write `user_plans`; upgrade confirmation UI |

---

### 15 — Health Check

| Field | Value |
|---|---|
| **Feature** | Uptime monitoring liveness endpoint |
| **Domain** | Infrastructure |
| **UI** | None |
| **API** | `GET /api/health` |
| **Database** | None |
| **AI** | None |
| **Authentication** | None (public) |
| **Authorization** | None |
| **Plan Enforcement** | None |
| **Decision Engine** | Not applicable |
| **Status** | LIVE |
| **Completion %** | 100% |
| **Missing Pieces** | No external uptime monitor configured |

---

### 16 — Legal Pages

| Field | Value |
|---|---|
| **Feature** | Privacy Policy and Terms of Service |
| **Domain** | Marketing / Compliance |
| **UI** | `/privacy`, `/terms` |
| **API** | None |
| **Database** | None |
| **AI** | None |
| **Authentication** | None (public) |
| **Authorization** | None |
| **Plan Enforcement** | None |
| **Decision Engine** | Not applicable |
| **Status** | PARTIAL |
| **Completion %** | 20% (pages exist; content is placeholder) |
| **Missing Pieces** | Legal review; actual policy content |

---

*Feature matrix produced 2026-07-21. Read-only assessment.*
