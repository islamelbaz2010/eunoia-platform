import {
  RE_RULE_BLOCKING,
  RE_RULE_SEVERITY,
  RE_RULE_MIN_PHASE,
} from '../types/enums'
import type { REPhase, RERuleId } from '../types/enums'
import type { REFullParameters } from '../types/parameters'
import type { REEvidence } from '../types/evidence'
import type { RERuleResult } from '../types/request'
import { evidenceAgeDays } from '../types/evidence'

// ---------------------------------------------------------------------------
// Rule Dispatcher — evaluates all 22 RE rules deterministically.
// Rule IDs are never hardcoded by name — always referenced via the RERuleId type.
// Rule conditions follow the exact specifications from REAL_ESTATE_RULE_LIBRARY.md.
// ---------------------------------------------------------------------------

function makeResult(
  ruleId: RERuleId,
  fired: boolean,
  message: string,
  phase: REPhase,
  skipped = false,
): RERuleResult {
  return {
    ruleId,
    fired,
    blocking: RE_RULE_BLOCKING[ruleId],
    severity:  RE_RULE_SEVERITY[ruleId],
    message,
    phase: RE_RULE_MIN_PHASE[ruleId],
    skipped,
  }
}

function phaseValue(phase: REPhase): number {
  return phase === 'P1' ? 1 : phase === 'P2' ? 2 : 3
}

function skipResult(ruleId: RERuleId, phase: REPhase): RERuleResult {
  return makeResult(
    ruleId,
    false,
    `Skipped: requires phase ${RE_RULE_MIN_PHASE[ruleId]} but request is ${phase}.`,
    phase,
    true,
  )
}

// ---------------------------------------------------------------------------
// Individual rule evaluations (Priority 1 → 4)
// ---------------------------------------------------------------------------

function evalReFin001(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-FIN-001'
  const fired = p.computed_npv <= 0
  return makeResult(id, fired, fired
    ? `RE-FIN-001 FAIL: computed_npv (${p.computed_npv}) is zero or negative. Project does not generate value at the hurdle rate.`
    : `RE-FIN-001 PASS: computed_npv (${p.computed_npv}) is strictly positive.`,
    phase,
  )
}

function evalReFin002(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-FIN-002'
  const fired = p.computed_irr_annual < p.hurdle_rate
  return makeResult(id, fired, fired
    ? `RE-FIN-002 FAIL: IRR (${p.computed_irr_annual}) < hurdle_rate (${p.hurdle_rate}). Project does not meet the minimum return threshold.`
    : `RE-FIN-002 PASS: IRR (${p.computed_irr_annual}) ≥ hurdle_rate (${p.hurdle_rate}).`,
    phase,
  )
}

function evalReFin003(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-FIN-003'
  const fired = p.computed_net_profit <= 0
  return makeResult(id, fired, fired
    ? `RE-FIN-003 FAIL: computed_net_profit (${p.computed_net_profit}) ≤ 0. Project is not profitable.`
    : `RE-FIN-003 PASS: computed_net_profit (${p.computed_net_profit}) is positive.`,
    phase,
  )
}

function evalReFin004(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-FIN-004'
  const fired = p.computed_peak_financing_gap > p.computed_available_capital
  return makeResult(id, fired, fired
    ? `RE-FIN-004 FAIL: peak_financing_gap (${p.computed_peak_financing_gap}) exceeds available_capital (${p.computed_available_capital}). Project cannot self-fund its peak cash shortfall.`
    : `RE-FIN-004 PASS: available_capital (${p.computed_available_capital}) covers peak_financing_gap (${p.computed_peak_financing_gap}).`,
    phase,
  )
}

function evalReFin005(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-FIN-005'
  const fired = p.computed_annual_roi < 0.08
  return makeResult(id, fired, fired
    ? `RE-FIN-005 WARN: annual_roi (${(p.computed_annual_roi * 100).toFixed(1)}%) is below 8% advisory threshold. Project returns sub-market returns.`
    : `RE-FIN-005 PASS: annual_roi (${(p.computed_annual_roi * 100).toFixed(1)}%) ≥ 8%.`,
    phase,
  )
}

function evalReFin006(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-FIN-006'
  const fired = p.computed_annual_roi > 0.20
  return makeResult(id, fired,
    fired
      ? `RE-FIN-006 POSITIVE SIGNAL: annual_roi (${(p.computed_annual_roi * 100).toFixed(1)}%) exceeds 20% — strong return profile.`
      : `RE-FIN-006: annual_roi (${(p.computed_annual_roi * 100).toFixed(1)}%) is within normal range.`,
    phase,
  )
}

