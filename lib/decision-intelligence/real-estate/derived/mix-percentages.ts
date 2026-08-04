import type { RECallerParameters, REPlatformDerivedParameters } from '../types/parameters'

// Computes the four activity mix percentages from caller-supplied area inputs.
// Formula (from Section 3, Category B):
//   residential_mix_pct    = residential_area_sqm    / total_saleable_area_sqm
//   commercial_mix_pct     = commercial_area_sqm     / total_saleable_area_sqm
//   administrative_mix_pct = administrative_area_sqm / total_saleable_area_sqm
//   medical_mix_pct        = medical_area_sqm        / total_saleable_area_sqm
//
// Caller-supplied mix_pct values are IGNORED — the engine always recomputes from areas.
// Executed at Stage 6 after all prior stages have passed.
export function computeMixPercentages(
  params: Pick<RECallerParameters,
    | 'total_saleable_area_sqm'
    | 'residential_area_sqm'
    | 'commercial_area_sqm'
    | 'administrative_area_sqm'
    | 'medical_area_sqm'
  >,
): Pick<REPlatformDerivedParameters,
  | 'residential_mix_pct'
  | 'commercial_mix_pct'
  | 'administrative_mix_pct'
  | 'medical_mix_pct'
> {
  const total = params.total_saleable_area_sqm

  const residentialArea = params.residential_area_sqm ?? 0
  const commercialArea  = params.commercial_area_sqm  ?? 0
  const adminArea       = params.administrative_area_sqm ?? 0
  const medicalArea     = params.medical_area_sqm     ?? 0

  return {
    residential_mix_pct:    total > 0 ? residentialArea / total : 0,
    commercial_mix_pct:     total > 0 ? commercialArea  / total : 0,
    administrative_mix_pct: total > 0 ? adminArea       / total : 0,
    medical_mix_pct:        total > 0 ? medicalArea     / total : 0,
  }
}
