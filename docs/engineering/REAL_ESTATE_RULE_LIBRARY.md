# Real Estate Decision Intelligence — Rule Library

**Classification:** Engineering Architecture — Internal Only
**Version:** 1.0
**Date:** 2026-08-03
**Author:** Chief Decision Intelligence Architect
**Status:** AWAITING EXECUTIVE APPROVAL

---

## Purpose

This document is the canonical rule specification for Real Estate business rules evaluated by the Eunoia Decision Intelligence Engine. Every rule is defined at the knowledge level — what it means, when it fires, and why it exists. Implementation uses the existing rule engine without modification.

Rules are organized into six categories. Within each category, blocking rules (FAIL action) are listed first, followed by advisory rules (WARN action). Rules are assigned IDs using the format `RE-[CATEGORY]-[NUMBER]`.

Rules marked **[UNIVERSAL]** apply to any investment domain. Rules marked **[RE-SPECIFIC]** contain Real Estate knowledge. Rules marked **[EXISTING]** are already implemented. Rules marked **[NEW — P1/P2/P3]** are being introduced in the corresponding phase.

---

## Category: FINANCIAL

Financial rules are the primary gates. They evaluate whether the project creates acceptable economic value. All blocking financial rules must pass before any option can receive a PROCEED recommendation.

---

### RE-FIN-001 — NPV Gate

**Status:** [EXISTING] [UNIVERSAL]
**Business Purpose:** A project with negative NPV returns less than the minimum acceptable rate when the time value of money is accounted for. Regardless of headline profit, if the discounted future cash flows do not exceed the cost, the project destroys value relative to the market alternative.
**Condition:** `computed_npv <= 0`
**Severity:** CRITICAL
**Blocking:** YES — pipeline halts recommendation for this option
**Evidence Required:** `financial_projections`
**Threshold:** computed_npv must be strictly positive
**Recommended Action:** Revise — investigate which cost or revenue assumptions drive the negative NPV. The most common causes: construction cost overestimate, price per sqm below market, sales period too long.
**Reason:** NPV < 0 means the project returns less than the 20% hurdle rate in present-value terms. There is no financial justification to proceed.
**Confidence Impact:** Blocking — rule_compliance dimension severely penalized when this rule fires and the option proceeds anyway (validation will block it).
**Cross-Domain Reusability:** UNIVERSAL — identical rule applies to Hotel, Medical, Restaurant investment decisions.

---

### RE-FIN-002 — IRR vs. Hurdle Rate Gate

**Status:** [NEW — P1] [UNIVERSAL]
**Business Purpose:** IRR is the effective annual return rate of the investment. If IRR falls below the market hurdle rate (20% for Egypt real estate), the developer is accepting below-market returns. A project can have marginally positive NPV but IRR of 15% — meaning the developer would earn more by deploying capital in an alternative investment. This rule closes that gap.
**Condition:** `computed_irr_annual < hurdle_rate`
**Severity:** CRITICAL
**Blocking:** YES
**Evidence Required:** `financial_projections`, `computed_irr_annual`, `hurdle_rate`
**Threshold:** computed_irr_annual must be ≥ hurdle_rate (default: 0.20 for Egypt real estate)
**Recommended Action:** Revise — the return rate is insufficient. Options: (1) Reduce construction cost per sqm, (2) Increase price per sqm toward market ceiling, (3) Reduce sales period assumption, (4) Reduce overhead percentages.
**Reason:** Below-hurdle-rate returns mean the developer earns less than what the market requires for this level of risk and illiquidity. Capital is better deployed elsewhere.
**Confidence Impact:** Blocking — rule_compliance severely penalized.
**Cross-Domain Reusability:** UNIVERSAL — IRR vs. hurdle rate gate applies to any capital investment decision.

---

### RE-FIN-003 — Net Profit Gate

