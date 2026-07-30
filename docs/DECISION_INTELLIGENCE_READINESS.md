# Decision Intelligence Readiness

**Date:** 2026-07-21  
**Purpose:** Verify every component of the Decision Intelligence Engine against its spec, then list every gap that must be closed before the engine becomes production-ready end-to-end.

---

## 1. Architecture Verification

### Type System

| Component | File | Status | Notes |
|---|---|---|---|
| Decision lifecycle (DRAFT→EVALUATING→VALIDATED→COMPLETED\|REJECTED\|ARCHIVED) | `lib/decision-intelligence/types/decision.types.ts` | COMPLETE | Branded IDs: DecisionId, OptionId; append-only audit trail via DecisionStatusEvent |
| Evidence model | `lib/decision-intelligence/types/evidence.types.ts` | COMPLETE | 6 source types; authority weights; freshness; contradiction detection via negative reference weights |
| Confidence model | `lib/decision-intelligence/types/confidence.types.ts` | COMPLETE | 5 dimensions; weights sum to 1.0 (validated at module load); ConfidenceBand: VERY_HIGH/HIGH/MEDIUM/LOW/VERY_LOW |
| Business rules | `lib/decision-intelligence/types/rules.types.ts` | COMPLETE | 4 actions (PASS/FAIL/WARN/REQUIRE_OVERRIDE); 11 operators; AND within group; OR between groups |
| Validation pipeline | `lib/decision-intelligence/types/validation.types.ts` | COMPLETE | 5 stages ordered (structural→business→evidence→confidence→consistency); DEFAULT_VALIDATION_THRESHOLDS |
| Explainability structures | `lib/decision-intelligence/types/explainability.types.ts` | COMPLETE | WHY, WHY_NOT, EVIDENCE_USED, RULES_TRIGGERED; DecisionExplainability |
| Universal Decision Report | `lib/decision-intelligence/types/report.types.ts` | COMPLETE | Schema version 1.0.0; self-contained; ReportMetadata with generatedBy='decision-engine-v1' |
| Types barrel | `lib/decision-intelligence/types/index.ts` | COMPLETE | All 7 type files re-exported |

---

### Evidence Subsystem

| Component | File | Status | Notes |
|---|---|---|---|
| Evidence collection | `lib/decision-intelligence/evidence/evidence-collector.ts` | COMPLETE | Validates items; exponential freshness decay per source type half-life; contradiction detection; returns EvidenceCollection with stats |
| Evidence weighting | `lib/decision-intelligence/evidence/evidence-weighter.ts` | COMPLETE | FACTOR_WEIGHTS: sourceAuthority=0.40, freshness=0.35, confidence=0.25; normalizes to sum=1.0 |

**Freshness half-lives (verified):**
- `human_validation`: 720h (30 days)
- `internal_data`: 168h (7 days)
- `user_input`: 168h (7 days)
- `document`: 720h (30 days)
- `external_source`: 24h
- `ai_analysis`: 48h

---

### Engine Layer

| Component | File | Status | Notes |
|---|---|---|---|
| Confidence engine | `lib/decision-intelligence/engine/confidence-engine.ts` | COMPLETE | 5 dimension functions; identifies weakest/strongest; band classification |
| Rules engine | `lib/decision-intelligence/engine/rules-engine.ts` | COMPLETE | Priority ordering; dot-notation path resolution; 11 operators; filterRulesForDomain() |
| Validation engine | `lib/decision-intelligence/engine/validation-engine.ts` | COMPLETE | Halt on blocking FAIL; remaining stages recorded as SKIP (audit-safe); PASSED/FAILED/PARTIAL status |
| Explainability engine | `lib/decision-intelligence/engine/explainability-engine.ts` | COMPLETE | Zero AI calls; deterministic from computed scores; all 4 explanation types |
| Decision orchestrator | `lib/decision-intelligence/engine/decision-engine.ts` | COMPLETE | Full pipeline: rules→weights→confidence→validation→recommendation→explainability→report |
| Public API barrel | `lib/decision-intelligence/index.ts` | COMPLETE | All public types and functions re-exported |

