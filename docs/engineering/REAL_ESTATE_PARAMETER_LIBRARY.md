# Real Estate Decision Intelligence — Parameter Library

**Classification:** Engineering Architecture — Internal Only
**Version:** 1.0
**Date:** 2026-08-03
**Author:** Chief Decision Intelligence Architect
**Status:** AWAITING EXECUTIVE APPROVAL

---

## Purpose

This document is the canonical parameter catalog for Real Estate decision inputs supplied to the Eunoia Decision Intelligence Engine via `context.parameters`. Every parameter listed here is a named key in the flat parameters map. Rules reference parameters via `factPath` using these exact names.

Parameters marked **[UNIVERSAL]** apply to any investment domain and will be reused by Hotels, Medical, Restaurants, and future verticals. Parameters marked **[RE-SPECIFIC]** are Real Estate concepts.

Parameters marked **[EXISTING]** are already present in the engine or benchmark cases. Parameters marked **[NEW — P1]**, **[NEW — P2]**, or **[NEW — P3]** are being introduced in the corresponding phase.

---

## Group 1 — Return Metrics

These are the primary output metrics of the financial model. They answer: "Is this investment worth making?"

---

### `computed_npv`

**Status:** [EXISTING] [UNIVERSAL]
**Description:** Net Present Value of all project cash flows discounted at the hurdle rate. Positive NPV means the project creates value above the minimum required return. Negative NPV means the project destroys value.
**Unit:** Currency (EGP)
**Allowed Range:** Any real number (negative values are valid and trigger the FAIL gate)
**How Calculated:** Sum of (cash flow in period t) / (1 + hurdle_rate)^t for all periods t, minus initial investment. Computed externally by the financial model layer.
**Required Evidence:** `financial_projections` (mandatory), `cash_flow_timing` (required for accuracy)
**Validation Rules:** Must be a finite number. Values below −1,000,000,000,000 are implausible and should trigger a validation warning.
**Confidence Impact:** Rule compliance dimension — the NPV rule is the highest-weight feasibility rule. A passing NPV strongly supports rule compliance score.
**Example:** `computed_npv: 12500000` (EGP 12.5M positive NPV — passes gate)

---

### `computed_irr_annual`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Annual Internal Rate of Return. The discount rate at which the project's NPV equals zero. Measures the effective annualized return rate of the investment. If IRR exceeds the hurdle rate, the project returns more than the market minimum. If IRR is below the hurdle rate, the project underperforms the market regardless of whether NPV is positive.
**Unit:** Decimal rate (e.g., 0.22 = 22%)
**Allowed Range:** −1.0 to 10.0 (negative IRR indicates net loss; values above 10.0 = 1000% are implausible)
**How Calculated:** Numerical root-finding (Newton-Raphson or bisection) on the cash flow sequence. Computed externally. For irregular cash flows, use XIRR (see `computed_xirr_annual`).
**Required Evidence:** `financial_projections` (mandatory), `cash_flow_timing` (required for accurate IRR)
**Validation Rules:**
- Must be a finite number
- Must be supplied alongside `hurdle_rate` for the gate rule to evaluate
- Values above 5.0 (500%) trigger a data quality warning — likely a modeling error
**Confidence Impact:** Rule compliance dimension — the IRR gate is a primary blocking condition. A failing IRR rule significantly penalizes rule compliance score.
**Example:** `computed_irr_annual: 0.26` (26% IRR — passes the 20% hurdle rate gate)

---

### `computed_xirr_annual`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** Extended IRR — computed from irregular cash flow timing (actual calendar dates rather than equal periods). More accurate than standard IRR when construction draws and sales collections do not align to regular quarterly intervals.
**Unit:** Decimal rate
**Allowed Range:** −1.0 to 10.0
**How Calculated:** XIRR algorithm applied to cash flows with their actual dates. Computed externally.
**Required Evidence:** `cash_flow_timing` (mandatory for XIRR)
**Validation Rules:** Must be within 5 percentage points of `computed_irr_annual`. Larger divergence indicates irregular cash flow timing that significantly distorts the standard IRR.
**Confidence Impact:** When supplied alongside `computed_irr_annual`, increases evidence consistency score (two independent return metrics in agreement).
**Example:** `computed_xirr_annual: 0.24` (24% XIRR vs. 26% standard IRR — acceptable divergence)

---

### `computed_mirr_annual`