**Status:** [EXISTING] [UNIVERSAL]
**Business Purpose:** Verifies that the project generates positive absolute profit after all costs and taxes. Even if NPV is technically positive (which it cannot be if profit is zero at the hurdle rate used), zero or negative profit is an unambiguous failure condition.
**Condition:** `computed_net_profit <= 0`
**Severity:** CRITICAL
**Blocking:** YES
**Evidence Required:** `financial_projections`
**Threshold:** computed_net_profit must be strictly positive
**Recommended Action:** Revise — immediate cost reduction or revenue increase required. The project loses money in absolute terms.
**Reason:** Negative net profit means the project costs more than it generates. This is not a return-rate problem — it is a fundamental viability failure.
**Confidence Impact:** Blocking.
**Cross-Domain Reusability:** UNIVERSAL.

---

### RE-FIN-004 — Financing Gap vs. Available Capital Gate

**Status:** [NEW — P1] [UNIVERSAL]
**Business Purpose:** The peak financing gap is the maximum additional capital the developer must have available beyond what the project generates internally. Even a project with positive NPV and sufficient IRR will stall mid-construction if the developer runs out of capital. This gate explicitly checks whether the developer's available capital covers the maximum cash draw point.
**Condition:** `computed_peak_financing_gap > computed_available_capital`
**Severity:** CRITICAL
**Blocking:** YES
**Evidence Required:** `cash_flow_timing` (for gap computation), `capital_structure` (for available capital declaration)
**Threshold:** computed_peak_financing_gap must be ≤ computed_available_capital
**Recommended Action:** Either (1) secure additional capital or financing to close the gap, (2) restructure the payment schedule to increase down payments and collect installments faster, or (3) phase the project to reduce the peak capital draw in any single period.
**Reason:** Capital exhaustion during execution is the most common cause of real estate project failure in Egypt. A project can be financially viable on paper and still fail because the developer cannot fund the construction during the gap between outflows (land installments + construction draws) and inflows (sales installments). NPV does not capture this risk.
**Confidence Impact:** Blocking.
**Cross-Domain Reusability:** UNIVERSAL — capital gap applies to Hotels, Medical facilities, Restaurants with significant fit-out capital requirements.

---

### RE-FIN-005 — Minimum Annual ROI

**Status:** [EXISTING] [UNIVERSAL]
**Business Purpose:** Annual ROI is the simple return metric that most developers use for quick evaluation. Even if IRR and NPV pass, an annual ROI below 8% signals that the project's headline return is too low relative to simpler investment alternatives (e.g., government bonds, bank deposits).
**Condition:** `computed_annual_roi < 0.08`
**Severity:** HIGH
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `financial_projections`
**Threshold:** computed_annual_roi ≥ 0.08 (8% annual ROI)
**Recommended Action:** Review the project timeline and cost structure. An ROI below 8% over a multi-year project is below the risk-free rate alternative. Consider whether the project duration can be shortened or costs reduced.
**Reason:** Sub-8% annual ROI makes the investment uncompetitive with lower-risk alternatives. This is a WARN (not FAIL) because IRR and NPV are the primary gates — ROI is supplementary.
**Confidence Impact:** Advisory — rule_compliance dimension moderately penalized.
**Cross-Domain Reusability:** UNIVERSAL.

---

### RE-FIN-006 — High ROI Consistency Check (Counter-Signal for Defer)

**Status:** [EXISTING] [UNIVERSAL]
**Business Purpose:** When annual ROI exceeds 20%, recommending "Defer" or "Revise" is inconsistent with the financial evidence. High ROI options should be strongly weighted toward "Proceed."
**Condition:** `computed_annual_roi > 0.20` (applied as a positive signal for the Proceed option)
**Severity:** MEDIUM
**Blocking:** NO — scoring signal
**Evidence Required:** `financial_projections`
**Threshold:** computed_annual_roi > 0.20
**Reason:** An option with 20%+ annual ROI that receives a DEFER or REVISE recommendation has a logic inconsistency — the financial evidence strongly favors proceeding.
**Cross-Domain Reusability:** UNIVERSAL.

---

## Category: COMMERCIAL

