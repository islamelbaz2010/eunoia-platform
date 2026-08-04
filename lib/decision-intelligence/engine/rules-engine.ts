/**
 * Rules Engine — evaluates business rules deterministically.
 *
 * Rules are evaluated in priority order (lower number = first). The engine
 * is pure: given the same rules and facts, it always produces the same output.
 * It does not perform I/O, does not call AI, and does not mutate state.
 *
 * Each rule can match via any of its condition groups (OR semantics between
 * groups; AND semantics within a group). When a group matches, the rule fires.
 *
 * Sprint A1 additions:
 *   - Condition trace: records the actual fact values evaluated per condition
 *   - Dynamic explanation: builds a human-readable string with actual values
 *   - Score impact: computes marginal contribution of each rule to the option score
 *   - Weighted rule scoring: rules with higher `weight` have more influence
 *   - Category tracking: fired categories are aggregated in the summary
 */

import type {
  BusinessRule,
  RuleCategory,
  RuleCondition,
  RuleConditionGroup,
  RuleFacts,
  RuleResult,
  RuleEvaluationResult,
  RuleEvaluationSummary,
  RuleId,
  ConditionEvaluationTrace,
} from '../types/rules.types'

// ---------------------------------------------------------------------------
// Fact resolution — walk a dot-notation path into the facts object
// ---------------------------------------------------------------------------

function resolvePath(facts: RuleFacts, path: string): unknown {
  return path.split('.').reduce<unknown>((obj, key) => {
    if (obj !== null && obj !== undefined && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[key]
    }
    return undefined
  }, facts)
}

// ---------------------------------------------------------------------------
// Condition evaluation — returns match result AND actual value for trace
// ---------------------------------------------------------------------------

function evaluateCondition(condition: RuleCondition, facts: RuleFacts): boolean {
  const { factPath, operator, value } = condition
  const factValue = resolvePath(facts, factPath)

  switch (operator) {
    case 'eq':       return factValue === value
    case 'neq':      return factValue !== value
    case 'gt':       return typeof factValue === 'number' && typeof value === 'number' && factValue > value
    case 'gte':      return typeof factValue === 'number' && typeof value === 'number' && factValue >= value
    case 'lt':       return typeof factValue === 'number' && typeof value === 'number' && factValue < value
    case 'lte':      return typeof factValue === 'number' && typeof value === 'number' && factValue <= value
    case 'in':       return Array.isArray(value) && value.includes(factValue)
    case 'not_in':   return Array.isArray(value) && !value.includes(factValue)
    case 'exists':   return factValue !== undefined && factValue !== null
    case 'not_exists': return factValue === undefined || factValue === null
    case 'matches': {
      if (typeof factValue !== 'string' || typeof value !== 'string') return false
      try { return new RegExp(value).test(factValue) } catch { return false }
    }
    default: return false
  }
}

function buildConditionTrace(condition: RuleCondition, facts: RuleFacts): ConditionEvaluationTrace {
  return {
    factPath:      condition.factPath,
    operator:      condition.operator,
    expectedValue: condition.value,
    actualValue:   resolvePath(facts, condition.factPath),
    matched:       evaluateCondition(condition, facts),
  }
}

// ---------------------------------------------------------------------------
// Group evaluation — all conditions must be true (AND)
// ---------------------------------------------------------------------------

function evaluateConditionGroup(group: RuleConditionGroup, facts: RuleFacts): boolean {
  return group.conditions.every(condition => evaluateCondition(condition, facts))
}

function traceConditionGroup(group: RuleConditionGroup, facts: RuleFacts): ConditionEvaluationTrace[] {
  return group.conditions.map(c => buildConditionTrace(c, facts))
}

// ---------------------------------------------------------------------------
// Dynamic explanation — human-readable string with actual fact values
// ---------------------------------------------------------------------------

function formatValue(v: unknown): string {
  if (v === undefined) return 'undefined'
  if (v === null)      return 'null'
  if (typeof v === 'number') return v.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return JSON.stringify(v)
}

function buildExplanation(rule: BusinessRule, conditionTrace: ConditionEvaluationTrace[], fired: boolean): string {
  const conditionDescriptions = conditionTrace.map(t =>
    `${t.factPath} = ${formatValue(t.actualValue)} (${t.operator} ${formatValue(t.expectedValue)}: ${t.matched ? '✓' : '✗'})`
  ).join(', ')

  if (!fired) {
    return `Rule "${rule.name}" did not fire. Conditions evaluated: [${conditionDescriptions}]`
  }
  return `Rule "${rule.name}" fired — ${conditionDescriptions}. Action: ${rule.firesWithAction}. ${rule.message}`
}

// ---------------------------------------------------------------------------
// Single rule evaluation
// ---------------------------------------------------------------------------

function evaluateRule(
  rule: BusinessRule,
  facts: RuleFacts,
  totalWeight: number,
): RuleResult {
  const ruleWeight = rule.weight ?? 1.0

  if (!rule.enabled) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      fired: false,
      action: 'PASS',
      message: 'Rule is disabled',
      matchedGroupIndex: null,
      evaluatedAt: new Date().toISOString(),
      conditionTrace: [],
      explanation: `Rule "${rule.name}" is disabled and was not evaluated.`,
      scoreImpact: 0,
    }
  }

  // Test each condition group; fire on the first match (OR semantics)
  for (let i = 0; i < rule.conditionGroups.length; i++) {
    if (evaluateConditionGroup(rule.conditionGroups[i], facts)) {
      const conditionTrace = traceConditionGroup(rule.conditionGroups[i], facts)
      const scoreImpact = computeScoreImpact(rule.firesWithAction, ruleWeight, totalWeight)

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        fired: true,
        action: rule.firesWithAction,
        message: rule.message,
        matchedGroupIndex: i,
        evaluatedAt: new Date().toISOString(),
        conditionTrace,
        explanation: buildExplanation(rule, conditionTrace, true),
        scoreImpact,
      }
    }
  }

  // Rule did not fire — trace the first group to show why
  const firstGroupTrace = rule.conditionGroups.length > 0
    ? traceConditionGroup(rule.conditionGroups[0], facts)
    : []

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    fired: false,
    action: 'PASS',
    message: `Rule "${rule.name}" conditions not met — no action required`,
    matchedGroupIndex: null,
    evaluatedAt: new Date().toISOString(),
    conditionTrace: firstGroupTrace,
    explanation: buildExplanation(rule, firstGroupTrace, false),
    scoreImpact: 0,
  }
}

