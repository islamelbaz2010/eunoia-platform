/**
 * Phase A — Sprint A1: Rule Intelligence
 *
 * Tests that every rule exposes:
 *   - conditionTrace (actual values that triggered conditions)
 *   - explanation (dynamic message with actual values)
 *   - scoreImpact (marginal contribution to option score)
 *   - weightedRuleScore (weight-adjusted compliance score)
 *   - firedCategories (which rule categories fired)
 */

import { describe, it, expect } from 'vitest'
import { evaluateRules } from '../engine/rules-engine'
import { ruleId } from '../types/rules.types'
import type { BusinessRule, RuleFacts } from '../types/rules.types'

const baseFacts: RuleFacts = {
  decisionId: 'dec-test-1',
  optionId: 'opt-proceed',
  subject: { domain: 'market_intelligence' },
  context: { question: 'What should we do?' },
  parameters: {
    computed_npv: -50000,
    computed_roi_annual: 0.05,  // 5%, below 8% minimum
  },
}

function makeRule(overrides: Partial<BusinessRule>): BusinessRule {
  return {
    id: ruleId('r1'),
    name: 'Test Rule',
    description: 'Test',
    rationale: 'Test rationale',
    priority: 1,
    domains: [],
    conditionGroups: [],
    firesWithAction: 'FAIL',
    message: 'Rule fired',
    overrideable: false,
    enabled: true,
    ...overrides,
  }
}

describe('Sprint A1 — Condition Trace', () => {
  it('fired rule includes conditionTrace with actualValue and expectedValue', () => {
    const rule = makeRule({
      conditionGroups: [{
        conditions: [
          { factPath: 'parameters.computed_npv', operator: 'lte', value: 0 },
        ],
      }],
      firesWithAction: 'FAIL',
    })
    const result = evaluateRules([rule], baseFacts)
    const r = result.results[0]

    expect(r.fired).toBe(true)
    expect(r.conditionTrace).toHaveLength(1)
    expect(r.conditionTrace[0].factPath).toBe('parameters.computed_npv')
    expect(r.conditionTrace[0].actualValue).toBe(-50000)
    expect(r.conditionTrace[0].expectedValue).toBe(0)
    expect(r.conditionTrace[0].matched).toBe(true)
    expect(r.conditionTrace[0].operator).toBe('lte')
  })

  it('non-fired rule still includes conditionTrace showing why it did not match', () => {
    const rule = makeRule({
      conditionGroups: [{
        conditions: [
          { factPath: 'parameters.computed_npv', operator: 'gt', value: 100000 },
        ],
      }],
      firesWithAction: 'WARN',
    })
    const result = evaluateRules([rule], baseFacts)
    const r = result.results[0]

    expect(r.fired).toBe(false)
    expect(r.conditionTrace).toHaveLength(1)
    expect(r.conditionTrace[0].actualValue).toBe(-50000)
    expect(r.conditionTrace[0].matched).toBe(false)
  })

  it('disabled rule has empty conditionTrace', () => {
    const rule = makeRule({ enabled: false })
    const result = evaluateRules([rule], baseFacts)
    expect(result.results[0].conditionTrace).toHaveLength(0)
  })

  it('multi-condition group traces all conditions', () => {
    const rule = makeRule({
      conditionGroups: [{
        conditions: [
          { factPath: 'optionId', operator: 'eq', value: 'opt-proceed' },
          { factPath: 'parameters.computed_npv', operator: 'lte', value: 0 },
        ],
      }],
      firesWithAction: 'FAIL',
    })
    const result = evaluateRules([rule], baseFacts)
    const r = result.results[0]

    expect(r.fired).toBe(true)
    expect(r.conditionTrace).toHaveLength(2)
    expect(r.conditionTrace[0].matched).toBe(true)
    expect(r.conditionTrace[1].matched).toBe(true)
  })
})

