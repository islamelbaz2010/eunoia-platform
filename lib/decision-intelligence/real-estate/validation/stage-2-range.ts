import { RE_ERROR_CODES } from '../errors/error-codes'
import type { RECallerParameters } from '../types/parameters'
import type { REStageResult, REValidationError, REValidationWarning } from '../types/request'

const EGYPT_HURDLE_RATE_DEFAULT = 0.20
const EGYPT_TAX_RATE_DEFAULT    = 0.225
const NPV_EXTREME_LOW           = -1_000_000_000_000
const IRR_QUALITY_WARNING       = 5.0
const CONSTRUCTION_COST_WARNING = 0   // covered by positive() in schema

// Stage 2 — Range Validation
// Validates parameter values against their defined ranges.
// Produces DATA_QUALITY_WARNING and advisory notices (non-blocking).
// All blocking range errors are already caught by the Zod schema in Stage 1.
export function runStage2Range(params: RECallerParameters): REStageResult {
  const start = Date.now()
  const errors: REValidationError[] = []
  const warnings: REValidationWarning[] = []

  // 1. computed_npv extreme low warning
  if (params.computed_npv < NPV_EXTREME_LOW) {
    warnings.push({
      parameter: 'computed_npv',
      code: RE_ERROR_CODES.DATA_QUALITY_WARNING,
      message: `computed_npv (${params.computed_npv}) is below −1,000,000,000,000. Verify the financial model.`,
    })
  }

  // 2. computed_irr_annual > 5.0 data quality warning
  if (params.computed_irr_annual > 5.0) {
    warnings.push({
      parameter: 'computed_irr_annual',
      code: RE_ERROR_CODES.DATA_QUALITY_WARNING,
      message: `computed_irr_annual (${params.computed_irr_annual}) exceeds 5.0 (500%). Verify IRR computation method.`,
    })
  }

  // 3. NPV/IRR sign consistency: positive NPV at hurdle rate implies IRR > hurdle_rate
  const npvPositive = params.computed_npv > 0
  const irrAboveHurdle = params.computed_irr_annual > params.hurdle_rate
  if (npvPositive !== irrAboveHurdle) {
    warnings.push({
      parameter: 'computed_irr_annual',
      code: RE_ERROR_CODES.IRR_SIGN_INCONSISTENCY,
      message: `IRR sign inconsistency: NPV is ${npvPositive ? 'positive' : 'negative'} but IRR ${params.computed_irr_annual} is ${irrAboveHurdle ? 'above' : 'below'} hurdle_rate ${params.hurdle_rate}. Verify cash flow model.`,
    })
  }

  // 4. hurdle_rate deviates from Egypt convention (0.20)
  if (Math.abs(params.hurdle_rate - EGYPT_HURDLE_RATE_DEFAULT) > 0.0001) {
    warnings.push({
      parameter: 'hurdle_rate',
      code: RE_ERROR_CODES.HURDLE_RATE_DEVIATION,
      message: `hurdle_rate (${params.hurdle_rate}) deviates from Egypt real estate convention (${EGYPT_HURDLE_RATE_DEFAULT}). Provide documented deviation justification.`,
    })
  }

  // 5. tax_rate deviates from Egypt corporate tax (0.225)
  if (Math.abs(params.tax_rate - EGYPT_TAX_RATE_DEFAULT) > 0.0001) {
    warnings.push({
      parameter: 'tax_rate',
      code: RE_ERROR_CODES.TAX_RATE_DEVIATION,
      message: `tax_rate (${params.tax_rate}) deviates from Egypt corporate tax rate (${EGYPT_TAX_RATE_DEFAULT}). Provide documented tax exemption or deviation justification.`,
    })
  }

  // 6. computed_break_even_quarter: must be ≤ total_project_duration_years × 4
  const maxBreakEven = Math.round(params.total_project_duration_years * 4)
  if (params.computed_break_even_quarter > maxBreakEven) {
    errors.push({
      parameter: 'computed_break_even_quarter',
      code: RE_ERROR_CODES.PARAMETER_OUT_OF_RANGE,
      message: `computed_break_even_quarter (${params.computed_break_even_quarter}) exceeds total_project_duration_years × 4 (${maxBreakEven}). Break-even cannot occur after project end.`,
    })
  }

  // 7. computed_break_even_quarter ≤ 2 unusual — possible down-payment mismodel warning
  if (params.computed_break_even_quarter <= 2) {
    warnings.push({
      parameter: 'computed_break_even_quarter',
      code: RE_ERROR_CODES.DATA_QUALITY_WARNING,
      message: `computed_break_even_quarter (${params.computed_break_even_quarter}) is ≤ 2. Verify down payments are not mismodeled as Day 1 revenue.`,
    })
  }

  // 8. computed_peak_financing_gap = 0 unusual
  if (params.computed_peak_financing_gap === 0) {
    warnings.push({
      parameter: 'computed_peak_financing_gap',
      code: RE_ERROR_CODES.DATA_QUALITY_WARNING,
      message: 'computed_peak_financing_gap is 0. A zero peak gap is unusual — verify the cash flow model self-funds from inception.',
    })
  }

  // 9. XIRR vs IRR divergence (when present)
  const xirr = params.computed_xirr_annual
  if (xirr != null) {
    const divergence = Math.abs(xirr - params.computed_irr_annual)
    if (divergence > 0.05) {
      warnings.push({
        parameter: 'computed_xirr_annual',
        code: RE_ERROR_CODES.DATA_QUALITY_WARNING,
        message: `XIRR (${xirr}) diverges from IRR (${params.computed_irr_annual}) by ${(divergence * 100).toFixed(1)}pp (threshold: 5pp). Flag for analyst review.`,
      })
    }
  }

  // 10. MIRR ≤ IRR (when both present)
  const mirr = params.computed_mirr_annual
  if (mirr != null && mirr > params.computed_irr_annual) {
    errors.push({
      parameter: 'computed_mirr_annual',
      code: RE_ERROR_CODES.PARAMETER_OUT_OF_RANGE,
      message: `computed_mirr_annual (${mirr}) must be ≤ computed_irr_annual (${params.computed_irr_annual}) by definition.`,
    })
  }

  // 11. computed_np_ratio > 0.6 triggers cost inclusion check
  const npRatio = params.computed_np_ratio
  if (npRatio != null && npRatio > 0.6) {
    warnings.push({
      parameter: 'computed_np_ratio',
      code: RE_ERROR_CODES.DATA_QUALITY_WARNING,
      message: `computed_np_ratio (${npRatio}) exceeds 0.6. Verify all cost categories (tax, marketing, commission) are included in the financial model.`,
    })
  }

  // 12. ROE vs ROI: if debt_amount = 0 then ROE must equal ROI
  const roe = params.computed_annual_roe
  const debtAmount = params.debt_amount ?? 0
  if (roe != null && debtAmount === 0) {
    const roeDiff = Math.abs(roe - params.computed_annual_roi)
    if (roeDiff > 0.01) {
      warnings.push({
        parameter: 'computed_annual_roe',
        code: RE_ERROR_CODES.DATA_QUALITY_WARNING,
        message: `When debt_amount = 0, computed_annual_roe (${roe}) must equal computed_annual_roi (${params.computed_annual_roi}). Discrepancy: ${(roeDiff * 100).toFixed(2)}pp.`,
      })
    }
  }

  // 13. sales_commission_pct < 0.05 unusual — check external broker commissions
  if (params.sales_commission_pct < 0.05) {
    warnings.push({
      parameter: 'sales_commission_pct',
      code: RE_ERROR_CODES.DATA_QUALITY_WARNING,
      message: `sales_commission_pct (${params.sales_commission_pct}) is below 0.05. Verify that external broker commissions are included.`,
    })
  }

  const passed = errors.length === 0
  return {
    stage: 'stage-2-range',
    passed,
    blocking: false, // Range stage produces warnings; hard range errors are schema-caught in Stage 1
    errors,
    warnings,
    durationMs: Date.now() - start,
  }
}