// ---------------------------------------------------------------------------
// Score impact — marginal contribution of a single rule to the option's score
// ---------------------------------------------------------------------------

function computeScoreImpact(
  action: string,
  ruleWeight: number,
  totalWeight: number,
): number {
  if (totalWeight <= 0) return 0
  if (action === 'FAIL') return -(ruleWeight / totalWeight) * 100
  if (action === 'WARN') return -(ruleWeight * 0.5 / totalWeight) * 100
  return 0
}

// ---------------------------------------------------------------------------
// Weighted rule score — replaces the unweighted count-based formula
// ---------------------------------------------------------------------------

function computeWeightedRuleScore(
  results: RuleResult[],
  rules: BusinessRule[],
): number {
  const totalWeight = rules.reduce((sum, r) => sum + (r.weight ?? 1.0), 0)
  if (totalWeight <= 0) return 100

  let penaltyWeight = 0
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const w = rules[i]?.weight ?? 1.0
    if (r.fired) {
      if (r.action === 'FAIL') penaltyWeight += w
      else if (r.action === 'WARN') penaltyWeight += w * 0.5
    }
  }

  return Math.max(0, Math.round(((totalWeight - penaltyWeight) / totalWeight) * 100))
}

// ---------------------------------------------------------------------------
// Summary computation
// ---------------------------------------------------------------------------

function buildSummary(results: RuleResult[], rules: BusinessRule[]): RuleEvaluationSummary {
  const firedResults = results.filter(r => r.fired)
  const blockingRuleIds: RuleId[] = []
  const overrideRequiredRuleIds: RuleId[] = []
  const firedCategories = new Set<RuleCategory>()
  let failed = 0
  let warned = 0
  let requireOverride = 0

  for (let i = 0; i < firedResults.length; i++) {
    const r = firedResults[i]
    if (r.action === 'FAIL') {
      failed++
      blockingRuleIds.push(r.ruleId)
    } else if (r.action === 'WARN') {
      warned++
    } else if (r.action === 'REQUIRE_OVERRIDE') {
      requireOverride++
      overrideRequiredRuleIds.push(r.ruleId)
    }
    // Track categories of fired rules
    const matchedRule = rules.find(rule => rule.id === r.ruleId)
    if (matchedRule?.category) firedCategories.add(matchedRule.category)
  }

  const passed = results.length - firedResults.length + firedResults.filter(r => r.action === 'PASS').length
  const totalWeight = rules.reduce((sum, r) => sum + (r.weight ?? 1.0), 0)

  return {
    totalRules: results.length,
    firedRules: firedResults.length,
    passedRules: passed,
    failedRules: failed,
    warnRules: warned,
    requireOverrideRules: requireOverride,
    isBlocked: blockingRuleIds.length > 0,
    blockingRuleIds,
    overrideRequiredRuleIds,
    weightedRuleScore: computeWeightedRuleScore(results, rules),
    totalWeight,
    firedCategories: Array.from(firedCategories),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate all applicable rules against the supplied facts.
 *
 * Rules are sorted by priority before evaluation. The engine never throws;
 * a malformed condition simply evaluates to false.
 *
 * Sprint A1: Each RuleResult now includes `conditionTrace`, `explanation`,
 * and `scoreImpact`. The summary now includes `weightedRuleScore`, `totalWeight`,
 * and `firedCategories`.
 */
export function evaluateRules(
  rules: BusinessRule[],
  facts: RuleFacts,
): RuleEvaluationResult {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority)
  const totalWeight = sorted.reduce((sum, r) => sum + (r.weight ?? 1.0), 0)
  const results = sorted.map(rule => evaluateRule(rule, facts, totalWeight))

  return {
    decisionId: facts.decisionId,
    optionId: facts.optionId,
    results,
    summary: buildSummary(results, sorted),
    evaluatedAt: new Date().toISOString(),
  }
}

/**
 * Filter a rule set to those applicable to a given domain.
 * Returns all rules if no domain filter is provided.
 */
export function filterRulesForDomain(
  rules: BusinessRule[],
  domain: string,
): BusinessRule[] {
  return rules.filter(r => r.domains.length === 0 || r.domains.includes(domain))
}

/**
 * Re-evaluate rules against a modified set of parameters.
 *
 * Used by the scenario engine to test hypothetical parameter changes without
 * running the full decision engine pipeline. Pure function — no side effects.
 */
export function evaluateRulesWithParameters(
  rules: BusinessRule[],
  baseFacts: RuleFacts,
  parameterOverrides: Record<string, unknown>,
): RuleEvaluationResult {
  const modifiedFacts: RuleFacts = {
    ...baseFacts,
    parameters: { ...baseFacts.parameters, ...parameterOverrides },
  }
  return evaluateRules(rules, modifiedFacts)
}
