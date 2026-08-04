/**
 * Scenario Intelligence Engine — Sprint A4
 *
 * Answers "What would change this recommendation?" by re-evaluating business
 * rules under hypothetical parameter changes.
 *
 * Architecture:
 *   1. Extract "sensitivity thresholds" from fired rules — for each numeric
 *      condition that caused a FAIL or WARN, compute the threshold value
 *      that would cause the rule to NOT fire.
 *
 *   2. Test a standard set of what-if scenarios: ±20% change on primary
 *      numeric parameters that appeared in fired rules.
 *
 *   3. Compute decision stability from how many scenarios flip the recommendation
 *      and how large the parameter changes needed are.
 *
 * This engine is fully deterministic — no AI calls, no randomness.
 * It reuses `evaluateRulesWithParameters` from the rules engine.
 */

import type {
  BusinessRule,
  RuleFacts,
  RuleResult,
} from '../types/rules.types'
import type {
  DecisionOption,
} from '../types/decision.types'
import type {
  ScenarioAnalysis,
  ScenarioResult,
  SensitivityThreshold,
  DecisionStability,
  ScenarioParameterChange,
  ScenarioOptionScore,
} from '../types/scenario.types'
import { evaluateRulesWithParameters } from './rules-engine'

// ---------------------------------------------------------------------------
// Helper: extract numeric threshold from a fired FAIL/WARN rule condition
// ---------------------------------------------------------------------------

interface ExtractedThreshold {
  factPath: string
  currentValue: number
  thresholdValue: number
  direction: 'increase' | 'decrease'
  ruleId: string
  ruleName: string
  affectedOptionId: string
  affectedOptionLabel: string
  wouldChangeRecommendation: boolean
}

function extractNumericThresholds(
  firedResult: RuleResult,
  optionId: string,
  optionLabel: string,
  currentParameters: Record<string, unknown>,
): ExtractedThreshold[] {
  const thresholds: ExtractedThreshold[] = []

  for (const trace of firedResult.conditionTrace) {
    if (typeof trace.actualValue !== 'number') continue
    if (typeof trace.expectedValue !== 'number') continue

    const current = trace.actualValue
    const threshold = trace.expectedValue

    let direction: 'increase' | 'decrease' | null = null
    let crossoverValue: number = threshold

    switch (trace.operator) {
      case 'lte':  // fired because current <= threshold → need current > threshold to NOT fire
      case 'lt':
        direction = 'increase'
        crossoverValue = threshold + (trace.operator === 'lte' ? 1 : 0)
        break
      case 'gte':  // fired because current >= threshold → need current < threshold to NOT fire
      case 'gt':
        direction = 'decrease'
        crossoverValue = threshold - (trace.operator === 'gte' ? 1 : 0)
        break
      default:
        continue  // eq/neq/in/etc. — not a simple numeric threshold
    }

    if (direction === null) continue

    thresholds.push({
      factPath: trace.factPath,
      currentValue: current,
      thresholdValue: crossoverValue,
      direction,
      ruleId: firedResult.ruleId as string,
      ruleName: firedResult.ruleName,
      affectedOptionId: optionId,
      affectedOptionLabel: optionLabel,
      wouldChangeRecommendation: firedResult.action === 'FAIL',
    })
  }

  return thresholds
}

// ---------------------------------------------------------------------------
// Helper: compute a rule score for a single option under modified parameters
// ---------------------------------------------------------------------------

function computeOptionRuleScore(
  rules: BusinessRule[],
  facts: RuleFacts,
  parameterOverrides: Record<string, unknown>,
): { score: number; blocked: boolean } {
  const result = evaluateRulesWithParameters(rules, facts, parameterOverrides)
  return {
    score: result.summary.weightedRuleScore,
    blocked: result.summary.isBlocked,
  }
}

// ---------------------------------------------------------------------------
// Helper: find recommended option given scores
// ---------------------------------------------------------------------------

function findBestOption(
  optionScores: ScenarioOptionScore[],
): string | null {
  const eligible = optionScores.filter(o => !o.wouldBeBlocked)
  if (eligible.length === 0) return null
  return eligible.reduce((best, o) =>
    o.hypotheticalScore > best.hypotheticalScore ? o : best
  ).optionId
}