**Status:** [NEW — P3] [UNIVERSAL]
**Description:** Modified Internal Rate of Return. Corrects for the assumption in standard IRR that cash flows are reinvested at the IRR rate itself (often unrealistic). Uses a separate reinvestment rate (typically the cost of capital) for positive cash flows and a finance rate for negative flows. More conservative and more realistic than IRR for long-duration projects.
**Unit:** Decimal rate
**Allowed Range:** −1.0 to 5.0
**How Calculated:** Computed externally using the MIRR formula with a specified reinvestment rate and finance rate.
**Required Evidence:** `financial_projections`, `capital_structure` (to know reinvestment and finance rates)
**Validation Rules:** MIRR must be ≤ IRR (by definition — reinvestment at a lower rate reduces the effective return)
**Confidence Impact:** When MIRR > hurdle_rate, adds to rule compliance confidence. When MIRR < IRR significantly (> 5 pp), notes the reinvestment assumption sensitivity.
**Example:** `computed_mirr_annual: 0.21` (21% MIRR vs. 26% IRR — reinvestment adjustment reduces effective return)

---

### `computed_annual_roi`

**Status:** [EXISTING] [UNIVERSAL]
**Description:** Annual Return on Investment. Net profit after tax divided by total project cost, then divided by project duration in years. A simple, intuitive return metric understood by all executives. Not a substitute for IRR — it ignores time value of money.
**Unit:** Decimal rate per year
**Allowed Range:** −1.0 to 10.0 (negative = loss; above 10.0 implausible for real estate)
**How Calculated:** (net_profit_after_tax / total_project_cost) / total_project_duration_years
**Required Evidence:** `financial_projections` (mandatory)
**Validation Rules:** Must be consistent with `computed_irr_annual` — if ROI > IRR by more than 15 percentage points, flag a potential modeling inconsistency.
**Confidence Impact:** Existing rule engine uses this as a WARN gate (< 8%) and as a negative signal for Defer/Revise options.
**Example:** `computed_annual_roi: 0.18` (18% annual ROI — above the 8% minimum threshold)

---

### `computed_annual_roe`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** Annual Return on Equity. Net profit after tax divided by equity invested, then divided by project duration. Relevant for leveraged projects where debt reduces the equity required. ROE > ROI indicates the project benefits from leverage.
**Unit:** Decimal rate per year
**Allowed Range:** −2.0 to 20.0 (leverage can amplify both gains and losses)
**How Calculated:** (net_profit_after_tax / equity_amount) / total_project_duration_years
**Required Evidence:** `financial_projections`, `capital_structure`
**Validation Rules:** If `debt_amount = 0`, then ROE must equal ROI (all-equity project). If ROE < ROI, the leverage is value-destructive (interest cost exceeds return amplification).
**Confidence Impact:** Supplementary metric. Does not directly gate but adds richness to the financial evidence set (evidence volume dimension).
**Example:** `computed_annual_roe: 0.28` (28% ROE vs. 18% ROI — leverage is beneficial)

---

### `computed_np_ratio`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** Net Profit Ratio (also called Net Profit Margin or NP Ratio). Net profit after tax divided by total revenue. Expresses what percentage of revenue the project keeps as profit. Used to track margin erosion across scenarios and compare projects of different scales.
**Unit:** Decimal ratio (0.0 to 1.0)
**Allowed Range:** −1.0 to 1.0 (negative = loss)
**How Calculated:** net_profit_after_tax / total_revenue
**Required Evidence:** `financial_projections`
**Validation Rules:** Must be less than 1.0. If NP ratio > 0.6, verify that all cost categories (tax, marketing, sales commission) are properly included.
**Confidence Impact:** Supplementary. Adds to evidence volume.
**Example:** `computed_np_ratio: 0.32` (32% net profit margin)

---

### `computed_profitability_index`

**Status:** [NEW — P3] [UNIVERSAL]
**Description:** Profitability Index (also called NPV Ratio or Benefit-Cost Ratio). NPV divided by the initial investment. Used to rank competing projects when capital is constrained — a project with PI > 1 creates more NPV per unit of capital than a project with PI < 1, even if their absolute NPVs differ.
**Unit:** Dimensionless ratio
**Allowed Range:** −10.0 to 100.0
**How Calculated:** computed_npv / initial_equity_investment
**Required Evidence:** `financial_projections`, `capital_structure`
**Validation Rules:** PI > 1.0 means NPV is positive (consistent with NPV gate). PI < 0 means NPV is negative.
**Confidence Impact:** Useful when multiple options are compared — option with highest PI among passing options should be recommended.
**Example:** `computed_profitability_index: 1.45` (NPV 45% greater than initial investment)

---

## Group 2 — Cash Flow and Capital Metrics

These metrics answer: "Will we have enough cash at every point in the project timeline?"

---