---

### Test Coverage

| Test File | Tests | Status |
|---|---|---|
| `evidence-collector.test.ts` | 10 | PASSING |
| `evidence-weighter.test.ts` | 8 | PASSING |
| `confidence-engine.test.ts` | 10 | PASSING |
| `rules-engine.test.ts` | 12 | PASSING |
| `validation-engine.test.ts` | 8 | PASSING |
| `decision-engine.test.ts` | 13 | PASSING |
| **Total** | **61** | **ALL PASSING** |

---

## 2. Integration Points — Current State

| Integration Point | Required For | Status |
|---|---|---|
| Route wiring: Real Estate | Decision reports in `/dashboard/real-estate` | NOT STARTED |
| Route wiring: Lead Finder | Lead quality decisions in `/api/research/leads` | NOT STARTED |
| Route wiring: Talent Finder | Hire/no-hire decisions in `/api/research/talent` | NOT STARTED |
| Data adapter: Real Estate | Convert legacy engine output → DecisionEngineInput | NOT STARTED |
| Data adapter: Lead Finder | Convert research pipeline output → DecisionEngineInput | NOT STARTED |
| Data adapter: Talent Finder | Convert AI estimate → DecisionEngineInput | NOT STARTED |
| Persistence: decisions table | Store DecisionEngineResult in Supabase | NOT STARTED |
| Persistence: reports table | Store UniversalDecisionReport in Supabase | NOT STARTED |
| UI: DecisionReportCard | Display UniversalDecisionReport | NOT STARTED |
| UI: ConfidenceBadge | Display ConfidenceScore band | NOT STARTED |
| UI: EvidenceTimeline | Display evidence items with freshness | NOT STARTED |
| UI: ExplainabilityPanel | Display WHY/WHY_NOT/RULES explanations | NOT STARTED |
| AI narration layer | Enrich DecisionOption.aiAnalysis post-scoring | NOT STARTED |
| Business rules: Real Estate | RuleFacts schema + RuleConditions for feasibility | NOT STARTED |
| Business rules: Lead Finder | RuleFacts schema + RuleConditions for lead quality | NOT STARTED |
| Business rules: Talent Finder | RuleFacts schema + RuleConditions for hiring | NOT STARTED |

**Integration completeness:** 0% of integration points started.

---

## 3. Persistence Layer — What Must Be Built

The following SQL table must be created in Supabase and the file added to `supabase/`:

```sql
-- decisions table (to be created as supabase/decisions-table.sql)
CREATE TABLE decisions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain        TEXT NOT NULL,              -- 'real_estate' | 'lead_finder' | 'talent_finder'
  input_hash    TEXT NOT NULL,              -- SHA-256 of DecisionEngineInput for dedup
  status        TEXT NOT NULL,              -- DecisionStatus enum
  confidence    JSONB NOT NULL,             -- ConfidenceScore
  recommendation JSONB,                    -- DecisionRecommendation (nullable if REJECTED)
  report        JSONB NOT NULL,             -- UniversalDecisionReport
  explainability JSONB NOT NULL,            -- DecisionExplainability
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  schema_version TEXT NOT NULL DEFAULT '1.0.0'
);

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own decisions"
  ON decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert"
  ON decisions FOR INSERT WITH CHECK (true);
```

---

## 4. Business Rules — What Must Be Defined

For each domain, a `BusinessRule[]` array must be authored. These cannot be generated automatically — they require domain knowledge from the product owner.

### Real Estate Rules (examples of what must be defined)

```
Required rules include (not exhaustive):
- Debt Service Coverage Ratio (DSCR) < 1.0 → FAIL (blocking)
- Net Operating Income (NOI) < 0 → FAIL (blocking)
- Vacancy rate > market benchmark + 20% → WARN
- Construction cost > 150% of comparable → WARN
- Permit/zoning status = "pending" → REQUIRE_OVERRIDE
- City market score < 40 → WARN
- Sector demand trend = "declining" → WARN
```

