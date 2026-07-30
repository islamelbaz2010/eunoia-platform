# Decision Intelligence Architecture

**Date:** 2026-07-21  
**Owner:** Technical Lead  
**Status:** CANONICAL — This document defines the permanent architecture of the Decision Intelligence system. All implementation sprints must conform to it.

**Sources verified against:** `lib/decision-intelligence/` (all 15 source files, 6 test files, 61 passing tests); `lib/decision-intelligence/types/` (all 7 type files); `docs/DECISION_INTELLIGENCE_READINESS.md`; `docs/NORTH_STAR.md`

---

## Canonical Product Identity

**The Eunoia Platform does NOT sell AI reports.**

**The Eunoia Platform sells VALIDATED BUSINESS DECISIONS.**

A report is a format. A decision is the product. The distinction is architectural:

| Report (what others sell) | Validated Decision (what Eunoia sells) |
|---|---|
| AI text output | Deterministic scoring + AI narration |
| Non-reproducible | Same inputs always produce same scores |
| No confidence measure | Five-dimensional confidence score |
| No rules applied | Domain-specific business rules enforced |
| No explainability | Full WHY/WHY_NOT/RULES explanation |
| Cannot be rejected | Rejected if validation fails |
| No audit trail | Immutable status history |
| Trust: "the AI said so" | Trust: evidence + rules + validation |

**Decision Intelligence is NOT the final product output.**  
**A Validated Decision — one that has passed the Decision Validation Engine — is the final product output.**

A decision that reaches the Decision Intelligence Engine but fails the Decision Validation Engine is REJECTED. A REJECTED decision does not become a product output. The customer only receives a VALIDATED or COMPLETED decision.

This is the platform's core competitive advantage: the Decision Validation Engine is the quality gate that a generic AI tool cannot replicate.

---

