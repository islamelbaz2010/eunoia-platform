/**
 * Confidence Engine — computes the dimensional confidence score.
 *
 * Each of the five dimensions is computed from structured numeric inputs —
 * never from free-form AI text. The engine is pure: same inputs → same outputs.
 *
 * See confidence.types.ts for the full model and dimension weight definitions.
 */

import type {
  ConfidenceInput,
  ConfidenceScore,
  ConfidenceDimension,
  DimensionScore,
  ConfidenceBand,
} from '../types/confidence.types'
import {
  CONFIDENCE_DIMENSION_WEIGHTS,
  CONFIDENCE_BANDS,
} from '../types/confidence.types'

// ---------------------------------------------------------------------------
// Per-dimension computation
// ---------------------------------------------------------------------------

function computeVolumeScore(
  input: ConfidenceInput['volume'],
): Omit<DimensionScore, 'weightedScore'> {
  const { totalEvidenceCount, uniqueSourceTypeCount } = input

  // Volume component: saturates at 10 items (score 1.0)
  const volumeComponent = Math.min(1, totalEvidenceCount / 10)

  // Diversity component: 6 source types → full diversity score
  const diversityComponent = Math.min(1, uniqueSourceTypeCount / 6)

  // 60/40 blend: enough items matter more than type diversity
  const rawScore = Math.round((volumeComponent * 0.6 + diversityComponent * 0.4) * 100)

  const primaryFactor =
    totalEvidenceCount === 0 ? 'no_evidence'
    : totalEvidenceCount < 3 ? 'low_volume'
    : uniqueSourceTypeCount === 1 ? 'low_diversity'
    : 'adequate'

  return {
    dimension: 'evidence_volume',
    rawScore,
    weight: CONFIDENCE_DIMENSION_WEIGHTS['evidence_volume'],
    primaryFactor,
    supportingMetrics: { totalEvidenceCount, uniqueSourceTypeCount },
  }
}

function computeQualityScore(
  input: ConfidenceInput['quality'],
): Omit<DimensionScore, 'weightedScore'> {
  const { averageAuthorityScore, aiEvidenceCount, humanEvidenceCount, totalEvidenceCount, coverageScore } = input

  const authorityComponent = averageAuthorityScore  // already in [0, 1]

  // Prefer human evidence over AI evidence: penalise AI-heavy collections
  const aiRatio = totalEvidenceCount > 0 ? aiEvidenceCount / totalEvidenceCount : 0
  const humanRatio = totalEvidenceCount > 0 ? humanEvidenceCount / totalEvidenceCount : 0
  // AI-only collection → penalty of 0.2; human-only → bonus of 0.1 over neutral
  const sourceCompositionComponent = Math.max(0, Math.min(1, 0.7 + humanRatio * 0.3 - aiRatio * 0.2))

  // Coverage penalty: missing required evidence categories reduces quality score.
  // When coverageScore is 0 (no relevant evidence), apply maximum penalty (0.3 reduction).
  // When coverageScore is 100 (all expected categories covered), no penalty.
  const coverageComponent = coverageScore !== undefined
    ? Math.max(0, Math.min(1, coverageScore / 100))
    : 1.0  // no penalty when coverage analysis wasn't run

  // Blend: authority 50%, source composition 30%, coverage 20%
  const blendedScore = authorityComponent * 0.50 + sourceCompositionComponent * 0.30 + coverageComponent * 0.20

  const rawScore = Math.round(blendedScore * 100)

  const primaryFactor =
    totalEvidenceCount === 0 ? 'no_evidence'
    : coverageScore !== undefined && coverageScore < 40 ? 'missing_evidence_categories'
    : aiRatio > 0.7 ? 'ai_heavy'
    : humanRatio > 0.3 ? 'human_validated'
    : 'mixed_sources'

  return {
    dimension: 'evidence_quality',
    rawScore,
    weight: CONFIDENCE_DIMENSION_WEIGHTS['evidence_quality'],
    primaryFactor,
    supportingMetrics: { averageAuthorityScore, aiRatio, humanRatio, coverageScore: coverageScore ?? -1 },
  }
}

function computeFreshnessScore(
  input: ConfidenceInput['freshness'],
): Omit<DimensionScore, 'weightedScore'> {
  const { weightedAverageFreshness, maxAgeHours } = input

  // Penalise staleness: if any item is older than 720h (30 days), cap score
  const ageCapPenalty = maxAgeHours > 720 ? 0.5 : maxAgeHours > 168 ? 0.8 : 1.0

  const rawScore = Math.round(weightedAverageFreshness * ageCapPenalty * 100)

  const primaryFactor =
    weightedAverageFreshness < 0.3 ? 'very_stale'
    : weightedAverageFreshness < 0.6 ? 'moderately_stale'
    : maxAgeHours > 720 ? 'oldest_item_very_old'
    : 'fresh'

  return {
    dimension: 'evidence_freshness',
    rawScore,
    weight: CONFIDENCE_DIMENSION_WEIGHTS['evidence_freshness'],
    primaryFactor,
    supportingMetrics: { weightedAverageFreshness, maxAgeHours, ageCapPenalty },
  }
}

