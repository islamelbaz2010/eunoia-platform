/**
 * Gold Dataset — canonical benchmark cases for Decision Engine accuracy validation.
 *
 * This is the authoritative registry of all benchmark cases. Adding a case here
 * automatically includes it in the regression suite and accuracy report.
 *
 * Current coverage:
 *   feasibility    — 4 cases (rules: 5, total weight: 7.5)
 *   campaign_roi   — 3 cases (rules: 3, total weight: 4.5)
 *   market_entry   — 3 cases (rules: 4, total weight: 6.0)
 *   lead_gen       — 3 cases (rules: 3, total weight: 4.5)
 *   full_analysis  — 3 cases (rules: 3, total weight: 4.5)
 *
 * Total: 16 cases across 5 report types.
 */

export { FEASIBILITY_CASES }   from './feasibility.cases'
export { CAMPAIGN_ROI_CASES }  from './campaign-roi.cases'
export { MARKET_ENTRY_CASES }  from './market-entry.cases'
export { LEAD_GEN_CASES }      from './lead-gen.cases'
export { FULL_ANALYSIS_CASES } from './full-analysis.cases'

import { FEASIBILITY_CASES }   from './feasibility.cases'
import { CAMPAIGN_ROI_CASES }  from './campaign-roi.cases'
import { MARKET_ENTRY_CASES }  from './market-entry.cases'
import { LEAD_GEN_CASES }      from './lead-gen.cases'
import { FULL_ANALYSIS_CASES } from './full-analysis.cases'
import type { BenchmarkCase }  from '../types'

/**
 * The complete gold dataset — all canonical cases in stable order.
 *
 * Order: feasibility → campaign_roi → market_entry → lead_gen → full_analysis.
 * Do not reorder existing cases; append new cases at the end of each section.
 */
export const GOLD_DATASET: readonly BenchmarkCase[] = [
  ...FEASIBILITY_CASES,
  ...CAMPAIGN_ROI_CASES,
  ...MARKET_ENTRY_CASES,
  ...LEAD_GEN_CASES,
  ...FULL_ANALYSIS_CASES,
]