## Complete Intelligence Pipeline

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        INTELLIGENCE PIPELINE                               │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  STAGE 1: DATA SOURCES                                              │  │
│  │                                                                     │  │
│  │  SerpAPI      Apollo.io     User Inputs    Internal Benchmarks      │  │
│  │  (web search) (enrichment)  (form data)    (sectors, cities data)   │  │
│  │       ↓            ↓             ↓                  ↓               │  │
│  └───────────────────────────────────────────────────────────────────  │  │
│                              │                                          │  │
│  ┌───────────────────────────▼─────────────────────────────────────┐   │  │
│  │  STAGE 2: RESEARCH ENGINE                                       │   │  │
│  │                                                                 │   │  │
│  │  search → source-collection → normalization → deduplication     │   │  │
│  │  → company-validation → company-size → source-quality           │   │  │
│  │  → ranking → apollo-enrichment → ai-analysis                   │   │  │
│  │                                                                 │   │  │
│  │  Output: structured, normalized, scored research result         │   │  │
│  └─────────────────────────────┬───────────────────────────────── │   │  │
│                                │                                   │   │  │
│  ┌─────────────────────────────▼────────────────────────────────┐  │   │  │
│  │  STAGE 3: EVIDENCE COLLECTION                                │  │   │  │
│  │                                                              │  │   │  │
│  │  evidence-collector.ts                                       │  │   │  │
│  │  · Validates each evidence item (required fields, types)     │  │   │  │
│  │  · Applies exponential freshness decay per source type       │  │   │  │
│  │    half-lives: human_validation=720h, document=720h,         │  │   │  │
│  │    internal_data=168h, user_input=168h, ai_analysis=48h,     │  │   │  │
│  │    external_source=24h                                       │  │   │  │
│  │  · Detects contradictions via negative reference weights     │  │   │  │
│  │  · Returns EvidenceCollection with stats                     │  │   │  │
│  └──────────────────────────────┬───────────────────────────── │  │   │  │
│                                 │                               │  │   │  │
│  ┌──────────────────────────────▼──────────────────────────┐    │  │   │  │
│  │  STAGE 4: EVIDENCE NORMALIZATION (WEIGHTING)            │    │  │   │  │
│  │                                                         │    │  │   │  │
│  │  evidence-weighter.ts                                   │    │  │   │  │
│  │  FACTOR_WEIGHTS:                                        │    │  │   │  │
│  │    sourceAuthority = 0.40                               │    │  │   │  │
│  │    freshness        = 0.35                              │    │  │   │  │
│  │    confidence       = 0.25                              │    │  │   │  │
│  │  · Normalizes weights so collection sums to 1.0         │    │  │   │  │
│  │  · Output: weighted EvidenceItem[]                      │    │  │   │  │
│  └─────────────────────────────┬───────────────────────── │    │  │   │  │
│                                │                           │    │  │   │  │
│  ┌─────────────────────────────▼────────────────────────┐  │    │  │   │  │
│  │  STAGE 5: DECISION INTELLIGENCE ENGINE (DIE)         │  │    │  │   │  │
│  │                                                      │  │    │  │   │  │
│  │  decision-engine.ts (orchestrator)                   │  │    │  │   │  │
│  │                                                      │  │    │  │   │  │
│  │  5a. evaluateRules(rules, facts) per option          │  │    │  │   │  │
│  │      → rules-engine.ts                               │  │    │  │   │  │
│  │      11 operators; AND within group; OR between      │  │    │  │   │  │
│  │      Priority ordering; dot-notation path resolve    │  │    │  │   │  │
│  │                                                      │  │    │  │   │  │
│  │  5b. computeConfidenceScore(input)                   │  │    │  │   │  │
│  │      → confidence-engine.ts                          │  │    │  │   │  │
│  │      5 dimensions; weights sum to 1.0 (invariant)    │  │    │  │   │  │
│  │      Bands: VERY_HIGH≥85, HIGH≥70, MEDIUM≥50,        │  │    │  │   │  │
│  │             LOW≥30, VERY_LOW<30                      │  │    │  │   │  │
│  │                                                      │  │    │  │   │  │
│  │  5c. selectRecommendation(options, rules, confidence) │  │    │  │   │  │
│  │      Highest-scoring non-blocked option wins         │  │    │  │   │  │
│  │                                                      │  │    │  │   │  │
│  │  Output: Decision (EVALUATING) + ConfidenceScore     │  │    │  │   │  │
│  │          + RuleEvaluationResults + Recommendation    │  │    │  │   │  │
│  └─────────────────────────────┬───────────────────── │  │    │  │   │  │
│                                │                       │  │    │  │   │  │
│  ┌─────────────────────────────▼────────────────────┐  │  │    │  │   │  │
│  │  STAGE 6: DECISION VALIDATION ENGINE (DVE)       │  │  │    │  │   │  │
│  │                                                  │  │  │    │  │   │  │
│  │  validation-engine.ts                            │  │  │    │  │   │  │
│  │                                                  │  │  │    │  │   │  │
│  │  ┌──────────────────────────────────────────┐   │  │  │    │  │   │  │
│  │  │ Stage 1: structural                      │   │  │  │    │  │   │  │
│  │  │ Stage 2: business    HALT-AND-SKIP:      │   │  │  │    │  │   │  │
│  │  │ Stage 3: evidence    blocking FAIL =     │   │  │  │    │  │   │  │
│  │  │ Stage 4: confidence  halt pipeline;      │   │  │  │    │  │   │  │
│  │  │ Stage 5: consistency remaining = SKIP    │   │  │  │    │  │   │  │
│  │  └──────────────────────────────────────────┘   │  │  │    │  │   │  │
│  │                                                  │  │  │    │  │   │  │
│  │  ValidationResult.pipelineStatus:               │  │  │    │  │   │  │
│  │    PASSED  → Decision transitions to VALIDATED  │  │  │    │  │   │  │
│  │    FAILED  → Decision transitions to REJECTED   │  │  │    │  │   │  │
│  │    PARTIAL → Decision transitions to REJECTED   │  │  │    │  │   │  │
│  │             (warnings surfaced in report)       │  │  │    │  │   │  │
│  │                                                  │  │  │    │  │   │  │
│  │  VALIDATED decisions proceed to Report Builder   │  │  │    │  │   │  │
│  │  REJECTED decisions return rejection report      │  │  │    │  │   │  │
│  └──────────────────────────┬─────────────────── │  │  │    │  │   │  │
│                             │ VALIDATED only      │  │  │    │  │   │  │
│  ┌──────────────────────────▼──────────────────┐  │  │  │    │  │   │  │
│  │  STAGE 7: AI NARRATION LAYER                │  │  │  │    │  │   │  │
│  │  (caller-side — optional, post-scoring)     │  │  │  │    │  │   │  │
│  │                                             │  │  │  │    │  │   │  │
│  │  For each DecisionOption:                   │  │  │  │    │  │   │  │
│  │    option.aiAnalysis = GPT-4o-mini.chat({   │  │  │  │    │  │   │  │
│  │      ruleScore, blockedByRules,             │  │  │  │    │  │   │  │
│  │      flaggingRuleIds, whyNot                │  │  │  │    │  │   │  │
│  │    })                                       │  │  │  │    │  │   │  │
│  │                                             │  │  │  │    │  │   │  │
│  │  Calculate-then-narrate:                    │  │  │  │    │  │   │  │
│  │  AI narrates scores it did NOT compute      │  │  │  │    │  │   │  │
│  │  Decision is valid without narration        │  │  │  │    │  │   │  │
│  └──────────────────────────┬───────────────── │  │  │    │  │   │  │
│                             │                   │  │  │    │  │   │  │
│  ┌──────────────────────────▼──────────────┐    │  │  │    │  │   │  │
│  │  STAGE 8: DECISION REPORT BUILDER       │    │  │  │    │  │   │  │
│  │                                         │    │  │  │    │  │   │  │
│  │  explainability-engine.ts + report      │    │  │  │    │  │   │  │
│  │                                         │    │  │  │    │  │   │  │
│  │  8a. generateExplainability(args)        │    │  │  │    │  │   │  │
│  │      WHY, WHY_NOT, EVIDENCE_USED,       │    │  │  │    │  │   │  │
│  │      RULES_TRIGGERED; zero AI calls     │    │  │  │    │  │   │  │
│  │                                         │    │  │  │    │  │   │  │
│  │  8b. assembleUniversalDecisionReport()  │    │  │  │    │  │   │  │
│  │      schemaVersion: '1.0.0'             │    │  │  │    │  │   │  │
│  │      generatedBy: 'decision-engine-v1'  │    │  │  │    │  │   │  │
│  │                                         │    │  │  │    │  │   │  │
│  │  Output: UniversalDecisionReport        │    │  │  │    │  │   │  │
│  │  (self-contained; immutable)            │    │  │  │    │  │   │  │
│  └──────────────────────────┬─────────── │    │  │  │    │  │   │  │
│                             │             │    │  │  │    │  │   │  │
│  ┌──────────────────────────▼──────────┐  │    │  │  │    │  │   │  │
│  │  STAGE 9: PERSISTENCE               │  │    │  │  │    │  │   │  │
│  │                                     │  │    │  │  │    │  │   │  │
│  │  Supabase: decisions table          │  │    │  │  │    │  │   │  │
│  │  (NOT YET BUILT — migration 007)    │  │    │  │  │    │  │   │  │
│  │                                     │  │    │  │  │    │  │   │  │
│  │  Stores: status, confidence,        │  │    │  │  │    │  │   │  │
│  │  recommendation, report, explain-   │  │    │  │  │    │  │   │  │
│  │  ability, input_hash, schema_version│  │    │  │  │    │  │   │  │
│  │                                     │  │    │  │  │    │  │   │  │
│  │  RLS: auth.uid() = user_id          │  │    │  │  │    │  │   │  │
│  └──────────────────────────┬───────── │  │    │  │  │    │  │   │  │
│                             │           │  │    │  │  │    │  │   │  │
│                             ▼                                          │
│                            USER                                        │
│                  (receives Validated Decision)                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Stage Descriptions

