# Domain Coverage

**Date:** 2026-07-21  
**Canonical architecture reference:** `docs/PLATFORM_ARCHITECTURE_MAP.md`  
**Canonical module reference:** `docs/MODULE_INVENTORY.md` (updated; see also `docs/CONSISTENCY_AUDIT.md` CRIT-06)

---

## 1 — Real Estate

**Purpose:** AI-powered feasibility analysis, campaign ROI, market entry strategy, lead generation, and full analysis for the Egyptian and MENA real estate market.

**Current Maturity:** Functional but architecturally legacy.

**Implemented:**
- 5 report types via legacy AI orchestrator (feasibility, campaign, market-entry, leads, full-analysis)
- Egypt 2026 market benchmarks in `core/data/sectors.data.ts` and `cities.data.ts`
- AI commentary via OpenAI GPT-4o-mini with Cloudflare Worker proxy fallback
- 24-hour Redis cache on analysis results
- Rate limiting (5 req/hr per user)

**Missing:**
- Plan limit enforcement (checkPlanLimit not called on `/api/intelligence`)
- Decision Intelligence Engine integration — results have no confidence score, no explainability, no business rules
- Migration from legacy AI engine to Decision Intelligence framework
- Real-time market data — all benchmarks are hardcoded for 2026
- Export to structured Decision Report format

**Implemented % (functional):** 70%  
**Implemented % (architecturally complete):** 30%

**Technical Risk:** The legacy AI engine produces unstructured text with no deterministic validation. Output quality depends entirely on the LLM's response format compliance. No fallback if GPT-4o-mini produces malformed JSON.

**Business Risk:** Product promise of "business intelligence" is unmet when the only deliverable is an AI text response with no evidence citation, confidence scoring, or explainability.

**Priority:** HIGH — Real Estate is the primary paying module; Decision Engine integration here has the highest user-visible ROI.

**Estimated Remaining Work:** Medium (2-3 sprints to integrate Decision Engine and migrate from legacy engine).

---

## 2 — Research (Lead Finder + Talent Finder)

**Purpose:** B2B lead discovery through live company search (SerpAPI), and talent market analysis through AI estimation with job-board source links.

**Current Maturity:** Lead Finder is production-grade with a complete data acquisition pipeline. Talent Finder is functional but AI-only.

**Implemented (Lead Finder):**
- Full acquisition pipeline: SerpAPI search → source collection → normalization → deduplication → company validation → company-size inference → source quality scoring → ranking → Apollo enrichment (optional) → AI analysis
- Per-user rate limiting + monthly plan enforcement
- Quota warning CTA on plan breach
- Failed-request recovery cards in report history
- 10+ library modules with individual test coverage

**Implemented (Talent Finder):**
- Pure GPT-4o-mini estimation (salary range, hiring demand, candidate archetypes)
- Static job-board URL builders (`buildCandidateSources()`)
- Per-user rate limiting + monthly plan enforcement

**Missing:**
- Lead Finder: company-size filter not wired into search query (captured in `search_criteria` but ignored)
- Lead Finder: decision-maker enrichment is user-input title echo — no real contact discovery
- Lead Finder: Decision Engine integration for evidence-based lead quality scoring
- Talent Finder: zero real data backing — entirely AI-estimated
- Both: Apollo.io `APOLLO_API_KEY` absent from production env
- Both: global SerpAPI daily quota (`SEARCH_DAILY_QUOTA`) and per-user sub-quota (`SEARCH_DAILY_QUOTA_PER_USER`) are documented only in `.env.example`, not in operator guides

**Implemented % (Lead Finder):** 80%  
**Implemented % (Talent Finder):** 60%

**Technical Risk:** The global SerpAPI daily quota is shared across all users. One high-volume user can exhaust the daily budget for all other users with no per-tenant fairness (though per-user sub-quota `SEARCH_DAILY_QUOTA_PER_USER=30` partially mitigates this). Fail-open design means a Redis outage removes all quota controls simultaneously.

**Business Risk:** Talent Finder's AI-only approach and clear disclaimers limit its perceived value. Lead Finder's decision-maker section shows user-supplied titles verbatim — a customer will notice this is not real enrichment.

**Priority:** HIGH — Active paying path; Apollo enrichment and Decision Engine integration are the two highest-ROI improvements.

**Estimated Remaining Work:** Medium (1-2 sprints for decision engine integration; another sprint for real decision-maker enrichment).

---

## 3 — Decision Intelligence

**Purpose:** Explainable, evidence-based business decision framework. The core product differentiator — produces decisions with confidence scores, business rules, validation pipeline, and full explainability. Not AI text generation.