function evalReCom001(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-COM-001'
  const fired = p.sales_period_years > 3.5
  return makeResult(id, fired, fired
    ? `RE-COM-001 WARN: sales_period_years (${p.sales_period_years}) exceeds 3.5-year market benchmark. Extended sales period increases execution risk.`
    : `RE-COM-001 PASS: sales_period_years (${p.sales_period_years}) ≤ 3.5 years.`,
    phase,
  )
}

function evalReCom002(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-COM-002'
  const absorption = p.market_absorption_rate_years
  if (absorption == null) {
    return makeResult(id, false, 'RE-COM-002 SKIP: market_absorption_rate_years not supplied — benchmark comparison skipped.', phase)
  }
  const threshold = absorption * 1.5
  const fired = p.sales_period_years > threshold
  return makeResult(id, fired, fired
    ? `RE-COM-002 WARN: sales_period_years (${p.sales_period_years}) exceeds 1.5× market absorption rate (${threshold.toFixed(2)}). Sales velocity assumption is aggressive.`
    : `RE-COM-002 PASS: sales_period_years (${p.sales_period_years}) ≤ 1.5× absorption benchmark (${threshold.toFixed(2)}).`,
    phase,
  )
}

function evalReCom003(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-COM-003'
  const fired = p.commercial_mix_pct > 0.40
  return makeResult(id, fired, fired
    ? `RE-COM-003 WARN: commercial_mix_pct (${(p.commercial_mix_pct * 100).toFixed(1)}%) exceeds 40%. High commercial concentration increases absorption risk.`
    : `RE-COM-003 PASS: commercial_mix_pct (${(p.commercial_mix_pct * 100).toFixed(1)}%) ≤ 40%.`,
    phase,
  )
}

function evalReCom004(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-COM-004'
  if (phaseValue(phase) < 2) return skipResult(id, phase)
  const benchmark = p.market_price_benchmark_residential_per_sqm
  if (benchmark == null || benchmark === 0) {
    return makeResult(id, false, 'RE-COM-004 SKIP: market_price_benchmark_residential_per_sqm not supplied.', phase)
  }
  const price = p.price_per_sqm_residential
  if (price == null) {
    return makeResult(id, false, 'RE-COM-004 SKIP: price_per_sqm_residential not supplied.', phase)
  }
  const deviation = Math.abs(price - benchmark) / benchmark
  const fired = deviation > 0.30
  return makeResult(id, fired, fired
    ? `RE-COM-004 WARN: price_per_sqm_residential (${price}) deviates from benchmark (${benchmark}) by ${(deviation * 100).toFixed(1)}% (threshold: 30%).`
    : `RE-COM-004 PASS: price deviation from benchmark (${(deviation * 100).toFixed(1)}%) ≤ 30%.`,
    phase,
  )
}

function evalReOps001(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-OPS-001'
  const fired = p.computed_break_even_quarter > 8
  return makeResult(id, fired, fired
    ? `RE-OPS-001 WARN: break_even_quarter (${p.computed_break_even_quarter}) exceeds 8 quarters (2 years). Extended break-even raises liquidity risk.`
    : `RE-OPS-001 PASS: break_even_quarter (${p.computed_break_even_quarter}) ≤ 8 quarters.`,
    phase,
  )
}

function evalReOps002(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-OPS-002'
  const fired = p.marketing_cost_pct > 0.08
  return makeResult(id, fired, fired
    ? `RE-OPS-002 WARN: marketing_cost_pct (${(p.marketing_cost_pct * 100).toFixed(1)}%) exceeds 8% advisory threshold. Review marketing budget efficiency.`
    : `RE-OPS-002 PASS: marketing_cost_pct (${(p.marketing_cost_pct * 100).toFixed(1)}%) ≤ 8%.`,
    phase,
  )
}

function evalReOps003(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-OPS-003'
  const fired = p.execution_period_years > 4.0
  return makeResult(id, fired, fired
    ? `RE-OPS-003 WARN: execution_period_years (${p.execution_period_years}) exceeds 4 years. Extended execution period increases inflation and financing risk.`
    : `RE-OPS-003 PASS: execution_period_years (${p.execution_period_years}) ≤ 4 years.`,
    phase,
  )
}