### Stage 1 — Data Sources

The raw inputs from which evidence is collected. Three categories:

**External real-time sources:**
- `SerpAPI` — web search results used by Research Engine (Lead Finder, Talent Finder)
- `Apollo.io` — company enrichment (optional; no-ops without API key)

**User-provided inputs:**
- Form data submitted by the user (location, sector, project parameters, search criteria)
- Treated as `user_input` source type with freshness half-life of 168h

**Internal benchmarks:**
- `core/data/sectors.data.ts` — Egypt 2026 sector market benchmarks
- `core/data/cities.data.ts` — City scores and market conditions
- Treated as `internal_data` source type with freshness half-life of 168h

**AI-generated intermediaries:**
- OpenAI GPT-4o-mini outputs from the legacy AI engine and research AI analysis step
- Treated as `ai_analysis` source type with freshness half-life of 48h

**Key property:** Data Sources have no knowledge of decisions. They produce raw material. Evidence Collection converts raw material into `EvidenceItem` objects with proper source typing.

---

### Stage 2 — Research Engine

**Location:** `lib/research/` (~20 modules)  
**Status:** Complete (15 test files)

The Research Engine is the acquisition pipeline that transforms raw Data Source outputs into structured, normalized, scored research results. It runs before the Decision Intelligence system is involved.

**Pipeline steps (Lead Finder path):**
1. `search-provider.ts` — SerpAPI query execution
2. `source-collector.ts` — raw result collection
3. `normalizer.ts` — field normalization and cleanup
4. `dedup.ts` — deduplication by domain/name similarity
5. `company-validation.ts` — validates company existence and legitimacy
6. `company-size.ts` — infers employee count from available signals
7. `source-quality.ts` — scores source credibility
8. `ranker.ts` — ranks results by composite quality score
9. `apollo-adapter.ts` — optional enrichment (contact data, firmographics)
10. `ai-analysis.ts` — OpenAI analysis of the search result set

**Output:** A structured research result that becomes the primary input for Evidence Collection.

**Interface with Stage 3:** A Data Adapter (not yet built — see Section: Integration Gaps) converts Research Engine output into `EvidenceItem[]` conforming to `lib/decision-intelligence/types/evidence.types.ts`.

---

### Stage 3 — Evidence Collection

**Location:** `lib/decision-intelligence/evidence/evidence-collector.ts`  
**Status:** COMPLETE (10 tests passing)

The Evidence Collector is the entry point into the Decision Intelligence system. It takes raw `EvidenceItem[]` from the Data Adapter and produces a validated, annotated `EvidenceCollection`.

**Responsibilities:**
- Validates each `EvidenceItem` for required fields and type conformance
- Applies exponential freshness decay per source type half-life (see freshness half-lives above)
- Detects contradictions between evidence items via negative reference weights
- Computes collection-level statistics: averageFreshness, contradictionCount, bySourceType counts

**Output:** `EvidenceCollection` with `items: EvidenceItem[]`, stats, and contradiction metadata

**Key property:** The Evidence Collector does not score or weight. It only validates and annotates. Weighting is Stage 4.

---

### Stage 4 — Evidence Normalization (Weighting)

**Location:** `lib/decision-intelligence/evidence/evidence-weighter.ts`  
**Status:** COMPLETE (8 tests passing)

Converts validated evidence items into weighted inputs for the confidence engine. Ensures the collection is normalized so weights sum to 1.0.

**FACTOR_WEIGHTS:**
- `sourceAuthority` = 0.40 — authority score of the source type (human > internal > external > AI)
- `freshness` = 0.35 — exponential decay score based on age and source type half-life
- `confidence` = 0.25 — explicit confidence value on the evidence item

**Key property:** These weights are not arbitrary — they encode a product priority: source authority and freshness are the strongest predictors of evidence reliability. Weight invariant is enforced at module load time.

---

### Stage 5 — Decision Intelligence Engine (DIE)

**Location:** `lib/decision-intelligence/engine/decision-engine.ts` (orchestrator) + 4 sub-engines  
**Status:** COMPLETE (61 tests across all 6 engine files)

The DIE takes the weighted evidence collection plus user-defined business rules and produces a scored, recommended decision. It does NOT validate the decision — that is Stage 6 (DVE).

**Sub-components:**