### `computed_peak_financing_gap`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** The maximum negative cumulative cash position during the project execution period. Represents the maximum additional capital the developer must have available beyond what is generated internally. A project can have positive NPV and IRR but still fail if the peak financing gap exceeds what the developer can fund.
**Unit:** Currency (EGP, absolute value — positive number representing a cash shortfall)
**Allowed Range:** 0 to any positive number (0 = project self-funds from inception, no external capital needed after initial investment)
**How Calculated:** Maximum of (absolute value of cumulative net cash flow) across all periods where cumulative net cash flow is negative. Computed externally from the quarterly cash flow model.
**Required Evidence:** `cash_flow_timing` (mandatory), `financial_projections`
**Validation Rules:**
- Must be a non-negative number
- Must be supplied alongside `computed_available_capital` for the gate rule to evaluate
- If peak_financing_gap = 0, verify: this is rare for development projects and may indicate a modeling error
**Confidence Impact:** When `cash_flow_timing` evidence is absent, this parameter cannot be supplied accurately — the coverage penalty applies.
**Example:** `computed_peak_financing_gap: 35000000` (EGP 35M peak capital draw)

---

### `computed_available_capital`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Total equity capital the developer has available and committed to this specific project. Not total developer equity — specifically the capital allocated and accessible for this project's financing gap.
**Unit:** Currency (EGP)
**Allowed Range:** 0 to any positive number
**How Calculated:** Supplied directly by the developer as a declaration. Not computed from the financial model — it is a constraint input, not a model output.
**Required Evidence:** `capital_structure` (authoritative source for this declaration)
**Validation Rules:**
- Must be a positive number
- Should be validated against the developer's stated equity position for plausibility
- If `computed_available_capital` < total project cost, verify leverage/financing plan
**Confidence Impact:** When supplied with high-authority evidence (`human_validation`), strengthens rule compliance score. When supplied as `user_input` only, the capital gate passes but confidence is penalized.
**Example:** `computed_available_capital: 50000000` (EGP 50M committed capital)

---

### `computed_break_even_quarter`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** The quarter number (counting from project start) in which cumulative net cash flow first turns positive. Quarter 1 = first three months of the project. Measures how long the developer is "in the red" before the project starts returning capital.
**Unit:** Quarter number (integer ≥ 1)
**Allowed Range:** 1 to 40 (40 quarters = 10 years; beyond 10 years is implausible for feasibility)
**How Calculated:** The first quarter t where cumulative_net_cash_flow(t) ≥ 0. Computed externally from the quarterly cash flow model.
**Required Evidence:** `cash_flow_timing` (mandatory)
**Validation Rules:**
- Must be a positive integer
- Must be ≤ total_project_duration_years × 4
- If break_even_quarter ≤ 2, verify: very early break-even is unusual and may indicate a modeling error (down payments might be mismodeled as revenue at inception)
**Confidence Impact:** Advisory rule fires when break-even quarter exceeds 8 (2 years). This is a non-blocking signal but contributes to rule compliance dimension.
**Example:** `computed_break_even_quarter: 6` (break-even at Q6 — 18 months, within acceptable range)

---

### `computed_net_profit`

**Status:** [EXISTING] [UNIVERSAL]
**Description:** Total net profit after tax over the full project life. The bottom-line financial result.
**Unit:** Currency (EGP)
**Allowed Range:** Any real number (negative = loss)
**How Calculated:** Total revenue − total cost − tax. Computed externally.
**Required Evidence:** `financial_projections`
**Validation Rules:** Must be consistent with `computed_annual_roi` × `total_project_cost` × `total_project_duration_years`.
**Confidence Impact:** Existing blocking rule: net profit ≤ 0 → FAIL.
**Example:** `computed_net_profit: 22000000` (EGP 22M net profit)

---

## Group 3 — Capital Structure

These parameters describe how the project is funded and at what cost.

---

### `equity_amount`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** Total equity invested in the project by the developer (own capital, not borrowed).
**Unit:** Currency (EGP)
**Allowed Range:** > 0
**How Calculated:** Supplied directly. Part of the capital structure declaration.
**Required Evidence:** `capital_structure`
**Validation Rules:** equity_amount + debt_amount should approximately equal total_project_cost (within 5% for modeling precision).
**Confidence Impact:** Supports evidence volume. Used in ROE computation.
**Example:** `equity_amount: 40000000` (EGP 40M equity)

---

### `debt_amount`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** Total debt financing (bank loans, partner debt, construction financing) for the project.
**Unit:** Currency (EGP)
**Allowed Range:** ≥ 0
**How Calculated:** Supplied directly. May be zero for all-equity projects.
**Required Evidence:** `capital_structure`
**Validation Rules:** If debt_amount > 0, `financing_cost_pct` must also be supplied.
**Confidence Impact:** Used in ROE computation and WACC derivation (P3).
**Example:** `debt_amount: 15000000` (EGP 15M debt financing)

---

