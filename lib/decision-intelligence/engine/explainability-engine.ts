/**
 * Explainability Engine — generates the full DecisionExplainability package.
 *
 * This engine translates the outputs of the confidence, rules, and evidence
 * engines into human-readable structured explanations. It does NOT call AI:
 * all explanations are derived deterministically from the computed scores,
 * rule results, and evidence weights.
 *
 * AI narration (if needed) is layered on top by the caller — the engine
 * produces the factual foundation that narration would describe.
 */

import type {
  DecisionExplainability,
  ExplainWhy,
  ExplainWhyNot,
  ExplainEvidenceUsed,
  ExplainRulesTriggered,
  AlternativeConsidered,
  EvidenceExplanationItem,
  FiredRuleExplanation,
  WhyNotReason,
  BlockingRuleExplanation,
  ExplanationReason,
} from '../types/explainability.types'
import type { ConfidenceScore } from '../types/confidence.types'
import type { RuleEvaluationResult } from '../types/rules.types'
import type { EvidenceCollection } from '../types/evidence.types'
import type { EvidenceWeight } from '../types/evidence.types'
import type { Decision, DecisionOption } from '../types/decision.types'

// ---------------------------------------------------------------------------
// Helper: build ExplainWhy
// ---------------------------------------------------------------------------

function buildWhyExplanation(
  recommendedOption: DecisionOption,
  confidence: ConfidenceScore,
  weights: EvidenceWeight[],
): ExplainWhy {
  const reasons: ExplanationReason[] = []

  // Rule score as a reason
  if (recommendedOption.ruleScore > 70) {
    reasons.push({
      label: 'High rule compliance score',
      explanation: `This option scored ${recommendedOption.ruleScore}/100 on business rule evaluation, indicating strong alignment with domain policy.`,
      relativeWeight: 0.40,
    })
  } else if (recommendedOption.ruleScore > 40) {
    reasons.push({
      label: 'Acceptable rule compliance',
      explanation: `This option achieved a rule compliance score of ${recommendedOption.ruleScore}/100.`,
      relativeWeight: 0.25,
    })
  }

  // Confidence band as a reason
  if (confidence.band === 'VERY_HIGH' || confidence.band === 'HIGH') {
    reasons.push({
      label: `${confidence.band.replace('_', ' ')} confidence`,
      explanation: `The overall confidence score of ${confidence.overall} reflects strong evidence quality and rule compliance.`,
      relativeWeight: 0.35,
    })
  }

  // Strongest dimension
  reasons.push({
    label: `Strong ${confidence.strongestDimension.replace(/_/g, ' ')}`,
    explanation: `The strongest confidence dimension is ${confidence.strongestDimension.replace(/_/g, ' ')}, which contributed the most to the overall score.`,
    relativeWeight: 0.25,
  })

  // No blocking rules
  if (!recommendedOption.blockedByRules) {
    reasons.push({
      label: 'No blocking rule violations',
      explanation: 'This option passed all applicable business rules without triggering any blocking conditions.',
      relativeWeight: 0.20,
    })
  }

  // Top 3 supporting evidence IDs by weight
  const sortedByWeight = [...weights].sort((a, b) => b.weight - a.weight)
  const topSupportingEvidenceIds = sortedByWeight.slice(0, 3).map(w => w.evidenceId as string)

  return {
    summary: recommendedOption.aiAnalysis ||
      `Option "${recommendedOption.label}" was recommended based on a rule compliance score of ${recommendedOption.ruleScore}/100 and an overall confidence of ${confidence.overall}.`,
    reasons,
    confidenceBand: confidence.band,
    strongestDimension: confidence.strongestDimension,
    topSupportingEvidenceIds,
  }
}

// ---------------------------------------------------------------------------
// Helper: build ExplainWhyNot entries
// ---------------------------------------------------------------------------

function buildWhyNotExplanation(
  option: DecisionOption,
  recommendedOption: DecisionOption,
  ruleResult: RuleEvaluationResult | undefined,
): ExplainWhyNot {
  const blockingRules: BlockingRuleExplanation[] = (ruleResult?.results ?? [])
    .filter(r => r.fired && r.action === 'FAIL')
    .map(r => ({
      ruleId: r.ruleId as string,
      ruleName: r.ruleName,
      action: r.action,
      message: r.message,
      overrideable: false, // would need access to the rule object — conservative default
    }))

  let primaryReason: WhyNotReason
  let explanation: string

  if (option.blockedByRules || blockingRules.length > 0) {
    primaryReason = 'BLOCKED_BY_RULE'
    explanation = `This option is blocked by ${blockingRules.length} business rule(s): ${blockingRules.map(r => r.ruleName).join(', ')}.`
  } else if (option.ruleScore < recommendedOption.ruleScore) {
    primaryReason = 'LOWER_RULE_SCORE'
    explanation = `This option scored ${option.ruleScore}/100 on business rule evaluation, compared to ${recommendedOption.ruleScore}/100 for the recommended option.`
  } else {
    primaryReason = 'LOWER_RULE_SCORE'
    explanation = `This option was not selected. Consider reviewing the decision parameters to understand how to improve its suitability.`
  }

  return {
    optionId: option.id as string,
    optionLabel: option.label,
    primaryReason,
    explanation,
    blockingRules,
    negativeEvidenceIds: [],
    ruleScoreVsRecommended: {
      thisOption: option.ruleScore,
      recommended: recommendedOption.ruleScore,
    },
  }
}

