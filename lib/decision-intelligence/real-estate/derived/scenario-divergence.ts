import type { RECallerParameters } from '../types/parameters'

// Computes scenario_divergence_ratio (P2) when both scenario NPV values are present.
// Formula (Section 3, Category B):
//   scenario_divergence_ratio = (optimistic_npv − pessimistic_npv) / |computed_npv|
//
// Returns null when either scenario NPV is absent or computed_npv is 0.
// Must not be manually supplied by the caller.
export function computeScenarioDivergenceRatio(
  params: Pick<RECallerParameters, 'computed_npv' | 'pessimistic_npv' | 'optimistic_npv'>,
): number | null {
  const { computed_npv, pessimistic_npv, optimistic_npv } = params

  if (pessimistic_npv == null || optimistic_npv == null) return null
  if (computed_npv === 0) return null

  return (optimistic_npv - pessimistic_npv) / Math.abs(computed_npv)
}
