# Active Sprint

**Updated:** 2026-07-21

## Sprint Name

Commercial Readiness Visibility & Trust Sprint

## Sprint Objective

Convert existing server-side enforcement and operational hygiene into customer-visible, production-safe product behavior without requiring new third-party billing or monitoring secrets.

## Completed

**Session 1:**
- Usage meter on the main dashboard.
- Plan and monthly usage summary in Settings.
- Working `npm run lint` command for the current Next/ESLint stack.
- Unit tests for plan enforcement and rate limiting.
- Customer-safe dashboard error boundary.
- Unit tests for dashboard error references.
- Focused research-service, AI-analysis, and search-provider tests.
- Quota-blocked upgrade CTA in dashboard research flows.
- Failed-request recovery cards and retry links in report history.
- Baseline Privacy Policy and Terms pages.
- Public `/api/health` endpoint with regression coverage.

**Session 2:**
- Account data export (`/api/account/export` → Download My Data in Settings).
- Account deletion (`/api/account/delete` + confirmation dialog in Settings).
- Admin/ops console (`/dashboard/admin`) with user list, usage, and plan management.
- Admin API routes (`/api/admin/check`, `/api/admin/users`, `/api/admin/users/[id]/plan`).
- Admin Console sidebar link (shown only to admin users via `/api/admin/check`).
- Quota warning banner on dashboard at ≥80% and 100% usage.
- Audit log infrastructure (`supabase/audit-log.sql`, `lib/admin/audit.ts`).
- Audit log wired to plan-change and account-delete events.
- 2-step onboarding product tour.
- Market Intelligence page upgraded with live per-user research stats.
- Plan model architecture documented and dead code removed from workspace.types.ts.

## Completed (Decision Intelligence Sprint)

**Session 3 — Decision Intelligence Architecture:**
- Created `lib/decision-intelligence/` directory structure with 4 subdirectories.
- Created 7 type files in `lib/decision-intelligence/types/`:
  - `decision.types.ts` — Decision lifecycle (DRAFT→EVALUATING→VALIDATED→COMPLETED|REJECTED|ARCHIVED), branded IDs, audit trail
  - `evidence.types.ts` — Multi-type evidence model (6 source types, authority weights, freshness, references)
  - `confidence.types.ts` — 5-dimension confidence model (weights sum to 1.0, validated at module load)
  - `rules.types.ts` — Deterministic business rules (conditions, operators, PASS/FAIL/WARN/REQUIRE_OVERRIDE)
  - `validation.types.ts` — 5-stage validation pipeline (structural→business→evidence→confidence→consistency)
  - `explainability.types.ts` — WHY/WHY_NOT/EVIDENCE/RULES explanation structures
  - `report.types.ts` — Universal Decision Report v1.0.0 schema
  - `index.ts` — Types barrel export
- Created 2 evidence subsystem files in `lib/decision-intelligence/evidence/`:
  - `evidence-collector.ts` — Validates items, computes freshness via exponential decay, detects contradictions
  - `evidence-weighter.ts` — Normalizes weights using source authority × freshness × confidence formula
- Created 5 engine files in `lib/decision-intelligence/engine/`:
  - `confidence-engine.ts` — Computes all 5 confidence dimensions, identifies weakest/strongest
  - `rules-engine.ts` — Evaluates rules in priority order, AND within groups, OR between groups
  - `validation-engine.ts` — Runs 5-stage pipeline, halts on blocking failures, skips remaining stages
  - `explainability-engine.ts` — Builds WHY/WHY_NOT/EVIDENCE/RULES explanations deterministically (no AI calls)
  - `decision-engine.ts` — Top-level orchestrator: rules → weights → confidence → validation → recommendation → explainability → report
- Created `lib/decision-intelligence/index.ts` — Public API barrel
- Created 4 test files in `lib/decision-intelligence/__tests__/`:
  - `evidence-collector.test.ts` — 10 tests
  - `evidence-weighter.test.ts` — 8 tests
  - `confidence-engine.test.ts` — 10 tests
  - `rules-engine.test.ts` — 12 tests
  - `validation-engine.test.ts` — 8 tests
  - `decision-engine.test.ts` — 13 tests

## Completed (Decision Benchmark Suite — 2026-07-30)

**Session 6 — Decision Benchmark Suite:**
- Created `lib/decision-intelligence/benchmark/` directory with 10 files.
- `types.ts` — BenchmarkCase, BenchmarkEngineInput (plain-string boundary types), BenchmarkReport, BenchmarkCaseResult.
- `cases/feasibility.cases.ts` — 4 canonical feasibility cases.
- `cases/campaign-roi.cases.ts` — 3 canonical campaign ROI cases.
- `cases/market-entry.cases.ts` — 3 canonical market entry cases.
- `cases/lead-gen.cases.ts` — 3 canonical lead gen cases.
- `cases/full-analysis.cases.ts` — 3 canonical full analysis cases.
- `cases/index.ts` — GOLD_DATASET (16 cases total).
- `runner.ts` — `runBenchmark()` executes all 16 cases against the live engine.
- `report.ts` — `generateAccuracyReport()` produces markdown accuracy report.
- `__tests__/benchmark.test.ts` — 33 Vitest regression tests; 100% recommendation accuracy threshold; ≥80% overall threshold.
- Discovered and documented canonical engine behavior: FAIL rules → `pipelineStatus = 'FAILED'` → `recommendation = null` (all 5 blocked-option cases updated accordingly).
- Verification: **315 tests passing** (31 test files). 0 failures. TypeScript clean.

## In Progress

- None.

## Blocked

- Stripe or equivalent billing integration: requires provider decision and secrets.
- APM/structured monitoring integration: requires provider decision and project token/DSN.
- Admin/ops console at runtime: requires `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_EMAILS` in production env.
- Authenticated user notification emails: requires sender/domain and notification policy decision.
- Final Privacy Policy and Terms: requires legal review.
- `supabase/audit-log.sql`: must be applied in Supabase SQL Editor before audit logging is active.
