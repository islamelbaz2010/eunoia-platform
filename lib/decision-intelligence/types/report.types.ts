/**
 * Universal Decision Report — the canonical output of the Decision Intelligence Engine.
 *
 * Every decision that reaches VALIDATED or COMPLETED status produces exactly
 * one Universal Decision Report. The report is self-contained: a recipient
 * who has never seen the underlying data can fully understand the decision,
 * the recommendation, the supporting evidence, the rules that applied, and
 * the confidence level — without access to any other system.
 *
 * Reports are immutable once generated. If a decision is revised, a new
 * report is generated and the previous one is superseded (not deleted).
 */

import type { Decision, DecisionOption, DecisionRecommendation } from './decision.types'
import type { ConfidenceScore, TrustScore } from './confidence.types'
import type { ValidationResult } from './validation.types'
import type { DecisionExplainability } from './explainability.types'
import type { RuleEvaluationResult } from './rules.types'
import type { EvidenceCollection } from './evidence.types'

// ---------------------------------------------------------------------------
// Branded ID
// ---------------------------------------------------------------------------

declare const __reportIdBrand: unique symbol
export type ReportId = string & { readonly [__reportIdBrand]: true }
export function reportId(id: string): ReportId { return id as ReportId }

// ---------------------------------------------------------------------------
// Report version — incremented when the engine schema changes
// ---------------------------------------------------------------------------

export const UNIVERSAL_REPORT_SCHEMA_VERSION = '1.0.0' as const
export type ReportSchemaVersion = typeof UNIVERSAL_REPORT_SCHEMA_VERSION

// ---------------------------------------------------------------------------
// Report status
// ---------------------------------------------------------------------------

export type ReportStatus =
  | 'CURRENT'      // the latest report for this decision
  | 'SUPERSEDED'   // replaced by a newer report for the same decision
  | 'DRAFT'        // generated for a VALIDATED decision (not yet COMPLETED)

// ---------------------------------------------------------------------------
// Executive summary — the TL;DR section of the report
// ---------------------------------------------------------------------------

export interface ReportExecutiveSummary {
  /** One sentence: what was decided and what the outcome was. */
  readonly headline: string
  /** 2–3 sentences expanding the headline. */
  readonly summary: string
  /** The recommended option's label. Null if no recommendation could be made. */
  readonly recommendedOption: string | null
  /** Overall confidence band. */
  readonly confidenceBand: string
  /** Overall confidence score (0–100). */
  readonly confidenceScore: number
  /** True if the recommendation was produced by deterministic rules alone (no AI). */
  readonly isRuleDetermined: boolean
  /** True if a human override was applied. */
  readonly humanOverrideApplied: boolean
}

// ---------------------------------------------------------------------------
// Option scoring table — comparable side-by-side view
// ---------------------------------------------------------------------------

export interface OptionScoringRow {
  readonly optionId: string
  readonly optionLabel: string
  readonly ruleScore: number
  readonly isRecommended: boolean
  readonly isBlocked: boolean
  readonly blockingRuleCount: number
  readonly warningRuleCount: number
}

// ---------------------------------------------------------------------------
// Evidence summary section
// ---------------------------------------------------------------------------

export interface ReportEvidenceSummary {
  readonly totalItems: number
  readonly bySourceType: Record<string, number>
  readonly averageFreshness: number
  readonly averageConfidence: number
  readonly contradictionCount: number
  /** Items that most heavily influenced the outcome. */
  readonly keyEvidenceIds: string[]
}

// ---------------------------------------------------------------------------
// Metadata section
// ---------------------------------------------------------------------------

export interface ReportMetadata {
  readonly reportId: ReportId
  readonly schemaVersion: ReportSchemaVersion
  readonly status: ReportStatus
  readonly decisionId: string
  readonly decisionDomain: string
  readonly decisionName: string
  /** ISO-8601 timestamp when the decision was first created. */
  readonly decisionCreatedAt: string
  /** ISO-8601 timestamp when this report was generated. */
  readonly generatedAt: string
  /** ID of the report this supersedes, if any. */
  readonly supersedesReportId: ReportId | null
  readonly generatedBy: 'decision-engine-v1'
}

// ---------------------------------------------------------------------------
// Risk flags — surfaced issues the consumer must be aware of
// ---------------------------------------------------------------------------

export type RiskSeverity = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ReportRiskFlag {
  readonly severity: RiskSeverity
  readonly category: 'evidence' | 'confidence' | 'rule' | 'validation' | 'data'
  readonly title: string
  readonly description: string
  /** What a human reviewer should do about this risk. */
  readonly mitigationAdvice: string
}

// ---------------------------------------------------------------------------
// Universal Decision Report — the top-level document
// ---------------------------------------------------------------------------

export interface UniversalDecisionReport {
  readonly metadata: ReportMetadata
  readonly executiveSummary: ReportExecutiveSummary
  readonly decision: Decision
  readonly recommendation: DecisionRecommendation | null
  readonly options: DecisionOption[]
  readonly optionScoring: OptionScoringRow[]
  readonly confidence: ConfidenceScore
  readonly trustScore: TrustScore
  readonly evidence: EvidenceCollection
  readonly evidenceSummary: ReportEvidenceSummary
  readonly ruleEvaluations: RuleEvaluationResult[]
  readonly validation: ValidationResult
  readonly explainability: DecisionExplainability
  readonly riskFlags: ReportRiskFlag[]
}

// ---------------------------------------------------------------------------
// Report request — what the engine needs to produce a report
// ---------------------------------------------------------------------------

export interface ReportRequest {
  readonly decisionId: string
  /** Emit a DRAFT report even if the decision is only VALIDATED (not yet COMPLETED). */
  readonly allowDraft?: boolean
}

// ---------------------------------------------------------------------------
// Report index entry — stored reference without the full payload
// ---------------------------------------------------------------------------

export interface ReportIndexEntry {
  readonly reportId: ReportId
  readonly decisionId: string
  readonly status: ReportStatus
  readonly schemaVersion: ReportSchemaVersion
  readonly confidenceScore: number
  readonly recommendedOptionId: string | null
  readonly generatedAt: string
}
