/**
 * Evidence Weighter — assigns a normalized weight to each evidence item.
 *
 * The weight reflects how much influence each item should have in confidence
 * calculations. Three factors compose the raw weight:
 *
 *   1. Source authority (from EVIDENCE_SOURCE_AUTHORITY)
 *   2. Freshness score (exponentially decayed, computed by the collector)
 *   3. Per-item confidence (supplied by the caller)
 *
 * Raw weights are then normalized so they sum to 1.0, making them directly
 * usable as fractional contributions in weighted-average calculations.
 */

import type { EvidenceItem, EvidenceWeight } from '../types/evidence.types'
import { EVIDENCE_SOURCE_AUTHORITY } from '../types/evidence.types'

// ---------------------------------------------------------------------------
// Composition weights for the three factors
// ---------------------------------------------------------------------------

const FACTOR_WEIGHTS = {
  sourceAuthority: 0.40,
  freshness:       0.35,
  confidence:      0.25,
} as const

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute normalized weights for a collection of evidence items.
 *
 * Returns one EvidenceWeight per item, in the same order as the input array.
 * If the input is empty, returns an empty array.
 */
export function weightEvidence(items: EvidenceItem[]): EvidenceWeight[] {
  if (items.length === 0) return []

  const raw = items.map(item => {
    const sourceAuthorityScore = EVIDENCE_SOURCE_AUTHORITY[item.source.type]
    const freshnessScore = item.freshness          // already in [0, 1]
    const confidenceScore = item.confidence        // already in [0, 1]

    const rawWeight =
      sourceAuthorityScore * FACTOR_WEIGHTS.sourceAuthority +
      freshnessScore       * FACTOR_WEIGHTS.freshness +
      confidenceScore      * FACTOR_WEIGHTS.confidence

    return {
      evidenceId: item.id,
      sourceAuthorityScore,
      freshnessScore,
      confidenceScore,
      rawWeight,
    }
  })

  const totalRaw = raw.reduce((sum, r) => sum + r.rawWeight, 0)

  return raw.map(r => ({
    evidenceId: r.evidenceId,
    weight: totalRaw > 0 ? r.rawWeight / totalRaw : 1 / items.length,
    sourceAuthorityScore: r.sourceAuthorityScore,
    freshnessScore: r.freshnessScore,
    confidenceScore: r.confidenceScore,
    rawWeight: r.rawWeight,
  }))
}

/**
 * Compute the weighted average freshness across a collection.
 * Returns 0 if no items are provided.
 */
export function weightedAverageFreshness(
  items: EvidenceItem[],
  weights: EvidenceWeight[],
): number {
  if (items.length === 0) return 0
  return items.reduce((sum, item, i) => {
    const w = weights[i]?.weight ?? 0
    return sum + item.freshness * w
  }, 0)
}

/**
 * Compute the maximum age in hours across all evidence items.
 * Age is computed relative to `now` (defaults to Date.now()).
 */
export function maxEvidenceAgeHours(
  items: EvidenceItem[],
  now = Date.now(),
): number {
  if (items.length === 0) return 0
  return items.reduce((max, item) => {
    const ageMs = now - new Date(item.source.retrievedAt).getTime()
    const ageHours = Math.max(0, ageMs / (1000 * 60 * 60))
    return Math.max(max, ageHours)
  }, 0)
}
