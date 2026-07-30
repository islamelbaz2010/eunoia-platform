# Critical Path

**Date:** 2026-07-21  
**Owner:** Technical Lead  
**Canonical references:** `docs/MVP_DEFINITION.md`, `docs/EXECUTION_ROADMAP.md`, `docs/PROJECT_DEPENDENCY_DAG.md`

---

## Definition

The Critical Path is the ordered dependency chain without which no subsequent step can safely proceed. Every sprint in this chain is a blocker for everything that follows it. No step can be skipped, reordered, or parallelized unless explicitly marked as parallelizable.

**If a step is not complete, do not start the next step.** This is enforced by the Exit Criteria in `docs/EXIT_CRITERIA.md`.

---

## Critical Path Chain

```
STEP 1: Infrastructure Recovery
    ↓
STEP 2: Knowledge Base Repair
    ↓
STEP 3: Root Middleware + Security Baseline
    ↓
STEP 4: Decision Intelligence Integration (Real Estate)
    ↓
STEP 5: Plan Enforcement Completion
    ↓
STEP 6: Billing Integration
    ↓
STEP 7: Legal + Compliance
    ↓
MVP GATE — Platform is ready for first paying customer
    ↓
STEP 8: DI Integration (Lead Finder + Talent Finder)
    ↓
STEP 9: Observability + Monitoring
    ↓
STEP 10: Legacy AI Engine Migration
    ↓
STEP 11: Email Notifications
    ↓
STEP 12: Full Commercial Launch
```

---

## Step 1 — Infrastructure Recovery

**Status:** BLOCKED (user action required)  
**Blocker:** Supabase project was deleted. Platform is non-operational. DNS returns NXDOMAIN.  
**Parallelizable with:** Step 2 (knowledge base is documentation-only)

### Required Actions

1. Create a new Supabase project at `supabase.com`
2. Record the new `SUPABASE_URL` and `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (KEEP SECURE)
3. Apply all 6 SQL migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_audit_log.sql`
   - `supabase/migrations/004_usage_tracking.sql`
   - `supabase/migrations/005_demo_leads.sql`
   - `supabase/migrations/006_user_plans.sql`
4. Enable Row Level Security on all tables
5. Verify auth providers configured (Email/password minimum)
6. Run `npx supabase gen types typescript --project-id <id>` to generate real `supabase.types.ts`
7. Update Vercel environment variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
8. Also set in Vercel (all required for operational state):
   - `OPENAI_API_KEY`
   - `SERPAPI_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `CLOUDFLARE_WORKER_URL`
   - `AI_PROXY_URL`
   - `SEARCH_DAILY_QUOTA`
   - `SEARCH_DAILY_QUOTA_PER_USER`
   - `ADMIN_EMAILS`
   - `RESEND_API_KEY`
9. Redeploy Vercel
10. Confirm `GET /api/health` returns `{ ok: true }` on production domain
11. Confirm login works end-to-end (create account → onboarding → dashboard)

**Exit Criteria:** Platform is operational. All env vars set. `GET /api/health` returns 200. New account creation succeeds.

**Depends on:** Nothing (this is the first step)  
**Unblocks:** All subsequent steps

---

## Step 2 — Knowledge Base Repair

**Status:** NOT STARTED  
**Priority:** CRITICAL (misleads every future AI session if not fixed)  
**Parallelizable with:** Step 1

### Required Actions

1. Update `.ai/CURRENT/MASTER_PROJECT_MEMORY.md`:
   - Remove "Pre-Implementation" status for Decision Intelligence
   - Replace with "Library: COMPLETE (15 files, 61 tests). Integration: NOT STARTED."
   - Fix project name from "UNKNOWN" to "Eunoia Platform"
   - Add Decision Intelligence Architecture Sprint to completed work
2. Update `.ai/CURRENT/CURRENT_SYSTEM_MAP.md`:
   - Add "SUPERSEDED BY `docs/MODULE_INVENTORY.md` and `docs/PLATFORM_ARCHITECTURE_MAP.md`" header at top
   - Remove the false claim that no test framework exists
   - Remove the false claim that research modules don't exist
   - Correct the false claim about `proxy.ts` being middleware
3. Update `README.md`:
   - Change production URL from `ai.halannews.com` to `intelligence.eunoiazones.com`
4. Update `.ai/CURRENT/PROJECT_CONTEXT.md`:
   - Fix production URL
   - Fix Demo AI description (GPT-4o-mini via `AI_PROXY_URL`, not Claude via Cloudflare)
   - Add missing env vars: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SEARCH_DAILY_QUOTA_PER_USER`, `AI_PROXY_URL`, `ADMIN_EMAILS`
5. Update `.ai/CURRENT/START_SESSION.md` loading order:
   - Add note that SPRINT_MEMORY.md appendix content takes precedence over MASTER_PROJECT_MEMORY.md for phase/status fields when they conflict