Commercial rules evaluate market viability: whether the product can be sold at the assumed price and pace, and whether the activity mix matches market demand.

---

### RE-COM-001 — Sales Period Advisory

**Status:** [NEW — P1] [UNIVERSAL]
**Business Purpose:** Sales velocity is the single most sensitive assumption in real estate financial models. Extending the sales period by 1 year reduces annual ROI by 25-40% and may collapse IRR below the hurdle rate. A project assuming more than 3.5 years to sell all units is making a highly optimistic market demand assumption that should be surfaced as a risk.
**Condition:** `sales_period_years > 3.5`
**Severity:** HIGH
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `sales_projections`
**Threshold:** sales_period_years ≤ 3.5 years
**Recommended Action:** Validate the sales period assumption against market absorption data for comparable projects in the same district. If the market benchmark confirms a longer sales period is realistic, increase the sales period in the financial model to reflect true expectations — then re-evaluate NPV and IRR.
**Reason:** Most successful Egypt real estate projects complete unit sales within 2-3 years. Assumptions beyond 3.5 years indicate either: the project is overpriced, the district has weak demand, or the product type has slow absorption. Each scenario requires specific mitigation before proceeding.
**Confidence Impact:** Advisory — rule_compliance dimension penalized when this fires, reducing overall confidence.
**Cross-Domain Reusability:** UNIVERSAL — sales period applies to any product or service that must achieve market absorption over time.

---

### RE-COM-002 — Sales Period vs. Market Benchmark

**Status:** [NEW — P3] [RE-SPECIFIC]
**Business Purpose:** Extends RE-COM-001 by comparing the assumed sales period to the district-specific market benchmark. A 3-year assumption in a district where comparable projects sell in 3.2 years is reasonable. The same assumption in a district with a 1.5-year average is aggressive.
**Condition:** `sales_period_years > market_absorption_rate_years * 1.5`
**Severity:** HIGH
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `sales_projections`, `market_data` (for `market_absorption_rate_years`)
**Threshold:** sales_period_years ≤ 1.5 × market_absorption_rate_years
**Recommended Action:** Revisit the sales period assumption. The project assumes significantly slower absorption than comparable district projects. Either the product is different enough to justify the longer period (and that differentiation must be evidenced), or the assumption is too conservative/optimistic.
**Reason:** District absorption rate is the most reliable benchmark for sales velocity. Deviating 50% beyond the district average without justification introduces material financial risk.
**Confidence Impact:** Advisory.
**Cross-Domain Reusability:** PARTIAL — benchmark comparison pattern is universal; specific district metric is RE-specific.

---

### RE-COM-003 — Commercial Mix Dominance Risk

**Status:** [NEW — P2] [RE-SPECIFIC]
**Business Purpose:** Commercial units (retail, showrooms) absorb significantly slower than residential units in Egyptian real estate markets. A project with > 40% commercial allocation in a non-commercial district faces elevated sales velocity risk for that component, which can delay total project completion and increase financing gap duration.
**Condition:** `commercial_mix_pct > 0.40`
**Severity:** MEDIUM
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `activity_mix_financial`, `market_data`
**Threshold:** commercial_mix_pct ≤ 0.40 for mixed-use projects in primarily residential districts
**Recommended Action:** Validate that the commercial allocation matches documented demand for commercial space in this district. If market research confirms commercial demand, provide that evidence. Otherwise, consider reducing commercial allocation to below 40%.
**Reason:** High commercial mix without confirmed demand is a structural absorption risk. Commercial units typically take 50-100% longer to sell than residential units of comparable size and price. This extends the project's effective sales period.
**Confidence Impact:** Advisory when this rule fires — evidence_quality dimension penalized if no market data supports the high commercial allocation.
**Cross-Domain Reusability:** RE-SPECIFIC in thresholds; pattern (dominant slow-absorption activity type) applicable in other domains.

---

### RE-COM-004 — Price Deviation from Market Benchmark

