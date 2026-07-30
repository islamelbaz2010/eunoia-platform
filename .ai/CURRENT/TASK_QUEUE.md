# Task Queue

**Updated:** 2026-07-21

---

## Done

**Session 1 (2026-07-21):**
- Show monthly plan usage on `/dashboard`.
- Show current plan and monthly usage on `/dashboard/settings`.
- Add tests for `checkPlanLimit`.
- Add tests for `checkRateLimit`.
- Restore lint command compatibility with Next 16 / ESLint 9.
- Hide raw dashboard error messages from customers.
- Add dashboard error reference tests.
- Add tests for `research-service.ts`, `ai-analysis.ts`, and `search-provider.ts`.
- Add quota-blocked upgrade CTA in dashboard research flows.
- Add failed-request recovery cards and retry links in report history.
- Add baseline Privacy Policy and Terms pages with legal-review placeholders.
- Add lightweight health-check endpoint for uptime monitoring.

**Session 2 (2026-07-21):**
- Add account data export (`/api/account/export`).
- Add account deletion with cascade (`/api/account/delete`).
- Add Download My Data + Delete Account UI to Settings.
- Add Supabase admin client (`lib/supabase/admin.ts`).
- Add admin identity check (`lib/admin/auth.ts`).
- Add admin/ops console (`/dashboard/admin`, `/api/admin/users`, `/api/admin/users/[id]/plan`).
- Add conditional Admin Console link in sidebar.
- Add quota warning banner to dashboard (80%/100%).
- Add audit log table SQL (`supabase/audit-log.sql`).
- Add `lib/admin/audit.ts` — writes to audit_log on plan changes and account deletions.
- Add 2-step onboarding product tour to `/dashboard/onboarding`.
- Convert analytics page to server component with live user research stats.
- Remove dead-code PLAN_LIMITS/PLAN_LABELS from workspace.types.ts.
- Document plan model architecture split in both types files.

**Session 3 — Decision Intelligence Architecture (2026-07-21):**
- Create `lib/decision-intelligence/` directory structure.
- Create 7 type definition files (decision, evidence, confidence, rules, validation, explainability, report).
- Create evidence subsystem (collector + weighter).
- Create confidence engine.
- Create rules engine.
- Create validation engine.
- Create explainability engine.
- Create decision engine (top-level orchestrator).
- Create public barrel index.
- Create comprehensive test suite (6 files, 61 tests).
- All verifications: typecheck ✓, lint ✓, 194 tests ✓, build ✓.

**Sessions 4–5 — Documentation + Architecture Sprints (2026-07-21):**
- Platform State Assessment: 5 docs (PLATFORM_STATE_ASSESSMENT, PLATFORM_ARCHITECTURE_MAP, MODULE_INVENTORY, INTEGRATION_MATRIX, TECHNICAL_DEBT_REGISTER)
- Canonicalization Sprint: 9 docs (CONSISTENCY_AUDIT, FEATURE_MATRIX, DOMAIN_COVERAGE, DEPENDENCY_GRAPH, EXECUTION_READINESS, DECISION_INTELLIGENCE_READINESS, KNOWLEDGE_GAPS, PROJECT_HEALTH_SCORE, BOOTSTRAP_VALIDATION)
- Final Executive Documentation Sprint: 11 docs (NORTH_STAR, PROJECT_EXECUTION_MASTER, MVP_DEFINITION, CRITICAL_PATH, PROJECT_DEPENDENCY_DAG, EXECUTION_RULEBOOK, EXIT_CRITERIA, ADR_REGISTER, PRODUCTION_CHECKLIST, PROJECT_KPIS, EXECUTION_ROADMAP)
- Final Architecture Sprint: 1 doc (DECISION_INTELLIGENCE_ARCHITECTURE)

---

## Current

No active engineering tasks. Platform is non-operational (Supabase deleted). Awaiting infrastructure recovery.