**Exit Criteria:** A new AI session loading all `.ai/CURRENT/` documents would know: DI is implemented, test suite exists, research modules exist, `proxy.ts` is dead code, correct production URL.

**Depends on:** Nothing (documentation only)  
**Unblocks:** All future AI sessions; safe knowledge transfer

---

## Step 3 — Root Middleware + Security Baseline

**Status:** NOT STARTED  
**Priority:** HIGH SECURITY  
**Depends on:** Step 1 (Supabase must be up to test session refresh)

### Required Actions

1. Rename `proxy.ts` → `middleware.ts` (root level)
2. Rename the exported function `proxy` → `middleware`
3. Verify `config.matcher` covers all protected routes
4. Test: unauthenticated request to `/dashboard` redirects to `/login`
5. Test: authenticated session is refreshed on every request
6. Add rate limiting on auth endpoints (`/auth/sign-in`, `/auth/sign-up`)
7. Verify `SUPABASE_SERVICE_ROLE_KEY` is never in client bundle (run `grep -r SUPABASE_SERVICE_ROLE_KEY .next/static/`)

**Exit Criteria:** `proxy.ts` no longer exists. `middleware.ts` exists and executes. `/dashboard` without a session redirects. Session refresh confirmed in Supabase logs.

**Depends on:** Step 1  
**Unblocks:** Step 4 (secure foundation before integrating Decision Intelligence)

---

## Step 4 — Decision Intelligence Integration (Real Estate)

**Status:** NOT STARTED  
**Priority:** PRODUCT-CRITICAL (North Star metric depends on this)  
**Depends on:** Step 1 (Supabase for persistence), Step 3 (secure routes)

### Required Actions

1. Write `supabase/migrations/007_decisions_table.sql`:
   - Table: `decisions` with fields: id, user_id, module, request_payload, engine_output, created_at
   - RLS: `auth.uid() = user_id`
   - Apply migration
2. Define business rules for Real Estate module in `lib/decision-intelligence/rules/real-estate.ts`
3. Write data adapter: legacy engine Real Estate output → `DecisionEngineInput` type
4. Wire `runDecisionEngine()` into `/api/intelligence` route (after current AI analysis step)
5. Write `DecisionReportCard` UI component displaying:
   - Recommendation with confidence band label
   - Evidence list with source, freshness, weight
   - Business rules that fired (pass/fail)
   - Explainability panel (why winner won, why others lost)
   - Validation status badges
6. Add AI narration layer: after deterministic scoring, send option scores to GPT-4o-mini to enrich `option.aiAnalysis`
7. Persist the Decision output to `decisions` table
8. Add "View Decision Report" tab to Real Estate report output page
9. Test end-to-end: run a Real Estate request → confirm Decision Report renders with real data

**Exit Criteria:** A Real Estate feasibility request produces a Decision Report with: recommendation, confidence score with band label, at least 3 evidence items, at least 1 business rule result, explainability text. Decision is persisted to Supabase.

**Depends on:** Steps 1, 3  
**Unblocks:** MVP Gate (this is the product differentiator)

---

## Step 5 — Plan Enforcement Completion

**Status:** PARTIAL (missing enforcement on intelligence route)  
**Priority:** COMMERCIAL PREREQUISITE  
**Depends on:** Step 1 (Supabase must be up)

### Required Actions

1. Add `checkPlanLimit()` call to `/api/intelligence` route (Real Estate)
2. Return `402 Payment Required` with clear error message if limit exceeded
3. Show upgrade CTA in UI when 402 is received from intelligence route
4. Verify rate limiting (5 req/hr) is also enforced on intelligence route
5. Add `usage_tracking` insert to intelligence route (currently only research routes track usage)

**Exit Criteria:** Real Estate route respects monthly plan limit. STARTER user hitting limit sees upgrade prompt. API returns 402.

**Depends on:** Step 1  
**Unblocks:** Step 6 (billing relies on plan enforcement being correct)

---

## Step 6 — Billing Integration

**Status:** NOT STARTED  
**Priority:** COMMERCIAL PREREQUISITE  
**Depends on:** Steps 1, 5

### Required Actions

1. Choose and configure billing provider (Stripe recommended)
2. Create pricing page at `/pricing` with STARTER/PROFESSIONAL/AGENCY/ENTERPRISE plans and prices
3. Create checkout session API route: `POST /api/billing/checkout`
4. Create Stripe webhook handler: `POST /api/billing/webhook`
   - On `checkout.session.completed`: write to `user_plans` in Supabase with new plan and reset date
5. Create "Upgrade Plan" flow from Settings and from plan-limit error pages
6. Add plan display in Settings → Billing section
7. Test: complete a real checkout (test mode) → confirm `user_plans` is updated → confirm new limits apply immediately
8. Confirm webhook is secured with Stripe webhook signature verification

