import { describe, it, expect } from 'vitest'
import { runDecisionEngine } from '../engine/decision-engine'
import { collectEvidence } from '../evidence/evidence-collector'
import { ruleId } from '../types/rules.types'
import type { DecisionInput } from '../types/decision.types'
import type { BusinessRule } from '../types/rules.types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validInput: DecisionInput = {
  subject: { domain: 'Real Estate', name: 'Investment Property', metadata: {} },
  context: {
    question: 'Should we acquire this property?',
    parameters: { budget: 500_000, propertyType: 'residential' },
    constraints: ['Must meet ROI threshold'],
    objectives: ['Maximize ROI', 'Minimize vacancy'],
  },
  options: [
    { id: 'opt-buy', label: 'Buy', description: 'Acquire the property outright' },
    { id: 'opt-lease', label: 'Lease', description: 'Enter a long-term lease instead' },
  ],
  requestedBy: 'user',
}

function makeEvidence(count = 3) {
  return collectEvidence({
    decisionId: 'n/a',
    items: Array.from({ length: count }, (_, i) => ({
      title: `Evidence ${i + 1}`,
      content: `Data point ${i + 1}`,
      sourceType: 'internal_data' as const,
      sourceLabel: 'Platform DB',
      confidence: 0.85,
      retrievedAt: new Date().toISOString(),
    })),
  }).collection
}

const blockBuyRule: BusinessRule = {
  id: ruleId('block-buy'),
  name: 'Block high-budget acquisition',
  description: 'Blocks the Buy option when budget is too high',
  rationale: 'Risk management policy',
  priority: 1,
  domains: ['Real Estate'],
  conditionGroups: [{
    conditions: [
      { factPath: 'optionId', operator: 'eq', value: 'opt-buy' },
      { factPath: 'parameters.budget', operator: 'gte', value: 500_000 },
    ],
  }],
  firesWithAction: 'FAIL',
  message: 'Buy option blocked: budget exceeds policy limit',
  overrideable: true,
  enabled: true,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runDecisionEngine — integration', () => {
  it('produces a result with all required fields', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [],
    })

    expect(result.decision).toBeDefined()
    expect(result.confidence).toBeDefined()
    expect(result.ruleResults).toBeDefined()
    expect(result.evidenceWeights).toBeDefined()
    expect(result.explainability).toBeDefined()
    expect(result.report).toBeDefined()
  })

  it('assigns VALIDATED status when validation passes', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [],
    })
    expect(result.decision.status).toBe('VALIDATED')
  })

  it('assigns REJECTED status when no evidence provided', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(0),
      rules: [],
      thresholds: { minimumEvidenceCount: 1 },
    })
    expect(result.decision.status).toBe('REJECTED')
    expect(result.decision.recommendation).toBeNull()
  })

  it('recommends the highest-scoring option', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [],
    })
    // Both options have equal rule scores with no rules — picks first eligible
    expect(result.decision.recommendation?.recommendedOptionId).toBeTruthy()
  })

  it('excludes blocked options from recommendation', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [blockBuyRule],
    })
    // Buy is blocked — only Lease is eligible
    const rec = result.decision.recommendation
    if (rec?.recommendedOptionId !== null) {
      expect(rec?.recommendedOptionId).not.toBe('opt-buy')
    }
  })

  it('marks the buy option as blocked when block rule fires', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [blockBuyRule],
    })
    const buyOption = result.decision.options.find(o => (o.id as string) === 'opt-buy')
    expect(buyOption?.blockedByRules).toBe(true)
  })

  it('produces a Universal Decision Report with correct schema version', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [],
    })
    expect(result.report.metadata.schemaVersion).toBe('1.0.0')
    expect(result.report.metadata.generatedBy).toBe('decision-engine-v1')
  })

  it('report option scoring matches decision options', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [],
    })
    expect(result.report.optionScoring).toHaveLength(result.decision.options.length)
  })

  it('explainability references the decision ID', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [],
    })
    expect(result.explainability.decisionId).toBe(result.decision.id as string)
  })

  it('evidence weights sum to 1.0', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(5),
      rules: [],
    })
    const total = result.evidenceWeights.reduce((s, w) => s + w.weight, 0)
    expect(total).toBeCloseTo(1.0, 5)
  })

  it('status history records DRAFT → EVALUATING → final transition', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [],
    })
    const history = result.decision.statusHistory
    expect(history[0].fromStatus).toBe('DRAFT')
    expect(history[0].toStatus).toBe('EVALUATING')
    expect(history[1].fromStatus).toBe('EVALUATING')
    expect(['VALIDATED', 'REJECTED']).toContain(history[1].toStatus)
  })

  it('adds HIGH confidence risk flag when confidence is LOW', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(0),
      rules: [],
      thresholds: { minimumEvidenceCount: 0, minimumConfidenceScore: 0 },
    })
    const highFlags = result.report.riskFlags.filter(f => f.severity === 'HIGH')
    expect(highFlags.length).toBeGreaterThanOrEqual(1)
  })

  it('report.trustScore has correct shape and valid band', () => {
    const result = runDecisionEngine({
      input: validInput,
      evidence: makeEvidence(3),
      rules: [],
    })
    const { trustScore } = result.report
    expect(trustScore).toBeDefined()
    expect(typeof trustScore.score).toBe('number')
    expect(trustScore.score).toBeGreaterThanOrEqual(0)
    expect(trustScore.score).toBeLessThanOrEqual(100)
    expect(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).toContain(trustScore.band)
    expect(typeof trustScore.label).toBe('string')
    expect(trustScore.label.length).toBeGreaterThan(0)
    expect(typeof trustScore.isRuleDetermined).toBe('boolean')
    expect(trustScore.score).toBe(result.report.confidence.overall)
  })
})
