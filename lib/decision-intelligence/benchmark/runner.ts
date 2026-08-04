/**
 * Decision Benchmark Runner
 *
 * Executes benchmark cases against the live Decision Engine and produces a
 * structured accuracy report. This is the acceptance gate for every future
 * Decision Engine change.
 *
 * Usage:
 *   import { runBenchmark } from './runner'
 *   import { GOLD_DATASET } from './cases'
 *   const report = runBenchmark(GOLD_DATASET)
 */

import { collectEvidence, type RawEvidenceInput } from '../evidence/evidence-collector'
import { runDecisionEngine, type DecisionEngineInput } from '../engine/decision-engine'
import type { BusinessRule } from '../types/rules.types'
import type { BenchmarkCase, BenchmarkCaseResult, BenchmarkReport } from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Package version used as the engine version label in reports. */
const ENGINE_VERSION = '1.0.0'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RunBenchmarkOptions {
  /**
   * Unique identifier for this run (defaults to an ISO timestamp).
   * Useful for correlating report files to specific CI runs.
   */
  readonly runId?: string
}

/**
 * Run all cases and return a BenchmarkReport with per-dimension accuracy.
 * Never throws — individual case failures are captured in the result.
 */
export function runBenchmark(
  cases: readonly BenchmarkCase[],
  options: RunBenchmarkOptions = {},
): BenchmarkReport {
  const ranAt = new Date().toISOString()
  const results: BenchmarkCaseResult[] = []

  for (const benchCase of cases) {
    results.push(runCase(benchCase))
  }

  return buildReport(results, ranAt)
}

// ---------------------------------------------------------------------------
// Single case runner
// ---------------------------------------------------------------------------

function runCase(benchCase: BenchmarkCase): BenchmarkCaseResult {
  const start = Date.now()
  const failures: string[] = []

  let actual: BenchmarkCaseResult['actual']
  try {
    actual = executeCase(benchCase)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const durationMs = Date.now() - start
    return buildFailedResult(benchCase, [`Engine threw: ${msg}`], durationMs)
  }

  const { expected } = benchCase

  // 1. Recommendation check
  const recommendationCorrect = actual.recommendedOptionId === expected.recommendedOptionId
  if (!recommendationCorrect) {
    failures.push(
      `Recommendation: expected "${expected.recommendedOptionId}", got "${actual.recommendedOptionId}"`,
    )
  }

  // 2. Fired rules check (symmetric diff — any missing or extra rule is a failure)
  const expectedSet = new Set(expected.firedRuleIds)
  const actualSet   = new Set(actual.firedRuleIds)
  const missingRules = [...expectedSet].filter(id => !actualSet.has(id))
  const extraRules   = [...actualSet].filter(id => !expectedSet.has(id))
  const firedRulesCorrect = missingRules.length === 0 && extraRules.length === 0
  if (!firedRulesCorrect) {
    if (missingRules.length > 0) failures.push(`Rules not fired (expected): ${missingRules.join(', ')}`)
    if (extraRules.length > 0)   failures.push(`Rules fired unexpectedly: ${extraRules.join(', ')}`)
  }

  // 3. Blocked options check
  const expectedBlocked = [...expected.blockedOptionIds].sort().join(',')
  const actualBlocked   = [...actual.blockedOptionIds].sort().join(',')
  const blockedOptionsCorrect = expectedBlocked === actualBlocked
  if (!blockedOptionsCorrect) {
    failures.push(`Blocked options: expected [${expectedBlocked}], got [${actualBlocked}]`)
  }

  // 4. Confidence range check
  const confidenceInRange =
    actual.confidence >= expected.confidence.min &&
    actual.confidence <= expected.confidence.max
  if (!confidenceInRange) {
    failures.push(
      `Confidence ${actual.confidence.toFixed(1)} outside [${expected.confidence.min}, ${expected.confidence.max}]`,
    )
  }

  // 5. Trust score range check
  const trustScoreInRange =
    actual.trustScore >= expected.trustScoreRange.min &&
    actual.trustScore <= expected.trustScoreRange.max
  if (!trustScoreInRange) {
    failures.push(
      `Trust score ${actual.trustScore.toFixed(1)} outside [${expected.trustScoreRange.min}, ${expected.trustScoreRange.max}]`,
    )
  }

  const passed = failures.length === 0

  return {
    caseId: benchCase.id,
    caseName: benchCase.name,
    reportType: benchCase.reportType,
    passed,
    checks: { recommendationCorrect, firedRulesCorrect, blockedOptionsCorrect, confidenceInRange, trustScoreInRange },
    actual,
    snapshot: {
      expectedRecommendation: expected.recommendedOptionId,
      expectedFiredRules: expected.firedRuleIds,
      expectedBlockedOptions: expected.blockedOptionIds,
      expectedConfidenceRange: expected.confidence,
    },
    failures,
    durationMs: Date.now() - start,
  }
}

// ---------------------------------------------------------------------------
// Engine execution
// ---------------------------------------------------------------------------