**Current Maturity:** Library complete; zero integration.

**Implemented:**
- 7 type definition files (decision lifecycle, evidence model, confidence model, business rules, validation pipeline, explainability structures, Universal Decision Report v1.0.0)
- Evidence subsystem: collector (exponential freshness decay) + weighter (normalized weights)
- Confidence engine: 5 dimensions, band classification
- Rules engine: 11 condition operators, AND/OR semantics, priority ordering
- Validation engine: 5-stage pipeline with halt-and-skip behavior
- Explainability engine: deterministic WHY/WHY_NOT/EVIDENCE/RULES output — zero AI calls
- Top-level decision orchestrator producing full `DecisionEngineResult`
- 61 passing tests across 6 test files

**Missing:**
- Route integration (Real Estate, Lead Finder, Talent Finder — none wired)
- Supabase persistence layer (`decisions` table SQL)
- `DecisionReportCard` UI component consuming `UniversalDecisionReport`
- AI narration layer: GPT-4o-mini enriches `DecisionOption.aiAnalysis` after rule scores are computed (calculate-then-narrate pattern)
- Business rules definitions for each module (Real Estate rules, Lead quality rules, Talent market rules)
- API route (or integration into existing routes)

**Implemented % (library):** 100%  
**Implemented % (end-to-end product):** 15%

**Technical Risk:** The library is pure TypeScript with no I/O — zero risk of breakage. Integration risk is in the data adapters (converting existing pipeline output to `DecisionEngineInput` format).

**Business Risk:** HIGH — The product's strategic differentiation rests on this engine. Currently produces zero user-visible value despite being fully implemented.

**Priority:** CRITICAL — This is the stated product core. Every month it remains unintegrated is a month the platform delivers generic AI text instead of its promised product.

**Estimated Remaining Work:** Large (3-5 sprints for full integration across all modules, persistence, and UI).

---

## 4 — Analytics

**Purpose:** Research activity statistics and curated Egypt/MENA market insights.

**Current Maturity:** Partially functional; inconsistent with platform identity.

**Implemented:**
- Live "Your Research Activity" stats (request count, last request, module breakdown) from Supabase `research_requests`
- Static curated market insights (Egypt economy, real estate, marketing, business, growth sectors)

**Missing:**
- Live market data (curated insights are hardcoded text)
- Cross-user aggregate analytics (admin-level market trending)
- Decision Intelligence output aggregation (e.g., "most frequently blocked real estate rules")
- Export of analytics data

**Implemented %:** 50%

**Technical Risk:** Low — server component reading from Supabase.

**Business Risk:** MEDIUM — Static curated content sold alongside evidence-based modules creates product inconsistency. A customer comparing Lead Finder output (real companies, confidence scores) with Analytics (hardcoded market text) will notice the quality gap.

**Priority:** MEDIUM — Functional gap; not blocking but affects perceived product quality.

**Estimated Remaining Work:** Small-to-Medium (integrate real data sources or explicitly position as curated editorial content).

---

## 5 — Administration

**Purpose:** Operator tools for managing users, plans, and audit trail.

**Current Maturity:** Feature-complete for the basic use case; blocked on env var configuration.

**Implemented:**
- Admin identity check (`ADMIN_EMAILS` env var)
- User list with plan + this-month usage (via Supabase service role)
- Plan change with audit log write
- Admin Console UI (`/dashboard/admin`) with search, filter, plan dropdown
- Best-effort audit log write to `audit_log` Supabase table
- Sidebar link shown conditionally to admin users

**Missing:**
- `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAILS` not set in production Vercel env
- `supabase/audit-log.sql` not yet applied in Supabase (Supabase project deleted)
- No audit log viewer in the UI
- No per-user report viewer for support
- Admin access model relies on `ADMIN_EMAILS` string check — no database role system

**Implemented %:** 70%

**Technical Risk:** LOW — All code is correct and tested.

**Business Risk:** LOW (admin tools) to HIGH (missing env vars) — until env vars are set, the admin console is non-functional in production.

**Priority:** HIGH (env var setup, trivial) — MEDIUM (feature completeness).

**Estimated Remaining Work:** Tiny (set env vars); Medium (audit viewer UI).

---

## 6 — Authentication

**Purpose:** User identity, session management, route protection.

**Current Maturity:** Functional with one latent architectural gap.

**Implemented:**
- Login, signup, forgot-password via Supabase Auth (email/password)
- Auth callback handler at `app/auth/callback/route.ts`
- Server-side session check in dashboard layout
- `lib/supabase/middleware.ts` with full `updateSession()` implementation

