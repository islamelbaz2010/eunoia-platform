# Execution Roadmap

**Date:** 2026-07-21  
**Owner:** Technical Lead  
**Canonical references:** `docs/CRITICAL_PATH.md`, `docs/EXIT_CRITERIA.md`, `docs/MVP_DEFINITION.md`

---

## Roadmap Structure

Each sprint has:
- **Sprint ID and Name**
- **Status:** BLOCKED | READY | IN PROGRESS | COMPLETE
- **Scope:** What is built or changed
- **Depends On:** Prerequisites that must be complete
- **Unblocks:** What becomes possible after this sprint
- **Effort:** S (hours) | M (1–2 days) | L (3–5 days) | XL (1+ week)
- **Health Score Delta:** Estimated overall health score improvement
- **Exit Criteria Reference:** Where pass/fail criteria are defined

---

## Pre-Sprint: Foundation (BLOCKED — User Action Required)

**Status:** BLOCKED  
**Action:** Founder must create a new Supabase project before any sprint can begin.

There is no code sprint that recovers a deleted Supabase project. The recovery action is manual infrastructure provisioning. Once completed, Sprint 1 can begin.

---

## Sprint 1: Infrastructure Recovery

**Status:** BLOCKED (requires pre-sprint Supabase creation)  
**Effort:** M  
**Health Score Delta:** +11 (Infrastructure 15 → 65, Code Quality 78 → 82)

### Scope
- Set all environment variables in Vercel (see Section 2 of `docs/PRODUCTION_CHECKLIST.md`)
- Apply all 6 SQL migrations in Supabase
- Enable RLS on all tables
- Enable PITR in Supabase
- Generate Supabase TypeScript types (`npx supabase gen types typescript`)
- Replace stub `types/supabase.types.ts` with generated file
- Remove all `supabase as any` casts from research routes
- Verify Vercel redeploy succeeds
- Verify `GET /api/health` returns 200 on production

### Depends On
- Supabase project created (user action)

### Unblocks
- All sprints that require auth, database, or API routes
- Sprint 3 (middleware testing requires live auth)
- Sprint 4 (DI integration requires persistence)
- Sprint 5 (plan enforcement requires live user_plans)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 1 (criteria 1.1–1.15 + Global)

---

## Sprint 2: Knowledge Base Repair

**Status:** READY (documentation only — no Supabase dependency)  
**Effort:** S  
**Health Score Delta:** +3 (Documentation 55 → 70, Knowledge 52 → 72)

### Scope
- Update `MASTER_PROJECT_MEMORY.md`: fix DI status from "Pre-Implementation" to "Library: COMPLETE"
- Update `CURRENT_SYSTEM_MAP.md`: add SUPERSEDED header; remove false claims about tests and research modules
- Update `README.md`: fix production URL
- Update `PROJECT_CONTEXT.md`: fix URL, env vars, demo AI description
- Update `START_SESSION.md` loading order guidance

### Depends On
- Nothing (documentation changes only)
- Can run in parallel with Sprint 1

### Unblocks
- Safe new AI sessions: any future session loads correct state
- Trust in bootstrap procedure

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 2 (criteria 2.1–2.8 + Global)

---

## Sprint 3: Root Middleware + Security Baseline

**Status:** BLOCKED on Sprint 1  
**Effort:** S  
**Health Score Delta:** +2 (Security 62 → 70, Architecture 72 → 74)

### Scope
- Rename `proxy.ts` → `middleware.ts` at repository root
- Rename exported function `proxy` → `middleware`
- Verify and update `config.matcher` to cover all protected routes
- Add rate limiting on auth endpoints
- Verify service role key is absent from client bundle

### Depends On
- Sprint 1 (Supabase must be live to test session refresh and middleware behavior)

### Unblocks
- Sprint 4 (secure route foundation before DI integration)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 3 (criteria 3.1–3.7 + Global)

---

## Sprint 4: Decision Intelligence Integration — Real Estate

**Status:** BLOCKED on Sprints 1, 3  
**Effort:** XL  
**Health Score Delta:** +10 (Decision Intelligence 38 → 68, Commercial 22 → 40)