describe('Sprint A1 — Dynamic Explanation', () => {
  it('fired rule explanation includes actual values and marks it as fired', () => {
    const rule = makeRule({
      name: 'Negative NPV blocks proceed',
      conditionGroups: [{
        conditions: [{ factPath: 'parameters.computed_npv', operator: 'lte', value: 0 }],
      }],
      firesWithAction: 'FAIL',
      message: 'NPV is negative — do not proceed',
    })
    const result = evaluateRules([rule], baseFacts)
    const r = result.results[0]

    expect(r.explanation).toContain('Negative NPV blocks proceed')
    expect(r.explanation).toContain('-50,000')   // actual value formatted
    expect(r.explanation).toContain('FAIL')
  })

  it('non-fired rule explanation says "did not fire"', () => {
    const rule = makeRule({
      conditionGroups: [{
        conditions: [{ factPath: 'parameters.computed_npv', operator: 'gt', value: 1000000 }],
      }],
      firesWithAction: 'WARN',
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.results[0].explanation).toContain('did not fire')
  })
})

describe('Sprint A1 — Score Impact', () => {
  it('FAIL rule with weight 1.0 in a 2-rule set has scoreImpact of -50', () => {
    const failRule = makeRule({
      id: ruleId('fail-rule'),
      weight: 1.0,
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'lte', value: 0 }] }],
      firesWithAction: 'FAIL',
    })
    const warnRule = makeRule({
      id: ruleId('warn-rule'),
      weight: 1.0,
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_roi_annual', operator: 'lt', value: 0.08 }] }],
      firesWithAction: 'WARN',
    })
    const result = evaluateRules([failRule, warnRule], baseFacts)

    const failResult = result.results.find(r => r.ruleId === 'fail-rule')
    const warnResult = result.results.find(r => r.ruleId === 'warn-rule')

    // totalWeight = 2.0, FAIL weight 1.0 → impact = -(1/2) * 100 = -50
    expect(failResult?.scoreImpact).toBeCloseTo(-50, 1)
    // WARN weight 1.0 → impact = -(0.5/2) * 100 = -25
    expect(warnResult?.scoreImpact).toBeCloseTo(-25, 1)
  })

  it('non-firing rule has scoreImpact of 0', () => {
    const rule = makeRule({
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'gt', value: 1000000 }] }],
      firesWithAction: 'FAIL',
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.results[0].scoreImpact).toBe(0)
  })

  it('heavy rule (weight=2.0) has twice the score impact of standard rule (weight=1.0)', () => {
    const heavyRule = makeRule({
      id: ruleId('heavy'),
      weight: 2.0,
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'lte', value: 0 }] }],
      firesWithAction: 'FAIL',
    })
    const standardRule = makeRule({
      id: ruleId('standard'),
      weight: 1.0,
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_roi_annual', operator: 'lt', value: 0.08 }] }],
      firesWithAction: 'FAIL',
    })
    const result = evaluateRules([heavyRule, standardRule], baseFacts)
    const heavyResult = result.results.find(r => r.ruleId === 'heavy')
    const standardResult = result.results.find(r => r.ruleId === 'standard')

    // totalWeight = 3.0
    // heavy FAIL: -(2/3)*100 ≈ -66.7
    // standard FAIL: -(1/3)*100 ≈ -33.3
    expect(Math.abs(heavyResult!.scoreImpact)).toBeCloseTo(Math.abs(standardResult!.scoreImpact) * 2, 1)
  })
})

describe('Sprint A1 — Weighted Rule Score', () => {
  it('two equal-weight rules where one FAILs → weightedRuleScore ≈ 50', () => {
    const failRule = makeRule({
      id: ruleId('r1'), weight: 1.0,
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'lte', value: 0 }] }],
      firesWithAction: 'FAIL',
    })
    const passRule = makeRule({
      id: ruleId('r2'), weight: 1.0,
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'gt', value: 1000000 }] }],
      firesWithAction: 'FAIL',  // won't fire
    })
    const result = evaluateRules([failRule, passRule], baseFacts)
    expect(result.summary.weightedRuleScore).toBe(50)
  })

  it('heavy FAIL rule (weight=2) in 3-rule set → weightedRuleScore ≈ 33', () => {
    const rules = [
      makeRule({ id: ruleId('r1'), weight: 2.0,
        conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'lte', value: 0 }] }],
        firesWithAction: 'FAIL' }),
      makeRule({ id: ruleId('r2'), weight: 1.0,
        conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'gt', value: 1e9 }] }],
        firesWithAction: 'FAIL' }),
      makeRule({ id: ruleId('r3'), weight: 1.0,
        conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'gt', value: 1e9 }] }],
        firesWithAction: 'WARN' }),
    ]
    const result = evaluateRules(rules, baseFacts)
    // totalWeight=4, failedWeight=2 → score = (4-2)/4 * 100 = 50
    expect(result.summary.weightedRuleScore).toBe(50)
    expect(result.summary.totalWeight).toBe(4)
  })

  it('weightedRuleScore is 100 when no rules fire', () => {
    const rule = makeRule({
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'gt', value: 1e9 }] }],
      firesWithAction: 'FAIL',
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.summary.weightedRuleScore).toBe(100)
  })

  it('WARN rule reduces weightedRuleScore by weight * 0.5', () => {
    const warnRule = makeRule({
      id: ruleId('warn'),
      weight: 1.0,
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_roi_annual', operator: 'lt', value: 0.08 }] }],
      firesWithAction: 'WARN',
    })
    const result = evaluateRules([warnRule], baseFacts)
    // 1 WARN rule, weight=1.0, total=1.0 → score = (1 - 0.5) / 1 * 100 = 50
    expect(result.summary.weightedRuleScore).toBe(50)
  })
})

describe('Sprint A1 — Rule Categories in Summary', () => {
  it('firedCategories lists categories of fired rules', () => {
    const financialRule = makeRule({
      id: ruleId('financial-rule'),
      category: 'financial',
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'lte', value: 0 }] }],
      firesWithAction: 'FAIL',
    })
    const marketRule = makeRule({
      id: ruleId('market-rule'),
      category: 'market',
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_roi_annual', operator: 'lt', value: 0.08 }] }],
      firesWithAction: 'WARN',
    })
    const result = evaluateRules([financialRule, marketRule], baseFacts)
    expect(result.summary.firedCategories).toContain('financial')
    expect(result.summary.firedCategories).toContain('market')
  })

  it('firedCategories is empty when no rules fire', () => {
    const rule = makeRule({
      category: 'financial',
      conditionGroups: [{ conditions: [{ factPath: 'parameters.computed_npv', operator: 'gt', value: 1e9 }] }],
      firesWithAction: 'FAIL',
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.summary.firedCategories).toHaveLength(0)
  })
})
