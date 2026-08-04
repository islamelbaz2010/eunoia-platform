/**
 * Evidence — the first-class input to every decision.
 *
 * Evidence is multi-typed, traceable, and weighted. The Decision Intelligence
 * Engine never lets AI-generated analysis bypass evidence requirements; all
 * confidence calculations are grounded in the evidence attached to a decision.
 */

// ---------------------------------------------------------------------------
// Branded ID
// ---------------------------------------------------------------------------

declare const __evidenceIdBrand: unique symbol
export type EvidenceId = string & { readonly [__evidenceIdBrand]: true }
export function evidenceId(id: string): EvidenceId { return id as EvidenceId }

// ---------------------------------------------------------------------------
// Evidence source classification
// ---------------------------------------------------------------------------

/**
 * The origin of a piece of evidence.
 *
 * - `internal_data`:     structured data from the platform's own databases
 * - `user_input`:        values provided directly by the user at decision time
 * - `ai_analysis`:       inference produced by an AI model
 * - `external_source`:   third-party data (APIs, scraped content, public records)
 * - `document`:          a human-supplied file or document excerpt
 * - `human_validation`:  a human expert's explicit assessment of a claim
 */
export type EvidenceSourceType =
  | 'internal_data'
  | 'user_input'
  | 'ai_analysis'
  | 'external_source'
  | 'document'
  | 'human_validation'

/**
 * Authority weight for each source type. Used as a baseline multiplier before
 * the full freshness and quality adjustments are applied. Higher = more credible.
 *
 * These values are intentional design decisions, not arbitrary numbers.
 * human_validation ranks highest because a domain expert's direct assessment
 * carries the highest epistemic authority. ai_analysis ranks low because it is
 * a derived inference, not a primary observation.
 */
// ---------------------------------------------------------------------------
// Evidence category — the semantic domain an evidence item covers
// ---------------------------------------------------------------------------

/**
 * Semantic category for an evidence item.
 *
 * Categories are used for:
 * - Coverage analysis: detecting which domains of evidence are missing
 * - Conflict detection: flagging items in the same category that disagree
 * - Duplicate detection: identifying near-duplicate items
 * - Confidence adjustment: penalizing decisions with missing critical categories
 *
 * - `financial`:      NPV, ROI, costs, revenues, profit projections
 * - `market_data`:    CPL benchmarks, lead data, market size, growth rates
 * - `user_provided`:  data directly entered by the user (raw form input)
 * - `operational`:    capacity, timeline, process efficiency metrics
 * - `benchmark`:      validated industry or market benchmarks
 * - `risk_data`:      volatility indicators, risk factors, scenario data
 * - `competitive`:    competitor activity, market share, differentiation data
 */
export type EvidenceCategory =
  | 'financial'
  | 'market_data'
  | 'user_provided'
  | 'operational'
  | 'benchmark'
  | 'risk_data'
  | 'competitive'

export const EVIDENCE_SOURCE_AUTHORITY: Record<EvidenceSourceType, number> = {
  human_validation: 1.00,
  internal_data:    0.90,
  user_input:       0.80,
  external_source:  0.70,
  document:         0.65,
  ai_analysis:      0.55,
}

// ---------------------------------------------------------------------------
// Evidence item
// ---------------------------------------------------------------------------

export interface EvidenceSource {
  readonly type: EvidenceSourceType
  /** Human-readable label identifying where this evidence came from. */
  readonly label: string
  /** Stable URI or identifier pointing to the originating resource, if available. */
  readonly uri: string | null
  /** ISO-8601 timestamp when this evidence was retrieved or produced. */
  readonly retrievedAt: string
}

