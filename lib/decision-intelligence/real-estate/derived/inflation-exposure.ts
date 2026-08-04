import type { RECallerParameters } from '../types/parameters'

// Computes inflation_exposure_score (P3).
// Formula (Section 3, Category B):
//   inflation_exposure_score = min(1.0, inflation_rate_annual × execution_period_years / 0.60)
//
// At 60% cumulative inflation (e.g. 15% × 4 years) the score reaches 1.0 (maximum).
// Must not be manually supplied by the caller.
export function computeInflationExposureScore(
  params: Pick<RECallerParameters, 'inflation_rate_annual' | 'execution_period_years'>,
): number {
  return Math.min(1.0, (params.inflation_rate_annual * params.execution_period_years) / 0.60)
}