**Status:** [NEW — P2] [RE-SPECIFIC]
**Business Purpose:** If the project's assumed selling price per sqm deviates significantly from market benchmarks for comparable projects in the same district, either the project is being modeled at inflated prices (overconfident revenue) or underpriced (underestimated revenue). Both create decision errors.
**Condition:** `price_per_sqm_residential > market_price_benchmark_residential_per_sqm * 1.30` OR `price_per_sqm_residential < market_price_benchmark_residential_per_sqm * 0.70`
**Severity:** MEDIUM
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `market_data` (for benchmark), `activity_mix_financial` (for project price)
**Threshold:** Project price must be within ±30% of district market benchmark
**Recommended Action:** If priced above benchmark by > 30%: verify that product differentiation (specification, location premium, brand) justifies the premium. If priced below benchmark by > 30%: verify that cost structure supports this price without destroying margins.
**Reason:** Price assumptions more than 30% above market benchmark are a leading indicator of revenue overestimation. Price assumptions more than 30% below market are unusual and may indicate underestimated revenue or a distress-pricing strategy.
**Cross-Domain Reusability:** RE-SPECIFIC in the metric; pattern (price vs. market benchmark deviation) is universal.

---

## Category: OPERATIONAL

Operational rules evaluate execution-level risks: timeline, cash conversion cycle, and cost efficiency.

---

### RE-OPS-001 — Break-Even Quarter Advisory

**Status:** [NEW — P1] [UNIVERSAL]
**Business Purpose:** The break-even quarter measures how long the developer must fund the project before the cumulative cash position turns positive. Longer break-even periods require more capital, increase financing cost, and extend the period of maximum financial risk. In Egypt real estate, a break-even beyond 8 quarters (2 years) is above the professional advisory threshold.
**Condition:** `computed_break_even_quarter > 8`
**Severity:** MEDIUM
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `cash_flow_timing`
**Threshold:** computed_break_even_quarter ≤ 8 quarters (24 months)
**Recommended Action:** Review the cash flow timing model. Options to reduce break-even quarter: (1) Increase down payment percentage, (2) Shorten installment collection period, (3) Accelerate sales launch (begin selling before full construction is complete), (4) Adjust land payment schedule to back-load earlier payments.
**Reason:** An 8-quarter break-even means the developer is net-negative for 2 years. Beyond this threshold, financing risk, interest cost, and execution risk accumulate to a level that materially threatens project completion.
**Cross-Domain Reusability:** UNIVERSAL — break-even quarter applies to Hotels, Restaurants, and any capital project with a cash collection ramp-up period.

---

### RE-OPS-002 — Marketing Cost Efficiency

**Status:** [NEW — P2] [UNIVERSAL]
**Business Purpose:** Marketing cost as a percentage of revenue above 8% indicates inefficient sales and marketing spend for Egypt real estate. High marketing cost is either a symptom of a product that is hard to sell (wrong location, price, or product type) or a cost structure problem.
**Condition:** `marketing_cost_pct > 0.08`
**Severity:** LOW
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `financial_projections`
**Threshold:** marketing_cost_pct ≤ 0.08 (8% of revenue)
**Recommended Action:** Review marketing cost assumptions. Typical Egypt real estate: 3-6% for well-located, demand-confirmed projects. Costs above 8% suggest demand uncertainty requiring excessive marketing investment.
**Reason:** Marketing cost is a proxy for demand confidence. High marketing cost reduces margins and signals that the product requires disproportionate effort to sell.
**Cross-Domain Reusability:** UNIVERSAL — marketing cost efficiency applies across all commercial domains.

---

### RE-OPS-004 — Operational Overhead Underbudget Advisory