### `hurdle_rate`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** The minimum acceptable annual return rate for this investment, expressed as a decimal. In Egypt real estate, the market convention is 0.20 (20%). This is not the risk-free rate — it is the minimum return the market requires for a real estate development investment given all associated risks.
**Unit:** Decimal rate
**Allowed Range:** 0.05 to 0.50 (5% minimum for any investment; 50% maximum is implausible as a minimum threshold)
**How Calculated:** Market convention for the domain. For Egypt real estate: 0.20. For other markets, different values apply. Supplied as a configuration input, not computed from the financial model.
**Required Evidence:** `market_data` (for confirmation that 0.20 is appropriate for the current market)
**Validation Rules:**
- Must be a positive number between 0.05 and 0.50
- If `hurdle_rate` differs from 0.20 for Egypt real estate, an advisory note should explain the deviation
**Confidence Impact:** Used in IRR gate and NPV calculation. Incorrect hurdle rate invalidates both financial gates.
**Example:** `hurdle_rate: 0.20` (20% — Egypt real estate market standard)

---

### `financing_cost_pct`

**Status:** [NEW — P3] [UNIVERSAL]
**Description:** Annual interest rate on debt financing. Used to compute total financing cost and to assess whether the project's IRR exceeds the cost of debt.
**Unit:** Decimal rate per year
**Allowed Range:** 0.01 to 0.40
**How Calculated:** Supplied directly from financing agreement or market quote.
**Required Evidence:** `capital_structure`
**Validation Rules:** If debt_amount = 0, this parameter is not required.
**Confidence Impact:** Supports evidence volume for capital structure evidence category.
**Example:** `financing_cost_pct: 0.175` (17.5% annual interest — typical Egypt commercial lending rate)

---

## Group 4 — Project Composition

These parameters describe what is being built and in what proportions. Real Estate specific.

---

### `land_area_sqm`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Total land area of the project site in square meters.
**Unit:** Square meters
**Allowed Range:** 100 to 10,000,000 (any real estate project)
**How Calculated:** From land title documentation or survey. Supplied directly.
**Required Evidence:** `land_terms`
**Validation Rules:** Must be positive. If `build_ratio` and `total_saleable_area_sqm` are also supplied, validate: total_saleable_area_sqm ≤ land_area_sqm × build_ratio × floor_count (approximation only — exact GFA computation is domain-specific).
**Confidence Impact:** Foundational parameter. Absent land area creates a structural evidence gap.
**Example:** `land_area_sqm: 40000` (40,000 sqm = 4 feddan)

---

### `build_ratio`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** The ratio of total constructed Gross Floor Area (GFA) to the total land area. Also known as Floor Area Ratio (FAR). Determines the maximum buildable area and must comply with local building regulations.
**Unit:** Dimensionless ratio
**Allowed Range:** 0.1 to 10.0 (typical Egypt RE: 0.3 to 3.0 depending on zone and height)
**How Calculated:** GFA / land_area_sqm. Defined by the architectural design within regulatory limits. Supplied directly.
**Required Evidence:** `technical_feasibility`, `regulatory_compliance`
**Validation Rules:**
- Must be within the regulatory limit for the district and zoning classification
- If build_ratio > 3.0 for a non-high-rise project, flag as implausible
**Confidence Impact:** Used to validate total_saleable_area_sqm. Inconsistency between declared area and computed area degrades evidence consistency.
**Example:** `build_ratio: 1.2` (120% coverage — builds more GFA than the land footprint across multiple floors)

---

### `total_saleable_area_sqm`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Total saleable area across all activity types. This is the area the developer sells to buyers — it is less than GFA because common areas, corridors, and parking are not sold.
**Unit:** Square meters
**Allowed Range:** 100 to 5,000,000
**How Calculated:** Sum of saleable areas by activity type. Efficiency ratio typically 0.75-0.85 of GFA.
**Required Evidence:** `technical_feasibility`, `activity_mix_financial`
**Validation Rules:** Must be less than land_area_sqm × build_ratio (cannot sell more than you build). Efficiency below 60% or above 90% is implausible.
**Confidence Impact:** Core to revenue calculation. Inconsistency with price/revenue figures degrades consistency score.
**Example:** `total_saleable_area_sqm: 38000` (38,000 sqm saleable from 40,000 sqm land with 1.2 build ratio)

---

### `residential_area_sqm`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Saleable area allocated to residential units (apartments, villas, townhouses, etc.)
**Unit:** Square meters
**Allowed Range:** 0 to total_saleable_area_sqm
**How Calculated:** Architectural design decision. Supplied directly.
**Required Evidence:** `activity_mix_financial`
**Validation Rules:** Sum of residential + commercial + administrative + medical must equal total_saleable_area_sqm (within 1% rounding).
**Confidence Impact:** Required for activity_mix_financial coverage.
**Example:** `residential_area_sqm: 28000` (28,000 sqm residential = 73.7% of total)

