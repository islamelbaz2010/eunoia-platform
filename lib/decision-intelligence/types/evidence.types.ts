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