**5a — Rules Engine** (`rules-engine.ts`)
- Evaluates `BusinessRule[]` against `RuleFacts` for each `DecisionOption`
- 4 actions: PASS, FAIL, WARN, REQUIRE_OVERRIDE
- 11 operators: eq, ne, gt, gte, lt, lte, in, nin, contains, startsWith, exists
- Rule groups: AND within group, OR between groups
- Priority ordering: higher-priority rules evaluated first
- Dot-notation path resolution into nested fact objects
- `filterRulesForDomain(domain)` for domain-scoped rule sets

**5b — Confidence Engine** (`confidence-engine.ts`)
- Computes 5-dimensional confidence score from evidence and rule results
- `CONFIDENCE_DIMENSION_WEIGHTS`: volume=0.20, quality=0.25, freshness=0.20, consistency=0.20, rule_compliance=0.15
- Weight sum invariant: throws at module load if weights ≠ 1.0
- Identifies `weakestDimension` and `strongestDimension`
- Assigns `ConfidenceBand`: VERY_HIGH≥85, HIGH≥70, MEDIUM≥50, LOW≥30, VERY_LOW<30
- Dimensional model enables explainability: "low confidence in evidence_freshness is dragging the overall score"

**5c — Recommendation Selection** (inside decision-engine.ts)
- Selects the highest-scoring non-blocked option as the recommendation
- Returns null recommendation if confidence is below the threshold or all options are blocked

**Output:** `DecisionEngineResult` containing:
- `decision: Decision` (status=EVALUATING at this stage)
- `confidence: ConfidenceScore`
- `ruleResults: RuleEvaluationResult[]`
- `recommendation: DecisionRecommendation | null`

**Key property:** The DIE is pure. No I/O, no database calls, no AI calls. Same inputs always produce same outputs. The AI narration layer (Stage 7) is caller-side.

---

### Stage 6 — Decision Validation Engine (DVE)

**Location:** `lib/decision-intelligence/engine/validation-engine.ts`  
**Status:** COMPLETE (8 tests passing)

The DVE is an independent architectural component — the quality gate that determines whether a Decision Intelligence output becomes a Validated Decision or is rejected.

Full architectural specification: see **Part II — Decision Validation Engine** below.

**Output:** `ValidationResult` with `pipelineStatus: PASSED | FAILED | PARTIAL`

**Terminal state decision:**
- PASSED → Decision transitions to `VALIDATED` → proceeds to Stage 8 (Report Builder)
- FAILED → Decision transitions to `REJECTED` → returns rejection report with failing checks and advice
- PARTIAL → Decision transitions to `REJECTED` (warnings are surfaced but partial is not acceptable for a customer-facing Validated Decision)

---

### Stage 7 — AI Narration Layer

**Location:** Caller-side (inside API route — NOT in the engine library)  
**Status:** NOT YET BUILT

The AI narration layer is an optional enrichment applied AFTER the engine has completed its deterministic calculations. It uses GPT-4o-mini to generate qualitative narrative for each `DecisionOption.aiAnalysis` field.

**Calculate-then-narrate pattern:**
```
Score deterministically (Stages 3–6)
  ↓
Send SCORES to AI, not the raw question
  ↓
AI narrates what it did NOT compute
```

The AI receives: `ruleScore`, `blockedByRules`, `flaggingRuleIds`, and the `whyNot` explainability for each option. It narrates the implications of those scores. It does not compute any score.

**Key property:** The decision is complete and valid without AI narration. A customer receives a correct, explainable, auditable decision even if the narration call fails. Narration is additive richness, not a dependency.

---

### Stage 8 — Decision Report Builder

**Location:** `lib/decision-intelligence/engine/explainability-engine.ts` + `report.types.ts`  
**Status:** COMPLETE (explainability engine); Report assembly inside decision-engine.ts

Generates the `UniversalDecisionReport` — the canonical output delivered to the customer. The report is self-contained: a recipient who has never seen the underlying data can fully understand the decision.

**8a — Explainability Engine** (`explainability-engine.ts`):
- Zero AI calls — fully deterministic from computed scores
- Generates 4 explanation types:
  - `WHY`: why the recommended option was chosen
  - `WHY_NOT`: why each non-recommended option was not chosen
  - `EVIDENCE_USED`: which evidence items most influenced the result
  - `RULES_TRIGGERED`: which business rules fired and their outcomes

**8b — Report Assembly:**
- Produces `UniversalDecisionReport` with `schemaVersion: '1.0.0'` and `generatedBy: 'decision-engine-v1'`
- Report is immutable once generated
- Superseded reports retain their record (not deleted)

**Full report structure:** see **Part IV — Decision Report Architecture** below.

---

### Stage 9 — Persistence

**Location:** Supabase `decisions` table (not yet created — requires migration 007)  
**Status:** NOT YET BUILT

The `UniversalDecisionReport` and associated decision metadata are persisted to Supabase after the Report Builder completes.

**Schema (to be implemented as `supabase/migrations/007_decisions_table.sql`):**
- `id`, `user_id`, `domain`, `input_hash` (SHA-256 for dedup), `status`
- `confidence` JSONB, `recommendation` JSONB (nullable if REJECTED)
- `report` JSONB, `explainability` JSONB
- `created_at`, `schema_version`
- RLS: `auth.uid() = user_id` on SELECT; service role on INSERT

---

## Integration Gaps (Architecture Items Not Yet Built)

These components are required by the architecture but not yet implemented:

| Component | Stage | Required For |
|---|---|---|
| Data Adapter: Real Estate | Stage 2→3 boundary | Converts legacy engine output → `EvidenceItem[]` |
| Data Adapter: Lead Finder | Stage 2→3 boundary | Converts research pipeline output → `EvidenceItem[]` |
| Data Adapter: Talent Finder | Stage 2→3 boundary | Converts AI estimate → `EvidenceItem[]` |
| Business Rules: Real Estate | Stage 5a | `BusinessRule[]` for feasibility decisions |
| Business Rules: Lead Finder | Stage 5a | `BusinessRule[]` for lead quality scoring |
| Business Rules: Talent Finder | Stage 5a | `BusinessRule[]` for hire/no-hire |
| AI Narration Layer | Stage 7 | GPT-4o-mini post-scoring enrichment |
| Route wiring (all 3 modules) | Stage 5 entry | API routes must call `runDecisionEngine()` |
| decisions table + migration | Stage 9 | Supabase persistence |
| Trust Score field | Report | DVE aggregate trust score in UniversalDecisionReport |
| DecisionReportCard UI | User | Renders UniversalDecisionReport |

---

---

## Part II — Decision Validation Engine (DVE)

---

### Purpose

The Decision Validation Engine (DVE) is the quality gate that separates a Decision Intelligence computation from a Validated Business Decision.

The DIE scores and recommends. The DVE decides whether that recommendation is trustworthy enough to deliver to a customer. A Decision that the DIE produces is not a product until the DVE passes it.

**The DVE is the reason Eunoia's output is not "just AI."**

---

### Architectural Independence

The DVE is architecturally independent from the DIE. It:
- Has its own input type (`ValidationResult` inputs)
- Has its own output type (`ValidationResult`)
- Makes the terminal status transition (EVALUATING → VALIDATED or REJECTED)
- Can be replaced, extended, or parameterized independently of the DIE
- Runs on the output of the DIE, not alongside it

**Location:** `lib/decision-intelligence/engine/validation-engine.ts`  
**Status:** COMPLETE (8 tests passing)  
**Called by:** The top-level decision-engine.ts orchestrator as the fourth step of six

---

### Responsibilities

1. Execute 5 validation stages in canonical order (structural → business → evidence → confidence → consistency)
2. Apply halt-and-skip semantics: if a blocking FAIL occurs, halt and mark remaining stages as SKIP
3. Record every check with status, message, and details — the validation result is an immutable audit record
4. Record execution time per stage and total
5. Produce `ValidationSummary` with: totalChecks, passed, failed, warned, skipped, canProceed, blockingMessages, warningMessages
6. Determine the terminal `pipelineStatus`: PASSED, FAILED, or PARTIAL
7. Set the `haltedAtStage` if halted

---

### Inputs

```typescript
interface DVEInputs {
  decision: Decision                          // from DIE (status: EVALUATING)
  confidence: ConfidenceScore                 // from confidence-engine.ts
  ruleResults: RuleEvaluationResult[]         // from rules-engine.ts
  evidenceCollection: EvidenceCollection      // from evidence-collector.ts
  thresholds: ValidationThresholds            // configurable per deployment
}

interface ValidationThresholds {
  minimumEvidenceCount: number        // default: 1
  minimumConfidenceScore: number      // default: 30
  maximumContradictionRatio: number   // default: 0.5
}
```

---

### Outputs

```typescript
interface ValidationResult {
  decisionId: string
  pipelineStatus: 'PASSED' | 'FAILED' | 'PARTIAL'
  stages: ValidationStageResult[]           // one per stage, even if SKIP
  haltedAtStage: ValidationStageType | null // null if ran to completion
  summary: ValidationSummary
  validatedAt: string                       // ISO-8601
  totalDurationMs: number
}
```

---

### Validation Lifecycle

```
DVE receives DecisionInput (status=EVALUATING)
        │
        ▼
Stage 1: structural
        │ FAIL (blocking) → HALT → REJECTED
        ▼ PASS or WARN
Stage 2: business
        │ FAIL (blocking) → HALT → REJECTED
        ▼ PASS or WARN
Stage 3: evidence
        │ FAIL (blocking) → HALT → REJECTED
        ▼ PASS or WARN
Stage 4: confidence
        │ FAIL (blocking) → HALT → REJECTED
        ▼ PASS or WARN
Stage 5: consistency
        │ FAIL (blocking) → HALT → REJECTED
        ▼ PASS or WARN
        │
pipelineStatus = PASSED
Decision → VALIDATED
        │
        ▼
Report Builder proceeds
```

---

### Failure Modes

| Failure | Stage | Cause | Outcome |
|---|---|---|---|
| Missing required fields | structural | Input schema violation | REJECTED; message details missing fields |
| Type constraints violated | structural | Wrong type in DecisionInput | REJECTED |
| Blocking business rule fired | business | `action=FAIL` rule evaluated true | REJECTED; message names the rule |
| Insufficient evidence | evidence | evidenceCount < minimumEvidenceCount | REJECTED |
| Evidence too old | evidence | All evidence items expired by freshness decay | REJECTED |
| Confidence too low | confidence | overall < minimumConfidenceScore (30) | REJECTED |
| Excessive contradictions | consistency | contradictionRatio > maximumContradictionRatio (0.5) | REJECTED |
| Warnings only (no blocking failures) | any | WARN checks fired, no FAIL | VALIDATED with warnings surfaced in report |

**REJECTED decisions** produce a rejection notice containing:
- `blockingMessages`: human-readable list of what failed and why
- `haltedAtStage`: which stage stopped the pipeline
- `warningMessages`: non-blocking issues also detected
- The rejection notice is NOT a customer-facing product. It is an operator-facing diagnostic.

---

### Success Modes

