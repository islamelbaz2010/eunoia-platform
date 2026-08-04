# Real Estate Decision Intelligence — Scenario Library

**Classification:** Engineering Architecture — Internal Only
**Version:** 1.0
**Date:** 2026-08-03
**Author:** Chief Decision Intelligence Architect
**Status:** AWAITING EXECUTIVE APPROVAL

---

## Purpose

This document defines every decision scenario for Real Estate feasibility analysis. Scenarios represent coherent, realistic alternative assumptions that test whether a decision recommendation holds under different market and execution conditions.

Scenarios fall into two tiers:
- **Named Scenarios** (Base, Optimistic, Pessimistic): Full coherent assumption sets. Applied simultaneously to test the full range of plausible outcomes. Implemented in P2.1.
- **Stress Scenarios** (all others): Single-axis or dual-axis shocks to specific parameters. Used to isolate specific risk drivers. These extend the existing ±20% scenario engine with named, interpretable scenarios.

Scenarios marked **[UNIVERSAL]** apply to any investment domain. Scenarios marked **[RE-SPECIFIC]** contain Real Estate knowledge.

Each scenario specifies:
- **Scenario Name and ID**
- **Business Interpretation** (what market or execution condition this scenario represents)
- **Modified Inputs** (which parameters change and by how much)
- **Affected Downstream Parameters** (what those input changes propagate to)
- **Expected Decision Impact** (what the recommendation and confidence should look like)
- **Executive Narrative** (how this scenario should be described to a CEO)

---

## TIER 1 — Named Scenarios

Named scenarios represent complete, internally consistent views of project outcomes. They are not parameter variations — they are alternative realities. All three must be run together; the gap between them defines the decision risk range.

---

### SCN-BASE-001 — Base Case

**Scenario ID:** SCN-BASE-001
**Type:** Named Scenario — Tier 1
**Status:** [UNIVERSAL]

**Business Interpretation**
The most likely outcome given current market conditions, validated cost estimates, and a realistic sales pace based on comparable projects in the same district. This is the primary scenario on which the recommendation is based.

**Modified Inputs vs. Default**
No modifications. All parameters at their stated values.

**Affected Downstream Parameters**
All parameters at stated values. NPV, IRR, annual ROI, break-even quarter are as computed in the financial model.

**Expected Decision Impact**
The base case defines the primary recommendation. If the base case recommends Proceed, the named scenario comparison will show whether that recommendation holds under pessimistic conditions.

**Executive Narrative**
"Under the most likely market and execution conditions, the project returns [X]% annually with a net present value of [Y] at the 20% discount rate. Break-even is expected at quarter [Z]."

---

### SCN-OPT-001 — Optimistic Case

**Scenario ID:** SCN-OPT-001
**Type:** Named Scenario — Tier 1
**Status:** [UNIVERSAL]

**Business Interpretation**
Favorable market conditions: faster-than-expected unit sales, price appreciation above the base assumption, and controlled construction costs at or below budget. Represents the upside potential if market demand is strong and execution is efficient.

**Modified Inputs**
| Parameter | Base Value | Optimistic Modification | Rationale |
|-----------|-----------|------------------------|-----------|
| sales_period_years | Base | Reduce by 25% (e.g., 2.5 → 1.88 years) | Strong demand, better-than-average absorption |
| price_per_sqm_residential | Base | Increase by 10% | Market price appreciation exceeding base assumption |
| price_per_sqm_commercial | Base | Increase by 10% | Same market appreciation |
| price_per_sqm_administrative | Base | Increase by 10% | Same |
| price_per_sqm_medical | Base | Increase by 8% | Slightly lower appreciation — medical slower |
| inflation_rate_annual | Base | Decrease by 3 pp (e.g., 15% → 12%) | Better-than-expected construction cost control |

**Affected Downstream Parameters**
- `computed_npv` increases (higher revenue, faster collection, lower costs)
- `computed_irr_annual` increases
- `computed_annual_roi` increases
- `computed_peak_financing_gap` decreases (faster inflows)
- `computed_break_even_quarter` decreases

**Expected Decision Impact**
All financial gates pass with wider margin. Confidence band moves toward VERY_HIGH. The optimistic scenario establishes the upside ceiling of the investment's return range.

**Executive Narrative**
"If the market performs above average — with faster unit sales and price appreciation — the project returns [X%] annually, with break-even achieved at quarter [Z]. This represents the investment's upside potential."

