# Executive Business Report — Schema v1.0
**Sprint:** Product Engineering Sprint 2  
**Date:** 2026-07-30  
**Status:** CANONICAL — DO NOT MODIFY WITHOUT EXECUTIVE APPROVAL

---

## Purpose

The `ExecutiveBusinessReport` is the customer-facing deliverable of the Eunoia Intelligence Platform. It is a composition of two data sources:

1. **`UniversalDecisionReport`** — the Decision Intelligence Engine's structured output (confidence, options, risk flags, evidence, validation, explainability)
2. **AI Narration** — the OpenAI-generated domain analysis (market data, SWOT, financial projections, actions, roadmap)

The report transforms raw engine output into a coherent, self-contained business document that a decision-maker can read, act on, and share.

---

## Schema Version

```
ExecutiveBusinessReport.schemaVersion = "2.0.0"
```

Schema version `2.0.0` distinguishes this executive report from the DI Engine's internal `UniversalDecisionReport` (schema version `"1.0.0"`).

---

## Source Mapping

| Report Section | Primary Source | Fallback |
|---|---|---|
| 1. Executive Summary | `UniversalDecisionReport.executiveSummary` | — |
| 2. Final Recommendation | `UniversalDecisionReport.recommendation` | AI narration `recommendation` |
| 3. Trust Score | `UniversalDecisionReport.trustScore` | — |
| 4. Decision Confidence | `UniversalDecisionReport.confidence` | — |
| 5. Evidence | `UniversalDecisionReport.evidence` + `evidenceSummary` | — |
| 6. Business Analysis | AI narration (`swot`, `market_overview`, `financials`, `score_breakdown`) | Empty strings |
| 7. Risk Analysis | `UniversalDecisionReport.riskFlags` + `validation.pipelineStatus` | AI narration `risk_scorecard` |
| 8. Alternative Options | `UniversalDecisionReport.options` + `optionScoring` | — |
| 9. Recommended Actions | AI narration (`immediate_actions`, `optimizations`, `improvements`, `quick_wins`) | Empty array |
| 10. Expected Business Impact | AI narration (`financials`, `projection_optimized`, `cpl_intelligence`, `pipeline_health`) | Empty |
| 11. Implementation Roadmap | AI narration (`entry_strategy_90days`, `strategy_90days`, `scenarios`) | Empty phases |
| 12. Appendix | `UniversalDecisionReport.metadata` + `ruleEvaluations` + `validation` | — |

---

## Full Schema

```typescript
interface ExecutiveBusinessReport {
  schemaVersion: '2.0.0'
  reportType: string          // 'feasibility' | 'campaign_roi' | 'market_entry' | 'lead_gen' | 'full_analysis'

  sections: {

    // ── SECTION 1: EXECUTIVE SUMMARY ─────────────────────────────────────
    executiveSummary: {
      headline: string           // One sentence: what was decided
      summary: string            // 2–3 sentences expanding the headline
      recommendedOption: string | null
      decisionStatus: 'VALIDATED' | 'REJECTED' | string
      domain: string             // 'market_intelligence'
      generatedAt: string        // ISO-8601
    }

    // ── SECTION 2: FINAL RECOMMENDATION ──────────────────────────────────
    finalRecommendation: {
      option: string | null      // Recommended option label, or null if no recommendation
      rationale: string          // Why this option was chosen
      confidenceScore: number    // 0–100
      confidenceBand: string     // 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
      isRuleDetermined: boolean  // True if rules (not AI) determined the recommendation
    }

    // ── SECTION 3: TRUST SCORE ────────────────────────────────────────────
    trustScore: {
      score: number              // 0–100
      band: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
      label: string              // e.g. 'High Confidence'
      interpretation: string     // Plain-language meaning of this score
    }

    // ── SECTION 4: DECISION CONFIDENCE ───────────────────────────────────
    decisionConfidence: {
      overall: number            // 0–100
      band: string               // 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW'
      dimensions: Array<{
        name: string             // Human-readable dimension name (e.g. 'evidence quality')
        rawScore: number         // 0–100 before weighting
        weightedScore: number    // Contribution to overall score
        primaryFactor: string    // Main factor driving this dimension
      }>
      weakestDimension: string   // Dimension to improve for higher confidence
      strongestDimension: string // Dimension most supporting the decision
    }

    // ── SECTION 5: EVIDENCE ───────────────────────────────────────────────
    evidence: {
      totalItems: number
      averageFreshness: number   // 0–1 (1 = just collected)
      averageConfidence: number  // 0–1
      contradictionCount: number
      bySourceType: Record<string, number>   // e.g. { user_input: 1, internal_data: 1 }
      items: Array<{
        title: string
        source: string
        confidence: number
        freshness: number
      }>
    }

    // ── SECTION 6: BUSINESS ANALYSIS ─────────────────────────────────────
    businessAnalysis: {
      summary: string            // AI executive summary (Arabic, from narration)
      swot: {
        strengths: string[]
        weaknesses: string[]
        opportunities: string[]
        threats: string[]
      } | null
      marketOverview: Record<string, unknown> | null   // Market data from narration
      performanceData: Record<string, unknown> | null  // Report-type-specific data
    }

    // ── SECTION 7: RISK ANALYSIS ──────────────────────────────────────────
    riskAnalysis: {
      overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
      flags: Array<{
        severity: string         // 'HIGH' | 'MEDIUM' | 'LOW'
        category: string         // 'evidence' | 'confidence' | 'rule' | 'validation' | 'data'
        title: string
        description: string
        mitigation: string
      }>
      validationStatus: string   // 'PASSED' | 'FAILED' | 'PARTIAL'
      riskScorecard: Record<string, unknown> | null   // From AI narration (feasibility only)
    }

    // ── SECTION 8: ALTERNATIVE OPTIONS ───────────────────────────────────
    alternativeOptions: Array<{
      label: string
      description: string
      ruleScore: number          // 0–100 rule compliance score
      isRecommended: boolean
      isBlocked: boolean
    }>

    // ── SECTION 9: RECOMMENDED ACTIONS ───────────────────────────────────
    recommendedActions: Array<{
      action: string
      timeline: string
      impact: string
      priority: number           // 1 = highest priority
    }>

    // ── SECTION 10: EXPECTED BUSINESS IMPACT ─────────────────────────────
    expectedBusinessImpact: {
      summary: string
      metrics: Array<{
        metric: string
        value: string
        timeframe: string
      }>
      financialHighlights: Record<string, unknown> | null
    }

    // ── SECTION 11: IMPLEMENTATION ROADMAP ───────────────────────────────
    implementationRoadmap: {
      phases: Array<{
        phase: string            // 'Phase 1', 'Phase 2', 'Phase 3'
        title: string
        actions: string[]
        kpi: string              // Measurable success metric for this phase
        budget: string | null
      }>
    }

    // ── SECTION 12: APPENDIX ─────────────────────────────────────────────
    appendix: {
      reportId: string
      decisionId: string
      schemaVersion: string      // DI Engine schema version ('1.0.0')
      domain: string
      decisionName: string
      ruleEvaluationCount: number
      validationStageCount: number
      generatedBy: string        // 'decision-engine-v1'
    }

  }
}
```