// ---------------------------------------------------------------------------
// Helper: compute stability
// ---------------------------------------------------------------------------

function computeStability(
  scenarios: ScenarioResult[],
  thresholds: SensitivityThreshold[],
): { stability: DecisionStability; stabilityScore: number; stabilityRationale: string } {
  if (scenarios.length === 0) {
    return {
      stability: 'ROBUST',
      stabilityScore: 85,
      stabilityRationale: 'No testable scenarios were identified. The recommendation appears stable.',
    }
  }

  const flippingScenarios = scenarios.filter(s => s.wouldChangeRecommendation)
  const flipRate = flippingScenarios.length / scenarios.length

  // Check the minimum magnitude change needed to flip
  const smallChanges = flippingScenarios.filter(s => Math.abs(s.parameterChange.magnitudePct) < 15)
  const moderateChanges = flippingScenarios.filter(s =>
    Math.abs(s.parameterChange.magnitudePct) >= 15 && Math.abs(s.parameterChange.magnitudePct) < 35
  )

  let stabilityScore = 100
  stabilityScore -= flipRate * 40         // flip rate reduces stability
  stabilityScore -= smallChanges.length * 20   // small-change flips are more concerning
  stabilityScore -= moderateChanges.length * 8
  stabilityScore -= thresholds.filter(t => t.wouldChangeRecommendation).length * 5

  stabilityScore = Math.max(0, Math.min(100, Math.round(stabilityScore)))

  const stability: DecisionStability =
    stabilityScore >= 70 ? 'ROBUST' :
    stabilityScore >= 40 ? 'MODERATE' :
    'FRAGILE'

  const rationale =
    flippingScenarios.length === 0
      ? `Recommendation holds across all ${scenarios.length} tested scenarios (±20% parameter changes). Decision is robust.`
      : smallChanges.length > 0
        ? `${smallChanges.length} small parameter change(s) (<15%) would flip the recommendation. Decision is fragile and sensitive to input accuracy.`
        : `${flippingScenarios.length} out of ${scenarios.length} tested scenarios would change the recommendation. Moderate sensitivity.`

  return { stability, stabilityScore, stabilityRationale: rationale }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScenarioEngineInput {
  readonly decisionId: string
  readonly options: DecisionOption[]
  readonly rules: BusinessRule[]
  readonly baseFacts: Record<string, RuleFacts>  // optionId → RuleFacts used during evaluation
  readonly baseRuleResults: Array<{ optionId: string; results: RuleResult[] }>
}

/**
 * Run scenario analysis for a decision.
 *
 * Tests ±20% changes on all numeric parameters that appear in fired rules,
 * then computes decision stability and sensitivity thresholds.
 */
export function runScenarioAnalysis(input: ScenarioEngineInput): ScenarioAnalysis {
  const { decisionId, options, rules, baseFacts, baseRuleResults } = input

  if (rules.length === 0) {
    return {
      decisionId,
      baseRecommendedOptionId: null,
      baseRecommendedOptionLabel: null,
      stability: 'ROBUST',
      stabilityScore: 85,
      stabilityRationale: 'No business rules were evaluated. Decision stability cannot be determined from rules alone.',
      sensitivityThresholds: [],
      scenarios: [],
      generatedAt: new Date().toISOString(),
    }
  }

  // Base recommended option
  const baseEligible = options.filter(o => !o.blockedByRules)
  const baseRecommended = baseEligible.length > 0
    ? baseEligible.reduce((best, o) => o.ruleScore > best.ruleScore ? o : best)
    : null

  // Extract sensitivity thresholds from fired FAIL/WARN results
  const allThresholds: ExtractedThreshold[] = []
  for (const { optionId, results } of baseRuleResults) {
    const option = options.find(o => (o.id as string) === optionId)
    if (!option) continue
    for (const result of results) {
      if (result.fired && (result.action === 'FAIL' || result.action === 'WARN')) {
        const ts = extractNumericThresholds(result, optionId, option.label, baseFacts[optionId]?.parameters ?? {})
        allThresholds.push(...ts)
      }
    }
  }

  // Build sensitivity threshold output objects
  const sensitivityThresholds: SensitivityThreshold[] = allThresholds.map(t => {
    const currentNum = t.currentValue
    const thresholdNum = t.thresholdValue
    const delta = thresholdNum - currentNum
    const paramName = t.factPath.split('.').pop() ?? t.factPath
    const readableName = paramName.replace(/computed_/g, '').replace(/_/g, ' ')

    const changeDescription = t.direction === 'increase'
      ? `${readableName} must increase from ${formatNum(currentNum)} to above ${formatNum(thresholdNum)} to unblock "${t.affectedOptionLabel}"`
      : `${readableName} must decrease from ${formatNum(currentNum)} to below ${formatNum(thresholdNum)} to remove warning on "${t.affectedOptionLabel}"`

    return {
      factPath: t.factPath,
      parameterName: readableName,
      currentValue: t.currentValue,
      thresholdValue: t.thresholdValue,
      requiredDirection: t.direction,
      ruleId: t.ruleId,
      ruleName: t.ruleName,
      affectedOptionId: t.affectedOptionId,
      affectedOptionLabel: t.affectedOptionLabel,
      changeDescription,
      wouldChangeRecommendation: t.wouldChangeRecommendation,
    }
  })

  // Build what-if scenarios: test ±20% on each unique numeric parameter from fired rules
  const testedParams = new Set<string>()
  const scenarios: ScenarioResult[] = []
  let scenarioIdx = 0

  for (const threshold of allThresholds) {
    const { factPath, currentValue } = threshold
    if (testedParams.has(factPath)) continue
    testedParams.add(factPath)

    for (const magnitudePct of [-20, 20]) {
      const hypotheticalValue = currentValue * (1 + magnitudePct / 100)
      const paramName = factPath.split('.').pop() ?? factPath
      const readableName = paramName.replace(/computed_/g, '').replace(/_/g, ' ')

      // Re-evaluate each option's rule score with this parameter change
      const optionScores: ScenarioOptionScore[] = options.map(option => {
        const facts = baseFacts[option.id as string]
        if (!facts) {
          return {
            optionId: option.id as string,
            optionLabel: option.label,
            originalScore: option.ruleScore,
            hypotheticalScore: option.ruleScore,
            wasBlocked: option.blockedByRules,
            wouldBeBlocked: option.blockedByRules,
          }
        }

        const { score, blocked } = computeOptionRuleScore(
          rules,
          facts,
          { [paramName]: hypotheticalValue },
        )

        return {
          optionId: option.id as string,
          optionLabel: option.label,
          originalScore: option.ruleScore,
          hypotheticalScore: score,
          wasBlocked: option.blockedByRules,
          wouldBeBlocked: blocked,
        }
      })

      const hypotheticalRecommendedId = findBestOption(optionScores)
      const hypotheticalOption = options.find(o => (o.id as string) === hypotheticalRecommendedId)
      const wouldChangeRecommendation = hypotheticalRecommendedId !== (baseRecommended?.id as string | null)

      const direction = magnitudePct > 0 ? 'increase' : 'decrease'

      const paramChange: ScenarioParameterChange = {
        factPath,
        parameterName: readableName,
        originalValue: currentValue,
        hypotheticalValue,
        direction,
        magnitudePct,
      }

      scenarios.push({
        scenarioId: `scenario-${++scenarioIdx}`,
        name: `${readableName} ${magnitudePct > 0 ? '+' : ''}${magnitudePct}%`,
        description: `What if ${readableName} ${direction}d by ${Math.abs(magnitudePct)}%? (${formatNum(currentValue)} → ${formatNum(hypotheticalValue)})`,
        parameterChange: paramChange,
        optionScores,
        wouldChangeRecommendation,
        hypotheticalRecommendedOptionId: hypotheticalRecommendedId,
        hypotheticalRecommendedOptionLabel: hypotheticalOption?.label ?? null,
      })
    }
  }

  const { stability, stabilityScore, stabilityRationale } = computeStability(scenarios, sensitivityThresholds)

  return {
    decisionId,
    baseRecommendedOptionId: (baseRecommended?.id as string) ?? null,
    baseRecommendedOptionLabel: baseRecommended?.label ?? null,
    stability,
    stabilityScore,
    stabilityRationale,
    sensitivityThresholds,
    scenarios,
    generatedAt: new Date().toISOString(),
  }
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