**Exit Criteria:** A user can go from STARTER to PROFESSIONAL without any operator action. `user_plans` is updated within seconds of payment. New plan limits are applied on next API request.

**Depends on:** Steps 1, 5  
**Unblocks:** MVP Gate

---

## Step 7 — Legal + Compliance

**Status:** NOT STARTED  
**Priority:** COMMERCIAL PREREQUISITE  
**Depends on:** None (content review, no code)

### Required Actions

1. Replace placeholder content in `/privacy` with reviewed Privacy Policy
2. Replace placeholder content in `/terms` with reviewed Terms of Service
3. Link both from login page, signup page, and footer
4. Confirm GDPR basics: account deletion deletes all data (already implemented), privacy policy covers data collection

**Exit Criteria:** `/privacy` and `/terms` contain non-placeholder, human-reviewed content. Both are linked from user-facing entry points.

**Depends on:** Nothing (can run in parallel with any step)  
**Unblocks:** MVP Gate

---

## MVP Gate

**All of the following must be complete before the platform accepts a paying customer:**

| Check | Step |
|---|---|
| Platform is operational (Supabase up, env vars set) | Step 1 |
| Knowledge base is accurate for new AI sessions | Step 2 |
| Root middleware protecting routes | Step 3 |
| Decision Intelligence live in Real Estate | Step 4 |
| Plan enforcement on all modules | Step 5 |
| Self-serve billing | Step 6 |
| Legal pages reviewed | Step 7 |

**Run the MVP Acceptance Criteria in `docs/MVP_DEFINITION.md` in full before declaring MVP complete.**

---

## Step 8 — DI Integration (Lead Finder + Talent Finder)

**Status:** NOT STARTED  
**Depends on:** Step 4 (pattern established in Real Estate)  
**Priority:** POST-MVP

Repeat the DI integration pattern from Step 4 for Lead Finder and Talent Finder:
- Business rules per module
- Data adapters from research engine output → `DecisionEngineInput`
- AI narration layer
- `DecisionReportCard` reuse or extension
- Persistence

---

## Step 9 — Observability + Monitoring

**Status:** NOT STARTED  
**Depends on:** MVP Gate (need a live platform to monitor)  
**Priority:** POST-MVP, pre-marketing

- Integrate APM provider (Sentry recommended)
- Add structured logging to all API routes
- Add uptime monitor for `intelligence.eunoiazones.com`
- Add alerting on error rate spikes and quota exhaustion

---

## Step 10 — Legacy AI Engine Migration

**Status:** NOT STARTED  
**Depends on:** Step 8 (all three modules have DI integration)  
**Priority:** POST-MVP

Migrate the 35 report types in `services/legacy-ai-engine/` to the Decision Intelligence pattern. Retire the legacy engine when migration is complete.

---

## Step 11 — Email Notifications

**Status:** NOT STARTED  
**Depends on:** Step 1 (Resend needs live domain), MVP Gate  
**Priority:** POST-MVP

- Set `RESEND_API_KEY` and verify sender domain
- Welcome email on signup
- Quota warning at 80% usage
- Plan upgrade confirmation
- Report ready notification (if async processing added later)

---

## Step 12 — Full Commercial Launch

**Status:** NOT STARTED  
**Depends on:** Steps 8–11  
**Priority:** Commercial milestone

- All three modules with DI integration
- Observability live
- Legacy engine retired
- Email notifications working
- Marketing site live and pointing to platform

---

## Dependency Summary

```
Step 1 (Infrastructure) ──────────────────────────────────────────── UNBLOCKS ALL
Step 2 (Knowledge Base) ─ parallel with Step 1 ──────────────────── UNBLOCKS Future AI Sessions
Step 3 (Middleware) ──── depends: Step 1 ─────────────────────────── UNBLOCKS Step 4
Step 4 (DI Real Estate) ─ depends: Steps 1, 3 ────────────────────── MVP BLOCKER
Step 5 (Plan Enforce) ─── depends: Step 1 ─────────────────────────── MVP BLOCKER
Step 6 (Billing) ────────  depends: Steps 1, 5 ─────────────────────── MVP BLOCKER
Step 7 (Legal) ──────────  no dependencies ─────────────────────────── MVP BLOCKER
      ↓
MVP GATE (Steps 1–7 complete)
      ↓
Step 8 (DI Expansion) ─── depends: Step 4 ─────────────────────────── Post-MVP
Step 9 (Observability) ─── depends: MVP Gate ────────────────────────── Post-MVP
Step 10 (Legacy Migration) depends: Step 8 ──────────────────────────── Post-MVP
Step 11 (Email) ───────── depends: MVP Gate ─────────────────────────── Post-MVP
Step 12 (Launch) ─────────  depends: Steps 8–11 ──────────────────────── Commercial
```

---

*Critical Path is canonical. Changes require technical lead sign-off.*