### Scope
- Write `supabase/migrations/007_decisions_table.sql` and apply it
- Define Real Estate business rules in `lib/decision-intelligence/rules/real-estate.ts`
- Write data adapter: legacy Real Estate output → `DecisionEngineInput`
- Wire `runDecisionEngine()` into `/api/intelligence` route
- Write AI narration layer (post-scoring GPT-4o-mini call)
- Persist decision to `decisions` table
- Build `DecisionReportCard` UI component
- Add "Decision Report" view to Real Estate output page
- Write tests for business rules and data adapter

### Depends On
- Sprint 1 (Supabase for decisions table persistence and auth)
- Sprint 3 (secure route before adding new route logic)

### Unblocks
- MVP Gate (DI in at least one module is required for MVP)
- Sprint 8 (DI expansion pattern established)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 4 (criteria 4.1–4.12 + Global)

---

## Sprint 5: Plan Enforcement Completion

**Status:** BLOCKED on Sprint 1  
**Effort:** S  
**Health Score Delta:** +3 (Commercial 40 → 45, Security 70 → 72)

### Scope
- Add `checkPlanLimit()` to `/api/intelligence` route
- Return 402 when limit exceeded; include upgrade prompt in response
- Add UI upgrade CTA for 402 from intelligence route
- Add rate limiting to `/api/intelligence`
- Add `usage_tracking` insert to intelligence route
- Write at least one test for plan enforcement on intelligence route

### Depends On
- Sprint 1 (plan enforcement requires live `user_plans` table)

### Unblocks
- Sprint 6 (billing must build on correct plan enforcement)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 5 (criteria 5.1–5.5 + Global)

---

## Sprint 6: Billing Integration

**Status:** BLOCKED on Sprints 1, 5  
**Decision Required:** Billing provider selection (see `docs/ADR_REGISTER.md` ADR-PENDING-003)  
**Effort:** XL  
**Health Score Delta:** +9 (Commercial 45 → 72, Architecture 74 → 76)

### Scope
- Create `/pricing` page with all plans and prices
- Implement Stripe (or chosen provider) checkout session route: `POST /api/billing/checkout`
- Implement webhook handler: `POST /api/billing/webhook`
  - Verify webhook signature
  - On successful checkout: write to `user_plans`
- Add "Upgrade Plan" flow from Settings
- Add "Upgrade Plan" CTA from plan-limit error responses
- Update Settings page to show current plan + billing management
- Write tests for webhook handler (mock Stripe events)
- End-to-end test in Stripe test mode

### Depends On
- Sprint 1 (Supabase for user_plans writes)
- Sprint 5 (plan enforcement must be correct before billing is built)
- Billing provider decision (ADR-PENDING-003)

### Unblocks
- MVP Gate (self-serve billing is required for MVP)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 6 (criteria 6.1–6.8 + Global)

---

## Sprint 7: Legal + Compliance

**Status:** READY (content review only — no code dependency)  
**Effort:** S (writing time; legal review may add time)  
**Health Score Delta:** +1

### Scope
- Replace placeholder Privacy Policy at `/privacy` with reviewed content
- Replace placeholder Terms of Service at `/terms` with reviewed content
- Link both pages from signup, login, and footer
- Confirm deletion and export cover GDPR Article 17 and 20 requirements

### Depends On
- Nothing (can run in parallel with any technical sprint)
- Legal review by founder or legal counsel

### Unblocks
- MVP Gate (reviewed legal pages are required for MVP)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 7 (criteria 7.1–7.4 + Global)

---

## MVP Gate

**Requires:** Sprints 1–7 complete + MVP Acceptance Criteria from `docs/MVP_DEFINITION.md` all passing.

**Estimated overall health score at MVP Gate:** ~70/100

**After MVP Gate:** Platform accepts first paying customer. All self-serve flows work. Decision Intelligence is live for Real Estate.

---

## Sprint 8: Decision Intelligence Expansion (Lead Finder + Talent Finder)