---

### `commercial_area_sqm`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Saleable area allocated to commercial units (retail, shops, showrooms, food & beverage).
**Unit:** Square meters
**Allowed Range:** 0 to total_saleable_area_sqm
**Required Evidence:** `activity_mix_financial`
**Confidence Impact:** Required for activity_mix_financial coverage.
**Example:** `commercial_area_sqm: 5000` (5,000 sqm commercial = 13.2% of total)

---

### `administrative_area_sqm`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Saleable area allocated to administrative/office units.
**Unit:** Square meters
**Allowed Range:** 0 to total_saleable_area_sqm
**Required Evidence:** `activity_mix_financial`
**Example:** `administrative_area_sqm: 3000` (3,000 sqm administrative = 7.9% of total)

---

### `medical_area_sqm`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Saleable area allocated to medical units (clinics, pharmacies, medical centers).
**Unit:** Square meters
**Allowed Range:** 0 to total_saleable_area_sqm
**Required Evidence:** `activity_mix_financial`
**Example:** `medical_area_sqm: 2000` (2,000 sqm medical = 5.3% of total)

---

### `residential_mix_pct`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Residential area as a percentage of total saleable area. The primary activity mix signal.
**Unit:** Decimal ratio (0.0 to 1.0)
**Allowed Range:** 0.0 to 1.0
**How Calculated:** residential_area_sqm / total_saleable_area_sqm
**Required Evidence:** `activity_mix_financial`
**Validation Rules:** residential_mix_pct + commercial_mix_pct + administrative_mix_pct + medical_mix_pct must equal 1.0 (within 0.01 rounding).
**Confidence Impact:** Primary mix parameter. Rules can reference this for mix-risk assessment.
**Example:** `residential_mix_pct: 0.737` (73.7% residential)

---

### `commercial_mix_pct`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Commercial area as a percentage of total saleable area.
**Unit:** Decimal ratio
**Allowed Range:** 0.0 to 1.0
**How Calculated:** commercial_area_sqm / total_saleable_area_sqm
**Validation Rules:** Part of mix sum = 1.0 constraint.
**Example:** `commercial_mix_pct: 0.132` (13.2% commercial)

---

### `administrative_mix_pct`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Administrative area as a percentage of total saleable area.
**Unit:** Decimal ratio
**Allowed Range:** 0.0 to 1.0
**Example:** `administrative_mix_pct: 0.079`

---

### `medical_mix_pct`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Medical area as a percentage of total saleable area.
**Unit:** Decimal ratio
**Allowed Range:** 0.0 to 1.0
**Example:** `medical_mix_pct: 0.053`

---

## Group 5 — Cost Structure

---

### `total_project_cost`

**Status:** [EXISTING] [UNIVERSAL]
**Description:** Total all-in project cost: land + construction + engineering + admin + marketing + sales + tax + financing.
**Unit:** Currency (EGP)
**Allowed Range:** > 0
**Required Evidence:** `financial_projections`
**Validation Rules:** Must equal the sum of all cost line items (within 2% rounding from the detailed model).
**Example:** `total_project_cost: 95000000` (EGP 95M total cost)

---

### `land_cost`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Total land acquisition cost including purchase price plus any administrative costs. Does not include the financing cost of deferred land payments (that belongs in financing_cost).
**Unit:** Currency (EGP)
**Allowed Range:** > 0
**Required Evidence:** `land_terms`
**Validation Rules:** land_cost / land_area_sqm should be within plausible range for the district (validated against market_price_benchmark_land_per_sqm if available).
**Example:** `land_cost: 30000000` (EGP 30M land cost)

---

### `construction_cost_total`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Total construction cost across all activity types, before inflation adjustment. This is the base construction cost at current prices.
**Unit:** Currency (EGP)
**Allowed Range:** > 0
**Required Evidence:** `cost_estimates`
**Validation Rules:** Should equal sum of (construction_cost_per_sqm × area) for each activity type. Discrepancy > 5% triggers a data quality check.
**Example:** `construction_cost_total: 45000000`

---

### `construction_cost_per_sqm_residential`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Construction cost per square meter for residential units. Varies by specification level (standard, premium, luxury) and district.
**Unit:** Currency per square meter (EGP/sqm)
**Allowed Range:** 2,000 to 50,000 EGP/sqm (2026 Egypt range: 8,000-20,000 for standard-premium residential)
**Required Evidence:** `cost_estimates`
**Validation Rules:** Must be consistent with market benchmarks for the specification level and district. Values outside the plausible range trigger an advisory.
**Example:** `construction_cost_per_sqm_residential: 12000` (EGP 12,000/sqm)

---