export interface EvidenceItem {
  readonly id: EvidenceId
  /** Short human-readable title describing this piece of evidence. */
  readonly title: string
  /**
   * The substantive claim or data this evidence makes.
   * Can be a string value, a number, or a structured object.
   */
  readonly content: string | number | Record<string, unknown>
  readonly source: EvidenceSource
  /**
   * A numeric indicator of how current this evidence is on a 0–1 scale.
   * 1.0 means retrieved within the last minute. Decays over time based on
   * the evidence type's defined half-life. Computed at collection time.
   */
  readonly freshness: number
  /**
   * Domain-specific confidence in this evidence item (0–1).
   * This is not the decision confidence; it is the confidence that this
   * specific piece of evidence is accurate and complete.
   */
  readonly confidence: number
  /**
   * References to other EvidenceItems that corroborate or contradict this item.
   * Positive: corroborates. Negative: contradicts.
   */
  readonly references: EvidenceReference[]
  /**
   * Key–value tags for domain-specific filtering and grouping.
   */
  readonly tags: Record<string, string>
  readonly createdAt: string  // ISO-8601
  /**
   * Semantic category of this evidence item.
   * Used for coverage analysis, duplicate detection, and confidence adjustment.
   * If not specified, the coverage analyser treats this item as uncategorized.
   */
  readonly category?: EvidenceCategory
}

export interface EvidenceReference {
  readonly evidenceId: EvidenceId
  /** Positive value: corroborating evidence. Negative: contradicting. */
  readonly relationWeight: number
  readonly description: string
}

// ---------------------------------------------------------------------------
// Evidence collection result
// ---------------------------------------------------------------------------

export interface EvidenceCollection {
  readonly decisionId: string
  readonly items: EvidenceItem[]
  /** Aggregate statistics over the entire collection. */
  readonly stats: EvidenceCollectionStats
  readonly collectedAt: string  // ISO-8601
}

export interface EvidenceCollectionStats {
  readonly total: number
  readonly bySourceType: Record<EvidenceSourceType, number>
  readonly averageFreshness: number
  readonly averageConfidence: number
  /** Count of items that contradict at least one other item in this collection. */
  readonly contradictionCount: number
  /**
   * Coverage analysis for this collection.
   * Present when the caller provides expected categories or when the
   * evidence-coverage analyser is run against this collection.
   */
  readonly coverageReport?: EvidenceCoverageReport
}

// ---------------------------------------------------------------------------
// Evidence coverage analysis — Sprint A2
// ---------------------------------------------------------------------------

/**
 * A pair of evidence items whose content appears to contradict each other.
 */
export interface ConflictPair {
  readonly evidenceIdA: string
  readonly evidenceIdB: string
  /** Human-readable description of why these two items conflict. */
  readonly conflictDescription: string
  /** How seriously this conflict affects decision quality. */
  readonly severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

/**
 * A hint about evidence that is expected but absent from the collection.
 */
export interface MissingEvidenceHint {
  readonly category: EvidenceCategory
  /** Short description of what is missing. */
  readonly description: string
  /** How much the absence of this evidence degrades decision quality. */
  readonly impact: 'HIGH' | 'MEDIUM' | 'LOW'
}

/**
 * Full coverage analysis for an evidence collection.
 *
 * Produced by `analyzeEvidenceCoverage()` and attached to the
 * EvidenceCollectionStats so confidence engines can penalize decisions
 * with insufficient evidence coverage.
 */
export interface EvidenceCoverageReport {
  /** Categories present in the collection. */
  readonly categoriesCovered: EvidenceCategory[]
  /** Categories expected but absent from the collection. */
  readonly categoriesMissing: EvidenceCategory[]
  /**
   * Coverage score in [0, 100].
   * 100 = all expected categories present.
   * 0  = no relevant evidence.
   */
  readonly coverageScore: number
  /**
   * Groups of evidence IDs that are likely duplicates.
   * Each inner array contains IDs of items that cover the same information.
   */
  readonly duplicateGroups: string[][]
  /** Pairs of items whose content appears to conflict. */
  readonly conflictPairs: ConflictPair[]
  /** Hints for what evidence should be added to improve decision quality. */
  readonly missingEvidenceHints: MissingEvidenceHint[]
  /** True if critical categories are covered sufficiently for a reliable decision. */
  readonly sufficientForDecision: boolean
}

// ---------------------------------------------------------------------------
// Evidence weight — computed per-item output from the weighter
// ---------------------------------------------------------------------------

export interface EvidenceWeight {
  readonly evidenceId: EvidenceId
  /**
   * Final normalized weight for this item in [0, 1].
   * Sum of all weights in a collection equals 1.0.
   */
  readonly weight: number
  readonly sourceAuthorityScore: number
  readonly freshnessScore: number
  readonly confidenceScore: number
  /** The raw weight before normalization across the collection. */
  readonly rawWeight: number
}