### Lead Finder Rules (examples)

```
- Company domain score < 30 → FAIL (exclude from results)
- Source type = "government" | "job_board" | "directory" → FAIL
- Company name = Wikipedia article title → FAIL
- SerpAPI domain mismatch with company name > threshold → WARN
- No employee count data → WARN
- LinkedIn URL absent → WARN
```

### Talent Finder Rules (examples)

```
- Salary estimate variance > 40% → WARN (AI uncertainty)
- Hiring demand = "very_low" → WARN
- No candidate sources for location → REQUIRE_OVERRIDE
```

**Status:** All rules are NOT YET DEFINED. Business rules require product owner input.

---

## 5. AI Narration Layer — Design

The Decision Intelligence Engine itself makes zero AI calls. AI narration is a caller-side concern. The intended design:

```
runDecisionEngine(input)
        │
        ▼
DecisionEngineResult (fully computed)
        │
        ▼ [caller adds narration]
For each DecisionOption in result.decision.options:
  option.aiAnalysis = await OpenAI.chat({
    system: "You are a business analyst. Interpret this option's scores.",
    user: JSON.stringify({
      ruleScore: option.ruleScore,
      blockedByRules: option.blockedByRules,
      flaggingRuleIds: option.flaggingRuleIds,
      whyNot: result.explainability.whyNot.find(w => w.optionId === option.id)
    })
  })
```

**Status:** NOT STARTED. Library is designed for it (aiAnalysis field exists on DecisionOption); implementation not written.

---

## 6. UI Components — What Must Be Built

| Component | Purpose | Inputs | Status |
|---|---|---|---|
| `DecisionReportCard` | Full report view | `UniversalDecisionReport` | NOT STARTED |
| `ConfidenceBadge` | Visual band indicator | `ConfidenceBand`, `overall` score | NOT STARTED |
| `EvidenceTimeline` | List evidence items by age | `EvidenceItem[]` | NOT STARTED |
| `RuleViolationList` | Show blocking and warning rules | `RuleEvaluationResult[]` | NOT STARTED |
| `ExplainabilityPanel` | WHY/WHY_NOT expandable | `DecisionExplainability` | NOT STARTED |
| `OptionComparisonTable` | Side-by-side option scoring | `OptionScoringRow[]` | NOT STARTED |

---

## 7. Everything Required Before Production-Ready

Ordered by dependency:

1. **Infrastructure Recovery** — Supabase project must exist for persistence to work
2. **Business Rules Authoring** — For each domain: Real Estate, Lead Finder, Talent Finder (requires product owner input; not a code task)
3. **Persistence SQL** — `supabase/decisions-table.sql` must be written and applied
4. **Data Adapters** — One adapter per domain converting existing pipeline output to `DecisionEngineInput`
5. **Route Integration** — Modify each API route to call `runDecisionEngine()` after the existing pipeline
6. **AI Narration** — GPT-4o-mini enrichment step for `DecisionOption.aiAnalysis`
7. **API Response Schema** — Update each route's response to include `decision`, `confidence`, `explainability`, and `report`
8. **UI Components** — At minimum `DecisionReportCard` and `ConfidenceBadge`
9. **Page Updates** — Update Real Estate, Lead Finder, Talent Finder pages to render new components
10. **End-to-End Testing** — Vitest integration tests for each adapter; E2E for at least one module
11. **Supabase Types Update** — After persistence table is created, regenerate `types/supabase.types.ts`

---

## 8. Production Readiness Score

| Dimension | Score | Notes |
|---|---|---|
| Library implementation | 100% | 15 files, 61 tests, all passing |
| Route integration | 0% | Zero routes wired |
| Persistence | 0% | No SQL table; no write calls |
| Business rules | 0% | None defined for any domain |
| UI | 0% | No components exist |
| AI narration | 0% | Not implemented |
| End-to-end tests | 0% | Library only |
| **Overall production readiness** | **~15%** | Library ready; product integration not started |

---

*Decision Intelligence readiness produced 2026-07-21. Read-only assessment.*