### `construction_cost_per_sqm_commercial`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Construction cost per square meter for commercial units. Typically higher than residential due to structural requirements.
**Unit:** EGP/sqm
**Allowed Range:** 3,000 to 60,000 EGP/sqm
**Required Evidence:** `cost_estimates`
**Example:** `construction_cost_per_sqm_commercial: 15000`

---

### `construction_cost_per_sqm_administrative`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Construction cost per square meter for administrative/office units.
**Unit:** EGP/sqm
**Allowed Range:** 3,000 to 60,000 EGP/sqm
**Required Evidence:** `cost_estimates`
**Example:** `construction_cost_per_sqm_administrative: 14000`

---

### `construction_cost_per_sqm_medical`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Construction cost per square meter for medical units. Typically highest among all activity types due to specialized infrastructure (gas lines, lead shielding, specialized plumbing).
**Unit:** EGP/sqm
**Allowed Range:** 5,000 to 80,000 EGP/sqm
**Required Evidence:** `cost_estimates`
**Example:** `construction_cost_per_sqm_medical: 18000`

---

### `marketing_cost_pct`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Marketing and advertising cost as a percentage of total project revenue. Covers all sales and marketing activities.
**Unit:** Decimal ratio
**Allowed Range:** 0.01 to 0.15 (typical Egypt RE: 0.03 to 0.08)
**Required Evidence:** `financial_projections`
**Example:** `marketing_cost_pct: 0.05` (5% of revenue goes to marketing)

---

### `sales_commission_pct`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Total sales commission as a percentage of revenue. Includes both internal sales team commission and external broker commissions.
**Unit:** Decimal ratio
**Allowed Range:** 0.01 to 0.10
**Required Evidence:** `financial_projections`
**Example:** `sales_commission_pct: 0.04` (4% total sales commission)

---

### `tax_rate`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Corporate income tax rate applied to project profit. Egypt corporate tax rate is 22.5% as of 2026.
**Unit:** Decimal ratio
**Allowed Range:** 0.0 to 0.50
**How Calculated:** Regulatory rate. Supplied as a configuration input.
**Required Evidence:** `regulatory_compliance` or `financial_projections`
**Validation Rules:** For Egypt projects, must be 0.225 unless there is documented tax exemption.
**Example:** `tax_rate: 0.225` (22.5% Egypt corporate tax)

---

### `maintenance_deposit_pct`

**Status:** [NEW — P2] [RE-SPECIFIC]
**Description:** Maintenance deposit (وديعة الصيانة) as a percentage of land cost. A statutory requirement in Egyptian real estate — paid upfront before construction commences. Typically 3-5% of land value.
**Unit:** Decimal ratio
**Allowed Range:** 0.02 to 0.07
**How Calculated:** Regulatory requirement. Supplied directly.
**Required Evidence:** `regulatory_compliance`, `land_terms`
**Validation Rules:** Must be present in total cost calculation. If absent, flag as `maintenance_deposit_included: false`.
**Example:** `maintenance_deposit_pct: 0.04` (4% of land cost)

---

### `inflation_rate_annual`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Expected annual inflation rate applied to construction costs over the execution period. Not CPI — specifically the construction cost inflation rate, which typically tracks material and labor cost growth.
**Unit:** Decimal rate per year
**Allowed Range:** 0.0 to 0.50 (Egypt construction inflation has reached 30%+ in inflationary periods)
**Required Evidence:** `market_data` or `financial_projections`
**Validation Rules:** Should be consistent with macroeconomic projections. Significant deviation from consensus market expectation triggers an advisory.
**Example:** `inflation_rate_annual: 0.15` (15% annual construction cost inflation)

---

## Group 6 — Revenue Structure

---

### `total_revenue`

**Status:** [EXISTING] [UNIVERSAL]
**Description:** Total project revenue from all sales across all activity types and all payment collection periods.
**Unit:** Currency (EGP)
**Allowed Range:** > 0
**Validation Rules:** Must equal sum of (saleable area × price per sqm) for each activity type.
**Required Evidence:** `financial_projections`
**Example:** `total_revenue: 117000000` (EGP 117M total revenue)

---

### `price_per_sqm_residential`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Selling price per square meter for residential units. The single most sensitive revenue input — small changes in price per sqm create large changes in total revenue.
**Unit:** EGP/sqm
**Allowed Range:** 5,000 to 200,000 EGP/sqm (varies dramatically by district and specification)
**Required Evidence:** `market_data` (for benchmark validation), `activity_mix_financial`
**Validation Rules:** Must be within a plausible range of `market_price_benchmark_residential_per_sqm`. Deviation > 30% from benchmark triggers an advisory.
**Example:** `price_per_sqm_residential: 25000` (EGP 25,000/sqm residential)

---

