# PHASE 4 EXECUTION PLAN
**Platform:** Eunoia Intelligence Platform  
**Phase:** 4 — Module Completion  
**Prepared:** 2026-07-30  
**Baseline commit:** `8dbd6df`  
**Status:** PLANNED — Do not execute until owner prerequisites are complete.

---

## Prerequisites (Before Starting Phase 4)

The following owner actions (from `OWNER_ACTIONS.md`) must be complete before Phase 4 begins:

| Owner Action | Why Required for Phase 4 |
|---|---|
| ACTION-01: Revoke Anthropic key | Security baseline before new feature work |
| ACTION-02: Apply DB migration (AGENCY enum) | Schema must match code |
| ACTION-03: Supabase credentials + type regen | TypeScript safety required before new integrations |
| ACTION-05: Confirm Supabase project identity | Integration target must be known |

**Do not begin Step 1 of Phase 4 until all four prerequisites are confirmed complete.**

---

## Phase 4 Objective

Transform the platform from a research-only service into the AI intelligence product described in ADR-005: a system that sells **Validated Decisions**, not AI reports.

The Decision Intelligence Engine (`lib/decision-intelligence/`) is fully built with 61 passing tests. Phase 4 wires it to users.

**Absolute constraints (same as prior phases):**
- Do not redesign the DI Engine architecture
- Do not rewrite working code
- Do not expand scope beyond what is listed here
- One logical change per commit
- Every step must end with: typecheck PASS, lint PASS, tests PASS, build PASS

---

## Step 1 — Remove `/api/debug-env` Empty Stub

**Why first:** Cleaning this before any integrations prevents it appearing in route inventories and avoids confusion about what routes are live.

**Task:** Delete `app/api/debug-env/route.ts`  
**Verification:** `npm run build` — route `/api/debug-env` must not appear in build output  
**Rollback:** `git revert` — no downstream consumers  
**Test plan:** Confirm no existing tests import or call `/api/debug-env`

**Acceptance criteria:**
- File deleted
- Build PASS (route removed from output)
- No test failures

---

## Step 2 — Regenerate Supabase Types

**Why second:** Every subsequent step touches research routes. Proper TypeScript types remove `as any` casts before new code is added on top of them.

**Task:** Replace the 10-line stub in `types/supabase.types.ts` with generated output  
**Command:** `npx supabase gen types typescript --project-id <project-id> > types/supabase.types.ts`  
**Expected outcome:** Full type definitions for `user_plans`, `research_requests`, `reports`, `leads`, `audit_log`, `usage_events`

**After regeneration:**
1. Remove `as any` casts in `lib/research/plan-enforcement.ts`
2. Remove `as any` casts in `app/api/admin/users/route.ts` (Supabase queries)
3. Remove `as any` casts in `app/api/admin/users/[id]/plan/route.ts`

**Verification:** `npm run typecheck` — must PASS with 0 errors after cast removal  
**Rollback:** `git revert` the type file change; restore `as any` casts

**Test plan:**
- All 202 existing tests must continue passing (types are compile-only; no behavior change)
- `npm run typecheck` must return 0 errors

**Acceptance criteria:**
- `types/supabase.types.ts` contains real table definitions
- All `as any` casts in research routes removed
- 202 tests PASS
- 0 typecheck errors

---

## Step 3 — Add `TrustScore` to `UniversalDecisionReport`

**Why third:** The `UniversalDecisionReport` type is the public API surface of the DI Engine. Adding `TrustScore` before integration ensures every downstream consumer gets a complete type from day one.

**Context:** `UniversalDecisionReport` in `lib/decision-intelligence/types/report.types.ts` currently has `confidenceScore: number` (0–100) in the `ReportExecutiveSummary`. The architecture spec calls for a named `TrustScore` that exposes this value with additional metadata for consumers who need to render it.

**Task:**
1. Add a `TrustScore` type to `lib/decision-intelligence/types/confidence.types.ts`:
   ```typescript
   export interface TrustScore {
     readonly score: number          // 0–100
     readonly band: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
     readonly label: string          // human-readable band label
     readonly isRuleDetermined: boolean
   }
   ```
2. Add `trustScore: TrustScore` field to `UniversalDecisionReport` in `report.types.ts`
3. Update `engine/decision-engine.ts` to populate the new field from existing `ConfidenceScore` data (no new computation — this is a data reshaping only)
4. Export `TrustScore` from `lib/decision-intelligence/index.ts`

**Why this is safe:** The DI Engine has zero callers. Adding a field to a type with no consumers cannot break anything.

**Rollback:** `git revert` — no callers affected  