**Missing:**
- Root `middleware.ts` — `proxy.ts` exists at root but is NOT executed as Next.js middleware (exports `proxy` function, not `middleware`). Session tokens are not refreshed on every request.
- Email verification enforcement (signup allows unverified emails to proceed)
- Rate limiting on auth endpoints

**Implemented %:** 85%

**Technical Risk:** MEDIUM — Sessions that expire during client-side navigation will not be refreshed until the next full page load hitting the dashboard layout. This can cause silent auth failures on long-lived sessions.

**Business Risk:** LOW — Functional for normal use patterns; edge cases around long sessions.

**Priority:** MEDIUM — Root middleware fix is a 10-minute task (DEBT-002 in Technical Debt Register).

**Estimated Remaining Work:** Tiny (add root `middleware.ts`).

---

## 7 — Billing

**Purpose:** Self-serve plan upgrade, payment processing, plan activation.

**Current Maturity:** Infrastructure-ready; no payment provider wired.

**Implemented:**
- Plan enforcement infrastructure (`user_plans` Supabase table, `checkPlanLimit()`, `PLAN_LIMITS`)
- Upgrade CTA shown to users at quota breach
- Admin-only manual plan override via Admin Console
- `audit_log` table for plan-change history

**Missing:**
- Billing provider (Stripe or equivalent) — no decision made
- Checkout session flow
- Webhook handler to write `user_plans` on payment success
- Pricing page
- Subscription management UI
- Invoice/receipt generation

**Implemented %:** 5%

**Technical Risk:** MEDIUM — Billing integration requires careful webhook verification and idempotent `user_plans` write.

**Business Risk:** CRITICAL — No self-serve revenue path exists. All plan upgrades are manual (admin SQL). This is the primary blocker between "working software" and "SaaS business."

**Priority:** CRITICAL — Every day without billing is a day revenue cannot scale.

**Estimated Remaining Work:** Large (1 full sprint minimum for Stripe + webhook + UI).

---

## 8 — Reports

**Purpose:** Persistence and retrieval of all AI-generated analysis outputs.

**Current Maturity:** Functional. Legacy Prisma `Report` model exists but is superseded by Supabase `reports` table.

**Implemented:**
- Supabase `reports` table (RLS enforced)
- Server-side report list with search and filter
- Failed-request recovery cards with retry prefill
- CSV export (client-side)
- Expandable report cards

**Missing:**
- API route `/api/reports` — does NOT exist (reports are read directly from Supabase in the server component). Any external integration or mobile client cannot access reports via REST.
- Decision Report format — existing reports are unstructured JSON blobs from the legacy engine
- PDF export (print-to-PDF only; no server-side PDF generation)

**Implemented %:** 75%

**Technical Risk:** LOW.

**Business Risk:** LOW-MEDIUM — Missing `/api/reports` REST endpoint blocks any future mobile or partner integration.

**Priority:** MEDIUM.

**Estimated Remaining Work:** Small (add `/api/reports` route if needed; medium for Decision Report format integration).

---

## 9 — Marketing

**Purpose:** Public-facing lead capture, demo experience, and landing pages.

**Current Maturity:** Structurally present; partially functional due to missing env vars.

**Implemented:**
- Marketing landing page (`/`)
- Market intelligence public landing (`/market-intelligence`)
- Demo landing with lead capture form (`/demo` → `/api/demo`)
- Demo AI report generation (`/api/demo/generate` — via `AI_PROXY_URL` proxy)
- Branded Arabic confirmation email template (Resend)
- Privacy Policy and Terms pages (placeholder content)

**Missing:**
- `RESEND_API_KEY` is empty — confirmation email never sends
- `AI_PROXY_URL` env var not documented; proxy destination unknown
- Legal content in Privacy Policy and Terms (placeholder only)
- SEO metadata (title tags, descriptions, OG images)

**Implemented %:** 50%

**Technical Risk:** LOW — Static pages and simple form submissions.

**Business Risk:** MEDIUM — Demo email is the primary demo conversion tool; broken email = lost leads.

**Priority:** MEDIUM — Set `RESEND_API_KEY` to fix demo email (trivial); legal review for policies (blocked).

**Estimated Remaining Work:** Tiny (env var); Medium (legal content); Medium (SEO).

---

## 10 — Settings

**Purpose:** User self-management — plan visibility, usage, data export, account deletion.

**Current Maturity:** Feature-complete for implemented scope.

**Implemented:**
- Plan tier display
- Monthly usage display
- Download My Data (JSON export)
- Delete Account (cascade via Supabase Admin)