**Status:** [NEW — P1] [SHARED]
**Business Purpose:** The التشغيل operational overhead cost category — covering engineering consulting, licensing fees, construction supervision, and HQ/administrative costs — typically represents 7–9% of total project cost in Egypt real estate. Projects that budget this category below a minimum threshold risk cost overruns during the administrative and oversight phases, which are non-discretionary costs. Omitting or underestimating this category inflates projected profit and masks true cost structure.
**Condition:** `(ops_engineering_consulting_pct + ops_licensing_pct + ops_supervision_pct) × construction_cost_total + ops_hq_cost_total < 0.05 × construction_cost_total`
**Severity:** MEDIUM
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `financial_projections`, `cost_estimates`
**Threshold:** Aggregate operational overhead ≥ 5% of construction cost (warning threshold). Market benchmark for Egypt real estate: 7–9% of total project cost. If the submitted overhead parameters total less than 5% of construction cost, the model is likely underestimating this category.
**Recommended Action:** Review the التشغيل sheet in the financial model. Confirm that engineering consulting (1–1.5%), licensing (1–1.5%), supervision (1–2%), and HQ/administrative costs are all explicitly modeled. If they are bundled into construction cost, separate them for accurate classification.
**Reason:** The operational overhead category is one of the most commonly omitted or underestimated cost categories in Egyptian real estate feasibility models. Its omission systematically overstates profit and understates the true all-in cost.
**Cross-Domain Reusability:** SHARED — engineering consulting, licensing, supervision, and administrative overhead apply to any multi-year capital construction project across Hotels, Medical facilities, and Restaurants.

---

### RE-OPS-003 — Extended Execution Period Risk

**Status:** [NEW — P2] [UNIVERSAL]
**Business Purpose:** Projects with construction periods longer than 4 years face compounding risks: inflation erodes cost estimates, market conditions shift, key team members change, and regulatory environment may evolve. These risks are not individually quantifiable but collectively material.
**Condition:** `execution_period_years > 4.0`
**Severity:** MEDIUM
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `technical_feasibility`
**Threshold:** execution_period_years ≤ 4.0 years
**Recommended Action:** If a 4+ year execution period is unavoidable (large mixed-use), phase the project to have distinct financial milestones — Phase 1 must be independently viable before Phase 2 commitments are made.
**Reason:** Beyond 4 years, the financial model's assumptions about costs, prices, and market conditions become unreliable. The decision is being made on stale projections regardless of when the evidence was collected.
**Cross-Domain Reusability:** UNIVERSAL.

---

## Category: STRATEGIC

Strategic rules evaluate the soundness of the project's market positioning and competitive logic.

---

### RE-STR-001 — Activity Mix Financial Evidence Completeness

**Status:** [NEW — P1] [RE-SPECIFIC]
**Business Purpose:** A feasibility decision supported only by aggregate financials (total cost, total revenue) without activity-type decomposition misses the compositional risk. If commercial units have lower margins and slower absorption than the aggregate model assumes, the decision is made on incomplete information.
**Condition:** Evidence coverage missing `activity_mix_financial` category when `commercial_mix_pct > 0.10` OR `medical_mix_pct > 0.10` OR `administrative_mix_pct > 0.10`
**Severity:** HIGH
**Blocking:** NO — but reduces coverage score below acceptable threshold when triggered
**Evidence Required:** `activity_mix_financial`
**Threshold:** When any non-residential activity type exceeds 10% of saleable area, activity_mix_financial evidence is required
**Recommended Action:** Supply activity-type-specific financial evidence: separate revenue and cost calculations for each activity type present in the project.
**Reason:** Projects with significant non-residential components (>10%) have fundamentally different financial profiles per activity type. Aggregate modeling hides this complexity.
**Cross-Domain Reusability:** RE-SPECIFIC in activity types; pattern (product mix requires disaggregated evidence) is universal.

---

### RE-STR-002 — Market Demand Evidence for Location