---

### SCN-PESS-001 — Pessimistic Case

**Scenario ID:** SCN-PESS-001
**Type:** Named Scenario — Tier 1
**Status:** [UNIVERSAL]

**Business Interpretation**
Adverse market conditions: slower-than-expected unit sales, price appreciation below the base assumption, and higher-than-budgeted construction costs from inflation. This is not a crisis scenario — it is a realistic representation of how projects often underperform their base case assumptions.

**Modified Inputs**
| Parameter | Base Value | Pessimistic Modification | Rationale |
|-----------|-----------|--------------------------|-----------|
| sales_period_years | Base | Increase by 40% (e.g., 2.5 → 3.5 years) | Slower market absorption than expected |
| price_per_sqm_residential | Base | Decrease by 10% | Price appreciation fails to materialize; competitive pressure |
| price_per_sqm_commercial | Base | Decrease by 12% | Commercial harder to sell than residential |
| price_per_sqm_administrative | Base | Decrease by 10% | |
| price_per_sqm_medical | Base | Decrease by 8% | Medical demand more stable than residential |
| inflation_rate_annual | Base | Increase by 5 pp (e.g., 15% → 20%) | Inflation shock increases construction costs |
| marketing_cost_pct | Base | Increase by 2 pp (e.g., 5% → 7%) | Higher marketing spend needed to move slower units |

**Affected Downstream Parameters**
- `computed_npv` decreases significantly (lower revenue, delayed collection, higher costs)
- `computed_irr_annual` decreases — may fall below hurdle rate
- `computed_annual_roi` decreases
- `computed_peak_financing_gap` increases (slower inflows extend the gap duration)
- `computed_break_even_quarter` increases
- `pessimistic_npv` = the NPV computed under this scenario

**Expected Decision Impact**
If `pessimistic_npv ≤ 0`: RE-RSK-001 fires. If `pessimistic_irr < hurdle_rate`: confirms that the project is viable only under base or better assumptions. This is the critical decision signal for the executive: "Is this project robust, or is it sensitive to downside?"

**Executive Narrative**
"If market conditions are unfavorable — with slower sales, price pressure, and higher construction costs — the project returns [X%] annually with NPV of [Y]. Under these conditions, [the project remains viable / the project turns NPV-negative]. This defines your downside risk."

---

## TIER 2 — Stress Scenarios

Stress scenarios isolate specific risk drivers. Each scenario modifies one or two parameters to test a specific business risk question.

---

### SCN-CFD-001 — Cash Flow Delay

**Scenario ID:** SCN-CFD-001
**Type:** Stress Scenario — Tier 2
**Status:** [UNIVERSAL]

**Business Interpretation**
Payment collections from buyers are delayed beyond the assumed schedule. This happens when buyers default on installment obligations, or when developer-financed installment terms are extended as a sales incentive. The cash flow timing model remains the same structurally, but collection occurs 2 quarters later than projected.

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| installment_collection_period_quarters | Increase by 2 quarters |
| down_payment_pct | Decrease by 5% (extended terms reduce upfront collection) |

**Affected Downstream Parameters**
- `computed_peak_financing_gap`: increases (inflows delayed)
- `computed_break_even_quarter`: increases by approximately 2 quarters
- `computed_npv`: decreases slightly (delayed cash has lower discounted value)
- `computed_irr_annual`: decreases

**Expected Decision Impact**
Tests whether the financing gap gate (RE-FIN-004) would still pass if collections are delayed. A project that barely passes the financing gate under base assumptions may fail under cash flow delay.

**Executive Narrative**
"If buyers delay payments by 6 months beyond contract terms — a common scenario in market downturns — the project requires [X] additional capital at peak draw. [Your available capital of Y covers / does not cover] this gap."

---

### SCN-CINF-001 — Construction Inflation Shock

**Scenario ID:** SCN-CINF-001
**Type:** Stress Scenario — Tier 2
**Status:** [UNIVERSAL]

**Business Interpretation**
A sudden increase in construction material costs — driven by currency devaluation, import disruption, or commodity price spikes. Egypt has experienced multiple such shocks. This scenario tests the project's financial resilience to a 20% increase in construction cost.

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| construction_cost_per_sqm_residential | Increase by 20% |
| construction_cost_per_sqm_commercial | Increase by 20% |
| construction_cost_per_sqm_administrative | Increase by 20% |
| construction_cost_per_sqm_medical | Increase by 20% |
| inflation_rate_annual | Increase by 8 pp |