function evalReOps004(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-OPS-004'
  const aggregateOverheadCost =
    (p.ops_engineering_consulting_pct + p.ops_licensing_pct + p.ops_supervision_pct) *
    p.construction_cost_total +
    p.ops_hq_cost_total
  const threshold = 0.05 * p.construction_cost_total
  const fired = aggregateOverheadCost < threshold
  return makeResult(id, fired, fired
    ? `RE-OPS-004 WARN: aggregate operational overhead (${aggregateOverheadCost.toFixed(0)}) is < 5% of construction_cost_total (${threshold.toFixed(0)}). Operational costs appear underbudgeted (market benchmark: 7–9%).`
    : `RE-OPS-004 PASS: aggregate operational overhead (${aggregateOverheadCost.toFixed(0)}) ≥ 5% of construction cost.`,
    phase,
  )
}

function evalReStr001(p: REFullParameters, evidence: REEvidence[], phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-STR-001'
  const total = p.total_saleable_area_sqm
  const threshold = total * 0.10
  const triggered =
    (p.commercial_mix_pct > 0.10) ||
    (p.medical_mix_pct > 0.10) ||
    (p.administrative_mix_pct > 0.10)
  if (!triggered) {
    return makeResult(id, false, 'RE-STR-001 PASS: no non-residential activity type exceeds 10% threshold.', phase)
  }
  const hasActivityMixEvidence = evidence.some(e => e.category === 'activity_mix_financial')
  const fired = !hasActivityMixEvidence
  return makeResult(id, fired, fired
    ? `RE-STR-001 WARN: non-residential activity exceeds 10% threshold but activity_mix_financial evidence is absent. Cannot validate per-activity revenue and cost assumptions.`
    : `RE-STR-001 PASS: activity_mix_financial evidence present for mixed-use project.`,
    phase,
  )
}

function evalReStr002(p: REFullParameters, evidence: REEvidence[], phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-STR-002'
  const hasMarketData = evidence.some(e => e.category === 'market_data')
  const fired = !hasMarketData
  return makeResult(id, fired, fired
    ? 'RE-STR-002 WARN: market_data evidence is absent. Price benchmarks and absorption rates cannot be independently validated.'
    : 'RE-STR-002 PASS: market_data evidence present.',
    phase,
  )
}

function evalReStr003(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-STR-003'
  if (p.land_cost <= 10_000_000) {
    return makeResult(id, false, 'RE-STR-003 PASS: land_cost ≤ 10,000,000 — maintenance deposit disclosure not required.', phase)
  }
  const fired = p.maintenance_deposit_pct == null
  return makeResult(id, fired, fired
    ? `RE-STR-003 WARN: land_cost (${p.land_cost}) > 10,000,000 but maintenance_deposit_pct is absent. Cannot confirm maintenance deposit was explicitly modeled in land_cost.`
    : `RE-STR-003 PASS: maintenance_deposit_pct (${p.maintenance_deposit_pct}) is disclosed for land_cost > 10,000,000.`,
    phase,
  )
}

function evalReExe001(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-EXE-001'
  const fired = p.inflation_rate_annual > 0.10 && p.execution_period_years > 2.0
  return makeResult(id, fired, fired
    ? `RE-EXE-001 WARN: High inflation risk — inflation_rate_annual (${(p.inflation_rate_annual * 100).toFixed(1)}%) > 10% combined with execution_period_years (${p.execution_period_years}) > 2 years. Construction cost overrun risk is elevated.`
    : 'RE-EXE-001 PASS: Inflation/execution risk within acceptable parameters.',
    phase,
  )
}

function evalReExe002(p: REFullParameters, evidence: REEvidence[], phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-EXE-002'
  const triggered = p.land_cost > 10_000_000 || p.execution_period_years > 2.0
  if (!triggered) {
    return makeResult(id, false, 'RE-EXE-002 PASS: cash_flow_timing evidence not required for this project scale.', phase)
  }
  const hasCashFlowEvidence = evidence.some(e => e.category === 'cash_flow_timing')
  const fired = !hasCashFlowEvidence
  return makeResult(id, fired, fired
    ? 'RE-EXE-002 WARN: cash_flow_timing evidence absent for large/long project. Quarterly cash flow timing cannot be validated.'
    : 'RE-EXE-002 PASS: cash_flow_timing evidence present.',
    phase,
  )
}

