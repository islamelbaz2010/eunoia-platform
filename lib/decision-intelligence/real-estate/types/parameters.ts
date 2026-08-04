import type { RELandRegistrationStatus } from './enums'

// ---------------------------------------------------------------------------
// Caller-supplied parameters (what the API caller sends in context.parameters)
// Platform-derived parameters (mix_pct × 4, scenario_divergence_ratio,
// inflation_exposure_score) are NOT included here — they are computed by
// the engine in Stage 6 and added to the context before rule evaluation.
// ---------------------------------------------------------------------------

// Group 1 — Return Metrics (externally computed by financial model, supplied by caller)
export interface REReturnMetricsParameters {
  computed_npv: number                           // REQUIRED P1 — true NPV net of investment
  computed_irr_annual: number                    // REQUIRED P1 — decimal rate e.g. 0.26
  computed_annual_roi: number                    // REQUIRED P1 — decimal rate per year
  computed_net_profit: number                    // REQUIRED P1 — EGP
  computed_xirr_annual?: number | null           // OPTIONAL P2
  computed_mirr_annual?: number | null           // OPTIONAL P3
  computed_annual_roe?: number | null            // OPTIONAL P2
  computed_np_ratio?: number | null              // OPTIONAL P2
  computed_profitability_index?: number | null   // OPTIONAL P3
}

// Group 2 — Cash Flow and Capital Metrics
export interface RECashFlowParameters {
  computed_peak_financing_gap: number            // REQUIRED P1 — EGP, non-negative
  computed_available_capital: number             // REQUIRED P1 — EGP, > 0
  computed_break_even_quarter: number            // REQUIRED P1 — integer 1–40
  computed_dpp_years?: number | null             // OPTIONAL P2
}

// Group 3 — Capital Structure
export interface RECapitalStructureParameters {
  hurdle_rate: number                            // REQUIRED P1 — default 0.20
  equity_amount?: number | null                  // OPTIONAL P2
  debt_amount?: number | null                    // OPTIONAL P2 — default 0
  financing_cost_pct?: number | null             // CONDITIONAL P2 — required when debt_amount > 0
}

// Group 4 — Project Composition (raw area inputs; mix_pct derived by engine)
export interface REProjectCompositionParameters {
  land_area_sqm: number                          // REQUIRED P1
  build_ratio: number                            // REQUIRED P1
  total_saleable_area_sqm: number                // REQUIRED P1
  residential_area_sqm: number                   // REQUIRED P1
  commercial_area_sqm?: number                   // CONDITIONAL P1 — default 0
  administrative_area_sqm?: number               // CONDITIONAL P1 — default 0
  medical_area_sqm?: number                      // CONDITIONAL P1 — default 0
}

// Group 5 — Cost Structure
export interface RECostStructureParameters {
  total_project_cost: number                     // REQUIRED P1
  land_cost: number                              // REQUIRED P1
  land_is_installment_purchase?: boolean         // CONDITIONAL P1 — default false
  land_installment_interest_total?: number       // CONDITIONAL P1 — required when land_is_installment_purchase=true
  construction_cost_total: number                // REQUIRED P1
  construction_cost_per_sqm_residential?: number // CONDITIONAL P1 — required when residential_area_sqm > 0
  construction_cost_per_sqm_commercial?: number  // CONDITIONAL P1 — when commercial_area_sqm > 0
  construction_cost_per_sqm_administrative?: number // CONDITIONAL P1 — when administrative_area_sqm > 0
  construction_cost_per_sqm_medical?: number     // CONDITIONAL P1 — when medical_area_sqm > 0
  ops_engineering_consulting_pct: number         // REQUIRED P1 — decimal ratio of construction cost
  ops_licensing_pct: number                      // REQUIRED P1
  ops_supervision_pct: number                    // REQUIRED P1
  ops_hq_cost_total: number                      // REQUIRED P1 — EGP
  marketing_cost_pct: number                     // REQUIRED P1 — decimal ratio of revenue
  sales_commission_pct: number                   // REQUIRED P1 — decimal ratio of revenue
  tax_rate: number                               // REQUIRED P1 — default 0.225
  maintenance_deposit_pct?: number | null        // CONDITIONAL P2 — when land_cost > 10,000,000
  inflation_rate_annual: number                  // REQUIRED P1 — construction cost inflation
}

// Group 6 — Revenue Structure
export interface RERevenueStructureParameters {
  total_revenue: number                          // REQUIRED P1
  price_per_sqm_residential?: number             // CONDITIONAL P1 — when residential_area_sqm > 0
  price_per_sqm_commercial?: number              // CONDITIONAL P1 — when commercial_area_sqm > 0
  price_per_sqm_administrative?: number          // CONDITIONAL P1 — when administrative_area_sqm > 0
  price_per_sqm_medical?: number                 // CONDITIONAL P1 — when medical_area_sqm > 0
  down_payment_pct?: number | null               // CONDITIONAL P2
  installment_collection_period_quarters?: number | null // CONDITIONAL P2 — integer
}

