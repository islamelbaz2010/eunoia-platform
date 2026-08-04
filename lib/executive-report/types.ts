/**
 * Executive Business Report — the canonical customer-facing deliverable.
 *
 * A composition of two sources:
 *   1. UniversalDecisionReport — DI Engine structured output
 *   2. AI Narration — OpenAI domain analysis
 *
 * Produced by buildExecutiveReport(). Consumed by the API response and
 * eventually the frontend report renderer.
 *
 * Schema version "2.0.0" distinguishes this from the DI Engine's internal
 * UniversalDecisionReport (schema version "1.0.0").
 */

// ---------------------------------------------------------------------------
// Section 1: Executive Summary
// ---------------------------------------------------------------------------

export interface ExecReportExecutiveSummary {
  readonly headline: string
  readonly summary: string
  readonly recommendedOption: string | null
  readonly decisionStatus: string
  readonly domain: string
  readonly generatedAt: string
}

// ---------------------------------------------------------------------------
// Section 2: Final Recommendation
// ---------------------------------------------------------------------------

export interface ExecReportFinalRecommendation {
  readonly option: string | null
  readonly rationale: string
  readonly confidenceScore: number
  readonly confidenceBand: string
  readonly isRuleDetermined: boolean
}

// ---------------------------------------------------------------------------
// Section 3: Trust Score
// ---------------------------------------------------------------------------

export interface ExecReportTrustScore {
  readonly score: number
  readonly band: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  readonly label: string
  /** Plain-language meaning of this trust level for the customer. */
  readonly interpretation: string
}

// ---------------------------------------------------------------------------
// Section 4: Decision Confidence
// ---------------------------------------------------------------------------

export interface ExecReportConfidenceDimension {
  readonly name: string
  readonly rawScore: number
  readonly weightedScore: number
  readonly primaryFactor: string
}

export interface ExecReportDecisionConfidence {
  readonly overall: number
  readonly band: string
  readonly dimensions: ExecReportConfidenceDimension[]
  readonly weakestDimension: string
  readonly strongestDimension: string
}

// ---------------------------------------------------------------------------
// Section 5: Evidence
// ---------------------------------------------------------------------------

export interface ExecReportEvidenceItem {
  readonly title: string
  readonly source: string
  readonly confidence: number
  readonly freshness: number
}

export interface ExecReportEvidence {
  readonly totalItems: number
  readonly averageFreshness: number
  readonly averageConfidence: number
  readonly contradictionCount: number
  readonly bySourceType: Record<string, number>
  readonly items: ExecReportEvidenceItem[]
}

// ---------------------------------------------------------------------------
// Section 6: Business Analysis
// ---------------------------------------------------------------------------

export interface ExecReportSWOT {
  readonly strengths: string[]
  readonly weaknesses: string[]
  readonly opportunities: string[]
  readonly threats: string[]
}

export interface ExecReportBusinessAnalysis {
  /** AI executive summary (from narration — may be Arabic). */
  readonly summary: string
  readonly swot: ExecReportSWOT | null
  readonly marketOverview: Record<string, unknown> | null
  readonly performanceData: Record<string, unknown> | null
}

// ---------------------------------------------------------------------------
// Section 7: Risk Analysis
// ---------------------------------------------------------------------------

export interface ExecReportRiskFlag {
  readonly severity: string
  readonly category: string
  readonly title: string
  readonly description: string
  readonly mitigation: string
}

export interface ExecReportRiskAnalysis {
  readonly overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  readonly flags: ExecReportRiskFlag[]
  readonly validationStatus: string
  readonly riskScorecard: Record<string, unknown> | null
}

// ---------------------------------------------------------------------------
// Section 8: Alternative Options
// ---------------------------------------------------------------------------

export interface ExecReportOption {
  readonly label: string
  readonly description: string
  readonly ruleScore: number
  readonly isRecommended: boolean
  readonly isBlocked: boolean
}

// ---------------------------------------------------------------------------
// Section 9: Recommended Actions
// ---------------------------------------------------------------------------

export interface ExecReportAction {
  readonly action: string
  readonly timeline: string
  readonly impact: string
  readonly priority: number
}

// ---------------------------------------------------------------------------
// Section 10: Expected Business Impact
// ---------------------------------------------------------------------------

export interface ExecReportImpactMetric {
  readonly metric: string
  readonly value: string
  readonly timeframe: string
}

export interface ExecReportBusinessImpact {
  readonly summary: string
  readonly metrics: ExecReportImpactMetric[]
  readonly financialHighlights: Record<string, unknown> | null
}

// ---------------------------------------------------------------------------
// Section 11: Implementation Roadmap
// ---------------------------------------------------------------------------

export interface ExecReportRoadmapPhase {
  readonly phase: string
  readonly title: string
  readonly actions: string[]
  readonly kpi: string
  readonly budget: string | null
}

export interface ExecReportImplementationRoadmap {
  readonly phases: ExecReportRoadmapPhase[]
}

// ---------------------------------------------------------------------------
// Section 12: Appendix
// ---------------------------------------------------------------------------

export interface ExecReportAppendix {
  readonly reportId: string
  readonly decisionId: string
  readonly schemaVersion: string
  readonly domain: string
  readonly decisionName: string
  readonly ruleEvaluationCount: number
  readonly validationStageCount: number
  readonly generatedBy: string
}

// ---------------------------------------------------------------------------
// Top-level: Executive Business Report
// ---------------------------------------------------------------------------

export interface ExecutiveBusinessReport {
  readonly schemaVersion: '2.0.0'
  readonly reportType: string
  readonly sections: {
    readonly executiveSummary: ExecReportExecutiveSummary
    readonly finalRecommendation: ExecReportFinalRecommendation
    readonly trustScore: ExecReportTrustScore
    readonly decisionConfidence: ExecReportDecisionConfidence
    readonly evidence: ExecReportEvidence
    readonly businessAnalysis: ExecReportBusinessAnalysis
    readonly riskAnalysis: ExecReportRiskAnalysis
    readonly alternativeOptions: ExecReportOption[]
    readonly recommendedActions: ExecReportAction[]
    readonly expectedBusinessImpact: ExecReportBusinessImpact
    readonly implementationRoadmap: ExecReportImplementationRoadmap
    readonly appendix: ExecReportAppendix
  }
}