// ---------------------------------------------------------------------------
// Helper: build ExplainEvidenceUsed
// ---------------------------------------------------------------------------

function buildEvidenceUsedExplanation(
  evidence: EvidenceCollection,
  weights: EvidenceWeight[],
): ExplainEvidenceUsed {
  const weightMap = new Map(weights.map(w => [w.evidenceId as string, w]))

  const items: EvidenceExplanationItem[] = evidence.items.map(item => {
    const w = weightMap.get(item.id as string)
    return {
      evidenceId: item.id as string,
      title: item.title,
      sourceType: item.source.type,
      sourceLabel: item.source.label,
      weight: w?.weight ?? 0,
      contribution: `${item.source.type.replace(/_/g, ' ')} evidence from "${item.source.label}" with ${(item.freshness * 100).toFixed(0)}% freshness`,
      freshnessScore: item.freshness,
      confidenceScore: item.confidence,
    }
  })

  const summary =
    evidence.stats.total === 0
      ? 'No evidence was collected for this decision.'
      : `${evidence.stats.total} evidence item(s) were collected from ${Object.values(evidence.stats.bySourceType).filter(v => v > 0).length} source type(s). Average freshness: ${(evidence.stats.averageFreshness * 100).toFixed(0)}%. Average confidence: ${(evidence.stats.averageConfidence * 100).toFixed(0)}%.`

  return {
    totalEvidenceItems: evidence.stats.total,
    evidenceItems: items,
    collectionSummary: summary,
  }
}

// ---------------------------------------------------------------------------
// Helper: build ExplainRulesTriggered
// ---------------------------------------------------------------------------

function buildRulesTriggeredExplanation(
  ruleResults: RuleEvaluationResult[],
): ExplainRulesTriggered {
  const firedRules: FiredRuleExplanation[] = []

  for (const result of ruleResults) {
    for (const r of result.results) {
      if (r.fired) {
        firedRules.push({
          ruleId: r.ruleId as string,
          ruleName: r.ruleName,
          action: r.action,
          rationale: `Rule "${r.ruleName}" fired against option "${result.optionId}".`,
          message: r.message,
          appliedToOptionId: result.optionId,
          appliedToOptionLabel: result.optionId,  // label not available here; caller can enrich
          overrideApplied: false,
          overrideJustification: null,
        })
      }
    }
  }

  return {
    totalRulesEvaluated: ruleResults.reduce((sum, r) => sum + r.results.length, 0),
    firedRules,
    noIssuesFound: firedRules.length === 0,
  }
}

// ---------------------------------------------------------------------------
// Helper: build AlternativesConsidered
// ---------------------------------------------------------------------------

function buildAlternatives(
  options: DecisionOption[],
  recommendedOptionId: string | null,
  ruleResults: RuleEvaluationResult[],
): AlternativeConsidered[] {
  return options
    .filter(o => (o.id as string) !== recommendedOptionId)
    .map(o => {
      const rr = ruleResults.find(r => r.optionId === (o.id as string))
      const blocking = rr?.results.filter(r => r.fired && r.action === 'FAIL') ?? []

      const couldBeRecommendedIf =
        o.blockedByRules
          ? `Remove or override the blocking rule(s): ${blocking.map(r => r.ruleName).join(', ')}`
          : o.ruleScore < (options.find(x => (x.id as string) === recommendedOptionId)?.ruleScore ?? 0)
            ? 'Improve rule compliance score through adjusted parameters'
            : null

      return {
        optionId: o.id as string,
        optionLabel: o.label,
        ruleScore: o.ruleScore,
        whyNotRecommended:
          o.blockedByRules
            ? `Blocked by ${blocking.length} rule(s)`
            : `Lower rule compliance score (${o.ruleScore}/100)`,
        couldBeRecommendedIf,
      }
    })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ExplainabilityEngineInput {
  readonly decision: Decision
  readonly options: DecisionOption[]
  readonly confidence: ConfidenceScore
  readonly evidence: EvidenceCollection
  readonly evidenceWeights: EvidenceWeight[]
  readonly ruleResults: RuleEvaluationResult[]
}

export function generateExplainability(
  args: ExplainabilityEngineInput,
): DecisionExplainability {
  const { decision, options, confidence, evidence, evidenceWeights, ruleResults } = args

  const recommendedOptionId = decision.recommendation?.recommendedOptionId as string | null
  const recommendedOption = options.find(o => (o.id as string) === recommendedOptionId)

  const why: ExplainWhy = recommendedOption
    ? buildWhyExplanation(recommendedOption, confidence, evidenceWeights)
    : {
        summary: 'No recommendation could be made due to insufficient confidence or blocking rules.',
        reasons: [],
        confidenceBand: confidence.band,
        strongestDimension: confidence.strongestDimension,
        topSupportingEvidenceIds: [],
      }

  const whyNot: ExplainWhyNot[] = recommendedOption
    ? options
        .filter(o => (o.id as string) !== (recommendedOption.id as string))
        .map(o => {
          const rr = ruleResults.find(r => r.optionId === (o.id as string))
          return buildWhyNotExplanation(o, recommendedOption, rr)
        })
    : []

  return {
    decisionId: decision.id as string,
    why,
    whyNot,
    evidenceUsed: buildEvidenceUsedExplanation(evidence, evidenceWeights),
    rulesTriggered: buildRulesTriggeredExplanation(ruleResults),
    alternativesConsidered: buildAlternatives(options, recommendedOptionId, ruleResults),
    generatedAt: new Date().toISOString(),
  }
}
