import { RE_ERROR_CODES } from '../errors/error-codes'
import type { RECallerParameters } from '../types/parameters'
import type { REStageResult, REValidationWarning } from '../types/request'

// Stage 4 — Arithmetic Consistency Check
// Verifies internal consistency across parameters.
// All failures produce DATA_CONSISTENCY_WARNING (non-blocking).
// The engine proceeds but the consistency dimension of confidence is penalized.
export function runStage4Consistency(params: RECallerParameters): REStageResult {
  const start = Date.now()
  const warnings: REValidationWarning[] = []

  const residentialArea  = params.residential_area_sqm   ?? 0
  const commercialArea   = params.commercial_area_sqm    ?? 0
  const adminArea        = params.administrative_area_sqm ?? 0
  const medicalArea      = params.medical_area_sqm       ?? 0
  const totalSaleableArea = params.total_saleable_area_sqm
  const AREA_TOLERANCE = 0.01   // 1%
  const MIX_TOLERANCE  = 0.01
  const NP_TOLERANCE   = 0.05   // 5%
  const ROI_TOLERANCE  = 0.15   // 15pp absolute

  // ── Check 1: mix_pct sum (after derivation) ──────────────────────────────
  // Verify area sum now (mix sum verified after derivation in Stage 6)
  const areaSum = residentialArea + commercialArea + adminArea + medicalArea
  const areaRatio = totalSaleableArea > 0 ? Math.abs(areaSum - totalSaleableArea) / totalSaleableArea : 0
  if (areaRatio > AREA_TOLERANCE) {
    warnings.push({
      parameter: 'total_saleable_area_sqm',
      code: RE_ERROR_CODES.AREA_SUM_INCONSISTENCY,
      message: `Area sum (${areaSum}) does not match total_saleable_area_sqm (${totalSaleableArea}) within 1%. Discrepancy: ${(areaRatio * 100).toFixed(2)}%.`,
    })
  }

  // ── Check 2: total_saleable_area_sqm ≤ land_area_sqm × build_ratio ───────
  const maxSaleableArea = params.land_area_sqm * params.build_ratio
  if (totalSaleableArea > maxSaleableArea) {
    warnings.push({
      parameter: 'total_saleable_area_sqm',
      code: RE_ERROR_CODES.AREA_BUILD_RATIO_VIOLATION,
      message: `total_saleable_area_sqm (${totalSaleableArea}) exceeds land_area_sqm × build_ratio (${maxSaleableArea}). Verify GFA and efficiency ratio.`,
    })
  }

  // ── Check 3: NPV sign consistent with IRR vs hurdle_rate ─────────────────
  // (Also checked in Stage 2; this is the formal consistency gate)
  const npvPositive    = params.computed_npv > 0
  const irrAboveHurdle = params.computed_irr_annual > params.hurdle_rate
  if (npvPositive !== irrAboveHurdle) {
    warnings.push({
      parameter: 'computed_npv',
      code: RE_ERROR_CODES.DATA_CONSISTENCY_WARNING,
      message: `NPV sign (${params.computed_npv > 0 ? 'positive' : 'negative'}) is inconsistent with IRR (${params.computed_irr_annual}) vs hurdle_rate (${params.hurdle_rate}).`,
    })
  }

  // ── Check 4: computed_net_profit consistency with total_revenue − total_project_cost ──
  const expectedNetProfit = params.total_revenue - params.total_project_cost
  const netProfitDenom = Math.abs(expectedNetProfit)
  if (netProfitDenom > 0) {
    const netProfitRatio = Math.abs(params.computed_net_profit - expectedNetProfit) / netProfitDenom
    if (netProfitRatio > NP_TOLERANCE) {
      warnings.push({
        parameter: 'computed_net_profit',
        code: RE_ERROR_CODES.NPV_NET_PROFIT_INCONSISTENCY,
        message: `computed_net_profit (${params.computed_net_profit}) diverges from total_revenue − total_project_cost (${expectedNetProfit}) by ${(netProfitRatio * 100).toFixed(1)}% (threshold: 5%).`,
      })
    }
  }

  // ── Check 5: computed_annual_roi consistency ──────────────────────────────
  // expected_roi = computed_net_profit / total_project_cost / total_project_duration_years
  if (params.total_project_cost > 0 && params.total_project_duration_years > 0) {
    const expectedRoi = params.computed_net_profit / params.total_project_cost / params.total_project_duration_years
    const roiDiff = Math.abs(params.computed_annual_roi - expectedRoi)
    if (roiDiff > ROI_TOLERANCE) {
      warnings.push({
        parameter: 'computed_annual_roi',
        code: RE_ERROR_CODES.ROI_CONSISTENCY_WARNING,
        message: `computed_annual_roi (${params.computed_annual_roi}) diverges from net_profit/cost/duration (${expectedRoi.toFixed(4)}) by ${(roiDiff * 100).toFixed(1)}pp (threshold: 15pp).`,
      })
    }
  }

  // ── Check 6: Scenario NPV order: pessimistic ≤ computed_npv ≤ optimistic ─
  const pessNpv = params.pessimistic_npv
  const optNpv  = params.optimistic_npv
  if (pessNpv != null && optNpv != null) {
    if (pessNpv > params.computed_npv) {
      warnings.push({
        parameter: 'pessimistic_npv',
        code: RE_ERROR_CODES.SCENARIO_ORDER_VIOLATION,
        message: `pessimistic_npv (${pessNpv}) must be ≤ computed_npv (${params.computed_npv}).`,
      })
    }
    if (optNpv < params.computed_npv) {
      warnings.push({
        parameter: 'optimistic_npv',
        code: RE_ERROR_CODES.SCENARIO_ORDER_VIOLATION,
        message: `optimistic_npv (${optNpv}) must be ≥ computed_npv (${params.computed_npv}).`,
      })
    }
  }

  // ── Check 7: MIRR ≤ IRR ──────────────────────────────────────────────────
  // (Hard violation also in Stage 2; here produces consistency warning)
  const mirr = params.computed_mirr_annual
  if (mirr != null && mirr > params.computed_irr_annual) {
    warnings.push({
      parameter: 'computed_mirr_annual',
      code: RE_ERROR_CODES.MIRR_IRR_VIOLATION,
      message: `computed_mirr_annual (${mirr}) must be ≤ computed_irr_annual (${params.computed_irr_annual}) by definition.`,
    })
  }

  // ── Check 8: Profitability Index consistency: PI > 1 implies NPV > 0 ─────
  const pi = params.computed_profitability_index
  if (pi != null) {
    if (pi > 1.0 && params.computed_npv <= 0) {
      warnings.push({
        parameter: 'computed_profitability_index',
        code: RE_ERROR_CODES.DATA_CONSISTENCY_WARNING,
        message: `computed_profitability_index (${pi}) > 1.0 but computed_npv (${params.computed_npv}) is not positive.`,
      })
    }
    if (pi < 0 && params.computed_npv >= 0) {
      warnings.push({
        parameter: 'computed_profitability_index',
        code: RE_ERROR_CODES.DATA_CONSISTENCY_WARNING,
        message: `computed_profitability_index (${pi}) < 0 but computed_npv (${params.computed_npv}) is not negative.`,
      })
    }
  }

  // ── Check 9: equity_amount + debt_amount within 20% of total_project_cost ─
  const equity = params.equity_amount
  const debt   = params.debt_amount
  if (equity != null && debt != null) {
    const capitalSum = equity + debt
    const costDiff = Math.abs(capitalSum - params.total_project_cost)
    const tolerance20pct = params.total_project_cost * 0.20
    if (costDiff > tolerance20pct) {
      warnings.push({
        code: RE_ERROR_CODES.CAPITAL_STRUCTURE_INCONSISTENCY,
        message: `equity_amount + debt_amount (${capitalSum}) diverges from total_project_cost (${params.total_project_cost}) by ${(costDiff / params.total_project_cost * 100).toFixed(1)}% (threshold: 20%). Capital structure does not fully account for project financing requirement.`,
      })
    }
  }

  return {
    stage: 'stage-4-consistency',
    passed: warnings.length === 0,
    blocking: false,  // consistency failures are non-blocking
    errors: [],
    warnings,
    durationMs: Date.now() - start,
  }
}