### `price_per_sqm_commercial`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Selling price per square meter for commercial units. Typically higher per sqm than residential in Egypt real estate.
**Unit:** EGP/sqm
**Allowed Range:** 8,000 to 300,000 EGP/sqm
**Required Evidence:** `market_data`, `activity_mix_financial`
**Example:** `price_per_sqm_commercial: 40000`

---

### `price_per_sqm_administrative`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Selling price per square meter for administrative/office units.
**Unit:** EGP/sqm
**Allowed Range:** 8,000 to 250,000 EGP/sqm
**Required Evidence:** `market_data`, `activity_mix_financial`
**Example:** `price_per_sqm_administrative: 35000`

---

### `price_per_sqm_medical`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** Selling price per square meter for medical units. Premium priced due to specialized fit-out and limited supply of certified medical spaces.
**Unit:** EGP/sqm
**Allowed Range:** 10,000 to 350,000 EGP/sqm
**Required Evidence:** `market_data`, `activity_mix_financial`
**Example:** `price_per_sqm_medical: 45000`

---

### `down_payment_pct`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** Down payment as a percentage of unit price collected at contract signing. The higher the down payment, the faster the inflow during the sales period, reducing the financing gap.
**Unit:** Decimal ratio
**Allowed Range:** 0.05 to 0.50 (Egypt RE: typically 0.10 to 0.30)
**Required Evidence:** `sales_projections`
**Validation Rules:** Down payment policy must be consistent with the stated sales velocity — higher down payments may suppress sales velocity.
**Example:** `down_payment_pct: 0.20` (20% down payment)

---

### `installment_collection_period_quarters`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** Number of quarters over which the remaining balance (after down payment) is collected from buyers. Longer collection periods shift inflows further into the future, widening the financing gap.
**Unit:** Integer (quarters)
**Allowed Range:** 1 to 40
**Required Evidence:** `sales_projections`, `cash_flow_timing`
**Example:** `installment_collection_period_quarters: 12` (3-year installment collection)

---

## Group 7 — Timeline Parameters

---

### `sales_period_years`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Expected total time to sell all units of the project, in years. The single most sensitive input in the financial model — longer sales periods increase financing gap, reduce annual ROI, and may collapse IRR below the hurdle rate.
**Unit:** Years (decimal)
**Allowed Range:** 0.5 to 7.0 (below 6 months is implausible; above 7 years indicates a failing sales assumption)
**How Calculated:** Typically from market research and comparable sales data for the district and product type.
**Required Evidence:** `sales_projections` (mandatory), `market_data` (for benchmark comparison)
**Validation Rules:**
- Must be positive
- If sales_period_years > 4.0, an advisory rule fires unconditionally
- If sales_period_years > `market_absorption_rate_years` by more than 50%, flag as aggressive assumption
**Confidence Impact:** Referenced by the sales velocity rule — when the rule fires, the rule_compliance dimension is penalized.
**Example:** `sales_period_years: 2.5` (2.5-year expected sales period)

---

### `execution_period_years`

**Status:** [NEW — P1] [UNIVERSAL]
**Description:** Project construction/execution period in years. The period during which construction spending occurs. Longer execution periods increase the inflation impact on construction costs and widen the financing gap.
**Unit:** Years (decimal)
**Allowed Range:** 0.5 to 10.0
**Required Evidence:** `technical_feasibility`
**Validation Rules:** If execution_period_years > 5, flag inflation risk advisory.
**Example:** `execution_period_years: 3.0` (3-year construction period)

---

### `total_project_duration_years`

**Status:** [EXISTING] [UNIVERSAL]
**Description:** Total project lifespan from land acquisition to final unit sale. Equals execution_period_years + sales_period_years (with overlap if sales begin during construction).
**Unit:** Years (decimal)
**Allowed Range:** 1.0 to 15.0
**Required Evidence:** `financial_projections`
**Example:** `total_project_duration_years: 5.0` (3 years construction + 2 years sales with overlap)

---

## Group 8 — Market Benchmarks

These parameters provide the reference values against which project assumptions are validated.

---

### `market_price_benchmark_residential_per_sqm`

**Status:** [NEW — P2] [RE-SPECIFIC]
**Description:** Market price per sqm for comparable residential projects in the same district. The authoritative benchmark for price validation.
**Unit:** EGP/sqm
**Allowed Range:** 5,000 to 200,000
**Required Evidence:** `market_data` (external source, high authority)
**Validation Rules:** `price_per_sqm_residential` should be within ±30% of this benchmark. Greater deviation requires explanation.
**Example:** `market_price_benchmark_residential_per_sqm: 26000`

---

### `market_absorption_rate_years`

