/**
 * Decision Engine — the top-level orchestrator.
 *
 * Accepts a DecisionInput + evidence + rules and produces a fully evaluated
 * Decision with a confidence score, validation result, explainability package,
 * and Universal Decision Report.
 *
 * Execution order:
 *   1. Validate structure of the input (structural stage only)
 *   2. Evaluate business rules per option
 *   3. Compute evidence weights
 *   4. Compute confidence score
 *   5. Run the full validation pipeline
 *   6. Determine recommendation (or no-recommendation)
 *   7. Generate explainability package
 *   8. Assemble Universal Decision Report
 *
 * The engine is pure at the orchestration level — it calls other pure engines
 * and combines their outputs. All I/O (persistence, AI narration) is the
 * responsibility of the caller.
 */

import { randomUUID } from 'crypto'
import type { BusinessRule, RuleEvaluationResult } from '../types/rules.types'
import type { EvidenceCollection, EvidenceWeight } from '../types/evidence.types'
import type { ValidationThresholds } from '../types/validation.types'
import type {
  Decision,
  DecisionId,
  DecisionInput,
  DecisionOption,
  DecisionRecommendation,
  DecisionStatus,
  DecisionStatusEvent,
  OptionId,
} from '../types/decision.types'
import type { ConfidenceScore, ConfidenceInput } from '../types/confidence.types'
import type { UniversalDecisionReport, ReportMetadata, ReportId } from '../types/report.types'
import type { DecisionExplainability } from '../types/explainability.types'

import { decisionId, optionId, TERMINAL_STATUSES } from '../types/decision.types'
import { reportId, UNIVERSAL_REPORT_SCHEMA_VERSION } from '../types/report.types'

import { weightEvidence, weightedAverageFreshness, maxEvidenceAgeHours } from '../evidence/evidence-weighter'
import { computeConfidenceScore } from './confidence-engine'
import { evaluateRules, filterRulesForDomain } from './rules-engine'
import { runValidationPipeline } from './validation-engine'
import { generateExplainability } from './explainability-engine'

// ---------------------------------------------------------------------------
// Engine input / output
// ---------------------------------------------------------------------------

export interface DecisionEngineInput {
  readonly input: DecisionInput
  readonly evidence: EvidenceCollection
  readonly rules: BusinessRule[]
  readonly thresholds?: Partial<ValidationThresholds>
}

export interface DecisionEngineResult {
  readonly decision: Decision
  readonly confidence: ConfidenceScore
  readonly ruleResults: RuleEvaluationResult[]
  readonly evidenceWeights: EvidenceWeight[]
  readonly explainability: DecisionExplainability
  readonly report: UniversalDecisionReport
}

// ---------------------------------------------------------------------------
// Helper: build options with rule scores
// ---------------------------------------------------------------------------

function buildOptionsWithRuleScores(
  rawOptions: DecisionInput['options'],
  ruleResultsByOptionId: Map<string, RuleEvaluationResult>,
): DecisionOption[] {
  return rawOptions.map(raw => {
    const id = optionId(raw.id ?? randomUUID())
    const rr = ruleResultsByOptionId.get(id as string)
    const summary = rr?.summary

    let ruleScore = 100
    if (summary) {
      const { totalRules, failedRules, warnRules } = summary
      if (totalRules > 0) {
        const passedFraction = (totalRules - failedRules - warnRules * 0.5) / totalRules
        ruleScore = Math.max(0, Math.round(passedFraction * 100))
      }
    }

    return {
      id,
      label: raw.label,
      description: raw.description,
      ruleScore,
      aiAnalysis: '',  // filled by caller via AI narration if desired
      blockedByRules: summary?.isBlocked ?? false,
      flaggingRuleIds: summary
        ? [...summary.blockingRuleIds as string[], ...summary.overrideRequiredRuleIds as string[]]
        : [],
    }
  })
}

// ---------------------------------------------------------------------------
// Helper: determine recommendation
// ---------------------------------------------------------------------------

function determineRecommendation(
  options: DecisionOption[],
  confidence: ConfidenceScore,
  minConfidenceToRecommend = 30,
): DecisionRecommendation {
  if (confidence.overall < minConfidenceToRecommend) {
    return {
      recommendedOptionId: null,
      rationale: `Confidence score of ${confidence.overall} is below the minimum of ${minConfidenceToRecommend} required to issue a recommendation.`,
      confidenceScore: confidence.overall,
      humanOverridden: false,
      overrideUserId: null,
      overrideJustification: null,
    }
  }

  const eligible = options.filter(o => !o.blockedByRules)
  if (eligible.length === 0) {
    return {
      recommendedOptionId: null,
      rationale: 'All options are blocked by business rules. No recommendation can be made.',
      confidenceScore: confidence.overall,
      humanOverridden: false,
      overrideUserId: null,
      overrideJustification: null,
    }
  }

  // Pick the option with the highest rule score
  const best = eligible.reduce((top, o) => o.ruleScore > top.ruleScore ? o : top)

  return {
    recommendedOptionId: best.id,
    rationale: `Option "${best.label}" achieved the highest rule compliance score (${best.ruleScore}/100) among eligible options.`,
    confidenceScore: confidence.overall,
    humanOverridden: false,
    overrideUserId: null,
    overrideJustification: null,
  }
}