**Status:** [NEW — P2] [RE-SPECIFIC]
**Business Purpose:** A project proceeding without market demand evidence for its specific district and product type is relying entirely on the developer's belief that demand exists. Without demand evidence, the sales velocity assumption is unsupported.
**Condition:** `market_data` evidence absent for the decision
**Severity:** MEDIUM
**Blocking:** NO — reduces coverage score
**Evidence Required:** `market_data`
**Threshold:** At least one market data evidence item must be present for a feasibility decision
**Recommended Action:** Provide market research covering: district price benchmarks per sqm by activity type, market absorption rates for comparable projects, and competitive project inventory.
**Reason:** Demand validation is mandatory for professional feasibility analysis. Its absence does not prevent a decision, but it reduces evidence coverage and confidence.
**Cross-Domain Reusability:** UNIVERSAL — market demand evidence is required for any business decision involving a new product or location.

---

### RE-STR-003 — Maintenance Deposit Inclusion Check

**Status:** [NEW — P2] [RE-SPECIFIC]
**Business Purpose:** The maintenance deposit (وديعة الصيانة) is a mandatory statutory cost in Egyptian real estate — typically 3-5% of land value, paid upfront before construction permits are issued. Projects that exclude this cost from their financial model overstate profit by that amount. For large land acquisitions, this is a material omission.
**Condition:** `maintenance_deposit_pct` is absent from context.parameters AND `land_cost > 10,000,000`
**Severity:** MEDIUM
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `land_terms`, `regulatory_compliance`
**Threshold:** maintenance_deposit_pct must be present when land_cost > EGP 10M
**Recommended Action:** Confirm whether the maintenance deposit has been included in the total project cost. If absent, add it: typically 3-5% of land cost, paid at permit issuance. Re-evaluate NPV and net profit after inclusion.
**Reason:** Omitting the maintenance deposit is a common oversight in financial models built without consulting a regulatory expert. It systematically overstates profit.
**Cross-Domain Reusability:** RE-SPECIFIC — this is an Egypt real estate regulatory requirement.

---

## Category: EXECUTION

Execution rules evaluate cost-side risks during the construction and delivery phase.

---

### RE-EXE-001 — Construction Cost Inflation Risk

**Status:** [NEW — P1] [UNIVERSAL]
**Business Purpose:** In inflationary economies, construction cost at year 3 of a 4-year execution period may be materially higher than the cost input at the time of the feasibility decision. A project that is NPV-positive based on current construction costs may be NPV-negative when inflation is applied through the execution period.
**Condition:** `inflation_rate_annual > 0.10` AND `execution_period_years > 2.0`
**Severity:** MEDIUM
**Blocking:** NO — advisory (WARN)
**Evidence Required:** `financial_projections` (for `inflation_rate_annual`), `technical_feasibility` (for `execution_period_years`)
**Threshold:** inflation_rate_annual ≤ 0.10 OR execution_period_years ≤ 2.0 (risk only applies when both conditions are present)
**Recommended Action:** Verify that the construction cost in the financial model is inflation-adjusted over the execution period. If it uses static current prices, re-run the financial model with an inflation coefficient applied quarterly.
**Reason:** A 15% annual inflation rate over a 4-year execution period compounds to approximately 75% cumulative cost increase. If the model uses today's construction cost for all 4 years, it is materially underestimating the actual cost.
**Cross-Domain Reusability:** UNIVERSAL — construction cost inflation applies to Hotels, Medical facilities, and any domain with multi-year capital construction.

---

### RE-EXE-002 — Land Payment vs. Cash Flow Alignment

**Status:** [NEW — P2] [RE-SPECIFIC]
**Business Purpose:** In Egyptian real estate, land is frequently purchased on installment (seller-financed), with quarterly payments spread over 3-5 years. If the land payment schedule front-loads large payments before significant sales revenue is collected, the financing gap is widened materially. This rule checks whether the payment alignment has been modeled.
**Condition:** `cash_flow_timing` evidence absent AND `land_cost > 10,000,000`
**Severity:** MEDIUM
**Blocking:** NO — reduces coverage score and triggers advisory
**Evidence Required:** `cash_flow_timing`, `land_terms`
**Threshold:** When land cost exceeds EGP 10M, cash flow timing evidence must be provided to accurately model the payment schedule alignment
**Recommended Action:** Provide the quarterly cash flow model that maps land installment outflows to sales installment inflows. The peak financing gap cannot be accurately computed without this alignment analysis.
**Reason:** Land payment schedules are one of the primary drivers of the financing gap. Ignoring the quarterly alignment overstates cash availability and understates the peak capital draw.
**Cross-Domain Reusability:** RE-SPECIFIC in content; the pattern (payment schedule alignment analysis for large installment-purchased assets) is relevant to other domains with installment asset acquisition.

