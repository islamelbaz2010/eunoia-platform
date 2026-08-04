# Executive Business Report — Acceptance Criteria
**Sprint:** Product Engineering Sprint 2  
**Date:** 2026-07-30

---

## Sprint 2 Acceptance Statement

> **"The Executive Business Report is the canonical customer-facing deliverable, produced automatically on every valid intelligence request, with all 12 sections populated from engine and AI narration data."**

---

## Functional Acceptance Criteria

### AC-01: All 12 Sections Present
**Given** a valid `POST /api/intelligence` request with any `reportType`  
**When** the DI Engine and OpenAI both succeed  
**Then** the response includes `executiveReport` with all 12 sections present and non-null

### AC-02: Section 1 — Executive Summary Sourced from DI Engine
**Given** a successful DI Engine run  
**Then** `executiveReport.sections.executiveSummary.headline` equals `decisionReport.executiveSummary.headline`  
**And** `executiveReport.sections.executiveSummary.decisionStatus` equals the decision status from the DI Engine

### AC-03: Section 2 — Final Recommendation Correctly Populated
**Given** the DI Engine produces a recommendation  
**Then** `executiveReport.sections.finalRecommendation.option` is the recommended option label (not null)  
**And** `executiveReport.sections.finalRecommendation.confidenceScore` matches `decisionReport.trustScore.score`

**Given** the DI Engine cannot issue a recommendation (confidence too low)  
**Then** `executiveReport.sections.finalRecommendation.option` is null  
**And** `executiveReport.sections.finalRecommendation.rationale` explains why

### AC-04: Section 3 — Trust Score Interpretation is Present
**Given** any trust score band  
**Then** `executiveReport.sections.trustScore.interpretation` is a non-empty string  
**And** `trustScore.score` matches `decisionReport.confidence.overall`

### AC-05: Section 4 — Confidence Dimensions Are Readable
**Then** each dimension's `name` uses human-readable format (spaces instead of underscores)  
**And** `weakestDimension` and `strongestDimension` are human-readable  

### AC-06: Section 5 — Evidence Reflects Collected Items
**Then** `evidence.totalItems` matches `decisionReport.evidenceSummary.totalItems`  
**And** `evidence.items` contains at most 10 items (capped for display)

### AC-07: Section 6 — Business Analysis Populated from Narration
**Given** `reportType = 'market_entry'`  
**Then** `businessAnalysis.swot` is populated from narration `swot` field (when present)  
**And** `businessAnalysis.marketOverview` is populated from narration `market_overview` (when present)

**Given** `reportType = 'feasibility'`  
**Then** `businessAnalysis.performanceData` is populated from narration `financials` (when present)

### AC-08: Section 7 — Risk Derivation is Correct
**Given** DI Engine produces no risk flags  
**Then** `riskAnalysis.overallRisk` is `'LOW'`

**Given** any risk flag with severity `'HIGH'`  
**Then** `riskAnalysis.overallRisk` is `'HIGH'` regardless of other flags

**Given** risk flags only with severity `'MEDIUM'`  
**Then** `riskAnalysis.overallRisk` is `'MEDIUM'`

### AC-09: Section 8 — All Options Included
**Then** `alternativeOptions` has exactly as many items as `decisionReport.options`  
**And** exactly one has `isRecommended: true` when a recommendation was made  
**And** `isBlocked` correctly reflects `blockedByRules` from the DI Engine

### AC-10: Section 9 — Actions Extracted Per Report Type
**Given** `reportType = 'feasibility'` and narration contains `immediate_actions`  
**Then** `recommendedActions` is populated from those actions

**Given** `reportType = 'market_entry'` and narration contains `entry_strategy_90days`  
**Then** `recommendedActions` contains at most 6 actions extracted from the 3-phase plan

**Given** narration contains no action-equivalent field  
**Then** `recommendedActions` is `[]` (empty array, not an error)