---

## Next

**Immediately executable — no external dependencies:**

1. **Sprint 2: Knowledge Base Repair** (documentation only)
   - Update `MASTER_PROJECT_MEMORY.md`: remove "Pre-Implementation" for DI; add "Library: COMPLETE"; fix project name from "UNKNOWN"
   - Update `CURRENT_SYSTEM_MAP.md`: add SUPERSEDED header; remove false claims about tests and research modules
   - Update `README.md`: fix production URL to `intelligence.eunoiazones.com`
   - Update `PROJECT_CONTEXT.md`: fix URL, env vars, demo AI description; add `AI_PROXY_URL`, `SEARCH_DAILY_QUOTA_PER_USER`, `ADMIN_EMAILS`
   - Update `START_SESSION.md` loading order guidance

**Requires Supabase restoration first:**

2. **Sprint 1: Infrastructure Recovery** (user action required)
   - Create new Supabase project
   - Apply 6 SQL migrations (`supabase/migrations/001_*.sql` through `006_*.sql`)
   - Apply `supabase/audit-log.sql`
   - Enable RLS on all tables; enable PITR
   - Generate Supabase TypeScript types
   - Set all Vercel env vars (see `docs/PRODUCTION_CHECKLIST.md` Section 2)
   - Redeploy Vercel; verify `GET /api/health` returns 200

3. **Sprint 3: Root Middleware + Security Baseline**
   - Rename `proxy.ts` → `middleware.ts` at repo root
   - Rename exported function `proxy` → `middleware`
   - Verify `config.matcher` covers all protected routes
   - Test unauthenticated `/dashboard` redirect

4. **Sprint 4: Decision Intelligence Integration — Real Estate** (depends on Sprints 1, 3)
   - Write `supabase/migrations/007_decisions_table.sql`
   - Define Real Estate business rules (`lib/decision-intelligence/rules/real-estate.ts`)
   - Write data adapter: legacy engine output → `DecisionEngineInput`
   - Wire `runDecisionEngine()` into `/api/intelligence`
   - Add DVE validation check: handle `pipelineStatus = REJECTED` (422 response)
   - Add AI narration layer (GPT-4o-mini post-scoring)
   - Add `trustScore: TrustScore` to `UniversalDecisionReport` (`report.types.ts`)
   - Persist decision to `decisions` table
   - Build `DecisionReportCard` UI component

5. **Sprint 5: Plan Enforcement Completion** (depends on Sprint 1)
   - Add `checkPlanLimit()` to `/api/intelligence`

6. **Sprint 6: Billing Integration** (depends on Sprints 1, 5; requires founder decision)
   - Requires provider decision (ADR-PENDING-003)

---

## Blocked

- **Supabase recovery:** Platform non-operational. DNS returns NXDOMAIN. User must create new Supabase project.
- **Vercel env vars:** Most production env vars are missing or point to deleted project.
- **Billing integration:** Provider decision required (ADR-PENDING-003).
- **APM/monitoring:** Provider decision required (ADR-PENDING-004).
- **Legal pages:** Content requires legal review.
- **Business rules (Real Estate, Leads, Talent):** Require founder domain input — not a code task.
- **Proxy env var unification:** Decision required (ADR-PENDING-002) before Sprint 3 proxy configuration.

---

## Pending Founder Decisions (from `docs/ADR_REGISTER.md`)

| ADR | Decision | Needed Before |
|---|---|---|
| ADR-PENDING-001 | Remove or sync `Workspace.plan` in Prisma? | Sprint 6 |
| ADR-PENDING-002 | Unify `CLOUDFLARE_WORKER_URL` and `AI_PROXY_URL`? | Sprint 3 |
| ADR-PENDING-003 | Choose billing provider (Stripe recommended) | Sprint 6 |
| ADR-PENDING-004 | Choose APM provider (Sentry recommended) | Sprint 9 |