**Affected Downstream Parameters**
- `total_project_cost`: increases significantly
- `construction_cost_total`: increases by 20%
- `computed_net_profit`: decreases (higher costs)
- `computed_npv`: decreases
- `computed_irr_annual`: decreases
- `computed_annual_roi`: decreases

**Expected Decision Impact**
Tests whether NPV gate (RE-FIN-001) and IRR gate (RE-FIN-002) still pass when construction costs are 20% above budget. A project with tight margins may fail financially under this shock.

**Executive Narrative**
"A 20% construction cost increase — consistent with [Egypt's 2022/2023 inflationary period] — would increase total project cost to [X] and reduce net profit to [Y]. Under these conditions, [the project remains viable / NPV turns negative / IRR falls below 20%]."

---

### SCN-SLOW-001 — Sales Slowdown

**Scenario ID:** SCN-SLOW-001
**Type:** Stress Scenario — Tier 2
**Status:** [UNIVERSAL]

**Business Interpretation**
Unit sales proceed significantly slower than the base assumption. This is the most common cause of real estate project financial distress in Egypt. This scenario extends the sales period by 1 full year beyond the base case.

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| sales_period_years | Increase by 1.0 year |
| sales_velocity_pct_year1 | Decrease by 20% (units that were sold in year 1 now sell in year 2) |
| sales_velocity_pct_year2 | Decrease by 15% (year 2 slower) |
| marketing_cost_pct | Increase by 1.5% (more marketing to move slower units) |

**Affected Downstream Parameters**
- `computed_irr_annual`: material decrease — the most IRR-sensitive scenario
- `computed_annual_roi`: decreases (same profit, more years)
- `computed_peak_financing_gap`: increases (inflows delayed by 1 year)
- `computed_break_even_quarter`: increases by approximately 4 quarters

**Expected Decision Impact**
This scenario most aggressively tests the IRR gate (RE-FIN-002). A project that passes IRR at 22% in the base case may fail at 17% under 1-year sales extension. If the scenario engine stability assessment shows this scenario flips the recommendation: stability = FRAGILE.

**Executive Narrative**
"If unit sales take one year longer than projected — a historically common outcome for new developments — annual return drops to [X%] and IRR falls to [Y%]. [This remains above the 20% market minimum / this falls below the 20% threshold, making the project unviable under this scenario]."

---

### SCN-SACC-001 — Sales Acceleration

**Scenario ID:** SCN-SACC-001
**Type:** Stress Scenario — Tier 2
**Status:** [UNIVERSAL]

**Business Interpretation**
Unit sales proceed faster than the base assumption — a positive scenario. Sales velocity 30% higher than base. This tests whether the recommendation improves significantly under favorable conditions (upside scenario for marketing and sales).

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| sales_period_years | Decrease by 30% |
| sales_velocity_pct_year1 | Increase by 25% |

**Affected Downstream Parameters**
- `computed_irr_annual`: increases
- `computed_annual_roi`: increases
- `computed_peak_financing_gap`: decreases
- `computed_break_even_quarter`: decreases

**Expected Decision Impact**
Establishes the upside potential from sales execution excellence. Used to answer: "How much does an aggressive sales team change the financial outcome?"

**Executive Narrative**
"With a high-performance sales team achieving 30% faster absorption than market average, IRR rises to [X%] and break-even is reached by quarter [Z]. This scenario represents the reward for superior sales execution."

---

### SCN-CAPS-001 — Capital Shortage

**Scenario ID:** SCN-CAPS-001
**Type:** Stress Scenario — Tier 2
**Status:** [UNIVERSAL]

**Business Interpretation**
The developer's available capital is reduced — due to a parallel project draw, unexpected expense, or partner withdrawal. This scenario reduces `computed_available_capital` by 20% to test whether the financing gap gate still passes.

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| computed_available_capital | Decrease by 20% |

**Affected Downstream Parameters**
- RE-FIN-004 gate evaluation changes
- Financing gap margin narrows or turns negative

**Expected Decision Impact**
A capital shortage of 20% should not cause the project to fail RE-FIN-004 if there was a comfortable capital buffer. If the available capital was already tight, this scenario surfaces the financing risk.