**Test plan:**
- All 61 DI Engine tests must pass (they verify engine output structure)
- Add one test to the decision-engine test file verifying `trustScore` is populated
- `npm run typecheck` — 0 errors

**Acceptance criteria:**
- `TrustScore` type defined and exported
- `UniversalDecisionReport.trustScore` populated by `runDecisionEngine()`
- 202 + 1 = 203 tests passing (minimum)
- 0 typecheck errors

---

## Step 4 — Market Intelligence Route Integration (First DI Integration)

**Why this route first:** `/api/intelligence/route.ts` is already the most complete route. It accepts structured input, calls OpenAI, and returns a report. The DI Engine can be layered in without changing the existing OpenAI call.

**Integration pattern — calculate-then-narrate:**
```
User request
  → Existing input validation (unchanged)
  → Existing plan enforcement (unchanged)
  → runDecisionEngine(input) [NEW — pure function, no I/O]
  → Existing OpenAI call (narrates the DI output) [input prompt may be enriched]
  → Return response with both DI output + OpenAI narration [NEW field in response]
```

**What the DI Engine needs (input mapping):**
- `decisionId`: generate from user ID + timestamp
- `decisionDomain`: `'market_intelligence'`
- `options`: derive from the intelligence query options (e.g., market entry vs. market expansion)
- `evidence`: derive from search results already collected by the route
- `rules`: use default market intelligence ruleset (to be defined — see Domain Rules note below)

**Domain Rules Note:** The Market Intelligence rules are not yet defined. Step 4 will use a minimal ruleset that is correct but sparse. Full business rules are a separate deliverable (Step 6). The integration must work with an empty or minimal ruleset — the engine is designed for this.

**Output mapping:**
- `response.decisionReport`: the full `UniversalDecisionReport` from the DI Engine
- `response.narrative`: existing OpenAI output (unchanged)
- `response.trustScore`: `UniversalDecisionReport.trustScore` promoted to top-level for easy client consumption

**Risk:** The intelligence route is the most complex in the codebase (~1000 lines). The DI call must be wrapped in try/catch — if the DI Engine throws, the route must fall back to the current behavior (narration only) and log the error. Never let DI failure break AI narration.

**Fail-safe pattern:**
```typescript
let decisionReport: UniversalDecisionReport | null = null
try {
  const diResult = runDecisionEngine(diInput)
  decisionReport = diResult.report
} catch (err) {
  console.error('[intelligence/di]', err)
  // narration proceeds without DI enrichment
}
```

**Rollback plan:** The DI call is additive (new field in response). If the DI output is wrong, the field can be removed in a single commit without affecting any other behavior. No database writes are introduced in this step.

**Test plan:**
1. Add tests to a new `app/api/intelligence/route.test.ts`:
   - Mock `runDecisionEngine` to return a valid report → verify `decisionReport` in response
   - Mock `runDecisionEngine` to throw → verify response still returns narration (fail-safe)
   - Verify `trustScore` appears at top level of response
2. All 202 existing tests must continue passing

**Acceptance criteria:**
- `runDecisionEngine` is called on every valid intelligence request
- `decisionReport` and `trustScore` appear in the API response
- DI failure does not break the existing narration flow
- All tests PASS (typecheck, lint, tests, build)

---

## Step 5 — Universal Report Storage

**Why now:** Phase 4 integration is incomplete if DI reports are computed and returned but never persisted. Storage enables report history, audit trails, and future retrieval.

**Current state:** The Supabase `reports` table already exists (from `supabase/reports-table.sql`). The intelligence route already writes to it for narration output. The DI report JSON will be stored alongside the narration.

**Task:** Modify the `reports` table write in the intelligence route to include the `DecisionReport` in the `output` JSONB column alongside the existing narration.

**Schema change required:** The `output` column is already `jsonb`. No schema migration is needed — the new field is added to the JSON object: `{ narration: "...", decisionReport: { ... } }`. This is backwards-compatible with existing rows.

**Rollback:** The `output` column change is additive JSON. Existing rows remain readable. Reverting the write code returns output to narration-only format.

**Test plan:**
1. Mock Supabase write in test and verify `output.decisionReport` is present
2. Verify existing rows without `decisionReport` do not cause read errors
3. All existing tests PASS

**Acceptance criteria:**
- Every completed intelligence request stores `decisionReport` in Supabase `reports.output`
- Existing data remains accessible
- All tests PASS

---

## Step 6 — Business Rules Definition (Founder Input Gate)

**This step is BLOCKED on founder input. Engineering cannot proceed without domain knowledge.**

