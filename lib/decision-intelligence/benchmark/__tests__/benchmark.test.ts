/**
 * Decision Engine — Accuracy Regression Suite
 *
 * This test suite is the official acceptance gate for every future Decision
 * Engine change. If recommendation accuracy falls below the minimum threshold,
 * the build MUST fail.
 *
 * Philosophy:
 *   - We run the live engine (no mocks) against the gold dataset
 *   - A failing test here means the engine produces incorrect business
 *     recommendations that clients would receive in production
 *   - Lowering the thresholds is not a fix — fix the engine
 *
 * Accuracy thresholds:
 *   MINIMUM_RECOMMENDATION_ACCURACY = 100%
 *     Every case must recommend the correct option. A single wrong
 *     recommendation is a regression.
 *   MINIMUM_OVERALL_ACCURACY = 80%
 *     At least 80% of all checks across all dimensions must pass.
 *
 * To add new cases: add them to the appropriate cases file and export from
 * cases/index.ts — they will automatically run in this suite.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import type { BenchmarkReport } from '../types'
import {
  GOLD_DATASET,
  FEASIBILITY_CASES,
  CAMPAIGN_ROI_CASES,
  MARKET_ENTRY_CASES,
  LEAD_GEN_CASES,
  FULL_ANALYSIS_CASES,
} from '../cases'
import { runBenchmark } from '../runner'
import { generateAccuracyReport } from '../report'

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const MINIMUM_RECOMMENDATION_ACCURACY = 100
const MINIMUM_OVERALL_ACCURACY = 80

// ---------------------------------------------------------------------------
// Dataset integrity checks
// ---------------------------------------------------------------------------

describe('Gold Dataset — integrity', () => {
  it('contains the expected number of cases', () => {
    expect(FEASIBILITY_CASES).toHaveLength(6)
    expect(CAMPAIGN_ROI_CASES).toHaveLength(3)
    expect(MARKET_ENTRY_CASES).toHaveLength(3)
    expect(LEAD_GEN_CASES).toHaveLength(3)
    expect(FULL_ANALYSIS_CASES).toHaveLength(3)
    expect(GOLD_DATASET).toHaveLength(18)
  })

  it('all case IDs are unique', () => {
    const ids = GOLD_DATASET.map(c => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all cases have a non-empty explanation', () => {
    for (const c of GOLD_DATASET) {
      expect(c.explanation.trim().length).toBeGreaterThan(0)
    }
  })

  it('all expected confidence ranges are valid (min <= max, both in [0, 100])', () => {
    for (const c of GOLD_DATASET) {
      const { min, max } = c.expected.confidence
      expect(min).toBeGreaterThanOrEqual(0)
      expect(max).toBeLessThanOrEqual(100)
      expect(min).toBeLessThanOrEqual(max)
    }
  })

  it('all cases belong to a known report type', () => {
    const knownTypes = new Set(['feasibility', 'campaign_roi', 'market_entry', 'lead_gen', 'full_analysis'])
    for (const c of GOLD_DATASET) {
      expect(knownTypes.has(c.reportType)).toBe(true)
    }
  })

  it('all cases have at least one rule in engineInput', () => {
    for (const c of GOLD_DATASET) {
      expect(c.engineInput.rules.length).toBeGreaterThan(0)
    }
  })

  it('all cases have at least one evidence item in engineInput', () => {
    for (const c of GOLD_DATASET) {
      expect(c.engineInput.rawEvidence.length).toBeGreaterThan(0)
    }
  })

  it('all cases have at least two options in engineInput', () => {
    for (const c of GOLD_DATASET) {
      expect(c.engineInput.input.options.length).toBeGreaterThanOrEqual(2)
    }
  })
})

// ---------------------------------------------------------------------------
// Acceptance gate — MUST NOT be weakened
// ---------------------------------------------------------------------------

describe('Decision Engine — accuracy gate', () => {
  let report: BenchmarkReport

  beforeAll(() => {
    report = runBenchmark(GOLD_DATASET)
  })

  it(`recommendation accuracy is ${MINIMUM_RECOMMENDATION_ACCURACY}% (zero wrong recommendations)`, () => {
    const accuracy = report.accuracy.recommendation
    if (accuracy < MINIMUM_RECOMMENDATION_ACCURACY) {
      const failing = report.results.filter(r => !r.checks.recommendationCorrect)
      const detail = failing.map(r =>
        `  [${r.caseId}] expected="${r.snapshot.expectedRecommendation}" got="${r.actual.recommendedOptionId}"`
      ).join('\n')
      throw new Error(
        `Recommendation accuracy ${accuracy.toFixed(1)}% is below the ${MINIMUM_RECOMMENDATION_ACCURACY}% gate.\n` +
        `${failing.length} failing case(s):\n${detail}\n\n` +
        `Fix the Decision Engine — do not lower the threshold.`
      )
    }
    expect(accuracy).toBeGreaterThanOrEqual(MINIMUM_RECOMMENDATION_ACCURACY)
  })

  it(`overall accuracy is at least ${MINIMUM_OVERALL_ACCURACY}% across all dimensions`, () => {
    const accuracy = report.accuracy.overall
    if (accuracy < MINIMUM_OVERALL_ACCURACY) {
      const detail = report.results
        .filter(r => !r.passed)
        .map(r => `  [${r.caseId}] failures: ${r.failures.join('; ')}`)
        .join('\n')
      throw new Error(
        `Overall accuracy ${accuracy.toFixed(1)}% is below the ${MINIMUM_OVERALL_ACCURACY}% gate.\n` +
        `${report.failed} failing case(s):\n${detail}\n\n` +
        `Fix the Decision Engine or recalibrate expected ranges in the case files.`
      )
    }
    expect(accuracy).toBeGreaterThanOrEqual(MINIMUM_OVERALL_ACCURACY)
  })
})

// ---------------------------------------------------------------------------
// Per-case results — detailed failures surface here in CI
// ---------------------------------------------------------------------------

describe('Decision Engine — per-case accuracy', () => {
  let report: BenchmarkReport

  beforeAll(() => {
    report = runBenchmark(GOLD_DATASET)
  })

  for (const benchCase of GOLD_DATASET) {
    it(`[${benchCase.id}] ${benchCase.name}`, () => {
      const result = report.results.find(r => r.caseId === benchCase.id)
      expect(result).toBeDefined()
      if (!result) return

      if (!result.passed) {
        throw new Error(
          `Case "${benchCase.id}" failed:\n` +
          result.failures.map(f => `  - ${f}`).join('\n')
        )
      }
      expect(result.passed).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// Report generator smoke test
// ---------------------------------------------------------------------------

describe('Accuracy report generator', () => {
  it('generates a non-empty markdown report', () => {
    const report = runBenchmark(GOLD_DATASET)
    const markdown = generateAccuracyReport(report)
    expect(markdown.length).toBeGreaterThan(100)
    expect(markdown).toContain('# Decision Engine — Accuracy Report')
    expect(markdown).toContain('Overall Accuracy')
    expect(markdown).toContain('Recommendation')
  })

  it('report summary counts are consistent', () => {
    const report = runBenchmark(GOLD_DATASET)
    expect(report.passed + report.failed).toBe(report.totalCases)
    expect(report.totalCases).toBe(GOLD_DATASET.length)
  })
})

// ---------------------------------------------------------------------------
// Per-report-type breakdown (informational — no gates)
// ---------------------------------------------------------------------------

describe('Decision Engine — accuracy by report type', () => {
  let report: BenchmarkReport

  beforeAll(() => {
    report = runBenchmark(GOLD_DATASET)
  })

  const reportTypes = ['feasibility', 'campaign_roi', 'market_entry', 'lead_gen', 'full_analysis'] as const

  for (const reportType of reportTypes) {
    it(`[${reportType}] all cases pass recommendation check`, () => {
      const cases = report.results.filter(r => r.reportType === reportType)
      const failing = cases.filter(r => !r.checks.recommendationCorrect)
      if (failing.length > 0) {
        const detail = failing.map(r =>
          `  [${r.caseId}] expected="${r.snapshot.expectedRecommendation}" got="${r.actual.recommendedOptionId}"`
        ).join('\n')
        throw new Error(`${reportType} recommendation failures:\n${detail}`)
      }
      expect(failing).toHaveLength(0)
    })
  }
})