**Executive Narrative**
"If 20% of committed capital becomes unavailable — a scenario that can arise from parallel project demands or delayed partner funding — [the project retains sufficient capital / the financing gap exceeds available capital, requiring immediate bridge financing]."

---

### SCN-PRED-001 — Price Reduction

**Scenario ID:** SCN-PRED-001
**Type:** Stress Scenario — Tier 2
**Status:** [UNIVERSAL]

**Business Interpretation**
Selling prices for all unit types are forced down — due to competitive pressure, market softening, or developer decision to discount to accelerate sales. Tests price sensitivity of the financial model.

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| price_per_sqm_residential | Decrease by 15% |
| price_per_sqm_commercial | Decrease by 15% |
| price_per_sqm_administrative | Decrease by 15% |
| price_per_sqm_medical | Decrease by 10% (medical demand more inelastic) |

**Affected Downstream Parameters**
- `total_revenue`: decreases by approximately 15%
- `computed_net_profit`: decreases significantly
- `computed_npv`: decreases
- `computed_irr_annual`: decreases

**Expected Decision Impact**
15% price reduction is a realistic scenario in a competitive market or when early sales momentum is weak. If NPV gate or IRR gate fails under this scenario, the project is price-sensitive and the decision should be conditioned on confirming price achievability.

**Executive Narrative**
"A 15% price reduction — which may be necessary to compete or accelerate sales — reduces net profit to [X] and NPV to [Y]. [The project remains viable / NPV turns negative]. This defines your price floor: below [Z] EGP/sqm, the project does not create value."

---

### SCN-PINC-001 — Price Increase

**Scenario ID:** SCN-PINC-001
**Type:** Stress Scenario — Tier 2
**Status:** [UNIVERSAL]

**Business Interpretation**
Prices rise above the base assumption due to successful brand positioning, market appreciation, or early demand confirmation at launch. Tests how much the financial outcome improves with price appreciation.

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| price_per_sqm_residential | Increase by 15% |
| price_per_sqm_commercial | Increase by 12% |
| price_per_sqm_administrative | Increase by 12% |
| price_per_sqm_medical | Increase by 10% |

**Affected Downstream Parameters**
- `total_revenue`: increases
- `computed_net_profit`: increases
- `computed_npv`: increases
- `computed_irr_annual`: increases

**Expected Decision Impact**
Shows how much additional return is available through pricing strategy. Relevant for options being evaluated: "Proceed at base price" vs. "Launch at premium price."

**Executive Narrative**
"A 15% price premium — achievable through product differentiation and delayed launch until market conditions improve — increases net profit to [X] and IRR to [Y%]. This scenario represents the value of market timing and brand positioning."

---

### SCN-COMP-001 — Competitor Entry

**Scenario ID:** SCN-COMP-001
**Type:** Stress Scenario — Tier 2
**Status:** [RE-SPECIFIC]

**Business Interpretation**
A competing project launches in the same district with comparable product and similar pricing. This compresses absorption rate (units sold per quarter decrease as the market is split) and applies mild price pressure.

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| sales_period_years | Increase by 35% (market share divided with competitor) |
| price_per_sqm_residential | Decrease by 8% (competitive pricing pressure) |
| price_per_sqm_commercial | Decrease by 10% |
| marketing_cost_pct | Increase by 1% (higher marketing effort to compete) |

**Affected Downstream Parameters**
- `computed_irr_annual`: decreases (slower sales + lower prices)
- `computed_annual_roi`: decreases
- `computed_peak_financing_gap`: increases (slower inflows)
- `computed_net_profit`: decreases

**Expected Decision Impact**
Tests whether the recommendation survives a realistic competitive threat. Many feasibility models ignore competitive supply — this scenario corrects that.

**Executive Narrative**
"If a comparable competing project launches in the same district during your sales period, absorption rate will slow and prices will face downward pressure. Under this scenario, your IRR [remains at X% / falls to Y%]. The competitive risk [is manageable / would require adjusting your sales strategy]."

---

### SCN-MKTS-001 — Market Slowdown

**Scenario ID:** SCN-MKTS-001
**Type:** Stress Scenario — Tier 2
**Status:** [RE-SPECIFIC]

**Business Interpretation**
A broad real estate market slowdown in the Egypt market — not a crisis, but a period of reduced demand activity. Sales velocity drops 40% below the base assumption and prices soften 10-15%.

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| sales_period_years | Increase by 60% (1.6× base sales period) |
| price_per_sqm_residential | Decrease by 12% |
| price_per_sqm_commercial | Decrease by 15% |
| price_per_sqm_administrative | Decrease by 12% |
| price_per_sqm_medical | Decrease by 8% |
| marketing_cost_pct | Increase by 2% |