// ---------------------------------------------------------------------------
// Helper: build confidence input from evidence + rule results
// ---------------------------------------------------------------------------

function buildConfidenceInput(
  evidence: EvidenceCollection,
  weights: EvidenceWeight[],
  ruleResults: RuleEvaluationResult[],
): ConfidenceInput {
  const { stats } = evidence
  const aiCount = stats.bySourceType['ai_analysis'] ?? 0
  const humanCount = stats.bySourceType['human_validation'] ?? 0

  const avgAuthority =
    evidence.items.length > 0
      ? weights.reduce((sum, w) => sum + w.sourceAuthorityScore * w.weight, 0)
      : 0

  const wAvgFreshness = weightedAverageFreshness(evidence.items, weights)
  const maxAgeHrs = maxEvidenceAgeHours(evidence.items)

  const totalEvidenceCount = stats.total
  const contradictionCount = stats.contradictionCount
  const consensusRatio = totalEvidenceCount > 0
    ? (totalEvidenceCount - contradictionCount) / totalEvidenceCount
    : 1

  const allRuleResultsSummaries = ruleResults.map(r => r.summary)
  const totalRulesEvaluated = allRuleResultsSummaries.reduce((s, r) => s + r.totalRules, 0)
  const passedRules = allRuleResultsSummaries.reduce((s, r) => s + r.passedRules, 0)
  const criticalViolationCount = allRuleResultsSummaries.reduce((s, r) => s + r.failedRules, 0)
  const warningCount = allRuleResultsSummaries.reduce((s, r) => s + r.warnRules, 0)

  const uniqueSourceTypes = new Set(evidence.items.map(i => i.source.type)).size

  return {
    volume: { totalEvidenceCount, uniqueSourceTypeCount: uniqueSourceTypes },
    quality: { averageAuthorityScore: avgAuthority, aiEvidenceCount: aiCount, humanEvidenceCount: humanCount, totalEvidenceCount },
    freshness: { weightedAverageFreshness: wAvgFreshness, maxAgeHours: maxAgeHrs },
    consistency: { contradictionCount, totalEvidenceCount, consensusRatio },
    ruleCompliance: { totalRulesEvaluated, passedRules, criticalViolationCount, warningCount },
  }
}

// ---------------------------------------------------------------------------
// Helper: assemble Decision object
// ---------------------------------------------------------------------------

function assembleDecision(
  id: DecisionId,
  input: DecisionInput,
  options: DecisionOption[],
  recommendation: DecisionRecommendation,
  evidence: EvidenceCollection,
  validationPassed: boolean,
  statusHistory: DecisionStatusEvent[],
): Decision {
  const status: DecisionStatus = validationPassed ? 'VALIDATED' : 'REJECTED'
  const now = new Date().toISOString()

  const transitionEvent: DecisionStatusEvent = {
    fromStatus: 'EVALUATING',
    toStatus: status,
    triggeredBy: 'system',
    reason: validationPassed
      ? 'All validation stages passed'
      : 'One or more validation stages failed',
    timestamp: now,
  }

  return {
    id,
    status,
    subject: input.subject,
    context: input.context,
    options,
    recommendation: validationPassed ? recommendation : null,
    evidenceIds: evidence.items.map(i => i.id as string),
    statusHistory: [...statusHistory, transitionEvent],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  }
}

// ---------------------------------------------------------------------------
// Helper: assemble UniversalDecisionReport
// ---------------------------------------------------------------------------

