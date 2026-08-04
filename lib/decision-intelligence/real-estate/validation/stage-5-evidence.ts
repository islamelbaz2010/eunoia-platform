import { RE_ERROR_CODES } from '../errors/error-codes'
import { RE_EVIDENCE_FRESHNESS_HALF_LIFE_DAYS } from '../types/enums'
import type { RECallerParameters } from '../types/parameters'
import type { REEvidence } from '../types/evidence'
import { evidenceAgeDays } from '../types/evidence'
import type { REStageResult, REValidationError, REValidationWarning } from '../types/request'

// Stage 5 — Evidence Completeness Check
// Verifies required evidence categories are present in context.evidence.
// Also checks evidence freshness against declared half-life thresholds.
//
// Severity of absence:
//   financial_projections → EVIDENCE_MISSING_CRITICAL  (blocking)
//   cost_estimates        → EVIDENCE_MISSING_REQUIRED  (blocking)
//   sales_projections     → EVIDENCE_MISSING_REQUIRED  (blocking)
//   land_terms            → EVIDENCE_MISSING_REQUIRED  (blocking)
//   cash_flow_timing      → EVIDENCE_MISSING_ADVISORY  (non-blocking — RE-EXE-002 fires at Stage 7)
export function runStage5Evidence(
  params: RECallerParameters,
  evidence: REEvidence[],
): REStageResult {
  const start = Date.now()
  const errors: REValidationError[] = []
  const warnings: REValidationWarning[] = []

  const byCategory = new Map<string, REEvidence>()
  for (const item of evidence) {
    byCategory.set(item.category, item)
  }

  // ── 1. financial_projections — REQUIRED, blocking ─────────────────────────
  if (!byCategory.has('financial_projections')) {
    errors.push({
      evidenceCategory: 'financial_projections',
      code: RE_ERROR_CODES.EVIDENCE_MISSING_CRITICAL,
      message: 'financial_projections evidence is REQUIRED and absent. Engine cannot verify computed financial metrics without it.',
    })
  }

  // ── 2. cost_estimates — REQUIRED, blocking ────────────────────────────────
  if (!byCategory.has('cost_estimates')) {
    errors.push({
      evidenceCategory: 'cost_estimates',
      code: RE_ERROR_CODES.EVIDENCE_MISSING_REQUIRED,
      message: 'cost_estimates evidence is REQUIRED and absent.',
    })
  }

  // ── 3. sales_projections — REQUIRED, blocking ─────────────────────────────
  if (!byCategory.has('sales_projections')) {
    errors.push({
      evidenceCategory: 'sales_projections',
      code: RE_ERROR_CODES.EVIDENCE_MISSING_REQUIRED,
      message: 'sales_projections evidence is REQUIRED and absent.',
    })
  }

  // ── 4. land_terms — REQUIRED, blocking ────────────────────────────────────
  if (!byCategory.has('land_terms')) {
    errors.push({
      evidenceCategory: 'land_terms',
      code: RE_ERROR_CODES.EVIDENCE_MISSING_REQUIRED,
      message: 'land_terms evidence is REQUIRED and absent.',
    })
  }

  // ── 5. cash_flow_timing — CONDITIONAL (non-blocking advisory) ─────────────
  // Trigger: land_cost > 10,000,000 OR execution_period_years > 2.0
  const cashFlowTimingTriggered =
    params.land_cost > 10_000_000 || params.execution_period_years > 2.0
  if (cashFlowTimingTriggered && !byCategory.has('cash_flow_timing')) {
    warnings.push({
      evidenceCategory: 'cash_flow_timing',
      code: RE_ERROR_CODES.EVIDENCE_MISSING_ADVISORY,
      message: 'cash_flow_timing evidence absent while trigger condition is met (land_cost > 10M or execution > 2 years). Rule RE-EXE-002 will fire at Stage 7.',
    })
  }

  // ── 6. Evidence freshness check ───────────────────────────────────────────
  for (const item of evidence) {
    const halfLifeDays = RE_EVIDENCE_FRESHNESS_HALF_LIFE_DAYS[item.category as keyof typeof RE_EVIDENCE_FRESHNESS_HALF_LIFE_DAYS]
    if (halfLifeDays === undefined) continue
    const ageDays = evidenceAgeDays(item)
    if (ageDays > halfLifeDays) {
      warnings.push({
        evidenceCategory: item.category,
        code: RE_ERROR_CODES.EVIDENCE_FRESHNESS_WARNING,
        message: `${item.category} evidence is ${ageDays.toFixed(0)} days old (half-life: ${halfLifeDays} days). Stale evidence degrades the evidence_freshness dimension of confidence.`,
      })
    }
  }

  const hasBlockingErrors = errors.length > 0
  return {
    stage: 'stage-5-evidence',
    passed: !hasBlockingErrors,
    blocking: hasBlockingErrors,
    errors,
    warnings,
    durationMs: Date.now() - start,
  }
}