---

## Report Type → AI Narration Field Mapping

### Section 6: Business Analysis

| Report Type | `swot` field | `marketOverview` field | `performanceData` field |
|---|---|---|---|
| `feasibility` | — | — | `financials` |
| `campaign_roi` | — | — | `kpi_scorecard` |
| `market_entry` | `swot` | `market_overview` | — |
| `lead_gen` | — | — | `pipeline_health` |
| `full_analysis` | `swot` | `market_overview` | `campaign_performance` |

### Section 9: Recommended Actions

| Report Type | AI Narration Field | Format |
|---|---|---|
| `feasibility` | `immediate_actions` | `[{action, timeline, impact}]` |
| `campaign_roi` | `optimizations` | `[{rank, action, expected_cpl_reduction, timeline}]` |
| `market_entry` | `entry_strategy_90days` | `{month1, month2, month3}` (extract `actions`) |
| `lead_gen` | `improvements` | `[{action, expected_impact, timeline}]` |
| `full_analysis` | `quick_wins` | `[{action, timeline, impact}]` |

### Section 10: Expected Business Impact

| Report Type | AI Narration Field | Key Metrics |
|---|---|---|
| `feasibility` | `financials` | net_profit, roi_pct, npv_assessment |
| `campaign_roi` | `projection_optimized` | target_cpl, projected_leads_month1, roi_improvement |
| `market_entry` | `cpl_intelligence` | meta_cpl_expected, budget_required_100leads, payback_timeline |
| `lead_gen` | `pipeline_health` | estimated_monthly_deals, estimated_monthly_revenue, ltv_cac_ratio |
| `full_analysis` | `marketing_score` | score/100, performance_tier |

### Section 11: Implementation Roadmap

| Report Type | AI Narration Field | Structure |
|---|---|---|
| `market_entry` | `entry_strategy_90days` | 3-phase month-by-month plan |
| `full_analysis` | `strategy_90days` | 3-phase month-by-month plan |
| `feasibility` | `scenarios` | pessimistic / base / optimistic |
| `campaign_roi` | `optimizations` | Top 3 optimizations as phases |
| `lead_gen` | `improvements` | Top 3 improvements as phases |

---

## Default Values (When Narration Field is Missing)

All string fields default to `''` (empty string).  
All array fields default to `[]`.  
All object fields default to `null`.  
This ensures the builder never throws — a partial narration still produces a valid report.

---

## Invariants

1. `sections.trustScore.score` always equals `sections.decisionConfidence.overall`
2. Exactly one option in `sections.alternativeOptions` has `isRecommended: true` (when a recommendation exists)
3. `sections.riskAnalysis.overallRisk` is `'HIGH'` if any flag has `severity: 'HIGH'`, otherwise `'MEDIUM'` if any `'MEDIUM'` flag, otherwise `'LOW'`
4. `sections.appendix.reportId` matches the `UniversalDecisionReport.metadata.reportId`
5. `schemaVersion` is always `'2.0.0'` for `ExecutiveBusinessReport`
