/**
 * Validation Engine — runs the ordered multi-stage validation pipeline.
 *
 * Stages execute in the order defined by VALIDATION_STAGE_ORDER. If a blocking
 * stage fails, execution halts and subsequent stages are skipped (marked SKIP).
 *
 * The engine is pure. It accepts all inputs as arguments and returns a
 * ValidationResult — no I/O, no AI calls, no side effects.
 */

import type {
  ValidationResult,
  ValidationStageResult,
  ValidationCheck,
  ValidationCheckStatus,
  ValidationSummary,
  ValidationThresholds,
  ValidationPipelineStatus,
  ValidationStageType,
} from '../types/validation.types'
import {
  VALIDATION_STAGE_ORDER,
  DEFAULT_VALIDATION_THRESHOLDS,
} from '../types/validation.types'
import type { DecisionInput } from '../types/decision.types'
import type { EvidenceCollection } from '../types/evidence.types'
import type { ConfidenceScore } from '../types/confidence.types'
import type { RuleEvaluationResult } from '../types/rules.types'

// ---------------------------------------------------------------------------
// Stage: structural
// ---------------------------------------------------------------------------

function runStructuralStage(input: DecisionInput, durationMs = 0): ValidationStageResult {
  const checks: ValidationCheck[] = []
  const startTime = Date.now()

  checks.push({
    id: 'struct-question',
    name: 'Decision question is present',
    description: 'The context must contain a non-empty question.',
    status: input.context.question?.trim() ? 'PASS' : 'FAIL',
    message: input.context.question?.trim()
      ? 'Question is present'
      : 'Decision context must include a non-empty question',
    details: { question: input.context.question },
    blocking: true,
  })

  checks.push({
    id: 'struct-options',
    name: 'At least one option provided',
    description: 'Decisions require at least one option to evaluate.',
    status: input.options.length > 0 ? 'PASS' : 'FAIL',
    message: input.options.length > 0
      ? `${input.options.length} option(s) provided`
      : 'At least one decision option is required',
    details: { optionCount: input.options.length },
    blocking: true,
  })

  checks.push({
    id: 'struct-domain',
    name: 'Domain is specified',
    description: 'The subject must include a non-empty domain.',
    status: input.subject.domain?.trim() ? 'PASS' : 'FAIL',
    message: input.subject.domain?.trim()
      ? `Domain: ${input.subject.domain}`
      : 'Decision subject must specify a domain',
    details: { domain: input.subject.domain },
    blocking: true,
  })

  const failedBlocking = checks.find(c => c.blocking && c.status === 'FAIL')
  const stageStatus: ValidationCheckStatus = failedBlocking ? 'FAIL'
    : checks.some(c => c.status === 'WARN') ? 'WARN'
    : 'PASS'

  return {
    stage: 'structural',
    status: stageStatus,
    checks,
    blocking: stageStatus === 'FAIL',
    executedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime || durationMs,
  }
}

// ---------------------------------------------------------------------------
// Stage: business (wraps rule evaluation results)
// ---------------------------------------------------------------------------

function runBusinessStage(
  ruleResults: RuleEvaluationResult[],
): ValidationStageResult {
  const startTime = Date.now()
  const checks: ValidationCheck[] = []

  const allBlocked = ruleResults.filter(r => r.summary.isBlocked)
  const allWarnings = ruleResults.filter(r => r.summary.warnRules > 0)
  const totalOptions = new Set(ruleResults.map(r => r.optionId)).size
  const eligibleOptions = totalOptions - allBlocked.length

  // P0.1 FIX: Only block the pipeline when ALL options are blocked.
  // When eligible options remain, emit WARN so the engine can recommend from them.
  if (allBlocked.length === 0) {
    checks.push({
      id: 'biz-no-blocking-rules',
      name: 'No blocking rule violations',
      description: 'No business rule with action FAIL must have fired.',
      status: 'PASS',
      message: 'All options passed business rule evaluation',
      details: { blockedOptionIds: [], blockingRuleIds: [] },
      blocking: false,
    })
  } else if (eligibleOptions > 0) {
    checks.push({
      id: 'biz-no-blocking-rules',
      name: 'No blocking rule violations',
      description: 'No business rule with action FAIL must have fired.',
      status: 'WARN',
      message: `${allBlocked.length} option(s) blocked by business rules — ${eligibleOptions} eligible option(s) remain`,
      details: {
        blockedOptionIds: allBlocked.map(r => r.optionId),
        blockingRuleIds: allBlocked.flatMap(r => r.summary.blockingRuleIds),
        eligibleOptionCount: eligibleOptions,
      },
      blocking: false,
    })
  }

  if (allWarnings.length > 0) {
    checks.push({
      id: 'biz-warnings',
      name: 'Business rule warnings',
      description: 'Rules with action WARN fired — review recommended.',
      status: 'WARN',
      message: `${allWarnings.length} option(s) have advisory rule warnings`,
      details: { warningOptionIds: allWarnings.map(r => r.optionId) },
      blocking: false,
    })
  }

  // Only a hard FAIL when ALL options are blocked — no eligible option can be recommended
  if (totalOptions > 0 && allBlocked.length === totalOptions) {
    checks.push({
      id: 'biz-all-options-blocked',
      name: 'All options blocked',
      description: 'Every available option is blocked by business rules.',
      status: 'FAIL',
      message: 'All decision options are blocked by business rules. The decision cannot proceed.',
      details: { totalOptions },
      blocking: true,
    })
  }

  const failedBlocking = checks.find(c => c.blocking && c.status === 'FAIL')
  const stageStatus: ValidationCheckStatus = failedBlocking ? 'FAIL'
    : checks.some(c => c.status === 'WARN') ? 'WARN'
    : 'PASS'

  return {
    stage: 'business',
    status: stageStatus,
    checks,
    blocking: stageStatus === 'FAIL',
    executedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  }
}

