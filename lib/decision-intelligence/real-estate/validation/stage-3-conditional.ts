import { RE_ERROR_CODES } from '../errors/error-codes'
import type { REPhase } from '../types/enums'
import type { RECallerParameters } from '../types/parameters'
import type { REEvidence } from '../types/evidence'
import type { REStageResult, REValidationError, REValidationWarning } from '../types/request'

// Stage 3 — Conditional Parameter Check
// Evaluates trigger conditions and confirms required conditional parameters are present.
// Triggers (from Section 5, Stage 3):
//   1. Activity mix trigger
//   2. Land installment trigger
//   3. Financing cost trigger (P2+)
//   4. Capital gate trigger
//   5. Maintenance deposit trigger
//   6. Cash flow timing trigger
export function runStage3Conditional(
  params: RECallerParameters,
  evidence: REEvidence[],
  phase: REPhase,
): REStageResult {
  const start = Date.now()
  const errors: REValidationError[] = []
  const warnings: REValidationWarning[] = []

  const totalSaleableArea = params.total_saleable_area_sqm
  const evidenceCategories = new Set(evidence.map(e => e.category))

  // ── Trigger 1: Activity mix ──────────────────────────────────────────────
  // If any non-residential type exceeds 10% of total_saleable_area_sqm:
  //   Require price_per_sqm_[type] + construction_cost_per_sqm_[type] + activity_mix_financial evidence
  const commercialArea  = params.commercial_area_sqm  ?? 0
  const adminArea       = params.administrative_area_sqm ?? 0
  const medicalArea     = params.medical_area_sqm     ?? 0
  const threshold = totalSaleableArea * 0.10
  let activityMixTriggered = false

  if (commercialArea > threshold) {
    activityMixTriggered = true
    if (!params.price_per_sqm_commercial) {
      errors.push({ parameter: 'price_per_sqm_commercial', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'price_per_sqm_commercial required: commercial_area_sqm exceeds 10% of total_saleable_area_sqm.' })
    }
    if (!params.construction_cost_per_sqm_commercial) {
      errors.push({ parameter: 'construction_cost_per_sqm_commercial', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'construction_cost_per_sqm_commercial required: commercial_area_sqm exceeds 10% of total_saleable_area_sqm.' })
    }
  }

  if (adminArea > threshold) {
    activityMixTriggered = true
    if (!params.price_per_sqm_administrative) {
      errors.push({ parameter: 'price_per_sqm_administrative', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'price_per_sqm_administrative required: administrative_area_sqm exceeds 10% of total_saleable_area_sqm.' })
    }
    if (!params.construction_cost_per_sqm_administrative) {
      errors.push({ parameter: 'construction_cost_per_sqm_administrative', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'construction_cost_per_sqm_administrative required: administrative_area_sqm exceeds 10% of total_saleable_area_sqm.' })
    }
  }

  if (medicalArea > threshold) {
    activityMixTriggered = true
    if (!params.price_per_sqm_medical) {
      errors.push({ parameter: 'price_per_sqm_medical', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'price_per_sqm_medical required: medical_area_sqm exceeds 10% of total_saleable_area_sqm.' })
    }
    if (!params.construction_cost_per_sqm_medical) {
      errors.push({ parameter: 'construction_cost_per_sqm_medical', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'construction_cost_per_sqm_medical required: medical_area_sqm exceeds 10% of total_saleable_area_sqm.' })
    }
  }

  if (activityMixTriggered && !evidenceCategories.has('activity_mix_financial')) {
    errors.push({ evidenceCategory: 'activity_mix_financial', code: RE_ERROR_CODES.CONDITIONAL_EVIDENCE_MISSING,
      message: 'activity_mix_financial evidence required: at least one non-residential activity type exceeds 10% of total_saleable_area_sqm.' })
  }

  // ── Trigger 2: Land installment ──────────────────────────────────────────
  // if land_is_installment_purchase = true → require land_installment_interest_total
  const isInstallmentPurchase = params.land_is_installment_purchase ?? false
  if (isInstallmentPurchase) {
    if (params.land_installment_interest_total == null) {
      errors.push({ parameter: 'land_installment_interest_total', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'land_installment_interest_total required when land_is_installment_purchase = true.' })
    }
  } else {
    // When not an installment purchase, interest total must be 0 or absent
    const interest = params.land_installment_interest_total
    if (interest != null && interest !== 0) {
      errors.push({ parameter: 'land_installment_interest_total', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'land_installment_interest_total must be 0 or absent when land_is_installment_purchase = false.' })
    }
  }

  // ── Trigger 3: Financing cost (P2+) ──────────────────────────────────────
  // if debt_amount > 0 and phase ≥ P2 → require financing_cost_pct
  const debtAmount = params.debt_amount ?? 0
  if (debtAmount > 0 && phase !== 'P1') {
    if (params.financing_cost_pct == null) {
      errors.push({ parameter: 'financing_cost_pct', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'financing_cost_pct required when debt_amount > 0 at P2 and above.' })
    }
  }

  // ── Trigger 4: Capital gate ───────────────────────────────────────────────
  // if computed_available_capital is present → require capital_structure evidence + computed_peak_financing_gap
  // (computed_available_capital is REQUIRED P1 so always present at P1+)
  if (!evidenceCategories.has('capital_structure')) {
    warnings.push({ evidenceCategory: 'capital_structure', code: RE_ERROR_CODES.CONDITIONAL_EVIDENCE_MISSING,
      message: 'capital_structure evidence is absent. computed_available_capital authority cannot be verified.' })
  }

  // ── Trigger 5: Maintenance deposit (P2) ──────────────────────────────────
  // if land_cost > 10,000,000 → require maintenance_deposit_pct (P2) or fire advisory
  const LAND_COST_THRESHOLD = 10_000_000
  if (params.land_cost > LAND_COST_THRESHOLD && phase !== 'P1') {
    if (params.maintenance_deposit_pct == null) {
      warnings.push({ parameter: 'maintenance_deposit_pct', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'maintenance_deposit_pct absent for land_cost > 10,000,000. RE-STR-003 disclosure advisory will fire.' })
    }
  }

  // ── Trigger 6: Cash flow timing ───────────────────────────────────────────
  // if land_cost > 10,000,000 OR execution_period_years > 2.0 → require cash_flow_timing evidence
  const cashFlowTimingTriggered =
    params.land_cost > LAND_COST_THRESHOLD || params.execution_period_years > 2.0

  if (cashFlowTimingTriggered && !evidenceCategories.has('cash_flow_timing')) {
    warnings.push({ evidenceCategory: 'cash_flow_timing', code: RE_ERROR_CODES.EVIDENCE_MISSING_ADVISORY,
      message: 'cash_flow_timing evidence absent. RE-EXE-002 advisory will fire. Absence is non-blocking but degrades confidence.' })
  }

  // residential area check: when residential_area_sqm > 0 require price and cost per sqm
  if ((params.residential_area_sqm ?? 0) > 0) {
    if (!params.price_per_sqm_residential) {
      errors.push({ parameter: 'price_per_sqm_residential', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'price_per_sqm_residential required when residential_area_sqm > 0.' })
    }
    if (!params.construction_cost_per_sqm_residential) {
      errors.push({ parameter: 'construction_cost_per_sqm_residential', code: RE_ERROR_CODES.CONDITIONAL_PARAMETER_MISSING,
        message: 'construction_cost_per_sqm_residential required when residential_area_sqm > 0.' })
    }
  }

  const hasBlockingErrors = errors.length > 0
  return {
    stage: 'stage-3-conditional',
    passed: !hasBlockingErrors,
    blocking: hasBlockingErrors,
    errors,
    warnings,
    durationMs: Date.now() - start,
  }
}