| Success | Meaning |
|---|---|
| All stages PASS, no warnings | VALIDATED — high-quality decision; full confidence in output |
| All stages PASS, some warnings | VALIDATED — acceptable quality; warnings surfaced in report riskFlags |
| pipelineStatus = PASSED | Decision moves to VALIDATED; Report Builder proceeds |

---

### Relationship with Decision Intelligence Engine

| Aspect | Decision Intelligence Engine (DIE) | Decision Validation Engine (DVE) |
|---|---|---|
| Role | Compute scores and recommendation | Gate the output for customer delivery |
| Input | EvidenceItems + BusinessRules + Context | DIE output + thresholds |
| Output | Scored decision with recommendation | VALIDATED or REJECTED status |
| Status produced | EVALUATING | VALIDATED or REJECTED |
| Can be called without the other | No — DVE requires DIE output | No — DVE runs after DIE |
| Replaces AI judgment? | No — it is a math engine | No — it checks math against thresholds |
| Product output | No | Only VALIDATED decisions are product |

---

### Relationship with Research Engine

The DVE does not call the Research Engine. The Research Engine runs before the Evidence Collection stage (Stage 2), and its output is converted to evidence items by Data Adapters. By the time the DVE runs (Stage 6), the research pipeline is complete and its outputs are already represented as weighted evidence items.

The DVE's evidence stage checks whether the evidence collection (whatever its source) meets minimum requirements. If the Research Engine produced insufficient or contradictory results, the DVE's evidence and consistency stages will catch it.

---

---

## Part III — Validation Dimensions

---

The DVE's 5 stages contain individual validation checks. These checks implement validation across 13 architectural dimensions. This section defines each dimension — what it measures, which stage it belongs to, and its implementation status.

**Status codes:** IMPLEMENTED (exists in validation-engine.ts) | DEFINED (specified, not yet implemented) | FUTURE (requires additional design)

---

### Dimension 1 — Evidence Quality

**Stage:** evidence  
**Status:** IMPLEMENTED (via confidence-engine.ts quality inputs; partially in evidence stage)

**What it measures:** The authority level and human-vs-AI ratio of the evidence collection. High-quality evidence comes from human validation and verified internal sources, not AI generation.

**Inputs:**
- `averageAuthorityScore` across all evidence items
- `aiEvidenceCount` — count of `source_type = 'ai_analysis'` items
- `humanEvidenceCount` — count of `source_type = 'human_validation'` items

**Failure:** If the evidence collection is entirely AI-generated (no human or internal source), quality is degraded. Currently: captured in confidence_quality dimension score; not yet a blocking DVE check.

**Future DVE check:** Block if `aiEvidenceCount / totalEvidenceCount > 0.9` (90%+ AI evidence).

---

### Dimension 2 — Evidence Coverage

**Stage:** evidence  
**Status:** IMPLEMENTED

**What it measures:** Whether the minimum required number of evidence items is present.

**Implementation:**
- `minimumEvidenceCount = 1` (configurable via `ValidationThresholds`)
- DVE evidence stage: FAIL if `evidenceCollection.items.length < minimumEvidenceCount`

**Failure:** "Insufficient evidence: 0 items provided, minimum 1 required."

---

### Dimension 3 — Data Freshness

**Stage:** evidence  
**Status:** IMPLEMENTED (freshness decay in evidence-collector.ts; partially in DVE evidence stage)

**What it measures:** Whether the evidence is recent enough to be reliable. Uses source-type-specific half-lives for exponential decay.

**Half-lives:**
- human_validation, document: 720h (30 days)
- internal_data, user_input: 168h (7 days)
- ai_analysis: 48h (2 days)
- external_source: 24h (1 day)

**Current implementation:** Freshness decay computed; `averageFreshness` available in EvidenceCollection. A DVE check that blocks on zero-freshness evidence is architecturally defined but not yet implemented as a standalone DVE check.

**Future DVE check:** Block if `evidenceCollection.averageFreshness < 0.1` (all evidence effectively expired).

---

### Dimension 4 — Source Diversity

**Stage:** evidence  
**Status:** DEFINED

**What it measures:** Whether the evidence comes from multiple independent source types. A decision backed by only one source type has a single point of failure.

**Architecture:** `uniqueSourceTypeCount` is already computed in `EvidenceVolumeInput` (confidence-engine.ts). The DVE should surface a WARN if `uniqueSourceTypeCount < 2`.

**Failure:** "Source diversity warning: all evidence from a single source type (`ai_analysis`). Confidence may be overstated."

**Status:** The data is available; the DVE check is not yet implemented.

---

### Dimension 5 — Source Credibility

**Stage:** evidence  
**Status:** IMPLEMENTED (authority weights in evidence-weighter.ts)

**What it measures:** Whether the sources backing the evidence are credible. Authority weights encode credibility: `human_validation` = highest authority; `ai_analysis` = lowest.

**Implementation:** `FACTOR_WEIGHTS.sourceAuthority = 0.40` in evidence-weighter.ts. Authority scores are assigned per `EvidenceItem.sourceType`.

**No separate DVE check required:** Source credibility is baked into the evidence weighting and surfaces in the `evidence_quality` confidence dimension. A low credibility collection produces a low confidence score, which the confidence validation stage catches.

---

### Dimension 6 — Business Rule Coverage

**Stage:** business  
**Status:** DEFINED

**What it measures:** Whether enough business rules were actually defined for the domain. An empty rule set means the business stage passes trivially, which is misleading.

**Architecture:** If `rules.length === 0` for a domain, the business validation stage should return a WARN (not a FAIL — zero rules is a configuration gap, not a data gap).

