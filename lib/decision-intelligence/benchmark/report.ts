/**
 * Decision Benchmark — Accuracy Report Generator
 *
 * Converts a BenchmarkReport into a human-readable markdown document that
 * answers the question: "How accurate are our business recommendations?"
 *
 * Sections:
 *   1. Overall accuracy summary
 *   2. Per-dimension accuracy
 *   3. Failing cases (false positives, false negatives, rule mismatches)
 *   4. Passing cases
 *   5. Suggested investigation areas
 */

import type { BenchmarkReport, BenchmarkCaseResult } from './types'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Generate a full markdown accuracy report from a BenchmarkReport. */
export function generateAccuracyReport(report: BenchmarkReport): string {
  const lines: string[] = []

  lines.push('# Decision Engine — Accuracy Report')
  lines.push('')
  lines.push(`- **Run at**: ${report.ranAt}`)
  lines.push(`- **Engine version**: ${report.engineVersion}`)
  lines.push(`- **Total cases**: ${report.totalCases}`)
  lines.push(`- **Passed**: ${report.passed}`)
  lines.push(`- **Failed**: ${report.failed}`)
  lines.push('')

  // Overall accuracy block
  const overallPct = report.accuracy.overall.toFixed(1)
  const overallStatus = report.accuracy.overall >= 100 ? '✅ PASS' : '❌ FAIL'
  lines.push(`## Overall Accuracy: ${overallPct}% ${overallStatus}`)
  lines.push('')
  lines.push('| Dimension | Accuracy |')
  lines.push('|-----------|----------|')
  lines.push(`| Recommendation | ${report.accuracy.recommendation.toFixed(1)}% |`)
  lines.push(`| Fired rules    | ${report.accuracy.rules.toFixed(1)}% |`)
  lines.push(`| Blocked options| ${report.accuracy.blockedOptions.toFixed(1)}% |`)
  lines.push(`| Confidence range| ${report.accuracy.confidence.toFixed(1)}% |`)
  lines.push(`| Trust score range| ${report.accuracy.trustScore.toFixed(1)}% |`)
  lines.push('')

  // Failing cases
  if (report.failed > 0) {
    lines.push('## Failing Cases')
    lines.push('')

    if (report.falsePositives.length > 0) {
      lines.push('### False Positives — wrong recommendation made')
      lines.push('')
      for (const r of report.falsePositives) {
        lines.push(...formatCaseResult(r))
      }
    }

    if (report.falseNegatives.length > 0) {
      lines.push('### False Negatives — expected recommendation not made')
      lines.push('')
      for (const r of report.falseNegatives) {
        lines.push(...formatCaseResult(r))
      }
    }

    if (report.ruleMismatches.length > 0) {
      lines.push('### Rule Mismatches — unexpected rules fired or expected rules missed')
      lines.push('')
      for (const r of report.ruleMismatches) {
        lines.push(...formatCaseResult(r))
      }
    }

    const otherFailing = report.results.filter(
      r =>
        !r.passed &&
        !report.falsePositives.includes(r) &&
        !report.falseNegatives.includes(r) &&
        !report.ruleMismatches.includes(r),
    )
    if (otherFailing.length > 0) {
      lines.push('### Other Failures — confidence or trust score out of range')
      lines.push('')
      for (const r of otherFailing) {
        lines.push(...formatCaseResult(r))
      }
    }
  }

  // Passing cases (compact)
  const passing = report.results.filter(r => r.passed)
  if (passing.length > 0) {
    lines.push('## Passing Cases')
    lines.push('')
    lines.push('| Case | Report Type | Duration |')
    lines.push('|------|-------------|----------|')
    for (const r of passing) {
      lines.push(`| ${r.caseId} | ${r.reportType} | ${r.durationMs}ms |`)
    }
    lines.push('')
  }

  // Investigation areas
  if (report.suggestedInvestigationAreas.length > 0) {
    lines.push('## Suggested Investigation Areas')
    lines.push('')
    for (const area of report.suggestedInvestigationAreas) {
      lines.push(`- ${area}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCaseResult(r: BenchmarkCaseResult): string[] {
  const status = r.passed ? '✅' : '❌'
  const lines = [
    `#### ${status} ${r.caseId} — ${r.caseName}`,
    '',
    `- **Report type**: ${r.reportType}`,
    `- **Duration**: ${r.durationMs}ms`,
    '',
    '**Expected**',
    `- Recommendation: \`${r.snapshot.expectedRecommendation}\``,
    `- Fired rules: ${r.snapshot.expectedFiredRules.length > 0 ? r.snapshot.expectedFiredRules.map(id => `\`${id}\``).join(', ') : '_(none)_'}`,
    `- Blocked options: ${r.snapshot.expectedBlockedOptions.length > 0 ? r.snapshot.expectedBlockedOptions.map(id => `\`${id}\``).join(', ') : '_(none)_'}`,
    `- Confidence range: [${r.snapshot.expectedConfidenceRange.min}, ${r.snapshot.expectedConfidenceRange.max}]`,
    '',
    '**Actual**',
    `- Recommendation: \`${r.actual.recommendedOptionId}\``,
    `- Fired rules: ${r.actual.firedRuleIds.length > 0 ? r.actual.firedRuleIds.map(id => `\`${id}\``).join(', ') : '_(none)_'}`,
    `- Blocked options: ${r.actual.blockedOptionIds.length > 0 ? r.actual.blockedOptionIds.map(id => `\`${id}\``).join(', ') : '_(none)_'}`,
    `- Confidence: ${r.actual.confidence.toFixed(1)} (${r.actual.confidenceBand})`,
    `- Trust score: ${r.actual.trustScore.toFixed(1)}`,
    '',
  ]

  if (r.failures.length > 0) {
    lines.push('**Failures**')
    lines.push('')
    for (const f of r.failures) {
      lines.push(`- ${f}`)
    }
    lines.push('')
  }

  return lines
}
