import { describe, it, expect } from 'vitest'
import { computeConfidenceScore } from '../engine/confidence-engine'
import type { ConfidenceInput } from '../types/confidence.types'

const perfectInput: ConfidenceInput = {
  volume: { totalEvidenceCount: 10, uniqueSourceTypeCount: 6 },
  quality: { averageAuthorityScore: 1.0, aiEvidenceCount: 0, humanEvidenceCount: 5, totalEvidenceCount: 10 },
  freshness: { weightedAverageFreshness: 1.0, maxAgeHours: 1 },
  consistency: { contradictionCount: 0, totalEvidenceCount: 10, consensusRatio: 1.0 },
  ruleCompliance: { totalRulesEvaluated: 5, passedRules: 5, criticalViolationCount: 0, warningCount: 0 },
}

const emptyInput: ConfidenceInput = {
  volume: { totalEvidenceCount: 0, uniqueSourceTypeCount: 0 },
  quality: { averageAuthorityScore: 0, aiEvidenceCount: 0, humanEvidenceCount: 0, totalEvidenceCount: 0 },
  freshness: { weightedAverageFreshness: 0, maxAgeHours: 0 },
  consistency: { contradictionCount: 0, totalEvidenceCount: 0, consensusRatio: 0 },
  ruleCompliance: { totalRulesEvaluated: 0, passedRules: 0, criticalViolationCount: 0, warningCount: 0 },
}

describe('computeConfidenceScore', () => {
  it('returns a score in [0, 100]', () => {
    const score = computeConfidenceScore(perfectInput)
    expect(score.overall).toBeGreaterThanOrEqual(0)
    expect(score.overall).toBeLessThanOrEqual(100)
  })

  it('returns VERY_HIGH band for perfect inputs', () => {
    const score = computeConfidenceScore(perfectInput)
    expect(score.band).toBe('VERY_HIGH')
  })

  it('returns a score with 5 dimension entries', () => {
    const score = computeConfidenceScore(perfectInput)
    expect(score.dimensions).toHaveLength(5)
  })

  it('dimension weights match CONFIDENCE_DIMENSION_WEIGHTS', () => {
    const score = computeConfidenceScore(perfectInput)
    const dims = Object.fromEntries(score.dimensions.map(d => [d.dimension, d.weight]))
    expect(dims['evidence_volume']).toBeCloseTo(0.20)
    expect(dims['evidence_quality']).toBeCloseTo(0.25)
    expect(dims['evidence_freshness']).toBeCloseTo(0.20)
    expect(dims['evidence_consistency']).toBeCloseTo(0.20)
    expect(dims['rule_compliance']).toBeCloseTo(0.15)
  })

  it('overall equals Math.round of summed weighted scores', () => {
    const score = computeConfidenceScore(perfectInput)
    const sumWeighted = score.dimensions.reduce((s, d) => s + d.weightedScore, 0)
    expect(score.overall).toBe(Math.round(sumWeighted))
  })

  it('identifies weakest and strongest dimensions', () => {
    // Force freshness low
    const input: ConfidenceInput = {
      ...perfectInput,
      freshness: { weightedAverageFreshness: 0.0, maxAgeHours: 10000 },
    }
    const score = computeConfidenceScore(input)
    expect(score.weakestDimension).toBe('evidence_freshness')
  })

  it('penalises critical rule violations', () => {
    const withViolations: ConfidenceInput = {
      ...perfectInput,
      ruleCompliance: { totalRulesEvaluated: 5, passedRules: 2, criticalViolationCount: 3, warningCount: 0 },
    }
    const perfect = computeConfidenceScore(perfectInput)
    const violated = computeConfidenceScore(withViolations)
    expect(violated.overall).toBeLessThan(perfect.overall)
  })

  it('returns 100 rules score when no rules apply', () => {
    const noRules: ConfidenceInput = {
      ...perfectInput,
      ruleCompliance: { totalRulesEvaluated: 0, passedRules: 0, criticalViolationCount: 0, warningCount: 0 },
    }
    const score = computeConfidenceScore(noRules)
    const rulesDim = score.dimensions.find(d => d.dimension === 'rule_compliance')
    expect(rulesDim?.rawScore).toBe(100)
  })

  it('handles empty input without throwing', () => {
    expect(() => computeConfidenceScore(emptyInput)).not.toThrow()
  })

  it('computedAt is a valid ISO-8601 timestamp', () => {
    const score = computeConfidenceScore(perfectInput)
    expect(new Date(score.computedAt).toISOString()).toBe(score.computedAt)
  })
})
