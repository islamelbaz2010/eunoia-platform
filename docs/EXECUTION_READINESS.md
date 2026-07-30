# Execution Readiness

**Date:** 2026-07-21  
**Purpose:** Assess readiness of every planned future sprint before any new session begins execution.  
**Status values:** READY / PARTIAL / BLOCKED / NOT STARTED

---

## Sprint 1 — Infrastructure Recovery

**Objective:** Restore Supabase, environment variables, and make the platform operational.

**Status:** PARTIAL

**Prerequisites:**
- New Supabase project (user action — cannot be done by AI session)
- Access to Vercel project dashboard (user action)

**Blockers:**
- Supabase project `mickjkhjjmskoswqatpl` deleted — DNS NXDOMAIN
- Production Vercel env vars for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL` are either absent or pointing to deleted project

**Required Documents:**
- `docs/PLATFORM_STATE_ASSESSMENT.md` — recovery checklist (section 8)
- `docs/INTEGRATION_MATRIX.md` — SQL migration order
- `.env.example` — complete env var list

**Estimated Complexity:** LOW (configuration only — no code changes)

**Risk:** LOW — all code is correct; only infrastructure is missing

**Execution Steps (for user):**
1. Create new Supabase project
2. Run 6 SQL migrations in order: reports-table → research-tables → plan-enforcement → leads-table → audit-log → usage-tracking
3. Update all Vercel env vars for all 3 environments
4. Fill `.env.local` for local dev
5. Run `npx prisma db push`
6. Redeploy Vercel project
7. Verify: load `/login`, create account, run one research request, check admin console

**Missing for Full Readiness:** User must provision Supabase and run SQL migrations.

---

## Sprint 2 — Root Middleware + Type Safety

**Objective:** Fix the root middleware gap (DEBT-002) and generate real Supabase types (DEBT-003).

**Status:** READY (after Infrastructure Recovery)

**Prerequisites:**
- Infrastructure Recovery complete (Supabase project active, env vars set)
- Supabase project ID known (for `supabase gen types typescript`)

**Blockers:**
- None in code
- Blocked on Infrastructure Recovery

**Required Documents:**
- `docs/TECHNICAL_DEBT_REGISTER.md` — DEBT-002, DEBT-003
- `docs/PLATFORM_STATE_ASSESSMENT.md` — security section

**Estimated Complexity:** LOW

**Risk:** LOW — Root middleware is ~10 lines; type generation is a single CLI command

**Execution Steps:**
1. Create `middleware.ts` at repo root that calls `updateSession()` from `lib/supabase/middleware.ts`
2. Run `npx supabase gen types typescript --project-id <new-project-id> > types/supabase.types.ts`
3. Fix any TypeScript errors introduced by real types (likely `as any` casts in research routes)
4. Run `npm run typecheck`, `npm test`, `npm run build`

**Missing for Full Readiness:** Nothing code-wise; depends on Supabase project.

---

## Sprint 3 — Decision Intelligence Integration (Phase 1: Real Estate)

**Objective:** Wire `runDecisionEngine()` into the Real Estate module as the first production integration of the Decision Intelligence library.

**Status:** PARTIAL

**Prerequisites:**
- Decision Intelligence Engine: COMPLETE (all 15 files, 61 tests)
- Real Estate module: ACTIVE (via `/api/intelligence`)
- Data adapter: NOT WRITTEN — must convert legacy engine output to `DecisionEngineInput`
- Business rules: NOT DEFINED — Real Estate feasibility rules must be defined

**Blockers:**
- Business rules for Real Estate feasibility not yet defined (domain knowledge required)
- No `decisions` Supabase table (SQL migration must be written and applied)
- No `DecisionReportCard` UI component

**Required Documents:**
- `docs/DECISION_INTELLIGENCE_READINESS.md` (this sprint produces it)
- `docs/FEATURE_MATRIX.md` — Feature 1 (Real Estate), Feature 13 (Decision Engine)

**Estimated Complexity:** HIGH (requires domain knowledge for rules, data adapter, persistence, and UI component)

**Risk:** MEDIUM — Data adapter from legacy engine output to `DecisionEngineInput` is the main risk; legacy output is unstructured JSON.

**Execution Steps:**
1. Define Real Estate feasibility business rules (RuleCondition + RuleAction)
2. Write `supabase/decisions-table.sql` and apply in Supabase
3. Create `lib/decision-intelligence/adapters/real-estate-adapter.ts`
4. Modify `/api/intelligence` to pass through Decision Engine after legacy AI call
5. Add AI narration: enrich `DecisionOption.aiAnalysis` using GPT-4o-mini
6. Create `components/decision-report-card.tsx`
7. Update `/dashboard/real-estate` page to render `DecisionReportCard`
8. Run tests + typecheck + build

**Missing for Full Readiness:** Business rules definition (domain knowledge); SQL migration; UI design.

---

## Sprint 4 — Decision Intelligence Integration (Phase 2: Lead Finder + Talent Finder)

**Objective:** Extend Decision Intelligence to Lead Finder (lead quality scoring) and Talent Finder (hire/no-hire decision).

**Status:** PARTIAL

**Prerequisites:**
- Sprint 3 complete (Real Estate integration proves the pattern)
- Lead quality business rules defined
- Talent market rules defined

**Blockers:**
- Business rules for lead quality and talent hiring not defined
- Talent Finder is pure AI — evidence model needs to be defined

**Required Documents:**
- `docs/DECISION_INTELLIGENCE_READINESS.md`
- `docs/FEATURE_MATRIX.md` — Features 2, 3, 13

**Estimated Complexity:** HIGH

**Risk:** MEDIUM — Lead Finder has rich data (SerpAPI results, Apollo enrichment, company validation scores) that maps naturally to `EvidenceItem[]`. Talent Finder is harder because it has no real data to put into the evidence model.

**Missing for Full Readiness:** Business rules; evidence model design for Talent Finder.

---

## Sprint 5 — Legacy AI Engine Migration

**Objective:** Migrate all 35 legacy AI report types from `services/legacy-ai-engine/` to the Decision Intelligence framework. Retire legacy engine.

**Status:** NOT STARTED

**Prerequisites:**
- Sprints 3 and 4 complete (Decision Engine proven in production)
- Mapping of 35 legacy analysis types to Decision Engine domains

**Blockers:**
- 35 report types need mapping to evidence + rules + options structure
- Legacy engine output is unstructured JSON — all 35 prompt outputs have different schemas

**Required Documents:**
- `docs/MODULE_INVENTORY.md` — section 3 (legacy engine file list)
- `docs/FEATURE_MATRIX.md` — Feature 1

**Estimated Complexity:** VERY HIGH (35 report types × adaptation work)

**Risk:** HIGH — Regressing existing Real Estate functionality; maintaining backward compatibility for existing stored reports

**Missing for Full Readiness:** Decision Engine proven in Sprints 3-4; migration plan per report type.

---

## Sprint 6 — Billing Integration

**Objective:** Implement self-serve plan upgrade via Stripe (or equivalent).

**Status:** BLOCKED

**Prerequisites:**
- Billing provider decision (Stripe, Paddle, LemonSqueezy, or other)
- Stripe account and API keys
- Pricing tier decision (monthly/annual, per-tier prices)
- Webhook endpoint configuration in Stripe dashboard

**Blockers:**
- Provider not chosen
- No Stripe keys
- No pricing page exists
- No pricing decision documented

**Required Documents:**
- `docs/TECHNICAL_DEBT_REGISTER.md` — DEBT-011
- `docs/FEATURE_MATRIX.md` — Feature 14 (Billing)
- `docs/DOMAIN_COVERAGE.md` — section 7 (Billing)

**Estimated Complexity:** HIGH (checkout, webhook, plan activation, UI, error handling)

**Risk:** HIGH — Billing integration is revenue-critical; incorrect webhook idempotency can result in duplicate plan activations or missed activations

**Missing for Full Readiness:** Provider decision; pricing decision; Stripe keys.

---

## Sprint 7 — Observability (APM + Structured Logging)

**Objective:** Add Sentry (or equivalent) for error monitoring and structured logging.

**Status:** BLOCKED

**Prerequisites:**
- APM provider decision (Sentry, Datadog, New Relic, Axiom)
- Provider credentials (DSN, API key)

**Blockers:**
- Provider not chosen

**Required Documents:**
- `docs/TECHNICAL_DEBT_REGISTER.md` — DEBT-012

**Estimated Complexity:** MEDIUM

**Risk:** LOW (instrumentation addition, no logic changes)

**Missing for Full Readiness:** Provider decision; credentials.

---

## Sprint 8 — Marketplace / Knowledge Engine

**Objective:** Build a module that aggregates industry insights from Decision Intelligence outputs across users (aggregate, not per-user).

**Status:** NOT STARTED

**Prerequisites:**
- Decision Intelligence integration complete (Sprints 3-4)
- Supabase `decisions` table with anonymized aggregate query support
- Product design for marketplace

**Blockers:**
- Decision Intelligence not integrated
- No product design
- No privacy review for aggregate data

**Estimated Complexity:** VERY HIGH

**Risk:** HIGH — Requires careful privacy design (aggregate-only, no cross-user data leakage)

**Missing for Full Readiness:** Sprints 3-4 complete; product design; privacy review.

---

## Sprint 9 — CRM Integration

**Objective:** Allow users to push Lead Finder results into a CRM (HubSpot, Salesforce, or custom).

**Status:** NOT STARTED

**Prerequisites:**
- CRM provider choice
- Lead Finder stabilized (Sprint 4)
- OAuth or API key flow for CRM connection

**Blockers:**
- Provider not chosen
- No CRM integration design

**Estimated Complexity:** HIGH

**Risk:** MEDIUM

**Missing for Full Readiness:** Provider decision; design; credentials.

---

## Sprint 10 — Multi-Tenant (Teams)

**Objective:** Extend the platform from single-user to team/workspace accounts with seat management.

**Status:** NOT STARTED

**Prerequisites:**
- Billing in place (Sprint 6) — team plans require billing
- Complete single-user experience (all above sprints)
- Data model redesign (all Supabase tables currently use `user_id`, not `workspace_id`)

**Blockers:**
- All prior sprints blocked or incomplete
- Data model migration is invasive (every RLS policy touches `user_id`)
- No Workspace.plan → Supabase user_plans reconciliation done (DEBT-007)

**Estimated Complexity:** VERY HIGH

**Risk:** VERY HIGH — Schema migration on live data; auth model change

**Missing for Full Readiness:** Sprints 1-6 complete; schema migration plan.

---

## Sprint 11 — Commercial Launch

**Objective:** Platform is publicly marketed to paying customers with full self-serve.

**Status:** BLOCKED

**Prerequisites:**
- Infrastructure operational (Sprint 1)
- Billing in place (Sprint 6)
- Legal content (Privacy Policy + Terms reviewed)
- APM (Sprint 7)
- Decision Engine integrated into at least one module (Sprint 3)

**Blockers:**
- Supabase deleted (Sprint 1)
- Billing not started (Sprint 6)
- Legal content is placeholder
- No email notifications
- No onboarding email

**Estimated Complexity:** HIGH (many parallel tracks)

**Risk:** HIGH

**Missing for Full Readiness:** Sprints 1, 3, 6, 7 complete; legal review; email sender domain.

---

## Sprint 12 — AI Agents

**Objective:** Autonomous AI research agents that periodically run Lead Finder / Talent Finder searches on the user's behalf and surface updates in the dashboard.

**Status:** NOT STARTED

**Prerequisites:**
- Decision Intelligence fully integrated (Sprints 3-4)
- Billing in place (agent features are upsell)
- Queue/async processing infrastructure

**Blockers:**
- All prior sprints incomplete
- No async job queue (would need Vercel Queues, BullMQ, or equivalent)

**Estimated Complexity:** VERY HIGH

**Risk:** HIGH

**Missing for Full Readiness:** Sprints 1, 3, 4, 6 complete; async job infrastructure decision.

---

## Readiness Summary

| Sprint | Status | Blockers |
|---|---|---|
| 1 — Infrastructure Recovery | PARTIAL | User must provision Supabase |
| 2 — Root Middleware + Types | READY (post-Sprint 1) | Sprint 1 |
| 3 — Decision Engine: Real Estate | PARTIAL | Business rules; SQL; UI design |
| 4 — Decision Engine: Research | PARTIAL | Sprint 3; business rules |
| 5 — Legacy AI Migration | NOT STARTED | Sprints 3-4 |
| 6 — Billing | BLOCKED | Provider decision |
| 7 — Observability | BLOCKED | Provider decision |
| 8 — Marketplace | NOT STARTED | Sprints 3-4; product design |
| 9 — CRM Integration | NOT STARTED | Provider decision; design |
| 10 — Multi-Tenant | NOT STARTED | Sprints 1-6 |
| 11 — Commercial Launch | BLOCKED | Sprints 1, 3, 6, 7; legal |
| 12 — AI Agents | NOT STARTED | Sprints 1, 3, 4, 6; infra |

---

*Execution readiness produced 2026-07-21. Read-only assessment.*