**Affected Downstream Parameters**
- Multiple financial gates affected simultaneously
- `computed_peak_financing_gap`: may increase substantially
- `computed_irr_annual`: likely to approach or fall below hurdle rate
- `computed_break_even_quarter`: extends significantly

**Expected Decision Impact**
This scenario typically flips PROCEED recommendations to REVISE or DEFER for projects with tight margins. Projects with ROBUST stability (from the scenario engine) survive this scenario; FRAGILE projects do not.

**Executive Narrative**
"Under a broad market slowdown — comparable to [2016/2023 periods] — with 60% longer sales timeline and 12% price pressure, IRR falls to [X%] and NPV to [Y]. [The project remains above the investment minimum / the project falls below acceptable returns]. Management should confirm project launch timing before a market slowdown period."

---

### SCN-ECRI-001 — Economic Crisis

**Scenario ID:** SCN-ECRI-001
**Type:** Stress Scenario — Tier 2
**Status:** [RE-SPECIFIC]

**Business Interpretation**
A severe macroeconomic disruption: currency devaluation, inflation spike, interest rate surge, or systemic market freeze. This is a tail-risk scenario, not a base expectation. Used to answer: "What is the absolute worst case?"

**Modified Inputs**
| Parameter | Modification |
|-----------|-------------|
| sales_period_years | Increase by 100% (2× base — units nearly stop selling) |
| price_per_sqm_residential | Decrease by 20% in EGP terms (real devaluation) |
| price_per_sqm_commercial | Decrease by 25% |
| price_per_sqm_administrative | Decrease by 20% |
| price_per_sqm_medical | Decrease by 15% |
| inflation_rate_annual | Increase by 15 pp (construction cost surge) |
| marketing_cost_pct | Increase by 3% |
| computed_available_capital | Decrease by 30% (liquidity crisis) |

**Affected Downstream Parameters**
- All financial metrics severely impacted
- High probability of RE-FIN-001, RE-FIN-002, RE-FIN-004 all failing simultaneously
- Break-even quarter extends to potentially 16+ quarters

**Expected Decision Impact**
Almost no real estate project survives this scenario intact. The purpose is not to block decisions — it is to answer: "If this scenario materializes during execution, what is the exit or pause strategy?" Projects with phased development structures have better crisis resilience than those with single large land payments.

**Executive Narrative**
"Under an economic crisis scenario — severe enough to double the sales period and increase construction costs by 15% — this project would face [a capital shortfall of X / NPV of Y]. Crisis resilience would require [additional capital of Z / project phasing / exit at phase boundary]. This scenario represents the tail risk that should inform your risk mitigation planning."

---

## Scenario Application Guide

### For Named Scenarios (Tier 1)
Run SCN-BASE-001, SCN-OPT-001, and SCN-PESS-001 together for every feasibility decision. The gap between their NPV outcomes determines decision stability:

| pessimistic_npv | base_npv | Stability | Recommendation |
|-----------------|----------|-----------|----------------|
| > 0 | > 0 | ROBUST | Proceed — viable in all named scenarios |
| ≤ 0 | > 0 | FRAGILE | Proceed with explicit downside risk disclosure |
| ≤ 0 | ≤ 0 | BLOCKED | Base case already failing — Revise or Defer |

### For Stress Scenarios (Tier 2)
Select the stress scenarios most relevant to the specific risk profile of the project:
- High commercial mix → run SCN-SLOW-001 and SCN-COMP-001
- Long execution period → run SCN-CINF-001
- Tight capital → run SCN-CAPS-001 and SCN-CFD-001
- Long sales period already assumed → run SCN-MKTS-001
- Large project in uncertain district → run all Tier 2 scenarios

### Scenario Result Interpretation
| Scenarios Failed | Business Interpretation |
|-----------------|------------------------|
| 0 of all scenarios | Decision is robust — proceed with standard monitoring |
| 1-2 Tier 2 scenarios | Decision is moderately fragile — add specific monitoring for those risk drivers |
| 3+ Tier 2 or any Named Scenario | Decision is fragile — executive review before commitment |
| Base Named Scenario fails | Do not proceed — fundamental viability question |