---

## Category: RISK

Risk rules evaluate scenario-level threats and structural fragility.

---

### RE-RSK-001 — Pessimistic Scenario NPV Advisory

**Status:** [NEW — P2] [UNIVERSAL]
**Business Purpose:** A project with positive base-case NPV but negative pessimistic-scenario NPV is conditionally viable. The executive must know that the recommendation to Proceed holds only under base or better assumptions, and that materially worse market conditions flip the recommendation. This is not a blocking condition — it is a mandatory risk disclosure.
**Condition:** `pessimistic_npv <= 0` AND `computed_npv > 0`
**Severity:** HIGH
**Blocking:** NO — advisory (WARN)
**Evidence Required:** Named scenario analysis output
**Threshold:** pessimistic_npv > 0 preferred; pessimistic_npv ≤ 0 triggers this disclosure
**Recommended Action:** The executive must understand that under pessimistic assumptions, this project destroys value. Identify the specific assumptions that drive the pessimistic NPV below zero (typically: longer sales period, higher construction cost, lower price per sqm) and assess how likely those assumptions are to materialize.
**Reason:** Proceeding on a project that is NPV-negative under realistic downside assumptions is a material risk management concern. This rule makes that risk explicit rather than implied.
**Cross-Domain Reusability:** UNIVERSAL.

---

### RE-RSK-002 — High Scenario Divergence (Decision Fragility)

**Status:** [NEW — P2] [UNIVERSAL]
**Business Purpose:** When the NPV gap between optimistic and pessimistic scenarios is very large relative to the base case, the recommendation is highly sensitive to assumption accuracy. Small errors in market data, cost estimates, or sales velocity produce dramatically different outcomes. This is a fragility signal — the decision is correct only if assumptions are precisely right.
**Condition:** `scenario_divergence_ratio > 5.0`
**Severity:** HIGH
**Blocking:** NO — advisory (WARN)
**Evidence Required:** Named scenario analysis output
**Threshold:** scenario_divergence_ratio ≤ 5.0
**Recommended Action:** When scenario divergence is high, the decision should be conditioned on additional evidence — specifically the assumption that drives the most divergence. Do not proceed to execution without validating the most sensitive assumption against market data.
**Reason:** High scenario divergence means the project's viability depends heavily on one or two key assumptions being correct. The higher the divergence, the more the recommendation is a bet on those assumptions rather than a well-supported business decision.
**Cross-Domain Reusability:** UNIVERSAL.

---

### RE-RSK-003 — Construction Cost Evidence Freshness

**Status:** [NEW — P1] [UNIVERSAL]
**Business Purpose:** Construction cost evidence older than 90 days is materially unreliable in Egypt's inflationary environment. A cost estimate from 3 months ago may underestimate current costs by 5-10% or more depending on material price movements. Stale construction cost evidence degrades the reliability of NPV, IRR, and net profit calculations that depend on it.
**Condition:** Evaluated through the evidence freshness scoring system — `cost_estimates` evidence items older than 90 days receive degraded freshness scores.
**Severity:** HIGH (via confidence scoring)
**Blocking:** NO — degrades evidence_freshness dimension of confidence
**Evidence Required:** `cost_estimates`
**Threshold:** cost_estimates evidence freshness half-life: 90 days (2,160 hours)
**Recommended Action:** Update construction cost estimates from a current contractor quote or cost consultant. Do not rely on estimates from the previous fiscal quarter in an inflationary environment.
**Reason:** Construction cost is the largest single cost category in most real estate projects. Stale estimates directly invalidate the financial model. This is not handled by the existing 24h freshness half-life — a new `cost_estimate` source type with 2,160h (90-day) half-life is needed.
**Cross-Domain Reusability:** UNIVERSAL — construction cost evidence freshness applies to any capital construction project.

