import { describe, it, expect } from 'vitest'
import { runREValidationPipeline } from '../validation/pipeline'
import type { REFeasibilityRequest } from '../types/request'

// ---------------------------------------------------------------------------
// Canonical minimal valid P1 request (mirrors Section 6 JSON example)
// ---------------------------------------------------------------------------

const VALID_P1_REQUEST: REFeasibilityRequest = {
  contractVersion: '1.0.0',
  domain: 'real_estate',
  decisionType: 'feasibility',
  phase: 'P1',
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: '2026-08-03T10:00:00Z',
  context: {
    parameters: {
      computed_npv:                       12_500_000,
      computed_irr_annual:                0.26,
      computed_annual_roi:                0.18,
      computed_net_profit:                22_000_000,
      computed_peak_financing_gap:        35_000_000,
      computed_available_capital:         50_000_000,
      computed_break_even_quarter:        6,
      hurdle_rate:                        0.20,
      total_project_cost:                 95_000_000,
      total_revenue:                      117_000_000,
      land_cost:                          30_000_000,
      land_installment_interest_total:    0,
      land_area_sqm:                      40_000,
      build_ratio:                        1.2,
      total_saleable_area_sqm:            38_000,
      residential_area_sqm:              28_000,
      commercial_area_sqm:                5_000,
      administrative_area_sqm:            3_000,
      medical_area_sqm:                   2_000,
      land_is_installment_purchase:       false,
      construction_cost_total:            45_000_000,
      construction_cost_per_sqm_residential: 12_000,
      construction_cost_per_sqm_commercial:  15_000,
      construction_cost_per_sqm_administrative: 14_000,
      construction_cost_per_sqm_medical:     18_000,
      ops_engineering_consulting_pct:     0.015,
      ops_licensing_pct:                  0.015,
      ops_supervision_pct:                0.020,
      ops_hq_cost_total:                  5_000_000,
      marketing_cost_pct:                 0.03,
      sales_commission_pct:               0.12,
      tax_rate:                           0.225,
      price_per_sqm_residential:          25_000,
      price_per_sqm_commercial:           40_000,
      price_per_sqm_administrative:       35_000,
      price_per_sqm_medical:              45_000,
      sales_period_years:                 2.5,
      execution_period_years:             3.0,
      total_project_duration_years:       5.0,
      market_absorption_rate_years:       1.8,
      inflation_rate_annual:              0.15,
    },
    evidence: [
      {
        category: 'financial_projections',
        authority: 0.95,
        source: 'human_validation',
        timestamp: '2026-08-01T10:00:00Z',
        items: [{ key: 'certifying_party', value: 'Licensed Financial Consultant' }],
      },
      {
        category: 'cash_flow_timing',
        authority: 0.85,
        source: 'internal_data',
        timestamp: '2026-08-01T10:00:00Z',
        items: [{ key: 'model_type', value: 'Quarterly cash flow model — 20 quarters' }],
      },
      {
        category: 'cost_estimates',
        authority: 0.90,
        source: 'cost_estimate',
        timestamp: '2026-07-15T09:00:00Z',
      },
      {
        category: 'sales_projections',
        authority: 0.80,
        source: 'sales_research',
        timestamp: '2026-07-20T10:00:00Z',
      },
      {
        category: 'land_terms',
        authority: 0.95,
        source: 'legal_document',
        timestamp: '2026-06-01T00:00:00Z',
      },
      {
        category: 'activity_mix_financial',
        authority: 0.85,
        source: 'internal_data',
        timestamp: '2026-08-01T00:00:00Z',
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// Stage 0 — Contract Version
// ---------------------------------------------------------------------------

describe('Stage 0: Contract Version', () => {
  it('passes with contractVersion 1.0.0', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    const stage = result.stagesCompleted.find(s => s.stage === 'stage-0-version')!
    expect(stage.passed).toBe(true)
    expect(stage.errors).toHaveLength(0)
  })

  it('fails with unsupported major version', () => {
    const req = { ...VALID_P1_REQUEST, contractVersion: '2.0.0' }
    const result = runREValidationPipeline(req)
    expect(result.status).toBe('FAILED')
    expect(result.haltedAtStage).toBe('stage-0-version')
    expect(result.errors[0].code).toBe('CONTRACT_VERSION_ERROR')
  })

  it('accepts any 1.x.x patch version', () => {
    const req = { ...VALID_P1_REQUEST, contractVersion: '1.5.3' }
    const result = runREValidationPipeline(req)
    const stage = result.stagesCompleted.find(s => s.stage === 'stage-0-version')!
    expect(stage.passed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Stage 1 — Schema Validation
// ---------------------------------------------------------------------------

describe('Stage 1: Schema Validation', () => {
  it('passes with all required P1 parameters', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    const stage = result.stagesCompleted.find(s => s.stage === 'stage-1-schema')!
    expect(stage.passed).toBe(true)
  })

  it('fails when computed_npv is missing', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters }
    // @ts-expect-error intentional
    delete params.computed_npv
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    expect(result.status).toBe('FAILED')
    expect(result.errors.some(e => e.parameter === 'computed_npv')).toBe(true)
  })

  it('fails when hurdle_rate is out of range (> 0.50)', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, hurdle_rate: 0.99 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    expect(result.status).toBe('FAILED')
  })

  it('fails when computed_break_even_quarter is non-integer', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, computed_break_even_quarter: 6.5 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    expect(result.status).toBe('FAILED')
  })
})

// ---------------------------------------------------------------------------
// Stage 3 — Conditional Check
// ---------------------------------------------------------------------------

describe('Stage 3: Conditional Parameters', () => {
  it('requires land_installment_interest_total when land_is_installment_purchase=true', () => {
    const params = {
      ...VALID_P1_REQUEST.context.parameters,
      land_is_installment_purchase: true,
      land_installment_interest_total: undefined,
    }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    expect(result.status).toBe('FAILED')
    expect(result.errors.some(e => e.parameter === 'land_installment_interest_total')).toBe(true)
  })

  it('does not require financing_cost_pct at P1 even when debt_amount > 0', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, debt_amount: 10_000_000 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    // P1 phase — financing cost trigger only fires at P2+
    const stage3 = result.stagesCompleted.find(s => s.stage === 'stage-3-conditional')!
    const hasFinancingError = stage3.errors.some(e => e.parameter === 'financing_cost_pct')
    expect(hasFinancingError).toBe(false)
  })

  it('requires financing_cost_pct at P2 when debt_amount > 0', () => {
    const params = {
      ...VALID_P1_REQUEST.context.parameters,
      debt_amount: 10_000_000,
      financing_cost_pct: undefined,
    }
    const req = {
      ...VALID_P1_REQUEST,
      phase: 'P2' as const,
      context: { ...VALID_P1_REQUEST.context, parameters: params },
    }
    const result = runREValidationPipeline(req)
    expect(result.errors.some(e => e.parameter === 'financing_cost_pct')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Stage 5 — Evidence Completeness
// ---------------------------------------------------------------------------

describe('Stage 5: Evidence Completeness', () => {
  it('fails when financial_projections evidence is absent', () => {
    const evidence = VALID_P1_REQUEST.context.evidence.filter(e => e.category !== 'financial_projections')
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, evidence } }
    const result = runREValidationPipeline(req)
    expect(result.status).toBe('FAILED')
    expect(result.errors.some(e => e.code === 'EVIDENCE_MISSING_CRITICAL')).toBe(true)
  })

  it('fails when cost_estimates evidence is absent', () => {
    const evidence = VALID_P1_REQUEST.context.evidence.filter(e => e.category !== 'cost_estimates')
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, evidence } }
    const result = runREValidationPipeline(req)
    expect(result.errors.some(e => e.code === 'EVIDENCE_MISSING_REQUIRED')).toBe(true)
  })

  it('issues advisory (non-blocking) when cash_flow_timing absent for large project', () => {
    const evidence = VALID_P1_REQUEST.context.evidence.filter(e => e.category !== 'cash_flow_timing')
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, evidence } }
    const result = runREValidationPipeline(req)
    // Should not FAIL the pipeline (advisory only)
    expect(result.status).not.toBe('FAILED')
    expect(result.warnings.some(w => w.code === 'EVIDENCE_MISSING_ADVISORY')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Stage 6 — Platform Derivation
// ---------------------------------------------------------------------------

describe('Stage 6: Platform Derivation', () => {
  it('derives mix percentages correctly', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    const enriched = result.enrichedParameters!
    // 28000 / 38000 ≈ 0.7368
    expect(enriched.residential_mix_pct).toBeCloseTo(28_000 / 38_000, 4)
    expect(enriched.commercial_mix_pct).toBeCloseTo(5_000  / 38_000, 4)
    expect(enriched.administrative_mix_pct).toBeCloseTo(3_000 / 38_000, 4)
    expect(enriched.medical_mix_pct).toBeCloseTo(2_000  / 38_000, 4)
  })

  it('does not compute scenario_divergence_ratio at P1', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    expect(result.enrichedParameters!.scenario_divergence_ratio).toBeNull()
  })

  it('does not compute inflation_exposure_score at P1', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    expect(result.enrichedParameters!.inflation_exposure_score).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Stage 7 — Rule Evaluation
// ---------------------------------------------------------------------------

describe('Stage 7: Rule Evaluation', () => {
  it('fires RE-FIN-001 when computed_npv < 0', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, computed_npv: -1_000_000 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-FIN-001')!
    expect(rule.fired).toBe(true)
    expect(rule.blocking).toBe(true)
    expect(result.status).toBe('FAILED')
  })

  it('fires RE-FIN-002 when IRR < hurdle_rate', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, computed_irr_annual: 0.15, computed_npv: -500_000 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-FIN-002')!
    expect(rule.fired).toBe(true)
    expect(rule.blocking).toBe(true)
  })

  it('fires RE-FIN-003 when computed_net_profit <= 0', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, computed_net_profit: 0 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-FIN-003')!
    expect(rule.fired).toBe(true)
    expect(rule.blocking).toBe(true)
  })

  it('fires RE-FIN-004 when peak_gap > available_capital', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, computed_peak_financing_gap: 60_000_000 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-FIN-004')!
    expect(rule.fired).toBe(true)
    expect(rule.blocking).toBe(true)
  })

  it('fires RE-COM-001 advisory when sales_period_years > 3.5', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, sales_period_years: 4.0 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-COM-001')!
    expect(rule.fired).toBe(true)
    expect(rule.blocking).toBe(false)
  })

  it('fires RE-OPS-004 when aggregate overhead < 5% of construction cost', () => {
    const params = {
      ...VALID_P1_REQUEST.context.parameters,
      ops_engineering_consulting_pct: 0.005,
      ops_licensing_pct:              0.005,
      ops_supervision_pct:            0.005,
      ops_hq_cost_total:              500_000,
    }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-OPS-004')!
    expect(rule.fired).toBe(true)
    expect(rule.blocking).toBe(false)
  })

  it('skips RE-COM-004 at P1 (requires P2+)', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-COM-004')!
    expect(rule.skipped).toBe(true)
  })

  it('does not fire RE-COM-002 when market_absorption_rate_years is absent', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters }
    delete (params as Record<string, unknown>).market_absorption_rate_years
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-COM-002')!
    expect(rule.fired).toBe(false)
  })

  it('valid request produces all 23 rule results', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    expect(result.ruleResults).toHaveLength(23)
  })

  it('valid request with good parameters returns PASSED or PARTIAL (not FAILED)', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    expect(result.status).not.toBe('FAILED')
  })

  it('fires RE-LGL-001 advisory when land_registration_status is unregistered', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, land_registration_status: 'unregistered' }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-LGL-001')!
    expect(rule.fired).toBe(true)
    expect(rule.blocking).toBe(false)
  })

  it('does not fire RE-LGL-001 when land_registration_status is registered', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, land_registration_status: 'registered' }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-LGL-001')!
    expect(rule.fired).toBe(false)
  })

  it('does not fire RE-LGL-001 when land_registration_status is absent', () => {
    const result = runREValidationPipeline(VALID_P1_REQUEST)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-LGL-001')!
    expect(rule.fired).toBe(false)
  })

  it('fires RE-FIN-001 when computed_npv is exactly zero', () => {
    const params = { ...VALID_P1_REQUEST.context.parameters, computed_npv: 0 }
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    const rule = result.ruleResults.find(r => r.ruleId === 'RE-FIN-001')!
    expect(rule.fired).toBe(true)
    expect(rule.blocking).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Platform-derived parameter protection
// ---------------------------------------------------------------------------

describe('Platform-Derived Parameters', () => {
  it('ignores caller-supplied mix_pct values and recomputes from areas', () => {
    const params = {
      ...VALID_P1_REQUEST.context.parameters,
    }
    // Attempt to inject a platform-derived value — engine ignores it and recomputes from areas
    ;(params as Record<string, unknown>)['residential_mix_pct'] = 0.99
    const req = { ...VALID_P1_REQUEST, context: { ...VALID_P1_REQUEST.context, parameters: params } }
    const result = runREValidationPipeline(req)
    // Engine always recomputes from area inputs
    expect(result.enrichedParameters!.residential_mix_pct).toBeCloseTo(28_000 / 38_000, 4)
  })
})

// ---------------------------------------------------------------------------
// Scenario divergence ratio (P2)
// ---------------------------------------------------------------------------

describe('Scenario Divergence Ratio (P2)', () => {
  it('computes scenario_divergence_ratio at P2 when both scenario NPVs are present', () => {
    const params = {
      ...VALID_P1_REQUEST.context.parameters,
      pessimistic_npv: -5_000_000,
      optimistic_npv:  20_000_000,
    }
    const req = {
      ...VALID_P1_REQUEST,
      phase: 'P2' as const,
      context: { ...VALID_P1_REQUEST.context, parameters: params },
    }
    const result = runREValidationPipeline(req)
    const enriched = result.enrichedParameters!
    // (20M - (-5M)) / |12.5M| = 25M / 12.5M = 2.0
    expect(enriched.scenario_divergence_ratio).toBeCloseTo(2.0, 3)
  })
})
