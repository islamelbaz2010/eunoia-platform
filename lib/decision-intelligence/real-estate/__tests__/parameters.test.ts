import { describe, it, expect } from 'vitest'
import { REParametersSchema } from '../schemas/parameters.schema'
import { computeMixPercentages } from '../derived/mix-percentages'
import { computeScenarioDivergenceRatio } from '../derived/scenario-divergence'
import { computeInflationExposureScore } from '../derived/inflation-exposure'
import { RE_REQUIRED_P1_PARAM_NAMES } from '../types/parameters'

// ---------------------------------------------------------------------------
// REParametersSchema — Zod schema contract tests
// ---------------------------------------------------------------------------

describe('REParametersSchema', () => {
  it('parses a minimal valid parameter set', () => {
    const result = REParametersSchema.safeParse({
      computed_npv: 1_000_000,
      computed_irr_annual: 0.25,
      computed_annual_roi: 0.15,
      computed_net_profit: 5_000_000,
      computed_peak_financing_gap: 2_000_000,
      computed_available_capital: 10_000_000,
      computed_break_even_quarter: 4,
      hurdle_rate: 0.20,
      total_project_cost: 20_000_000,
      total_revenue: 25_000_000,
      land_cost: 5_000_000,
      land_area_sqm: 1_000,
      build_ratio: 1.5,
      total_saleable_area_sqm: 1_200,
      residential_area_sqm: 1_200,
      construction_cost_total: 12_000_000,
      ops_engineering_consulting_pct: 0.015,
      ops_licensing_pct:              0.015,
      ops_supervision_pct:            0.020,
      ops_hq_cost_total: 500_000,
      marketing_cost_pct: 0.03,
      sales_commission_pct: 0.10,
      tax_rate: 0.225,
      inflation_rate_annual: 0.12,
      sales_period_years: 2.0,
      execution_period_years: 2.5,
      total_project_duration_years: 4.0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects computed_irr_annual > 10.0', () => {
    const result = REParametersSchema.safeParse({
      computed_npv: 1,
      computed_irr_annual: 11.0,
      computed_annual_roi: 0.1,
      computed_net_profit: 1,
      computed_peak_financing_gap: 0,
      computed_available_capital: 1,
      computed_break_even_quarter: 1,
      hurdle_rate: 0.20,
      total_project_cost: 1,
      total_revenue: 2,
      land_cost: 1,
      land_area_sqm: 100,
      build_ratio: 1.0,
      total_saleable_area_sqm: 100,
      residential_area_sqm: 100,
      construction_cost_total: 1,
      ops_engineering_consulting_pct: 0.01,
      ops_licensing_pct: 0.01,
      ops_supervision_pct: 0.01,
      ops_hq_cost_total: 1,
      marketing_cost_pct: 0.02,
      sales_commission_pct: 0.10,
      tax_rate: 0.225,
      inflation_rate_annual: 0.10,
      sales_period_years: 1.0,
      execution_period_years: 1.0,
      total_project_duration_years: 2.0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer computed_break_even_quarter', () => {
    const base = {
      computed_npv: 1, computed_irr_annual: 0.25, computed_annual_roi: 0.15, computed_net_profit: 1,
      computed_peak_financing_gap: 0, computed_available_capital: 1, computed_break_even_quarter: 3.7,
      hurdle_rate: 0.20, total_project_cost: 1, total_revenue: 2, land_cost: 1,
      land_area_sqm: 100, build_ratio: 1.0, total_saleable_area_sqm: 100, residential_area_sqm: 100,
      construction_cost_total: 1, ops_engineering_consulting_pct: 0.01, ops_licensing_pct: 0.01,
      ops_supervision_pct: 0.01, ops_hq_cost_total: 1, marketing_cost_pct: 0.02,
      sales_commission_pct: 0.10, tax_rate: 0.225, inflation_rate_annual: 0.10,
      sales_period_years: 1.0, execution_period_years: 1.0, total_project_duration_years: 2.0,
    }
    expect(REParametersSchema.safeParse(base).success).toBe(false)
  })

  it('defaults commercial_area_sqm to 0 when omitted', () => {
    const result = REParametersSchema.safeParse({
      computed_npv: 1, computed_irr_annual: 0.25, computed_annual_roi: 0.15, computed_net_profit: 1,
      computed_peak_financing_gap: 0, computed_available_capital: 1, computed_break_even_quarter: 1,
      hurdle_rate: 0.20, total_project_cost: 1, total_revenue: 2, land_cost: 1,
      land_area_sqm: 100, build_ratio: 1.0, total_saleable_area_sqm: 100, residential_area_sqm: 100,
      construction_cost_total: 1, ops_engineering_consulting_pct: 0.01, ops_licensing_pct: 0.01,
      ops_supervision_pct: 0.01, ops_hq_cost_total: 1, marketing_cost_pct: 0.02,
      sales_commission_pct: 0.10, tax_rate: 0.225, inflation_rate_annual: 0.10,
      sales_period_years: 1.0, execution_period_years: 1.0, total_project_duration_years: 2.0,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.commercial_area_sqm).toBe(0)
      expect(result.data.administrative_area_sqm).toBe(0)
      expect(result.data.medical_area_sqm).toBe(0)
    }
  })

  it('defaults land_is_installment_purchase to false', () => {
    const result = REParametersSchema.safeParse({
      computed_npv: 1, computed_irr_annual: 0.25, computed_annual_roi: 0.15, computed_net_profit: 1,
      computed_peak_financing_gap: 0, computed_available_capital: 1, computed_break_even_quarter: 1,
      hurdle_rate: 0.20, total_project_cost: 1, total_revenue: 2, land_cost: 1,
      land_area_sqm: 100, build_ratio: 1.0, total_saleable_area_sqm: 100, residential_area_sqm: 100,
      construction_cost_total: 1, ops_engineering_consulting_pct: 0.01, ops_licensing_pct: 0.01,
      ops_supervision_pct: 0.01, ops_hq_cost_total: 1, marketing_cost_pct: 0.02,
      sales_commission_pct: 0.10, tax_rate: 0.225, inflation_rate_annual: 0.10,
      sales_period_years: 1.0, execution_period_years: 1.0, total_project_duration_years: 2.0,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.land_is_installment_purchase).toBe(false)
    }
  })

  it('validates land_registration_status enum values', () => {
    const base = {
      computed_npv: 1, computed_irr_annual: 0.25, computed_annual_roi: 0.15, computed_net_profit: 1,
      computed_peak_financing_gap: 0, computed_available_capital: 1, computed_break_even_quarter: 1,
      hurdle_rate: 0.20, total_project_cost: 1, total_revenue: 2, land_cost: 1,
      land_area_sqm: 100, build_ratio: 1.0, total_saleable_area_sqm: 100, residential_area_sqm: 100,
      construction_cost_total: 1, ops_engineering_consulting_pct: 0.01, ops_licensing_pct: 0.01,
      ops_supervision_pct: 0.01, ops_hq_cost_total: 1, marketing_cost_pct: 0.02,
      sales_commission_pct: 0.10, tax_rate: 0.225, inflation_rate_annual: 0.10,
      sales_period_years: 1.0, execution_period_years: 1.0, total_project_duration_years: 2.0,
    }
    expect(REParametersSchema.safeParse({ ...base, land_registration_status: 'registered' }).success).toBe(true)
    expect(REParametersSchema.safeParse({ ...base, land_registration_status: 'in_progress' }).success).toBe(true)
    expect(REParametersSchema.safeParse({ ...base, land_registration_status: 'unregistered' }).success).toBe(true)
    expect(REParametersSchema.safeParse({ ...base, land_registration_status: 'unknown' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Required P1 parameter names
// ---------------------------------------------------------------------------

describe('RE_REQUIRED_P1_PARAM_NAMES', () => {
  it('contains exactly 27 required P1 parameters', () => {
    expect(RE_REQUIRED_P1_PARAM_NAMES).toHaveLength(27)
  })

  it('includes all CRITICAL financial gate parameters', () => {
    expect(RE_REQUIRED_P1_PARAM_NAMES).toContain('computed_npv')
    expect(RE_REQUIRED_P1_PARAM_NAMES).toContain('computed_irr_annual')
    expect(RE_REQUIRED_P1_PARAM_NAMES).toContain('computed_net_profit')
    expect(RE_REQUIRED_P1_PARAM_NAMES).toContain('computed_peak_financing_gap')
    expect(RE_REQUIRED_P1_PARAM_NAMES).toContain('computed_available_capital')
    expect(RE_REQUIRED_P1_PARAM_NAMES).toContain('hurdle_rate')
  })

  it('does not include platform-derived parameters', () => {
    expect(RE_REQUIRED_P1_PARAM_NAMES).not.toContain('residential_mix_pct')
    expect(RE_REQUIRED_P1_PARAM_NAMES).not.toContain('commercial_mix_pct')
    expect(RE_REQUIRED_P1_PARAM_NAMES).not.toContain('administrative_mix_pct')
    expect(RE_REQUIRED_P1_PARAM_NAMES).not.toContain('medical_mix_pct')
    expect(RE_REQUIRED_P1_PARAM_NAMES).not.toContain('scenario_divergence_ratio')
    expect(RE_REQUIRED_P1_PARAM_NAMES).not.toContain('inflation_exposure_score')
  })
})

// ---------------------------------------------------------------------------
// Platform derivation unit tests
// ---------------------------------------------------------------------------

describe('computeMixPercentages', () => {
  it('computes correct mix percentages from area inputs', () => {
    const result = computeMixPercentages({
      total_saleable_area_sqm: 10_000,
      residential_area_sqm:    6_000,
      commercial_area_sqm:     2_000,
      administrative_area_sqm: 1_000,
      medical_area_sqm:        1_000,
    })
    expect(result.residential_mix_pct).toBeCloseTo(0.6, 5)
    expect(result.commercial_mix_pct).toBeCloseTo(0.2, 5)
    expect(result.administrative_mix_pct).toBeCloseTo(0.1, 5)
    expect(result.medical_mix_pct).toBeCloseTo(0.1, 5)
  })

  it('handles zero total_saleable_area_sqm safely', () => {
    const result = computeMixPercentages({
      total_saleable_area_sqm: 0,
      residential_area_sqm:    0,
    })
    expect(result.residential_mix_pct).toBe(0)
    expect(result.commercial_mix_pct).toBe(0)
    expect(result.administrative_mix_pct).toBe(0)
    expect(result.medical_mix_pct).toBe(0)
  })

  it('produces mix percentages that sum to ~1.0', () => {
    const result = computeMixPercentages({
      total_saleable_area_sqm: 38_000,
      residential_area_sqm:   28_000,
      commercial_area_sqm:     5_000,
      administrative_area_sqm: 3_000,
      medical_area_sqm:        2_000,
    })
    const sum =
      result.residential_mix_pct +
      result.commercial_mix_pct +
      result.administrative_mix_pct +
      result.medical_mix_pct
    expect(sum).toBeCloseTo(1.0, 5)
  })
})

describe('computeScenarioDivergenceRatio', () => {
  it('computes correct ratio', () => {
    const ratio = computeScenarioDivergenceRatio({
      computed_npv:    10_000_000,
      pessimistic_npv: -5_000_000,
      optimistic_npv:  20_000_000,
    })
    // (20M - (-5M)) / |10M| = 25M / 10M = 2.5
    expect(ratio).toBeCloseTo(2.5, 5)
  })

  it('returns null when pessimistic_npv is absent', () => {
    const ratio = computeScenarioDivergenceRatio({
      computed_npv: 10_000_000,
      optimistic_npv: 20_000_000,
    })
    expect(ratio).toBeNull()
  })

  it('returns null when computed_npv is 0', () => {
    const ratio = computeScenarioDivergenceRatio({
      computed_npv: 0,
      pessimistic_npv: -1_000_000,
      optimistic_npv:   1_000_000,
    })
    expect(ratio).toBeNull()
  })
})

describe('computeInflationExposureScore', () => {
  it('computes 1.0 at 60% cumulative inflation', () => {
    // 15% × 4 years = 60% → score = 1.0
    expect(computeInflationExposureScore({
      inflation_rate_annual: 0.15,
      execution_period_years: 4.0,
    })).toBeCloseTo(1.0, 5)
  })

  it('caps at 1.0 for high inflation scenarios', () => {
    expect(computeInflationExposureScore({
      inflation_rate_annual: 0.40,
      execution_period_years: 5.0,
    })).toBe(1.0)
  })

  it('computes partial score for moderate inflation', () => {
    // 10% × 3 years = 30% / 60% = 0.5
    expect(computeInflationExposureScore({
      inflation_rate_annual: 0.10,
      execution_period_years: 3.0,
    })).toBeCloseTo(0.5, 5)
  })
})