The DI Engine's `ValidationRule[]` for each domain must be defined by someone with knowledge of the business domain. The engine evaluates rules, scores options, and generates recommendations — but the rules themselves encode the platform's intelligence.

**What engineering needs from the founder per domain:**

### Market Intelligence Domain
Questions to answer:
- What makes a market opportunity HIGH confidence? (e.g., market size > $X, competition < Y players)
- What are automatic blockers? (e.g., regulatory restriction, market saturation)
- What evidence sources are most trusted? (news, financial data, competitor analysis)

### Real Estate Domain
Questions to answer:
- What makes a property/location HIGH confidence for a client's criteria?
- What are deal-breakers? (e.g., flood zone, zoning mismatch)
- What data sources validate location quality?

### Leads Domain
Questions to answer:
- What makes a lead HIGH quality? (seniority level, company size, budget signals)
- What disqualifies a lead? (competitor, wrong geography)
- What evidence increases confidence? (LinkedIn activity, company news)

### Talent Domain
Questions to answer:
- What makes a candidate HIGH match? (skills, experience years, availability signals)
- What are automatic mismatches?
- What evidence increases match confidence?

**Deliverable from founder:** A structured brief per domain. Can be in prose — engineering will translate to `ValidationRule[]` types.

**Engineering will then:**
1. Implement rules as typed `ValidationRule[]` constants in `lib/decision-intelligence/rules/`
2. Write unit tests for each rule set
3. Register rules with the engine

---

## Step 7 — Real Estate Route Integration

After Market Intelligence is proven stable (Step 4–5) and business rules are defined (Step 6), the Real Estate route receives DI integration using the same pattern.

**Prerequisite:** Steps 4–6 complete.  
**Pattern:** Same as Step 4 (calculate-then-narrate, fail-safe wrapper, store output).  
**Domain rules:** From Step 6.

---

## Step 8 — Lead Finder Route Integration

Same pattern applied to `/api/research/leads`.

**Prerequisite:** Steps 4–7 complete.  
**Pattern:** Same as Step 4.  
**Domain rules:** From Step 6.  
**Additional consideration:** Lead quality scores from the DI Engine should surface in the lead table UI.

---

## Rollback Plan (Phase 4 Global)

Every Step is independently revertable. The DI integration uses the additive pattern throughout:
- New fields added to responses (never existing fields removed)
- DI calls wrapped in try/catch (fail-safe to current behavior)
- No database schema changes required (JSONB column is flexible)

To revert any individual step: `git revert <commit>`. The platform returns to the state before that step. No data migration is needed because the DI output is stored in an existing flexible JSON column.

**Full Phase 4 rollback:** `git revert` all Phase 4 commits. Platform returns to Phase 3 state. All Phase 3 tests continue passing.

---

## Test Plan Summary

| Step | New Tests | Existing Tests |
|---|---|---|
| Step 1 (remove debug-env) | 0 | 202 must pass |
| Step 2 (Supabase types) | 0 (type-only change) | 202 must pass |
| Step 3 (TrustScore) | +1 (trustScore populated) | 202 must pass |
| Step 4 (MI integration) | +3 minimum (happy path, DI fail-safe, trustScore) | 203 must pass |
| Step 5 (report storage) | +1 (decisionReport in output) | 206+ must pass |
| Step 6 (business rules) | +N per domain rule | All previous must pass |
| Step 7 (real estate) | +3 minimum | All previous must pass |
| Step 8 (leads) | +3 minimum | All previous must pass |

**Gate:** Every step must end with ALL tests passing. No step may introduce a failing test.

---

## Acceptance Criteria — Phase 4 Complete

Phase 4 is complete when:

1. `/api/debug-env` route is removed
2. `types/supabase.types.ts` contains real generated types; all `as any` casts removed from research routes
3. `UniversalDecisionReport.trustScore` is populated and exported
4. At least one production API route returns `decisionReport` and `trustScore` in its response
5. Decision reports are persisted to Supabase `reports` table
6. Business rules are defined and tested for at least one domain
7. All existing 202+ tests continue passing
8. Typecheck PASS, Lint PASS, Build PASS
9. Phase 4 completion report generated

---

## Phase 4 Does Not Include

To prevent scope creep — the following are explicitly NOT Phase 4:
- Billing integration (Phase 6)
- Self-service plan upgrades (Phase 6)
- UI for DI report display (Phase 5)
- APM or structured logging (Phase 5)
- CI/CD pipeline changes (Phase 5)
- Domain rules for Talent finder (if business rules are defined only for MI and Real Estate)
- Any new routes or pages not listed above