**Implementation:** The `filterRulesForDomain(domain)` function in rules-engine.ts can return an empty array. The DVE business stage does not currently warn in that case.

**Future DVE check:** WARN if `rulesForDomain.length === 0`. "No business rules defined for domain `real_estate`. Decision scored without domain-specific constraints."

---

### Dimension 7 — Contradiction Detection

**Stage:** consistency  
**Status:** IMPLEMENTED

**What it measures:** Whether evidence items contradict each other in ways that undermine the decision.

**Implementation:** `evidence-collector.ts` detects contradictions via negative reference weights. `EvidenceCollection.contradictionCount` and `consensusRatio` are computed. The DVE consistency stage checks: `contradictionRatio > maximumContradictionRatio` (default 0.5) → blocking FAIL.

**Failure:** "Evidence consistency failure: contradiction ratio 0.67 exceeds threshold 0.50. Decision rejected."

---

### Dimension 8 — Confidence Calibration

**Stage:** confidence  
**Status:** IMPLEMENTED

**What it measures:** Whether the computed confidence score is above the minimum threshold to constitute a reliable decision.

**Implementation:** `minimumConfidenceScore = 30` (default). DVE confidence stage checks: `confidenceScore.overall < minimumConfidenceScore` → blocking FAIL.

**Failure:** "Confidence too low: overall score 24 is below minimum threshold 30. Decision rejected."

**Note:** The threshold is configurable per deployment. Stricter domains (e.g., high-stakes real estate) may set this to 50.

---

### Dimension 9 — Decision Stability

**Stage:** consistency  
**Status:** DEFINED (not yet implemented)

**What it measures:** Whether the recommendation changes if the weakest evidence item is removed. An unstable decision — one where a single piece of evidence determines the winner — has lower reliability.

**Architecture:** Requires a sensitivity test:
1. Remove the lowest-weighted evidence item
2. Re-run confidence computation
3. If the recommended option changes: WARN ("Decision stability warning: recommendation is sensitive to the removal of a single evidence item")

**Status:** Not yet implemented in validation-engine.ts. Requires additional computation inside DVE consistency stage.

---

### Dimension 10 — Bias Detection

**Stage:** consistency  
**Status:** FUTURE

**What it measures:** Whether the evidence collection is systematically skewed toward one source type (e.g., all evidence is AI-generated, or all evidence supports only one option).

**Architecture:** Two checks:
1. Source type skew: if a single source type accounts for >80% of total evidence weight → WARN
2. Option support skew: if all evidence items reference only one option → WARN

**Status:** Requires design of `BiasCheck` spec. Not yet defined at the code level.

---

### Dimension 11 — Risk Consistency

**Stage:** structural  
**Status:** DEFINED

**What it measures:** Whether the `riskFlags` in the report are consistent with the validation results. If DVE identified blocking failures (later overridden by a human override), a HIGH severity risk flag must be present.

**Architecture:** After DVE passes (including human overrides), a post-validation check ensures:
- Every `REQUIRE_OVERRIDE` rule that was overridden has a corresponding `riskFlags` entry with `severity: 'HIGH'`
- A human override without a justification string is a structural validation failure

**Status:** Human override field exists in `DecisionRecommendation.humanOverridden`. Risk consistency check not yet implemented.

---

### Dimension 12 — Explainability Completeness

**Stage:** structural  
**Status:** DEFINED

**What it measures:** Whether the `DecisionExplainability` object contains all 4 required explanation types for every option.

**Required explanation types:** WHY (for winner), WHY_NOT (for each loser), EVIDENCE_USED, RULES_TRIGGERED

**Architecture:** DVE structural stage should check that `explainability` is not empty and contains at least one explanation per required type.

**Status:** The explainability object type is defined in `explainability.types.ts`. The DVE structural check is not yet implemented.

---

### Dimension 13 — Overall Trust Score

**Stage:** Post-pipeline (meta-dimension)  
**Status:** DEFINED — NOT YET IN UniversalDecisionReport

**What it measures:** A single aggregate score (0–100) computed from all 12 dimensions above, representing the overall trustworthiness of the Validated Decision.

**Architecture:**
```
TrustScore = weighted combination of:
  - Confidence.overall (from DIE)
  - ValidationSummary.passed / totalChecks (from DVE)
  - Evidence diversity score
  - Evidence freshness score
  - Human validation ratio
  - Zero contradictions bonus
```

**Why this matters:** The confidence score (from Stage 5b) measures how strong the evidence is. The Trust Score measures how well-formed and validated the entire decision process was. A decision can have HIGH confidence (strong evidence) but LOW trust (evidence from one AI source only, no business rules, DVE ran with warnings).

**ARCHITECTURAL REQUIREMENT:** The `UniversalDecisionReport` must gain a `trustScore: TrustScore` section. This is a NEW field not yet in `report.types.ts`.

**Implementation:** This is the only report change required by this architecture sprint. It should be added to `report.types.ts` and computed in the Report Builder after DVE completes.

---

---

## Part IV — Decision Report Architecture

---

The `UniversalDecisionReport` is defined in `lib/decision-intelligence/types/report.types.ts`. This section maps every required report section to its implementation status and type.

### Report Section Map