**Status:** NOT STARTED — POST-MVP  
**Effort:** L per module (2 modules = L total)  
**Health Score Delta:** +8 (Decision Intelligence 68 → 82, Commercial 72 → 78)

### Scope
Repeat Sprint 4 pattern for:
- Lead Finder: business rules, data adapter, DI integration, UI update
- Talent Finder: business rules, data adapter, DI integration, UI update

North Star Metric: 0 → per-user, per-module coverage (2 additional module integrations)

### Depends On
- Sprint 4 (pattern established; `DecisionReportCard` component reused)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 8

---

## Sprint 9: Observability + Monitoring

**Status:** NOT STARTED — POST-MVP  
**Decision Required:** APM provider selection (see `docs/ADR_REGISTER.md` ADR-PENDING-004)  
**Effort:** M  
**Health Score Delta:** +8 (Observability 12 → 65)

### Scope
- Integrate APM provider (Sentry recommended)
- Add structured logging to all API routes
- Set up uptime monitor for production URL
- Configure error rate alert

### Depends On
- MVP Gate (need a live platform to instrument)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 9

---

## Sprint 10: Legacy AI Engine Migration

**Status:** NOT STARTED — POST-MVP  
**Effort:** XL  
**Health Score Delta:** +4 (Architecture 76 → 80, Code Quality 82 → 85)

### Scope
- Migrate all 35 legacy report types to Decision Intelligence pattern
- Remove dependency on `services/legacy-ai-engine/`
- Retire `CLOUDFLARE_WORKER_URL` env var (after proxy decision resolved)
- Add tests for all migrated types

### Depends On
- Sprint 8 (all three modules have DI integration; migration pattern fully established)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 10

---

## Sprint 11: Email Notifications

**Status:** NOT STARTED — POST-MVP  
**Effort:** M  
**Health Score Delta:** +1

### Scope
- Set `RESEND_API_KEY` and verify Resend sender domain
- Welcome email on signup
- Quota warning at 80% usage
- Plan upgrade confirmation

### Depends On
- MVP Gate (domain must be live for email verification)

### Exit Criteria
See `docs/EXIT_CRITERIA.md` — Sprint 11

---

## Sprint 12: Full Commercial Launch

**Status:** NOT STARTED  
**Effort:** S (coordination sprint, not implementation)

### Scope
- Verify all Sprint 9–11 exit criteria
- Marketing site live and pointing to platform
- Domain email configured
- Customer support process defined
- Billing receipts verified (Stripe)
- Disaster recovery procedure documented and tested

### Depends On
- Sprints 8, 9, 10, 11

---

## Roadmap Summary

| Sprint | Name | Status | Effort | Unblocks |
|---|---|---|---|---|
| Pre | Supabase Recovery | BLOCKED (user) | - | All |
| 1 | Infrastructure Recovery | BLOCKED | M | 3, 4, 5, 6 |
| 2 | Knowledge Base Repair | **READY** | S | Future AI sessions |
| 3 | Root Middleware | BLOCKED (S1) | S | 4 |
| 4 | DI Real Estate | BLOCKED (S1, S3) | XL | MVP Gate, S8 |
| 5 | Plan Enforcement | BLOCKED (S1) | S | S6 |
| 6 | Billing | BLOCKED (S1, S5) | XL | MVP Gate |
| 7 | Legal | **READY** | S | MVP Gate |
| **MVP Gate** | — | BLOCKED | — | Paying customers |
| 8 | DI Expansion | NOT STARTED | L | S10 |
| 9 | Observability | NOT STARTED | M | S12 |
| 10 | Legacy Migration | NOT STARTED | XL | S12 |
| 11 | Email | NOT STARTED | M | S12 |
| 12 | Full Launch | NOT STARTED | S | — |

**First executable action today:** Sprint 2 (Knowledge Base Repair) — no dependencies, documentation only.

**First infrastructure action:** Founder creates new Supabase project, enables PITR, runs 6 migrations, sets all env vars in Vercel.

---

*Execution Roadmap is canonical. Changes require Technical Lead approval and sprint memory update.*
