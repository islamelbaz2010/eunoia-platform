/**
 * Confidence — a dimensional model, not an arbitrary percentage.
 *
 * Overall confidence is computed from five independent dimensions. Each
 * dimension has a defined weight. Weights must sum to exactly 1.0.
 *
 * The dimensional model is essential for explainability: instead of
 * "74% confident", the system can say "low confidence in evidence freshness
 * (score: 0.31) is dragging the overall score from 88 to 74".
 */

// ---------------------------------------------------------------------------
// Dimension definitions
// ---------------------------------------------------------------------------

/**
 * The five dimensions of decision confidence.
 *
 * `evidence_volume`:      how much evidence is present and how diverse its types are
 * `evidence_quality`:     authority and human-vs-AI ratio of the evidence
 * `evidence_freshness`:   weighted recency of all evidence items
 * `evidence_consistency`: degree of agreement across evidence items
 * `rule_compliance`:      how well the decision options satisfy business rules
 */
export type ConfidenceDimension =
  | 'evidence_volume'
  | 'evidence_quality'
  | 'evidence_freshness'
  | 'evidence_consistency'
  | 'rule_compliance'

/**
 * Dimension weights — must sum to exactly 1.0.
 *
 * These weights encode product priorities: quality and freshness of evidence
 * are the strongest predictors of decision reliability, so they carry the
 * highest weights.
 */
export const CONFIDENCE_DIMENSION_WEIGHTS: Record<ConfidenceDimension, number> = {
  evidence_volume:      0.20,
  evidence_quality:     0.25,
  evidence_freshness:   0.20,
  evidence_consistency: 0.20,
  rule_compliance:      0.15,
} as const

// Compile-time guard — weights must sum to 1.0
const _weightSum = Object.values(CONFIDENCE_DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0)
if (Math.abs(_weightSum - 1.0) > 0.0001) {
  throw new Error(`CONFIDENCE_DIMENSION_WEIGHTS must sum to 1.0, got ${_weightSum}`)
}

// ---------------------------------------------------------------------------
// Per-dimension score
// ---------------------------------------------------------------------------

export interface DimensionScore {
  readonly dimension: ConfidenceDimension
  /** Raw score in [0, 100] before weighting. */
  readonly rawScore: number
  /** Weighted contribution to the overall score (rawScore * weight). */
  readonly weightedScore: number
  readonly weight: number
  /**
   * Short machine-readable code for the main factor driving this score.
   * Used by the explainability engine to generate human-readable explanations.
   */
  readonly primaryFactor: string
  /** Supporting metrics that fed into this dimension's calculation. */
  readonly supportingMetrics: Record<string, number>
}

// ---------------------------------------------------------------------------
// Volume dimension inputs
// ---------------------------------------------------------------------------

export interface EvidenceVolumeInput {
  readonly totalEvidenceCount: number
  readonly uniqueSourceTypeCount: number
}

// ---------------------------------------------------------------------------
// Quality dimension inputs
// ---------------------------------------------------------------------------

export interface EvidenceQualityInput {
  /** Average authority score across all evidence items (0–1). */
  readonly averageAuthorityScore: number
  /** Count of items with source type === 'ai_analysis'. */
  readonly aiEvidenceCount: number
  /** Count of items with source type === 'human_validation'. */
  readonly humanEvidenceCount: number
  readonly totalEvidenceCount: number
}

// ---------------------------------------------------------------------------
// Freshness dimension inputs
// ---------------------------------------------------------------------------

export interface EvidenceFreshnessInput {
  /** Weighted average freshness across all evidence items (0–1). */
  readonly weightedAverageFreshness: number
  /** Maximum age in hours of any evidence item in the collection. */
  readonly maxAgeHours: number
}

// ---------------------------------------------------------------------------
// Consistency dimension inputs
// ---------------------------------------------------------------------------

export interface EvidenceConsistencyInput {
  /** Number of evidence items contradicting at least one other item. */
  readonly contradictionCount: number
  readonly totalEvidenceCount: number
  /**
   * Ratio of evidence items that agree with the majority position (0–1).
   * Computed by the evidence collector based on reference weights.
   */
  readonly consensusRatio: number
}

// ---------------------------------------------------------------------------
// Rule compliance dimension inputs
// ---------------------------------------------------------------------------

export interface RuleComplianceInput {
  readonly totalRulesEvaluated: number
  readonly passedRules: number
  /** Rules with action === 'FAIL' that fired. */
  readonly criticalViolationCount: number
  /** Rules with action === 'WARN' that fired. */
  readonly warningCount: number
}

// ---------------------------------------------------------------------------
// Full confidence score result
// ---------------------------------------------------------------------------

export interface ConfidenceScore {
  /**
   * Overall weighted confidence score in [0, 100].
   * This is the canonical score that appears in reports and recommendations.
   */
  readonly overall: number
  /** Per-dimension breakdown. */
  readonly dimensions: DimensionScore[]
  /**
   * Textual band — coarse label for the confidence level.
   *
   *   VERY_HIGH: overall >= 85
   *   HIGH:      overall >= 70
   *   MEDIUM:    overall >= 50
   *   LOW:       overall >= 30
   *   VERY_LOW:  overall < 30
   */
  readonly band: ConfidenceBand
  /** The dimension with the lowest weighted score. */
  readonly weakestDimension: ConfidenceDimension
  /** The dimension with the highest weighted score. */
  readonly strongestDimension: ConfidenceDimension
  readonly computedAt: string  // ISO-8601
}

export type ConfidenceBand = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW'

export const CONFIDENCE_BANDS: { min: number; band: ConfidenceBand }[] = [
  { min: 85, band: 'VERY_HIGH' },
  { min: 70, band: 'HIGH' },
  { min: 50, band: 'MEDIUM' },
  { min: 30, band: 'LOW' },
  { min: 0,  band: 'VERY_LOW' },
]

// ---------------------------------------------------------------------------
// Input aggregate consumed by the confidence engine
// ---------------------------------------------------------------------------

export interface ConfidenceInput {
  readonly volume: EvidenceVolumeInput
  readonly quality: EvidenceQualityInput
  readonly freshness: EvidenceFreshnessInput
  readonly consistency: EvidenceConsistencyInput
  readonly ruleCompliance: RuleComplianceInput
}