function assembleReport(
  decision: Decision,
  options: DecisionOption[],
  confidence: ConfidenceScore,
  evidence: EvidenceCollection,
  ruleResults: RuleEvaluationResult[],
  validation: ReturnType<typeof runValidationPipeline>,
  explainability: DecisionExplainability,
): UniversalDecisionReport {
  const rid = reportId(randomUUID())
  const now = new Date().toISOString()

  const metadata: ReportMetadata = {
    reportId: rid,
    schemaVersion: UNIVERSAL_REPORT_SCHEMA_VERSION,
    status: decision.status === 'VALIDATED' ? 'DRAFT' : 'CURRENT',
    decisionId: decision.id as string,
    decisionDomain: decision.subject.domain,
    decisionName: decision.subject.name,
    decisionCreatedAt: decision.createdAt,
    generatedAt: now,
    supersedesReportId: null,
    generatedBy: 'decision-engine-v1',
  }

  const executiveSummary = {
    headline: decision.recommendation?.recommendedOptionId
      ? `Recommended: ${options.find(o => o.id === decision.recommendation?.recommendedOptionId)?.label ?? 'Unknown'}`
      : 'No recommendation could be issued',
    summary: decision.recommendation?.rationale ?? 'The decision engine could not produce a recommendation for this input.',
    recommendedOption: options.find(o => o.id === decision.recommendation?.recommendedOptionId)?.label ?? null,
    confidenceBand: confidence.band,
    confidenceScore: confidence.overall,
    isRuleDetermined: true,
    humanOverrideApplied: decision.recommendation?.humanOverridden ?? false,
  }

  const optionScoring = options.map(o => ({
    optionId: o.id as string,
    optionLabel: o.label,
    ruleScore: o.ruleScore,
    isRecommended: o.id === decision.recommendation?.recommendedOptionId,
    isBlocked: o.blockedByRules,
    blockingRuleCount: o.flaggingRuleIds.length,
    warningCount: ruleResults.find(r => r.optionId === (o.id as string))?.summary.warnRules ?? 0,
    warningRuleCount: ruleResults.find(r => r.optionId === (o.id as string))?.summary.warnRules ?? 0,
  }))

  const evidenceSummary = {
    totalItems: evidence.stats.total,
    bySourceType: evidence.stats.bySourceType as Record<string, number>,
    averageFreshness: evidence.stats.averageFreshness,
    averageConfidence: evidence.stats.averageConfidence,
    contradictionCount: evidence.stats.contradictionCount,
    keyEvidenceIds: explainability.why.topSupportingEvidenceIds,
  }

  const riskFlags = []
  if (confidence.band === 'LOW' || confidence.band === 'VERY_LOW') {
    riskFlags.push({
      severity: 'HIGH' as const,
      category: 'confidence' as const,
      title: 'Low overall confidence',
      description: `Confidence score is ${confidence.overall} (${confidence.band}). The weakest dimension is ${confidence.weakestDimension}.`,
      mitigationAdvice: `Collect additional evidence for the ${confidence.weakestDimension.replace(/_/g, ' ')} dimension.`,
    })
  }
  if (evidence.stats.contradictionCount > 0) {
    riskFlags.push({
      severity: 'MEDIUM' as const,
      category: 'evidence' as const,
      title: 'Contradicting evidence detected',
      description: `${evidence.stats.contradictionCount} evidence item(s) contradict other evidence in the collection.`,
      mitigationAdvice: 'Review contradicting evidence and resolve or document the discrepancy before acting on the recommendation.',
    })
  }

  return {
    metadata,
    executiveSummary,
    decision,
    recommendation: decision.recommendation,
    options,
    optionScoring,
    confidence,
    evidence,
    evidenceSummary,
    ruleEvaluations: ruleResults,
    validation,
    explainability,
    riskFlags,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function runDecisionEngine(args: DecisionEngineInput): DecisionEngineResult {
  const { input, evidence, rules, thresholds } = args

  const decId = decisionId(randomUUID())
  const now = new Date().toISOString()

  const initialHistory: DecisionStatusEvent[] = [
    {
      fromStatus: 'DRAFT',
      toStatus: 'EVALUATING',
      triggeredBy: 'system',
      reason: 'Decision submitted for evaluation',
      timestamp: now,
    },
  ]

  // 1. Evaluate rules per option
  const domainRules = filterRulesForDomain(rules, input.subject.domain)
  const ruleResultsByOptionId = new Map<string, RuleEvaluationResult>()

  for (const rawOption of input.options) {
    const oid = rawOption.id ?? randomUUID()
    const facts = {
      decisionId: decId as string,
      optionId: oid,
      subject: input.subject as unknown as Record<string, unknown>,
      context: input.context as unknown as Record<string, unknown>,
      parameters: (input.context.parameters ?? {}) as Record<string, unknown>,
    }
    const rr = evaluateRules(domainRules, facts)
    ruleResultsByOptionId.set(oid, rr)
  }

  const ruleResults = Array.from(ruleResultsByOptionId.values())

  // 2. Build options with computed rule scores
  const options = buildOptionsWithRuleScores(input.options, ruleResultsByOptionId)

  // 3. Compute evidence weights
  const evidenceWeights = weightEvidence(evidence.items)

  // 4. Compute confidence score
  const confidenceInput = buildConfidenceInput(evidence, evidenceWeights, ruleResults)
  const confidence = computeConfidenceScore(confidenceInput)

  // 5. Run validation pipeline
  const validation = runValidationPipeline({
    decisionId: decId as string,
    input,
    evidence,
    confidence,
    ruleResults,
    thresholds,
  })

  // 6. Determine recommendation
  const recommendation = determineRecommendation(options, confidence)

  // 7. Assemble decision
  const decision = assembleDecision(
    decId,
    input,
    options,
    recommendation,
    evidence,
    validation.pipelineStatus !== 'FAILED',
    initialHistory,
  )

  // 8. Generate explainability
  const explainability = generateExplainability({
    decision,
    options,
    confidence,
    evidence,
    evidenceWeights,
    ruleResults,
  })

  // 9. Assemble report
  const report = assembleReport(decision, options, confidence, evidence, ruleResults, validation, explainability)

  return {
    decision,
    confidence,
    ruleResults,
    evidenceWeights,
    explainability,
    report,
  }
}
