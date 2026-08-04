export { computeMixPercentages } from './mix-percentages'
export { computeScenarioDivergenceRatio } from './scenario-divergence'
export { computeInflationExposureScore } from './inflation-exposure'

import type { RECallerParameters, REFullParameters } from '../types/parameters'
import type { REPhase } from '../types/enums'
import { computeMixPercentages } from './mix-percentages'
import { computeScenarioDivergenceRatio } from './scenario-divergence'
import { computeInflationExposureScore } from './inflation-exposure'

// Stage 6 — derives all platform-computed parameters from validated caller inputs.
// Returns the full parameter context ready for rule evaluation.
export function deriveAllParameters(
  params: RECallerParameters,
  phase: REPhase,
): REFullParameters {
  const mix = computeMixPercentages(params)

  const scenarioDivergence = phase === 'P1'
    ? null
    : computeScenarioDivergenceRatio(params)

  const inflationExposure = phase === 'P3'
    ? computeInflationExposureScore(params)
    : null

  return {
    ...params,
    ...mix,
    scenario_divergence_ratio: scenarioDivergence,
    inflation_exposure_score:  inflationExposure,
  }
}