**Status:** [NEW — P1] [RE-SPECIFIC]
**Description:** District-average sales period for comparable real estate projects. Provides context for evaluating the project's assumed sales period. Source: market research reports or comparable project data.
**Unit:** Years
**Allowed Range:** 0.5 to 5.0
**Required Evidence:** `market_data`
**Validation Rules:** Must be sourced from evidence with authority ≥ 0.70 (market research or transaction data). Broker opinion only (authority 0.60) insufficient as sole source.
**Example:** `market_absorption_rate_years: 1.8` (district average 1.8-year sales period)

---

### `district_irr_benchmark`

**Status:** [NEW — P3] [RE-SPECIFIC]
**Description:** Market-standard IRR for comparable projects in the same district. Provides context beyond the universal 20% hurdle rate — some districts command IRR of 25%+ due to risk profile.
**Unit:** Decimal rate
**Allowed Range:** 0.10 to 0.60
**Required Evidence:** `market_data`
**Example:** `district_irr_benchmark: 0.22` (district benchmark is 22% IRR)

---

## Group 9 — Risk Parameters

---

### `pessimistic_npv`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** NPV computed under the pessimistic scenario (slower sales, higher costs, lower prices). Supplied as an output of the named scenario analysis.
**Unit:** Currency (EGP)
**Allowed Range:** Any real number
**Required Evidence:** Named scenario analysis output
**Validation Rules:** pessimistic_npv ≤ base_npv ≤ optimistic_npv (by definition).
**Example:** `pessimistic_npv: -5000000` (negative NPV under pessimistic scenario)

---

### `optimistic_npv`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** NPV computed under the optimistic scenario.
**Unit:** Currency (EGP)
**Example:** `optimistic_npv: 28000000`

---

### `scenario_divergence_ratio`

**Status:** [NEW — P2] [UNIVERSAL]
**Description:** Ratio of (optimistic_npv − pessimistic_npv) to absolute value of base NPV. Measures how wide the scenario range is relative to the base case. High divergence means the recommendation is sensitive to assumptions. Low divergence means it is robust.
**Unit:** Dimensionless ratio
**Allowed Range:** 0.0 to 100.0
**How Calculated:** (optimistic_npv − pessimistic_npv) / |computed_npv|
**Required Evidence:** Named scenario analysis output
**Validation Rules:** If scenario_divergence_ratio > 5.0, the decision is highly assumption-sensitive (flag as FRAGILE regardless of base case recommendation).
**Example:** `scenario_divergence_ratio: 2.7` (moderate divergence — optimistic is 2.7× base NPV above pessimistic)

---

### `inflation_exposure_score`

**Status:** [NEW — P3] [UNIVERSAL]
**Description:** A computed signal representing the combined inflation risk from a long execution period in an inflationary environment. Higher scores indicate greater construction cost uncertainty.
**Unit:** Dimensionless score (0.0 to 1.0)
**Allowed Range:** 0.0 to 1.0
**How Calculated:** min(1.0, inflation_rate_annual × execution_period_years / 0.60). At 15% inflation over 4 years (60% cumulative), score = 1.0 (maximum risk).
**Required Evidence:** `inflation_rate_annual`, `execution_period_years`
**Example:** `inflation_exposure_score: 0.75` (15% inflation × 3 years = 45% cumulative / 60% = 0.75)

---

## Parameter Cross-Reference Table

| Parameter | Group | P-Phase | Universal | Rule References |
|-----------|-------|---------|-----------|-----------------|
| computed_npv | Return | EXISTING | YES | RE-FIN-001 |
| computed_irr_annual | Return | P1 | YES | RE-FIN-002 |
| computed_annual_roi | Return | EXISTING | YES | RE-FIN-005 |
| computed_net_profit | Cash Flow | EXISTING | YES | RE-FIN-003 |
| computed_peak_financing_gap | Cash Flow | P1 | YES | RE-FIN-004 |
| computed_available_capital | Capital | P1 | YES | RE-FIN-004 |
| computed_break_even_quarter | Cash Flow | P1 | YES | RE-OPS-001 |
| hurdle_rate | Capital | P1 | YES | RE-FIN-002 |
| sales_period_years | Timeline | P1 | YES | RE-COM-001 |
| market_absorption_rate_years | Market | P1 | NO | RE-COM-002 |
| residential_mix_pct | Composition | P1 | NO | RE-COM-003 |
| commercial_mix_pct | Composition | P1 | NO | RE-COM-003 |
| inflation_rate_annual | Cost | P1 | YES | RE-EXE-001 |
| execution_period_years | Timeline | P1 | YES | RE-EXE-001 |
| pessimistic_npv | Risk | P2 | YES | RE-RSK-001 |
| scenario_divergence_ratio | Risk | P2 | YES | RE-RSK-002 |
| inflation_exposure_score | Risk | P3 | YES | RE-EXE-001 |