**Missing:**
- Self-serve plan upgrade (blocked on billing)
- Email/password change
- Notification preferences
- Connected accounts / OAuth management

**Implemented %:** 70%

**Priority:** LOW-MEDIUM.

**Estimated Remaining Work:** Small (most features blocked on billing and auth provider decisions).

---

## 11 — Infrastructure

**Purpose:** Deployment, environment configuration, database, caching, rate limiting.

**Current Maturity:** Critically degraded — Supabase project deleted.

**Implemented:**
- Vercel deployment (`intelligence.eunoiazones.com`)
- Upstash Redis (rate limiting + 24h cache)
- Prisma schema with migrations
- 6 Supabase SQL migration files (not yet applied — project deleted)
- Health check endpoint

**Missing:**
- Active Supabase project (CRITICAL — all auth and data are offline)
- Environment variables in Vercel (most are blank post-project deletion)
- Root `middleware.ts` (DEBT-002)
- Structured error monitoring (APM)
- Uptime monitoring configuration

**Implemented %:** 30% (all infrastructure non-functional due to deleted Supabase)

**Priority:** CRITICAL.

**Estimated Remaining Work:** Medium (Supabase project creation, SQL migrations, Vercel env var configuration, redeploy).

---

## 12 — AI Platform

**Purpose:** The AI layer that powers all intelligence features.

**Current Maturity:** Two distinct AI engines; one legacy, one new and unintegrated.

**Implemented:**
- Legacy AI engine: `services/legacy-ai-engine/` — 35 report types via GPT-4o-mini with JSON-mode output
- Research Core Engine AI step: `lib/research/acquisition/ai-analysis.ts` — closed-list GPT-4o-mini summarization
- Demo AI: `app/api/demo/generate/route.ts` — market report via AI proxy
- Decision Intelligence Engine: deterministic math with zero AI calls (AI narration is caller-side)

**Missing:**
- AI narration layer for Decision Intelligence (GPT-4o-mini enriching `DecisionOption.aiAnalysis` post-scoring)
- AI provider strategy (single provider GPT-4o-mini; no fallback beyond Cloudflare proxy)
- Prompt versioning system
- Token usage tracking (neither engine tracks costs per user)
- Content moderation/output validation

**Implemented %:** 60%

**Priority:** MEDIUM — AI layer is functional; improvements are quality-of-life and risk-management.

**Estimated Remaining Work:** Medium (AI narration layer for Decision Engine).

---

## 13 — Knowledge System

**Purpose:** Institutional documentation, session memory, and canonical project knowledge.

**Current Maturity:** Partially maintained; significant staleness in key files.

**Implemented:**
- EPOS bootstrap procedure (`START_SESSION.md`, `END_SESSION.md`)
- Canonical memory (`MASTER_PROJECT_MEMORY.md`, `SPRINT_MEMORY.md`)
- Project context (`PROJECT_CONTEXT.md`, `CURRENT_SYSTEM_MAP.md`)
- Task tracking (`TASK_QUEUE.md`, `ACTIVE_SPRINT.md`, `CURRENT_STATE.md`)
- New assessment docs (`docs/PLATFORM_STATE_ASSESSMENT.md`, `docs/PLATFORM_ARCHITECTURE_MAP.md`, `docs/MODULE_INVENTORY.md`, `docs/INTEGRATION_MATRIX.md`, `docs/TECHNICAL_DEBT_REGISTER.md`)
- Audit history (`.ai/AUDIT/` — 35+ audit documents)

**Missing:**
- `MASTER_PROJECT_MEMORY.md` is severely stale (CRIT-01 in Consistency Audit)
- `CURRENT_SYSTEM_MAP.md` is obsolete (CRIT-02, CRIT-03, SIG-01)
- `MODULE_INVENTORY.md` missing 15+ files (CRIT-06)
- `PLATFORM_ARCHITECTURE_MAP.md` has wrong route paths (CRIT-05)
- `CHANGELOG.md` — does not exist as a standalone file
- `ROADMAP.md` — does not exist as a standalone file
- `PROJECT_STATE.md` — END_SESSION.md references it but `CURRENT_STATE.md` is used instead
- `NEXT_SPRINT.md` — END_SESSION.md says to create it but it doesn't exist

**Implemented %:** 55%

**Priority:** HIGH — Knowledge system staleness directly risks repeated work and wrong decisions in future sessions.

**Estimated Remaining Work:** Medium (this sprint addresses it; update MASTER_PROJECT_MEMORY and CURRENT_SYSTEM_MAP post-sprint).

---

*Domain coverage produced 2026-07-21. Read-only assessment.*
