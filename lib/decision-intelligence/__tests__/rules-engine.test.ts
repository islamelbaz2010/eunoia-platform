import { describe, it, expect } from 'vitest'
import { evaluateRules, filterRulesForDomain } from '../engine/rules-engine'
import { ruleId } from '../types/rules.types'
import type { BusinessRule, RuleFacts } from '../types/rules.types'

const baseFacts: RuleFacts = {
  decisionId: 'decision-1',
  optionId: 'option-a',
  subject: { domain: 'Real Estate', name: 'Test Property' },
  context: { question: 'Should we buy?' },
  parameters: { budget: 500000, propertyType: 'residential' },
}

function makeRule(overrides: Partial<BusinessRule>): BusinessRule {
  return {
    id: ruleId('rule-1'),
    name: 'Test Rule',
    description: 'A test rule',
    rationale: 'For testing',
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

describe('evaluateRules', () => {
  it('returns PASS for empty rule set', () => {
    const result = evaluateRules([], baseFacts)
    expect(result.results).toHaveLength(0)
    expect(result.summary.isBlocked).toBe(false)
  })

  it('does not fire a disabled rule', () => {
    const rule = makeRule({
      enabled: false,
      conditionGroups: [{ conditions: [{ factPath: 'parameters.budget', operator: 'gt', value: 0 }] }],
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.results[0].fired).toBe(false)
    expect(result.summary.isBlocked).toBe(false)
  })

  it('fires a rule when condition matches (eq)', () => {
    const rule = makeRule({
      conditionGroups: [{
        conditions: [{ factPath: 'parameters.propertyType', operator: 'eq', value: 'residential' }],
      }],
      firesWithAction: 'WARN',
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.results[0].fired).toBe(true)
    expect(result.results[0].action).toBe('WARN')
  })

  it('does not fire when condition does not match', () => {
    const rule = makeRule({
      conditionGroups: [{
        conditions: [{ factPath: 'parameters.budget', operator: 'gt', value: 1_000_000 }],
      }],
      firesWithAction: 'FAIL',
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.results[0].fired).toBe(false)
  })

  it('marks decision as blocked when FAIL rule fires', () => {
    const rule = makeRule({
      conditionGroups: [{
        conditions: [{ factPath: 'parameters.budget', operator: 'lte', value: 500000 }],
      }],
      firesWithAction: 'FAIL',
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.summary.isBlocked).toBe(true)
    expect(result.summary.blockingRuleIds).toContain('rule-1')
  })

  it('does not block for WARN action', () => {
    const rule = makeRule({
      conditionGroups: [{
        conditions: [{ factPath: 'parameters.budget', operator: 'lte', value: 500000 }],
      }],
      firesWithAction: 'WARN',
    })
    const result = evaluateRules([rule], baseFacts)
    expect(result.summary.isBlocked).toBe(false)
    expect(result.summary.warnRules).toBe(1)
  })

  it('evaluates multiple rules in priority order', () => {
    const rule1 = makeRule({ id: ruleId('r1'), priority: 10, firesWithAction: 'WARN',
      conditionGroups: [{ conditions: [{ factPath: 'parameters.budget', operator: 'gt', value: 0 }] }] })
    const rule2 = makeRule({ id: ruleId('r2'), priority: 1, firesWithAction: 'FAIL',
      conditionGroups: [{ conditions: [{ factPath: 'parameters.budget', operator: 'gt', value: 0 }] }] })

    const result = evaluateRules([rule1, rule2], baseFacts)
    // rule2 (priority 1) should appear first
    expect(result.results[0].ruleId).toBe('r2')
    expect(result.results[1].ruleId).toBe('r1')
  })

  it('supports OR between condition groups', () => {
    const rule = makeRule({
      conditionGroups: [
        { conditions: [{ factPath: 'parameters.budget', operator: 'gt', value: 1_000_000 }] },
        { conditions: [{ factPath: 'parameters.propertyType', operator: 'eq', value: 'residential' }] },
      ],
      firesWithAction: 'WARN',
    })
    // Second group should match
    const result = evaluateRules([rule], baseFacts)
    expect(result.results[0].fired).toBe(true)
    expect(result.results[0].matchedGroupIndex).toBe(1)
  })

  it('evaluates exists / not_exists operators', () => {
    const existsRule = makeRule({
      conditionGroups: [{ conditions: [{ factPath: 'parameters.budget', operator: 'exists' }] }],
      firesWithAction: 'PASS',
    })
    const notExistsRule = makeRule({
      id: ruleId('r2'),
      conditionGroups: [{ conditions: [{ factPath: 'parameters.nonExistent', operator: 'not_exists' }] }],
      firesWithAction: 'WARN',
    })
    const r1 = evaluateRules([existsRule], baseFacts)
    const r2 = evaluateRules([notExistsRule], baseFacts)
    expect(r1.results[0].fired).toBe(true)
    expect(r2.results[0].fired).toBe(true)
  })

  it('evaluates in / not_in operators', () => {
    const inRule = makeRule({
      conditionGroups: [{
        conditions: [{ factPath: 'parameters.propertyType', operator: 'in', value: ['residential', 'commercial'] }],
      }],
      firesWithAction: 'WARN',
    })
    const result = evaluateRules([inRule], baseFacts)
    expect(result.results[0].fired).toBe(true)
  })
})

describe('filterRulesForDomain', () => {
  const ruleAll = makeRule({ id: ruleId('rAll'), domains: [] })
  const ruleRE = makeRule({ id: ruleId('rRE'), domains: ['Real Estate'] })
  const ruleLeads = makeRule({ id: ruleId('rLeads'), domains: ['Lead Finder'] })

  it('returns all rules when rule has empty domains', () => {
    const filtered = filterRulesForDomain([ruleAll, ruleRE, ruleLeads], 'Real Estate')
    expect(filtered.map(r => r.id)).toContain('rAll')
    expect(filtered.map(r => r.id)).toContain('rRE')
    expect(filtered.map(r => r.id)).not.toContain('rLeads')
  })

  it('returns all rules for any domain when domains is empty', () => {
    const filtered = filterRulesForDomain([ruleAll], 'Anything')
    expect(filtered).toHaveLength(1)
  })
})