// ---------------------------------------------------------------------------
// Stage: evidence
// ---------------------------------------------------------------------------

function runEvidenceStage(
  evidence: EvidenceCollection,
  thresholds: ValidationThresholds,
): ValidationStageResult {
  const startTime = Date.now()
  const checks: ValidationCheck[] = []

  checks.push({
    id: 'ev-minimum-count',
    name: 'Minimum evidence count',
    description: `At least ${thresholds.minimumEvidenceCount} evidence item(s) required.`,
    status: evidence.stats.total >= thresholds.minimumEvidenceCount ? 'PASS' : 'FAIL',
    message: evidence.stats.total >= thresholds.minimumEvidenceCount
      ? `${evidence.stats.total} evidence item(s) present`
      : `Insufficient evidence: ${evidence.stats.total} of ${thresholds.minimumEvidenceCount} required`,
    details: { actual: evidence.stats.total, required: thresholds.minimumEvidenceCount },
    blocking: true,
  })

  if (evidence.stats.averageFreshness < 0.2) {
    checks.push({
      id: 'ev-stale-warning',
      name: 'Evidence freshness warning',
      description: 'Average freshness is very low.',
      status: 'WARN',
      message: `Evidence is very stale (average freshness: ${(evidence.stats.averageFreshness * 100).toFixed(0)}%). Consider refreshing data.`,
      details: { averageFreshness: evidence.stats.averageFreshness },
      blocking: false,
    })
  }

  const failedBlocking = checks.find(c => c.blocking && c.status === 'FAIL')
  const stageStatus: ValidationCheckStatus = failedBlocking ? 'FAIL'
    : checks.some(c => c.status === 'WARN') ? 'WARN'
    : 'PASS'

  return {
    stage: 'evidence',
    status: stageStatus,
    checks,
    blocking: stageStatus === 'FAIL',
    executedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  }
}

// ---------------------------------------------------------------------------
// Stage: confidence
// ---------------------------------------------------------------------------

function runConfidenceStage(
  confidence: ConfidenceScore,
  thresholds: ValidationThresholds,
): ValidationStageResult {
  const startTime = Date.now()
  const checks: ValidationCheck[] = []

  const meetsMinimum = confidence.overall >= thresholds.minimumConfidenceScore

  checks.push({
    id: 'conf-minimum',
    name: 'Minimum confidence threshold',
    description: `Overall confidence must be at least ${thresholds.minimumConfidenceScore}.`,
    status: meetsMinimum ? 'PASS' : 'FAIL',
    message: meetsMinimum
      ? `Confidence score ${confidence.overall} meets the minimum of ${thresholds.minimumConfidenceScore}`
      : `Confidence score ${confidence.overall} is below the minimum of ${thresholds.minimumConfidenceScore}`,
    details: {
      actual: confidence.overall,
      required: thresholds.minimumConfidenceScore,
      band: confidence.band,
    },
    blocking: true,
  })

  if (confidence.band === 'LOW' || confidence.band === 'VERY_LOW') {
    checks.push({
      id: 'conf-low-band-warning',
      name: 'Low confidence band',
      description: 'Confidence band is LOW or VERY_LOW.',
      status: 'WARN',
      message: `Confidence band is ${confidence.band}. Weakest dimension: ${confidence.weakestDimension}.`,
      details: { band: confidence.band, weakestDimension: confidence.weakestDimension },
      blocking: false,
    })
  }

  const failedBlocking = checks.find(c => c.blocking && c.status === 'FAIL')
  const stageStatus: ValidationCheckStatus = failedBlocking ? 'FAIL'
    : checks.some(c => c.status === 'WARN') ? 'WARN'
    : 'PASS'

  return {
    stage: 'confidence',
    status: stageStatus,
    checks,
    blocking: stageStatus === 'FAIL',
    executedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  }
}