---

## Rule Priority Matrix

| Rule ID | Category | Blocking | Phase | Universal | Weight (suggested) |
|---------|----------|---------|-------|-----------|-------------------|
| RE-FIN-001 | Financial | YES | EXISTING | YES | 1.00 |
| RE-FIN-002 | Financial | YES | P1 | YES | 1.00 |
| RE-FIN-003 | Financial | YES | EXISTING | YES | 1.00 |
| RE-FIN-004 | Financial | YES | P1 | YES | 1.00 |
| RE-FIN-005 | Financial | NO | EXISTING | YES | 0.70 |
| RE-FIN-006 | Financial | NO | EXISTING | YES | 0.60 |
| RE-COM-001 | Commercial | NO | P1 | YES | 0.70 |
| RE-COM-002 | Commercial | NO | P3 | PARTIAL | 0.65 |
| RE-COM-003 | Commercial | NO | P2 | NO | 0.55 |
| RE-COM-004 | Commercial | NO | P2 | NO | 0.50 |
| RE-OPS-001 | Operational | NO | P1 | YES | 0.60 |
| RE-OPS-002 | Operational | NO | P2 | YES | 0.40 |
| RE-OPS-003 | Operational | NO | P2 | YES | 0.55 |
| RE-OPS-004 | Operational | NO | P1 | YES | 0.45 |
| RE-STR-001 | Strategic | NO | P1 | PARTIAL | 0.65 |
| RE-STR-002 | Strategic | NO | P2 | YES | 0.50 |
| RE-STR-003 | Strategic | NO | P2 | NO | 0.45 |
| RE-EXE-001 | Execution | NO | P1 | YES | 0.60 |
| RE-EXE-002 | Execution | NO | P2 | PARTIAL | 0.50 |
| RE-RSK-001 | Risk | NO | P2 | YES | 0.70 |
| RE-RSK-002 | Risk | NO | P2 | YES | 0.65 |
| RE-RSK-003 | Risk | NO | P1 | YES | 0.60 |

---

## Rule Dependency Map

```
RE-FIN-001 (NPV Gate)
  └── depends on: computed_npv, financial_projections evidence

RE-FIN-002 (IRR Gate) ← [NEW P1, HIGHEST PRIORITY]
  └── depends on: computed_irr_annual, hurdle_rate, financial_projections evidence

RE-FIN-003 (Net Profit Gate)
  └── depends on: computed_net_profit, financial_projections evidence

RE-FIN-004 (Financing Gap Gate) ← [NEW P1, HIGHEST PRIORITY]
  └── depends on: computed_peak_financing_gap, computed_available_capital
  └── requires: cash_flow_timing evidence (to compute peak gap)

RE-OPS-004 (Operational Overhead Underbudget) ← [NEW P1]
  └── depends on: ops_engineering_consulting_pct, ops_licensing_pct, ops_supervision_pct, construction_cost_total, ops_hq_cost_total

RE-COM-001 (Sales Period) ← [NEW P1]
  └── depends on: sales_period_years
  └── enables: automatic ±20% scenario analysis on sales_period_years

RE-EXE-001 (Inflation Risk) ← [NEW P1]
  └── depends on: inflation_rate_annual, execution_period_years

RE-STR-001 (Activity Mix Coverage) ← [NEW P1]
  └── depends on: commercial_mix_pct, medical_mix_pct, administrative_mix_pct
  └── requires: activity_mix_financial evidence

RE-RSK-001 (Pessimistic NPV) ← [NEW P2]
  └── depends on: pessimistic_npv (from named scenario analysis — requires P2.1)

RE-RSK-002 (Scenario Divergence) ← [NEW P2]
  └── depends on: scenario_divergence_ratio (from named scenario analysis — requires P2.1)
```