// Group 7 — Timeline
export interface RETimelineParameters {
  sales_period_years: number                     // REQUIRED P1
  execution_period_years: number                 // REQUIRED P1
  total_project_duration_years: number           // REQUIRED P1
}

// Group 8 — Market Benchmarks
export interface REMarketBenchmarkParameters {
  market_absorption_rate_years?: number | null   // CONDITIONAL P1
  market_price_benchmark_residential_per_sqm?: number | null // OPTIONAL P2
  district_irr_benchmark?: number | null         // OPTIONAL P3
  fi_benchmark_reference?: number | null         // OPTIONAL P1 — documentation only, no gate
}

// Group 9 — Risk and Scenario (caller-supplied only; derived params added post-Stage 6)
export interface REScenarioParameters {
  pessimistic_npv?: number | null                // CONDITIONAL P2
  optimistic_npv?: number | null                 // CONDITIONAL P2
}

// Group 10 — Sales Velocity
export interface RESalesVelocityParameters {
  sales_velocity_pct_year1?: number | null       // OPTIONAL P1
  sales_velocity_pct_year2?: number | null       // OPTIONAL P1
  sales_velocity_pct_year3?: number | null       // OPTIONAL P1
}

// Group 11 — Regulatory Compliance
export interface RERegulatoryParameters {
  permits_confirmed?: boolean                    // OPTIONAL — default false
  zoning_compliant?: boolean                     // OPTIONAL — default false
  land_registration_status?: RELandRegistrationStatus | null // OPTIONAL
}

// ---------------------------------------------------------------------------
// Combined caller-supplied parameter type
// ---------------------------------------------------------------------------

export type RECallerParameters =
  REReturnMetricsParameters &
  RECashFlowParameters &
  RECapitalStructureParameters &
  REProjectCompositionParameters &
  RECostStructureParameters &
  RERevenueStructureParameters &
  RETimelineParameters &
  REMarketBenchmarkParameters &
  REScenarioParameters &
  RESalesVelocityParameters &
  RERegulatoryParameters

// ---------------------------------------------------------------------------
// Platform-derived parameters (computed by engine in Stage 6)
// These are injected into the full context before rule evaluation.
// Callers must NOT supply these.
// ---------------------------------------------------------------------------

export interface REPlatformDerivedParameters {
  residential_mix_pct: number      // residential_area_sqm / total_saleable_area_sqm
  commercial_mix_pct: number       // commercial_area_sqm / total_saleable_area_sqm
  administrative_mix_pct: number   // administrative_area_sqm / total_saleable_area_sqm
  medical_mix_pct: number          // medical_area_sqm / total_saleable_area_sqm
  scenario_divergence_ratio: number | null  // (optimistic_npv − pessimistic_npv) / |computed_npv| — P2
  inflation_exposure_score: number | null   // min(1.0, inflation_rate × execution / 0.60) — P3
}

// ---------------------------------------------------------------------------
// Full parameter context after Stage 6 derivation (used by rule engine)
// ---------------------------------------------------------------------------

export type REFullParameters = RECallerParameters & REPlatformDerivedParameters

// ---------------------------------------------------------------------------
// Required P1 parameters (minimum viable decision)
// Must all be present for a valid P1 request.
// ---------------------------------------------------------------------------

export type RERequiredP1Parameters = Pick<RECallerParameters,
  | 'computed_npv'
  | 'computed_irr_annual'
  | 'computed_annual_roi'
  | 'computed_net_profit'
  | 'computed_peak_financing_gap'
  | 'computed_available_capital'
  | 'computed_break_even_quarter'
  | 'hurdle_rate'
  | 'total_project_cost'
  | 'total_revenue'
  | 'land_cost'
  | 'land_area_sqm'
  | 'build_ratio'
  | 'total_saleable_area_sqm'
  | 'residential_area_sqm'
  | 'construction_cost_total'
  | 'ops_engineering_consulting_pct'
  | 'ops_licensing_pct'
  | 'ops_supervision_pct'
  | 'ops_hq_cost_total'
  | 'marketing_cost_pct'
  | 'sales_commission_pct'
  | 'tax_rate'
  | 'inflation_rate_annual'
  | 'sales_period_years'
  | 'execution_period_years'
  | 'total_project_duration_years'
>

export const RE_REQUIRED_P1_PARAM_NAMES: ReadonlyArray<keyof RERequiredP1Parameters> = [
  'computed_npv',
  'computed_irr_annual',
  'computed_annual_roi',
  'computed_net_profit',
  'computed_peak_financing_gap',
  'computed_available_capital',
  'computed_break_even_quarter',
  'hurdle_rate',
  'total_project_cost',
  'total_revenue',
  'land_cost',
  'land_area_sqm',
  'build_ratio',
  'total_saleable_area_sqm',
  'residential_area_sqm',
  'construction_cost_total',
  'ops_engineering_consulting_pct',
  'ops_licensing_pct',
  'ops_supervision_pct',
  'ops_hq_cost_total',
  'marketing_cost_pct',
  'sales_commission_pct',
  'tax_rate',
  'inflation_rate_annual',
  'sales_period_years',
  'execution_period_years',
  'total_project_duration_years',
]