// ---------------------------------------------------------------------------
// Stage: consistency
// ---------------------------------------------------------------------------

function runConsistencyStage(
  evidence: EvidenceCollection,
  thresholds: ValidationThresholds,
): ValidationStageResult {
  const startTime = Date.now()
  const checks: ValidationCheck[] = []

  const contradictionRatio =
    evidence.stats.total > 0
      ? evidence.stats.contradictionCount / evidence.stats.total
      : 0

  const withinThreshold = contradictionRatio <= thresholds.maximumContradictionRatio

  checks.push({
    id: 'cons-contradiction-ratio',
    name: 'Evidence contradiction ratio',
    description: `No more than ${(thresholds.maximumContradictionRatio * 100).toFixed(0)}% of evidence items may be contradictory.`,
    status: withinThreshold ? 'PASS' : 'FAIL',
    message: withinThreshold
      ? `Contradiction ratio ${(contradictionRatio * 100).toFixed(0)}% is within the threshold`
      : `Contradiction ratio ${(contradictionRatio * 100).toFixed(0)}% exceeds maximum of ${(thresholds.maximumContradictionRatio * 100).toFixed(0)}%`,
    details: {
      contradictionCount: evidence.stats.contradictionCount,
      total: evidence.stats.total,
      ratio: contradictionRatio,
      threshold: thresholds.maximumContradictionRatio,
    },
    blocking: true,
  })

  const failedBlocking = checks.find(c => c.blocking && c.status === 'FAIL')
  const stageStatus: ValidationCheckStatus = failedBlocking ? 'FAIL'
    : checks.some(c => c.status === 'WARN') ? 'WARN'
    : 'PASS'

  return {
    stage: 'consistency',
    status: stageStatus,
    checks,
    blocking: stageStatus === 'FAIL',
    executedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function buildSummary(stages: ValidationStageResult[]): ValidationSummary {
  let passed = 0, failed = 0, warned = 0, skipped = 0
  const blockingMessages: string[] = []
  const warningMessages: string[] = []

  for (const stage of stages) {
    for (const check of stage.checks) {
      if (check.status === 'PASS') passed++
      else if (check.status === 'FAIL') { failed++; if (check.blocking) blockingMessages.push(check.message) }
      else if (check.status === 'WARN') { warned++; warningMessages.push(check.message) }
      else skipped++
    }
  }

  return {
    totalChecks: passed + failed + warned + skipped,
    passed,
    failed,
    warned,
    skipped,
    canProceed: failed === 0,
    blockingMessages,
    warningMessages,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ValidationEngineInput {
  readonly decisionId: string
  readonly input: DecisionInput
  readonly evidence: EvidenceCollection
  readonly confidence: ConfidenceScore
  readonly ruleResults: RuleEvaluationResult[]
  readonly thresholds?: Partial<ValidationThresholds>
}

export function runValidationPipeline(args: ValidationEngineInput): ValidationResult {
  const totalStart = Date.now()
  const thresholds: ValidationThresholds = {
    ...DEFAULT_VALIDATION_THRESHOLDS,
    ...args.thresholds,
  }

  const stageRunners: Record<ValidationStageType, () => ValidationStageResult> = {
    structural:  () => runStructuralStage(args.input),
    business:    () => runBusinessStage(args.ruleResults),
    evidence:    () => runEvidenceStage(args.evidence, thresholds),
    confidence:  () => runConfidenceStage(args.confidence, thresholds),
    consistency: () => runConsistencyStage(args.evidence, thresholds),
  }

  const stages: ValidationStageResult[] = []
  let haltedAtStage: ValidationStageType | null = null

  for (const stageName of VALIDATION_STAGE_ORDER) {
    if (haltedAtStage !== null) {
      // Add a skipped placeholder for every remaining stage
      stages.push({
        stage: stageName,
        status: 'SKIP',
        checks: [{
          id: `${stageName}-skipped`,
          name: 'Stage skipped',
          description: 'Pipeline halted by a prior stage failure.',
          status: 'SKIP',
          message: `Skipped because the pipeline halted at stage "${haltedAtStage}"`,
          details: {},
          blocking: false,
        }],
        blocking: false,
        executedAt: new Date().toISOString(),
        durationMs: 0,
      })
      continue
    }

    const result = stageRunners[stageName]()
    stages.push(result)

    if (result.blocking && result.status === 'FAIL') {
      haltedAtStage = stageName
    }
  }

  const summary = buildSummary(stages)
  const pipelineStatus: ValidationPipelineStatus =
    summary.failed > 0 ? 'FAILED'
    : summary.warned > 0 ? 'PARTIAL'
    : 'PASSED'

  return {
    decisionId: args.decisionId,
    pipelineStatus,
    stages,
    haltedAtStage,
    summary,
    validatedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - totalStart,
  }
}
