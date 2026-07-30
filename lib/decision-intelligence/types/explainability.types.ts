/**
 * Explainability — structured answers to the questions a user will always ask.
 *
 * For every decision, the system produces four canonical explanations:
 *   WHY          — why this recommendation was made
 *   WHY_NOT      — why each rejected option was not recommended
 *   EVIDENCE     — what evidence was used and how it was weighted
 *   RULES        — which rules fired and what they said
 *
 * Additionally, if there were alternatives considered, they are enumerated.
 *
 * These structures are designed to be rendered directly in the UI or
 * serialized into the Universal Decision Report — no further AI calls required.
 */

import type { ConfidenceBand, ConfidenceDimension } from './confidence.types'
import type { RuleAction } from './rules.types'
import type { EvidenceSourceType } from './evidence.types'

// ---------------------------------------------------------------------------
// Why — why was this option recommended?
// ---------------------------------------------------------------------------

export interface ExplainWhy {
  /** Plain-language summary of the recommendation rationale. */
  readonly summary: string
  /** Ordered list of reasons (most influential first). */
  readonly reasons: ExplanationReason[]
  /** The confidence band at time of recommendation. */
  readonly confidenceBand: ConfidenceBand
  /** The single strongest dimension contributing to the confidence score. */
  readonly strongestDimension: ConfidenceDimension
  /** Top evidence items that most strongly support this recommendation. */
  readonly topSupportingEvidenceIds: string[]
}

export interface ExplanationReason {
  /** Short label (e.g. "Strong evidence volume"). */
  readonly label: string
  /** 1–2 sentence explanation. */
  readonly explanation: string
  /** Relative weight of this reason in the decision (0–1). */
  readonly relativeWeight: number
}

// ---------------------------------------------------------------------------
// Why not — why was each alternative not recommended?
// ---------------------------------------------------------------------------

export interface ExplainWhyNot {
  readonly optionId: string
  readonly optionLabel: string
  /** Root cause category. */
  readonly primaryReason: WhyNotReason
  /** Human-readable explanation. */
  readonly explanation: string
  /** Rules that fired against this option. */
  readonly blockingRules: BlockingRuleExplanation[]
  /** Evidence items that weigh against this option. */
  readonly negativeEvidenceIds: string[]
  /** Score comparison to the recommended option. */
  readonly ruleScoreVsRecommended: { thisOption: number; recommended: number }
}

export type WhyNotReason =
  | 'BLOCKED_BY_RULE'
  | 'LOWER_RULE_SCORE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONTRADICTING_EVIDENCE'
  | 'FAILED_VALIDATION'

export interface BlockingRuleExplanation {
  readonly ruleId: string
  readonly ruleName: string
  readonly action: RuleAction
  readonly message: string
  readonly overrideable: boolean
}

// ---------------------------------------------------------------------------
// Evidence used — how each piece of evidence contributed
// ---------------------------------------------------------------------------

export interface ExplainEvidenceUsed {
  readonly totalEvidenceItems: number
  readonly evidenceItems: EvidenceExplanationItem[]
  readonly collectionSummary: string
}

export interface EvidenceExplanationItem {
  readonly evidenceId: string
  readonly title: string
  readonly sourceType: EvidenceSourceType
  readonly sourceLabel: string
  /**
   * Normalized weight this item received in confidence calculations (0–1).
   * Weights across all items sum to 1.0.
   */
  readonly weight: number
  /** Short statement of what this evidence contributed to the decision. */
  readonly contribution: string
  readonly freshnessScore: number
  readonly confidenceScore: number
}

// ---------------------------------------------------------------------------
// Rules triggered — what happened in the rules engine
// ---------------------------------------------------------------------------

export interface ExplainRulesTriggered {
  readonly totalRulesEvaluated: number
  readonly firedRules: FiredRuleExplanation[]
  readonly noIssuesFound: boolean
}

export interface FiredRuleExplanation {
  readonly ruleId: string
  readonly ruleName: string
  readonly action: RuleAction
  readonly rationale: string
  readonly message: string
  readonly appliedToOptionId: string
  readonly appliedToOptionLabel: string
  readonly overrideApplied: boolean
  readonly overrideJustification: string | null
}

// ---------------------------------------------------------------------------
// Alternatives considered — options that were evaluated but not recommended
// ---------------------------------------------------------------------------

export interface AlternativeConsidered {
  readonly optionId: string
  readonly optionLabel: string
  readonly ruleScore: number
  readonly whyNotRecommended: string
  readonly couldBeRecommendedIf: string | null
}

// ---------------------------------------------------------------------------
// Full explainability package — one per decision
// ---------------------------------------------------------------------------

export interface DecisionExplainability {
  readonly decisionId: string
  readonly why: ExplainWhy
  readonly whyNot: ExplainWhyNot[]
  readonly evidenceUsed: ExplainEvidenceUsed
  readonly rulesTriggered: ExplainRulesTriggered
  readonly alternativesConsidered: AlternativeConsidered[]
  readonly generatedAt: string  // ISO-8601
}