function executeCase(benchCase: BenchmarkCase): BenchmarkCaseResult['actual'] {
  const { engineInput } = benchCase

  // Build a fresh EvidenceCollection with current timestamps to ensure
  // freshness scores always reflect "just retrieved" rather than the
  // age at which the case was created. Cast from the permissive benchmark
  // types to the engine's branded types — safe because the case files mirror
  // the exact shapes the engine expects.
  const { collection } = collectEvidence({
    decisionId: benchCase.id,
    items: engineInput.rawEvidence as unknown as RawEvidenceInput[],
  })

  const result = runDecisionEngine({
    input: engineInput.input as unknown as DecisionEngineInput['input'],
    evidence: collection,
    rules: engineInput.rules as unknown as BusinessRule[],
  })

  const { report } = result

  // Extract fired rule IDs across ALL options (deduplicated)
  const firedRuleIds = extractFiredRuleIds(report.ruleEvaluations)

  // Extract blocked option IDs
  const blockedOptionIds = report.ruleEvaluations
    .filter(ev => ev.summary.isBlocked)
    .map(ev => ev.optionId)

  const recommendedOptionId = (report.recommendation?.recommendedOptionId ?? null) as string | null

  return {
    recommendedOptionId,
    confidence: report.confidence.overall,
    confidenceBand: report.confidence.band,
    firedRuleIds,
    blockedOptionIds,
    trustScore: report.trustScore.score,
  }
}

function extractFiredRuleIds(ruleEvaluations: { results: { fired: boolean; ruleId: string }[] }[]): string[] {
  const seen = new Set<string>()
  for (const ev of ruleEvaluations) {
    for (const r of ev.results) {
      if (r.fired) seen.add(r.ruleId as string)
    }
  }
  return [...seen]
}

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------

function buildReport(results: BenchmarkCaseResult[], ranAt: string): BenchmarkReport {
  const totalCases = results.length
  const passed = results.filter(r => r.passed).length
  const failed = totalCases - passed

  const acc = (check: keyof BenchmarkCaseResult['checks']) =>
    totalCases > 0
      ? (results.filter(r => r.checks[check]).length / totalCases) * 100
      : 100

  const accuracy = {
    overall:        totalCases > 0 ? (passed / totalCases) * 100 : 100,
    recommendation: acc('recommendationCorrect'),
    rules:          acc('firedRulesCorrect'),
    blockedOptions: acc('blockedOptionsCorrect'),
    confidence:     acc('confidenceInRange'),
    trustScore:     acc('trustScoreInRange'),
  }

  const failing = results.filter(r => !r.passed)

  const falsePositives = failing.filter(r =>
    !r.checks.recommendationCorrect &&
    r.actual.recommendedOptionId !== null &&
    r.snapshot.expectedRecommendation !== null &&
    r.actual.recommendedOptionId !== r.snapshot.expectedRecommendation,
  )

  const falseNegatives = failing.filter(r =>
    !r.checks.recommendationCorrect &&
    (r.actual.recommendedOptionId === null || r.snapshot.expectedRecommendation === null),
  )

  const ruleMismatches      = failing.filter(r => !r.checks.firedRulesCorrect)
  const confidenceDeviations = failing.filter(r => !r.checks.confidenceInRange)
  const trustScoreDeviations = failing.filter(r => !r.checks.trustScoreInRange)

  const suggestedInvestigationAreas = buildInvestigationAreas(failing, accuracy)

  return {
    ranAt,
    engineVersion: ENGINE_VERSION,
    totalCases,
    passed,
    failed,
    accuracy,
    falsePositives,
    falseNegatives,
    ruleMismatches,
    confidenceDeviations,
    trustScoreDeviations,
    suggestedInvestigationAreas,
    results,
  }
}

function buildInvestigationAreas(failing: BenchmarkCaseResult[], accuracy: BenchmarkReport['accuracy']): string[] {
  const areas: string[] = []

  if (accuracy.recommendation < 100) {
    const types = [...new Set(failing.filter(r => !r.checks.recommendationCorrect).map(r => r.reportType))]
    areas.push(`Recommendation accuracy degraded. Affected report types: ${types.join(', ')}.`)
  }

  if (accuracy.rules < 100) {
    const types = [...new Set(failing.filter(r => !r.checks.firedRulesCorrect).map(r => r.reportType))]
    areas.push(`Rule firing mismatches detected. Check rule conditions in: ${types.join(', ')}.`)
  }

  if (accuracy.blockedOptions < 100) {
    areas.push('Blocked option detection has changed. Verify FAIL rule conditions and option blocking logic.')
  }

  if (accuracy.confidence < 100) {
    areas.push('Confidence score out of expected range. Check evidence coverage weights and confidence engine thresholds.')
  }

  if (accuracy.trustScore < 100) {
    areas.push('Trust score out of expected range. Review trust score derivation from confidence overall.')
  }

  if (failing.length === 0) {
    areas.push('All cases passed. No investigation required.')
  }

  return areas
}

// ---------------------------------------------------------------------------
// Internal: build a fully-failed result when the engine throws
// ---------------------------------------------------------------------------

function buildFailedResult(
  benchCase: BenchmarkCase,
  failures: string[],
  durationMs: number,
): BenchmarkCaseResult {
  return {
    caseId: benchCase.id,
    caseName: benchCase.name,
    reportType: benchCase.reportType,
    passed: false,
    checks: {
      recommendationCorrect: false,
      firedRulesCorrect: false,
      blockedOptionsCorrect: false,
      confidenceInRange: false,
      trustScoreInRange: false,
    },
    actual: {
      recommendedOptionId: null,
      confidence: 0,
      confidenceBand: 'VERY_LOW',
      firedRuleIds: [],
      blockedOptionIds: [],
      trustScore: 0,
    },
    snapshot: {
      expectedRecommendation: benchCase.expected.recommendedOptionId,
      expectedFiredRules: benchCase.expected.firedRuleIds,
      expectedBlockedOptions: benchCase.expected.blockedOptionIds,
      expectedConfidenceRange: benchCase.expected.confidence,
    },
    failures,
    durationMs,
  }
}
