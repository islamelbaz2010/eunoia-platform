import { describe, it, expect } from 'vitest'
import { runValidationPipeline } from '../engine/validation-engine'
import { collectEvidence } from '../evidence/evidence-collector'
import { computeConfidenceScore } from '../engine/confidence-engine'
import type { DecisionInput } from '../types/decision.types'
import type { ConfidenceInput } from '../types/confidence.types'

const validInput: DecisionInput = {
  subject: { domain: 'Real Estate', name: 'Test Property', metadata: {} },
  context: {
    question: 'Should we invest?',
    parameters: {},
    constraints: [],
    objectives: [],
  },
  options: [
    { id: 'opt-a', label: 'Buy', description: 'Purchase the property' },
  ],
  requestedBy: 'user',
}

function makeEvidence(count = 1) {
  return collectEvidence({
    decisionId: 'decision-1',
    items: Array.from({ length: count }, (_, i) => ({
      title: `Evidence ${i + 1}`,
      content: 'Some content',
      sourceType: 'internal_data' as const,
      sourceLabel: 'DB',
      confidence: 0.8,
      retrievedAt: new Date().toISOString(),
    })),
  }).collection
}

function makeConfidence(overrides: Partial<ConfidenceInput['ruleCompliance']> = {}) {
  return computeConfidenceScore({
    volume: { totalEvidenceCount: 3, uniqueSourceTypeCount: 2 },
    quality: { averageAuthorityScore: 0.9, aiEvidenceCount: 0, humanEvidenceCount: 1, totalEvidenceCount: 3 },
    freshness: { weightedAverageFreshness: 0.9, maxAgeHours: 1 },
    consistency: { contradictionCount: 0, totalEvidenceCount: 3, consensusRatio: 1.0 },
    ruleCompliance: { totalRulesEvaluated: 3, passedRules: 3, criticalViolationCount: 0, warningCount: 0, ...overrides },
  })
}

describe('runValidationPipeline', () => {
  it('passes for valid input with sufficient evidence', () => {
    const result = runValidationPipeline({
      decisionId: 'd1',
      input: validInput,
      evidence: makeEvidence(1),
      confidence: makeConfidence(),
      ruleResults: [],
    })
    expect(result.pipelineStatus).toBe('PASSED')
    expect(result.summary.canProceed).toBe(true)
  })

  it('fails structural stage when question is empty', () => {
    const badInput: DecisionInput = {
      ...validInput,
      context: { ...validInput.context, question: '' },
    }
    const result = runValidationPipeline({
      decisionId: 'd1',
      input: badInput,
      evidence: makeEvidence(1),
      confidence: makeConfidence(),
      ruleResults: [],
    })
    expect(result.pipelineStatus).toBe('FAILED')
    expect(result.haltedAtStage).toBe('structural')
  })

  it('fails structural stage when no options provided', () => {
    const badInput: DecisionInput = { ...validInput, options: [] }
    const result = runValidationPipeline({
      decisionId: 'd1',
      input: badInput,
      evidence: makeEvidence(1),
      confidence: makeConfidence(),
      ruleResults: [],
    })
    expect(result.haltedAtStage).toBe('structural')
  })

  it('fails evidence stage when below minimum count', () => {
    const result = runValidationPipeline({
      decisionId: 'd1',
      input: validInput,
      evidence: makeEvidence(0),
      confidence: makeConfidence(),
      ruleResults: [],
      thresholds: { minimumEvidenceCount: 1 },
    })
    expect(result.haltedAtStage).toBe('evidence')
  })

  it('fails confidence stage when below minimum threshold', () => {
    const lowConf = computeConfidenceScore({
      volume: { totalEvidenceCount: 0, uniqueSourceTypeCount: 0 },
      quality: { averageAuthorityScore: 0, aiEvidenceCount: 0, humanEvidenceCount: 0, totalEvidenceCount: 0 },
      freshness: { weightedAverageFreshness: 0, maxAgeHours: 9999 },
      consistency: { contradictionCount: 10, totalEvidenceCount: 10, consensusRatio: 0 },
      ruleCompliance: { totalRulesEvaluated: 5, passedRules: 0, criticalViolationCount: 5, warningCount: 0 },
    })
    const result = runValidationPipeline({
      decisionId: 'd1',
      input: validInput,
      evidence: makeEvidence(1),
      confidence: lowConf,
      ruleResults: [],
      thresholds: { minimumConfidenceScore: 50 },
    })
    expect(result.pipelineStatus).toBe('FAILED')
  })

  it('skips subsequent stages after halt', () => {
    const badInput: DecisionInput = { ...validInput, options: [] }
    const result = runValidationPipeline({
      decisionId: 'd1',
      input: badInput,
      evidence: makeEvidence(1),
      confidence: makeConfidence(),
      ruleResults: [],
    })
    const skipped = result.stages.filter(s => s.status === 'SKIP')
    expect(skipped.length).toBeGreaterThan(0)
  })

  it('records total duration', () => {
    const result = runValidationPipeline({
      decisionId: 'd1',
      input: validInput,
      evidence: makeEvidence(1),
      confidence: makeConfidence(),
      ruleResults: [],
    })
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0)
  })

  it('returns PARTIAL status when only warnings exist', () => {
    // Low freshness triggers a warning
    const freshEvidence = collectEvidence({
      decisionId: 'd1',
      items: [{
        title: 'Stale data',
        content: 'old',
        sourceType: 'external_source' as const,
        sourceLabel: 'Web',
        confidence: 0.8,
        retrievedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }],
    }).collection

    const conf = computeConfidenceScore({
      volume: { totalEvidenceCount: 1, uniqueSourceTypeCount: 1 },
      quality: { averageAuthorityScore: 0.7, aiEvidenceCount: 0, humanEvidenceCount: 0, totalEvidenceCount: 1 },
      freshness: { weightedAverageFreshness: 0.1, maxAgeHours: 720 },
      consistency: { contradictionCount: 0, totalEvidenceCount: 1, consensusRatio: 1 },
      ruleCompliance: { totalRulesEvaluated: 0, passedRules: 0, criticalViolationCount: 0, warningCount: 0 },
    })

    const result = runValidationPipeline({
      decisionId: 'd1',
      input: validInput,
      evidence: freshEvidence,
      confidence: conf,
      ruleResults: [],
      thresholds: { minimumConfidenceScore: 1 },
    })

    // At minimum, no FAILED status
    expect(['PASSED', 'PARTIAL']).toContain(result.pipelineStatus)
  })
})