function evalReRsk001(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-RSK-001'
  if (phaseValue(phase) < 2) return skipResult(id, phase)
  const pessNpv = p.pessimistic_npv
  if (pessNpv == null) {
    return makeResult(id, false, 'RE-RSK-001 SKIP: pessimistic_npv not supplied.', phase)
  }
  const fired = pessNpv <= 0 && p.computed_npv > 0
  return makeResult(id, fired, fired
    ? `RE-RSK-001 WARN: pessimistic_npv (${pessNpv}) ≤ 0 while base computed_npv (${p.computed_npv}) is positive. Decision is NPV-negative in the downside scenario.`
    : `RE-RSK-001 PASS: pessimistic scenario NPV (${pessNpv}) is positive.`,
    phase,
  )
}

function evalReRsk002(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-RSK-002'
  if (phaseValue(phase) < 2) return skipResult(id, phase)
  const divergence = p.scenario_divergence_ratio
  if (divergence == null) {
    return makeResult(id, false, 'RE-RSK-002 SKIP: scenario_divergence_ratio could not be derived (scenario NPVs absent or computed_npv = 0).', phase)
  }
  const fired = divergence > 5.0
  return makeResult(id, fired, fired
    ? `RE-RSK-002 WARN: scenario_divergence_ratio (${divergence.toFixed(2)}) exceeds 5.0. Decision is highly sensitive to scenario assumptions — fragility risk.`
    : `RE-RSK-002 PASS: scenario_divergence_ratio (${divergence.toFixed(2)}) ≤ 5.0.`,
    phase,
  )
}

function evalReRsk003(evidence: REEvidence[], phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-RSK-003'
  const costEst = evidence.find(e => e.category === 'cost_estimates')
  if (!costEst) {
    return makeResult(id, false, 'RE-RSK-003 SKIP: cost_estimates evidence absent (will be caught by Stage 5).', phase)
  }
  const ageDays = evidenceAgeDays(costEst)
  const fired = ageDays > 90
  return makeResult(id, fired, fired
    ? `RE-RSK-003 WARN: cost_estimates evidence is ${ageDays.toFixed(0)} days old (threshold: 90 days). Construction cost estimates may be stale.`
    : `RE-RSK-003 PASS: cost_estimates evidence is ${ageDays.toFixed(0)} days old (≤ 90 days).`,
    phase,
  )
}

function evalReLgl001(p: REFullParameters, phase: REPhase): RERuleResult {
  const id: RERuleId = 'RE-LGL-001'
  const fired = p.land_registration_status === 'unregistered'
  return makeResult(id, fired, fired
    ? `RE-LGL-001 WARN: land_registration_status is 'unregistered'. Legal title cannot be confirmed — proceeding without registered land title carries significant legal and financing risk.`
    : `RE-LGL-001 PASS: land_registration_status is '${p.land_registration_status ?? 'not specified'}' — no unregistered title concern.`,
    phase,
  )
}

// ---------------------------------------------------------------------------
// Main dispatcher — evaluates all 23 rules in priority order
// ---------------------------------------------------------------------------

export function dispatchAllRules(
  enrichedParams: REFullParameters,
  evidence: REEvidence[],
  phase: REPhase,
): RERuleResult[] {
  return [
    // Priority 1 — Critical Blocking
    evalReFin001(enrichedParams, phase),
    evalReFin002(enrichedParams, phase),
    evalReFin003(enrichedParams, phase),
    evalReFin004(enrichedParams, phase),
    // Priority 2 — High Advisory
    evalReFin005(enrichedParams, phase),
    evalReCom001(enrichedParams, phase),
    evalReCom002(enrichedParams, phase),
    evalReRsk001(enrichedParams, phase),
    evalReRsk002(enrichedParams, phase),
    evalReStr001(enrichedParams, evidence, phase),
    evalReLgl001(enrichedParams, phase),
    // Priority 3 — Medium Advisory
    evalReCom003(enrichedParams, phase),
    evalReCom004(enrichedParams, phase),
    evalReOps001(enrichedParams, phase),
    evalReOps003(enrichedParams, phase),
    evalReOps004(enrichedParams, phase),
    evalReStr002(enrichedParams, evidence, phase),
    evalReStr003(enrichedParams, phase),
    evalReExe001(enrichedParams, phase),
    evalReExe002(enrichedParams, evidence, phase),
    // Priority 4 — Low Advisory / Scoring
    evalReFin006(enrichedParams, phase),
    evalReOps002(enrichedParams, phase),
    evalReRsk003(evidence, phase),
  ]
}
