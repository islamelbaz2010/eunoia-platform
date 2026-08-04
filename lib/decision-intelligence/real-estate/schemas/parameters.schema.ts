import { z } from 'zod'

// Zod schema for all caller-supplied RE parameters.
// Platform-derived parameters (mix_pct × 4, scenario_divergence_ratio,
// inflation_exposure_score) are NOT in this schema — the engine computes them.
//
// This schema validates TYPE and RANGE correctness.
// Phase-specific PRESENCE requirements are enforced by Stage 1 and Stage 3.

export const REParametersSchema = z.object({

  // ── Group 1 — Return Metrics ─────────────────────────────────────────────
  computed_npv: z.number().finite(),
  computed_irr_annual: z.number().min(-1.0).max(10.0),
  computed_annual_roi: z.number().min(-1.0).max(10.0),
  computed_net_profit: z.number().finite(),
  computed_xirr_annual: z.number().min(-1.0).max(10.0).nullable().optional(),
  computed_mirr_annual: z.number().min(-1.0).max(5.0).nullable().optional(),
  computed_annual_roe: z.number().min(-2.0).max(20.0).nullable().optional(),
  computed_np_ratio: z.number().min(-1.0).max(1.0).nullable().optional(),
  computed_profitability_index: z.number().min(-10.0).max(100.0).nullable().optional(),

  // ── Group 2 — Cash Flow and Capital Metrics ───────────────────────────────
  computed_peak_financing_gap: z.number().min(0).finite(),
  computed_available_capital: z.number().positive().finite(),
  computed_break_even_quarter: z.number().int().min(1).max(40),
  computed_dpp_years: z.number().min(0).max(15.0).nullable().optional(),

  // ── Group 3 — Capital Structure ───────────────────────────────────────────
  hurdle_rate: z.number().min(0.05).max(0.50),
  equity_amount: z.number().positive().nullable().optional(),
  debt_amount: z.number().min(0).nullable().optional(),
  financing_cost_pct: z.number().min(0.01).max(0.40).nullable().optional(),

  // ── Group 4 — Project Composition ─────────────────────────────────────────
  land_area_sqm: z.number().min(100).max(10_000_000),
  build_ratio: z.number().min(0.1).max(10.0),
  total_saleable_area_sqm: z.number().min(100).max(5_000_000),
  residential_area_sqm: z.number().min(0),
  commercial_area_sqm: z.number().min(0).optional().default(0),
  administrative_area_sqm: z.number().min(0).optional().default(0),
  medical_area_sqm: z.number().min(0).optional().default(0),
  // mix_pct × 4: PLATFORM-DERIVED — not present in caller schema

  // ── Group 5 — Cost Structure ──────────────────────────────────────────────
  total_project_cost: z.number().positive().finite(),
  land_cost: z.number().positive().finite(),
  land_is_installment_purchase: z.boolean().optional().default(false),
  land_installment_interest_total: z.number().min(0).optional(),
  construction_cost_total: z.number().positive().finite(),
  construction_cost_per_sqm_residential: z.number().min(2_000).max(50_000).optional(),
  construction_cost_per_sqm_commercial: z.number().min(3_000).max(60_000).optional(),
  construction_cost_per_sqm_administrative: z.number().min(3_000).max(60_000).optional(),
  construction_cost_per_sqm_medical: z.number().min(5_000).max(80_000).optional(),
  ops_engineering_consulting_pct: z.number().min(0.005).max(0.05),
  ops_licensing_pct: z.number().min(0.005).max(0.05),
  ops_supervision_pct: z.number().min(0.005).max(0.05),
  ops_hq_cost_total: z.number().positive().finite(),
  marketing_cost_pct: z.number().min(0.01).max(0.15),
  sales_commission_pct: z.number().min(0.01).max(0.20),
  tax_rate: z.number().min(0).max(0.50),
  maintenance_deposit_pct: z.number().min(0.02).max(0.07).nullable().optional(),
  inflation_rate_annual: z.number().min(0).max(0.50),

  // ── Group 6 — Revenue Structure ───────────────────────────────────────────
  total_revenue: z.number().positive().finite(),
  price_per_sqm_residential: z.number().min(5_000).max(200_000).optional(),
  price_per_sqm_commercial: z.number().min(8_000).max(300_000).optional(),
  price_per_sqm_administrative: z.number().min(8_000).max(250_000).optional(),
  price_per_sqm_medical: z.number().min(10_000).max(350_000).optional(),
  down_payment_pct: z.number().min(0.05).max(0.50).nullable().optional(),
  installment_collection_period_quarters: z.number().int().min(1).max(40).nullable().optional(),

  // ── Group 7 — Timeline ────────────────────────────────────────────────────
  sales_period_years: z.number().min(0.5).max(7.0),
  execution_period_years: z.number().min(0.5).max(10.0),
  total_project_duration_years: z.number().min(1.0).max(15.0),

  // ── Group 8 — Market Benchmarks ───────────────────────────────────────────
  market_absorption_rate_years: z.number().min(0.5).max(5.0).nullable().optional(),
  market_price_benchmark_residential_per_sqm: z.number().min(5_000).max(200_000).nullable().optional(),
  district_irr_benchmark: z.number().min(0.10).max(0.60).nullable().optional(),
  fi_benchmark_reference: z.number().positive().nullable().optional(),

  // ── Group 9 — Risk/Scenario (caller-supplied only) ────────────────────────
  pessimistic_npv: z.number().finite().nullable().optional(),
  optimistic_npv: z.number().finite().nullable().optional(),
  // scenario_divergence_ratio: PLATFORM-DERIVED — not in caller schema
  // inflation_exposure_score: PLATFORM-DERIVED — not in caller schema

  // ── Group 10 — Sales Velocity ─────────────────────────────────────────────
  sales_velocity_pct_year1: z.number().min(0).max(1.0).nullable().optional(),
  sales_velocity_pct_year2: z.number().min(0).max(1.0).nullable().optional(),
  sales_velocity_pct_year3: z.number().min(0).max(1.0).nullable().optional(),

  // ── Group 11 — Regulatory Compliance ─────────────────────────────────────
  permits_confirmed: z.boolean().optional().default(false),
  zoning_compliant: z.boolean().optional().default(false),
  land_registration_status: z.enum(['registered', 'in_progress', 'unregistered']).nullable().optional(),
})

export type REParametersInput = z.input<typeof REParametersSchema>
export type REParametersParsed = z.output<typeof REParametersSchema>
