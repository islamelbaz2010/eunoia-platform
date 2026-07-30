/**
 * Rules Engine — evaluates business rules deterministically.
 *
 * Rules are evaluated in priority order (lower number = first). The engine
 * is pure: given the same rules and facts, it always produces the same output.
 * It does not perform I/O, does not call AI, and does not mutate state.
 *
 * Each rule can match via any of its condition groups (OR semantics between
 * groups; AND semantics within a group). When a group matches, the rule fires.
 */

import type {
  BusinessRule,
  RuleCondition,
  RuleConditionGroup,
  RuleFacts,
  RuleResult,
  RuleEvaluationResult,
  RuleEvaluationSummary,
  RuleId,
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
// Condition evaluation
// ---------------------------------------------------------------------------

function evaluateCondition(condition: RuleCondition, facts: RuleFacts): boolean {
  const { factPath, operator, value } = condition
  const factValue = resolvePath(facts, factPath)

  switch (operator) {
    case 'eq':
      return factValue === value

    case 'neq':
      return factValue !== value

    case 'gt':
      return typeof factValue === 'number' && typeof value === 'number' && factValue > value

    case 'gte':
      return typeof factValue === 'number' && typeof value === 'number' && factValue >= value

    case 'lt':
      return typeof factValue === 'number' && typeof value === 'number' && factValue < value

    case 'lte':
      return typeof factValue === 'number' && typeof value === 'number' && factValue <= value

    case 'in':
      return Array.isArray(value) && value.includes(factValue)

    case 'not_in':
      return Array.isArray(value) && !value.includes(factValue)

    case 'exists':
      return factValue !== undefined && factValue !== null

    case 'not_exists':
      return factValue === undefined || factValue === null

    case 'matches': {
      if (typeof factValue !== 'string' || typeof value !== 'string') return false
      try {
        return new RegExp(value).test(factValue)
      } catch {
        return false
      }
    }

    default:
      return false
  }
}

// ---------------------------------------------------------------------------
// Group evaluation — all conditions in a group must be true (AND)
// ---------------------------------------------------------------------------

function evaluateConditionGroup(group: RuleConditionGroup, facts: RuleFacts): boolean {
  return group.conditions.every(condition => evaluateCondition(condition, facts))
}

// ---------------------------------------------------------------------------
// Single rule evaluation
// ---------------------------------------------------------------------------

function evaluateRule(rule: BusinessRule, facts: RuleFacts): RuleResult {
  if (!rule.enabled) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      fired: false,
      action: 'PASS',
      message: 'Rule is disabled',
      matchedGroupIndex: null,
      evaluatedAt: new Date().toISOString(),
    }
  }

  // Test each condition group; fire on the first match (OR semantics)
  for (let i = 0; i < rule.conditionGroups.length; i++) {
    if (evaluateConditionGroup(rule.conditionGroups[i], facts)) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        fired: true,
        action: rule.firesWithAction,
        message: rule.message,
        matchedGroupIndex: i,
        evaluatedAt: new Date().toISOString(),
      }
    }
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    fired: false,
    action: 'PASS',
    message: `Rule "${rule.name}" conditions not met — no action required`,
    matchedGroupIndex: null,
    evaluatedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Summary computation
// ---------------------------------------------------------------------------

function buildSummary(results: RuleResult[]): RuleEvaluationSummary {
  const firedResults = results.filter(r => r.fired)
  const blockingRuleIds: RuleId[] = []
  const overrideRequiredRuleIds: RuleId[] = []
  let failed = 0
  let warned = 0
  let requireOverride = 0

  for (const r of firedResults) {
    if (r.action === 'FAIL') {
      failed++
      blockingRuleIds.push(r.ruleId)
    } else if (r.action === 'WARN') {
      warned++
    } else if (r.action === 'REQUIRE_OVERRIDE') {
      requireOverride++
      overrideRequiredRuleIds.push(r.ruleId)
    }
  }

  const passed = results.length - firedResults.length + firedResults.filter(r => r.action === 'PASS').length

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
 */
export function evaluateRules(
  rules: BusinessRule[],
  facts: RuleFacts,
): RuleEvaluationResult {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority)
  const results = sorted.map(rule => evaluateRule(rule, facts))

  return {
    decisionId: facts.decisionId,
    optionId: facts.optionId,
    results,
    summary: buildSummary(results),
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