### AC-11: Section 10 — Impact Metrics Populated Per Report Type
**Given** `reportType = 'campaign_roi'` and narration contains `projection_optimized`  
**Then** `expectedBusinessImpact.metrics` includes target CPL, projected leads, and ROI improvement

**Given** `reportType = 'feasibility'` and narration contains `financials`  
**Then** `expectedBusinessImpact.financialHighlights` is populated

### AC-12: Section 11 — Roadmap Phases Present
**Given** `reportType = 'market_entry'` with `entry_strategy_90days` in narration  
**Then** `implementationRoadmap.phases` has exactly 3 phases

**Given** any report type with no roadmap-equivalent narration  
**Then** `implementationRoadmap.phases` is `[]` (not an error)

### AC-13: Section 12 — Appendix IDs Match Source Report
**Then** `appendix.reportId` equals `decisionReport.metadata.reportId`  
**And** `appendix.decisionId` equals `decisionReport.metadata.decisionId`  
**And** `appendix.generatedBy` is `'decision-engine-v1'`

---

## Resilience Acceptance Criteria

### AC-14: Fail-Safe When DI Engine Is Absent
**Given** `decisionReport` is null (DI Engine failed in Sprint 1 fail-safe)  
**Then** `executiveReport` is absent from the response  
**And** `report` (narration) is still returned  
**And** the response status is `200`

### AC-15: Fail-Safe When Builder Throws
**Given** `buildExecutiveReport()` throws an unexpected exception  
**Then** `executiveReport` is absent from the response (logged, not propagated)  
**And** `decisionReport`, `trustScore`, and `report` are still returned

### AC-16: All Sections Have Defaults When Narration Is Empty
**Given** the AI narration is `{}` (empty object)  
**Then** `buildExecutiveReport()` returns a valid `ExecutiveBusinessReport`  
**And** string fields are `''`, array fields are `[]`, object fields are `null`  
**And** the function does NOT throw

---

## Schema Acceptance Criteria

### AC-17: Schema Version
**Then** `executiveReport.schemaVersion` is `'2.0.0'`

### AC-18: Report Type Preserved
**Then** `executiveReport.reportType` matches the request's `reportType`

### AC-19: Trust Score Invariant
**Then** `executiveReport.sections.trustScore.score` equals `executiveReport.sections.decisionConfidence.overall`

---

## Test Acceptance Criteria

### AC-20: Builder Test Coverage
The following must be tested in `lib/executive-report/__tests__/builder.test.ts`:
- All 12 sections are present in output
- Trust score score matches confidence overall
- Risk derivation for HIGH, MEDIUM, LOW
- Empty narration produces valid (not throwing) report
- Options correctly mapped from DI Engine
- `appendix.reportId` matches source

### AC-21: Route Integration Tests
The following must be tested in `app/api/intelligence/route.test.ts`:
- `executiveReport` present in response when DI and builder both succeed
- `executiveReport` absent when `decisionReport` is null (DI failed)
- Response is `200` and includes `report` narration even when builder throws

---

## Validation Gates (All Must Pass Before Sprint 2 is Complete)

| Gate | Command | Required Result |
|---|---|---|
| Typecheck | `npm run typecheck` | 0 errors |
| Lint | `npm run lint` | 0 warnings |
| Tests | `npm test` | All pass (206+ baseline) |
| Build | `npm run build` | PASS |
| Builder handles empty narration | Manual test | No throw |
| executiveReport in API response | Manual test with valid request | All 12 sections present |

---

## What Sprint 2 is NOT Accepting

The following are explicitly EXCLUDED from Sprint 2 acceptance:

- Persistence of `executiveReport` to database (deferred)
- Frontend rendering of the report (Sprint 5)
- PDF export (Sprint 5)
- Historical report comparison (Sprint 5)
- Report sharing or access control (Sprint 6)
- Billing based on report count (Sprint 6)