function computeConsistencyScore(
  input: ConfidenceInput['consistency'],
): Omit<DimensionScore, 'weightedScore'> {
  const { contradictionCount, totalEvidenceCount, consensusRatio } = input

  if (totalEvidenceCount === 0) {
    return {
      dimension: 'evidence_consistency',
      rawScore: 0,
      weight: CONFIDENCE_DIMENSION_WEIGHTS['evidence_consistency'],
      primaryFactor: 'no_evidence',
      supportingMetrics: { contradictionCount, totalEvidenceCount, consensusRatio },
    }
  }

  // Contradiction ratio: fraction of items involved in contradictions
  const contradictionRatio = contradictionCount / totalEvidenceCount

  // Consensus component: from the ratio supplied by the collector
  const consistencyRaw =
    consensusRatio * 0.5 + (1 - contradictionRatio) * 0.5

  const rawScore = Math.round(Math.max(0, Math.min(1, consistencyRaw)) * 100)

  const primaryFactor =
    contradictionRatio > 0.5 ? 'high_contradictions'
    : contradictionRatio > 0.2 ? 'some_contradictions'
    : consensusRatio < 0.5 ? 'low_consensus'
    : 'consistent'

  return {
    dimension: 'evidence_consistency',
    rawScore,
    weight: CONFIDENCE_DIMENSION_WEIGHTS['evidence_consistency'],
    primaryFactor,
    supportingMetrics: { contradictionRatio, consensusRatio },
  }
}

function computeRuleComplianceScore(
  input: ConfidenceInput['ruleCompliance'],
): Omit<DimensionScore, 'weightedScore'> {
  const { totalRulesEvaluated, passedRules, criticalViolationCount, warningCount } = input

  if (totalRulesEvaluated === 0) {
    // No rules = unknown compliance, not perfect compliance.
    // Returning 100 would falsely inflate confidence when zero domain logic is applied.
    // 50 signals "uncertain" — cannot verify compliance without rules.
    return {
      dimension: 'rule_compliance',
      rawScore: 50,
      weight: CONFIDENCE_DIMENSION_WEIGHTS['rule_compliance'],
      primaryFactor: 'no_rules_evaluated',
      supportingMetrics: {},
    }
  }

  const passRate = passedRules / totalRulesEvaluated
  // Critical violations are heavily penalised — each removes 20 points
  const criticalPenalty = Math.min(1, criticalViolationCount * 0.2)
  // Warnings are mildly penalised — each removes 5 points
  const warningPenalty = Math.min(0.3, warningCount * 0.05)

  const rawScore = Math.round(
    Math.max(0, (passRate - criticalPenalty - warningPenalty)) * 100,
  )

  const primaryFactor =
    criticalViolationCount > 0 ? 'critical_violations'
    : warningCount > 2 ? 'multiple_warnings'
    : passRate < 0.8 ? 'low_pass_rate'
    : 'compliant'

  return {
    dimension: 'rule_compliance',
    rawScore,
    weight: CONFIDENCE_DIMENSION_WEIGHTS['rule_compliance'],
    primaryFactor,
    supportingMetrics: { passRate, criticalViolationCount, warningCount },
  }
}

// ---------------------------------------------------------------------------
// Band classification
// ---------------------------------------------------------------------------

function classifyBand(overall: number): ConfidenceBand {
  for (const { min, band } of CONFIDENCE_BANDS) {
    if (overall >= min) return band
  }
  return 'VERY_LOW'
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function computeConfidenceScore(input: ConfidenceInput): ConfidenceScore {
  const partials = [
    computeVolumeScore(input.volume),
    computeQualityScore(input.quality),
    computeFreshnessScore(input.freshness),
    computeConsistencyScore(input.consistency),
    computeRuleComplianceScore(input.ruleCompliance),
  ]

  const dimensions: DimensionScore[] = partials.map(p => ({
    ...p,
    weightedScore: p.rawScore * p.weight,
  }))

  const overall = Math.round(dimensions.reduce((sum, d) => sum + d.weightedScore, 0))

  const weakest = dimensions.reduce((min, d) => d.weightedScore < min.weightedScore ? d : min)
  const strongest = dimensions.reduce((max, d) => d.weightedScore > max.weightedScore ? d : max)

  const coverageScore = input.quality.coverageScore
  const noEvidence = input.volume.totalEvidenceCount === 0
  const coverageCriticallyLow = coverageScore !== undefined && coverageScore < 30
  const sufficientForDecision = !noEvidence && !coverageCriticallyLow && overall >= 25

  return {
    overall,
    dimensions,
    band: classifyBand(overall),
    weakestDimension: weakest.dimension,
    strongestDimension: strongest.dimension,
    computedAt: new Date().toISOString(),
    sufficientForDecision,
    coverageScore,
  }
}