| Section | Report Field | Type | Status | Notes |
|---|---|---|---|---|
| **Audit Metadata** | `metadata` | `ReportMetadata` | COMPLETE | id, schemaVersion, decisionId, domain, timestamps, generatedBy, supersedesReportId |
| **Executive Summary** | `executiveSummary` | `ReportExecutiveSummary` | COMPLETE | headline, summary, recommendedOption, confidenceBand, confidenceScore, isRuleDetermined, humanOverrideApplied |
| **Recommendation** | `recommendation` | `DecisionRecommendation | null` | COMPLETE | recommendedOptionId, rationale, confidenceScore, humanOverridden, overrideJustification |
| **Confidence** | `confidence` | `ConfidenceScore` | COMPLETE | overall, 5 dimensions, band, weakestDimension, strongestDimension |
| **Validation Status** | `validation` | `ValidationResult` | COMPLETE | pipelineStatus, stages, haltedAtStage, summary, blockingMessages, warningMessages |
| **Trust Score** | `trustScore` | `TrustScore` (new type) | NOT YET IN REPORT | Aggregate post-DVE trust metric across all 13 dimensions — required addition |
| **Evidence** | `evidence` + `evidenceSummary` | `EvidenceCollection` + `ReportEvidenceSummary` | COMPLETE | items, bySourceType, averageFreshness, contradictionCount, keyEvidenceIds |
| **Business Rules** | `ruleEvaluations` | `RuleEvaluationResult[]` | COMPLETE | Per-rule: id, action, triggered, facts evaluated |
| **Risks** | `riskFlags` | `ReportRiskFlag[]` | COMPLETE | severity, category, title, description, mitigationAdvice |
| **Alternative Options** | `optionScoring` | `OptionScoringRow[]` | COMPLETE | Side-by-side: ruleScore, isBlocked, blockingRuleCount, warningRuleCount per option |
| **Explainability** | `explainability` | `DecisionExplainability` | COMPLETE | WHY, WHY_NOT, EVIDENCE_USED, RULES_TRIGGERED |
| **Supporting Sources** | `evidenceSummary.keyEvidenceIds` + `evidence.items` | string[] + EvidenceItem[] | COMPLETE | Source citations in evidence items; keyEvidenceIds for top sources |
| **Decision Lifecycle** | `decision.statusHistory` | `DecisionStatusEvent[]` | COMPLETE | Immutable audit trail of all status transitions |

### One Missing Section: Trust Score

The only section in the required architecture that is NOT yet in `UniversalDecisionReport` is the **Trust Score**.

The Trust Score is the meta-dimension (Dimension 13) that aggregates the DVE validation results into a single interpretable score. It answers: "How much should I trust this decision as a whole?"

**Required addition to `report.types.ts`:**
```typescript
// New type — to be added to report.types.ts
export interface TrustScore {
  readonly overall: number           // 0–100
  readonly band: TrustBand           // TRUSTED | CONDITIONAL | PROVISIONAL | UNTRUSTED
  readonly factors: TrustFactor[]    // per-dimension breakdown
  readonly computedAt: string        // ISO-8601
}

export type TrustBand = 'TRUSTED' | 'CONDITIONAL' | 'PROVISIONAL' | 'UNTRUSTED'

export interface TrustFactor {
  readonly dimension: string         // matches ValidationDimension names above
  readonly score: number             // 0–100
  readonly weight: number
  readonly contribution: number      // score * weight
}

// Added to UniversalDecisionReport
// trustScore: TrustScore
```

**Note:** This is an architectural definition only. Implementation is Sprint 4 work.

---

---

## Part V — Product Identity in Architecture

---

### Canonical Statements

These statements are permanent architectural constraints. Any implementation that violates them must be corrected:

1. **The platform sells Validated Decisions, not reports.** A report is the container. The Validated Decision is the product. The distinction matters: a customer cannot receive a REJECTED decision as output.

2. **The Decision Validation Engine is mandatory, not optional.** Every Decision Intelligence output MUST pass through the DVE. There is no "fast path" that skips validation. An implementation sprint that calls `runDecisionEngine()` and pipes its output directly to the user without DVE validation is architecturally incorrect.

3. **The confidence score is not the trust score.** Confidence measures how strong the evidence is. Trust measures how well-formed the entire decision process was. Both must be displayed to the customer.

4. **AI narration enriches; it does not decide.** GPT-4o-mini enriches `DecisionOption.aiAnalysis` after scoring. It does not compute scores. It does not choose the recommendation. It does not run the validation. If the narration call fails, the Validated Decision is still valid.

5. **Same inputs, same outputs.** The DIE and DVE are deterministic. AI narration is the only non-deterministic step. The core decision — the recommendation, confidence score, rule results, validation status, explainability — is always reproducible.

6. **Every decision is auditable.** The `UniversalDecisionReport` is self-contained and immutable. An auditor reading the report 12 months later can reconstruct exactly what evidence was used, what rules were applied, what the confidence was, why the recommendation was made, and what the validation found.

---

### Architectural Implications for Each Module

| Module | What Changes After DI Integration |
|---|---|
| Real Estate Intelligence | Stops returning AI text. Returns Validated Decision with confidence, rules, explainability, and trust score |
| Lead Finder | Each lead result gets a Lead Quality Decision with rule-based filtering and confidence score |
| Talent Finder | Hire/no-hire Decision with salary confidence scored against evidence quality |
| Report History | Must display UniversalDecisionReport, not raw AI text |
| Dashboard | North Star Metric: evidence-backed decisions/month (not reports generated) |
| Admin Console | Can view DVE rejection rates, confidence distributions, trust score distributions |

---

*Decision Intelligence Architecture is canonical. All implementation sprints must conform to this document. Changes require Technical Lead sign-off and ADR entry.*
