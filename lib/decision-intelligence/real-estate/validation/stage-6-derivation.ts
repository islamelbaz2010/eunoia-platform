import { RE_ERROR_CODES } from '../errors/error-codes'
import type { REPhase } from '../types/enums'
import type { RECallerParameters, REFullParameters } from '../types/parameters'
import { deriveAllParameters } from '../derived'
import type { REStageResult, REValidationWarning } from '../types/request'

// Stage 6 — Platform Derivation
// Computes platform-derived parameters from validated caller inputs:
//   1. residential_mix_pct, commercial_mix_pct, administrative_mix_pct, medical_mix_pct
//   2. scenario_divergence_ratio (P2+)
//   3. inflation_exposure_score (P3)
//
// Also verifies mix percentages sum to 1.0 (within 0.01).
// Populates derived values into the full parameter context for rule evaluation.
export function runStage6Derivation(
  params: RECallerParameters,
  phase: REPhase,
): { result: REStageResult; enriched: REFullParameters } {
  const start = Date.now()
  const warnings: REValidationWarning[] = []

  const enriched = deriveAllParameters(params, phase)

  // Verify mix percentages sum to 1.0 (within 0.01)
  const mixSum =
    enriched.residential_mix_pct +
    enriched.commercial_mix_pct +
    enriched.administrative_mix_pct +
    enriched.medical_mix_pct

  if (Math.abs(mixSum - 1.0) > 0.01) {
    warnings.push({
      parameter: 'total_saleable_area_sqm',
      code: RE_ERROR_CODES.DATA_CONSISTENCY_WARNING,
      message: `Mix percentages sum to ${mixSum.toFixed(4)} (expected 1.0 ± 0.01). Verify area inputs sum to total_saleable_area_sqm.`,
    })
  }

  return {
    result: {
      stage: 'stage-6-derivation',
      passed: true,
      blocking: false,
      errors: [],
      warnings,
      durationMs: Date.now() - start,
    },
    enriched,
  }
}
