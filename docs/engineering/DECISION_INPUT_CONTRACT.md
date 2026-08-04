# Decision Input Contract — Eunoia Platform

**Classification:** Engineering Architecture — Canonical Specification
**Contract Version:** 1.0.0
**Date:** 2026-08-03
**Author:** Chief Platform Architect
**Status:** FROZEN — Effective upon executive sign-off

---

## Authority

This document is the single source of truth for every input the Decision Intelligence Engine accepts. All other documents (Parameter Library, Rule Library, Evidence Library, Scenario Library, Explainability Library, Knowledge Freeze Certification) are upstream knowledge sources. This contract is the downstream specification that converts that knowledge into an engineering contract.

When a conflict exists between this contract and any upstream document, this contract takes precedence. Only the Chief Platform Architect may revise this contract.

---

## Section 1 — Purpose

### Why This Contract Exists

The Eunoia Decision Intelligence Engine evaluates structured inputs and returns a recommendation. The engine's correctness depends entirely on receiving inputs that are named correctly, typed correctly, valued within valid ranges, and validated in the correct order.

Without a single canonical specification:
- Engineers implement the same parameter with different names across modules
- Validation logic diverges between the API layer and the engine
- New parameters are added without understanding which rules they affect
- Future domains (Hotels, Medical, Restaurants) cannot reuse Shared parameters because there is no authoritative list of which parameters are Shared
- Breaking changes are introduced without version control

This contract solves all five problems. It is not a summary of other documents. It is the engineering specification that every module, every API endpoint, every test case, and every future domain adapter must comply with.

### What This Contract Governs

1. Every named input accepted by the Decision Engine via `context.parameters`
2. Every derived value computed from those inputs (by the platform or by the financial model)
3. The JSON structure of the request payload submitted to the Decision Engine
4. The validation sequence applied before a request reaches the engine
5. The rules for extending the contract without breaking existing integrations
6. The cross-domain reusability classification of every parameter

### What This Contract Does Not Govern

- The internal logic of any rule (governed by `REAL_ESTATE_RULE_LIBRARY.md`)
- The confidence scoring algorithm (governed by the existing engine implementation)
- The structure of the Decision Engine response (governed by the existing engine API)
- Financial computation methods (NPV, IRR, etc. — computed externally, supplied here)

---

## Section 2 — Canonical Parameter Registry

### Registry Format

Each parameter entry includes all eleven specification attributes. Parameters are organized by functional group. Within each group, parameters available at P1 are listed first.

**Phase labels:**
- `EXISTING` — present in the engine before this contract
- `P1` — introduced in Phase 1
- `P2` — introduced in Phase 2
- `P3` — introduced in Phase 3

**Required / Optional / Conditional:**
- `REQUIRED` — must be present in every feasibility request for the rule to evaluate
- `CONDITIONAL` — required only when a trigger condition is met (stated in Validation column)
- `OPTIONAL` — improves decision quality when present; rules degrade gracefully without it

---

### Group 1 — Return Metrics

Parameters that carry the primary outputs of the financial model.

---

#### `computed_npv`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP (currency) |
| **Required / Optional** | REQUIRED |
| **Default** | none — must be supplied |
| **Range** | Any real number; values below −1,000,000,000,000 trigger a validation warning |
| **Validation** | Must be true NPV (net of initial equity investment). Do NOT supply NPV-CI (cumulative discounted inflows without subtracting initial investment). Supplying NPV-CI inflates the value and will cause RE-FIN-001 to evaluate incorrectly. Must be finite. |
| **Source** | `financial_projections` evidence (mandatory) |
| **Used By Rules** | RE-FIN-001 (CRITICAL blocking gate) |
| **Used By Scenarios** | Base, Optimistic, Pessimistic scenarios all compute scenario-specific NPV variants |
| **Used By Explainability** | WHY / WHY NOT / HOW TO FIX templates for RE-FIN-001 reference this |
| **Used By Confidence** | Rule compliance dimension — primary gate; evidence quality dimension |

---

#### `computed_irr_annual`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate (e.g., 0.26 = 26%) |
| **Required / Optional** | REQUIRED (from P1) |
| **Default** | none |
| **Range** | −1.0 to 10.0 (values above 5.0 trigger a data quality warning) |
| **Validation** | Must be a finite number. Must be supplied alongside `hurdle_rate`. IRR sign must be consistent with NPV sign — positive NPV at hurdle rate implies IRR > hurdle_rate. |
| **Source** | `financial_projections` evidence; `cash_flow_timing` evidence (required for accuracy) |
| **Used By Rules** | RE-FIN-002 (CRITICAL blocking gate: `computed_irr_annual < hurdle_rate`) |
| **Used By Scenarios** | IRR sensitivity analysis — each scenario computes its own IRR |
| **Used By Explainability** | WHY / HOW TO FIX templates for RE-FIN-002 |
| **Used By Confidence** | Rule compliance dimension — CRITICAL gate |

---

#### `computed_annual_roi`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate per year |
| **Required / Optional** | REQUIRED |
| **Default** | none |
| **Range** | −1.0 to 10.0 |
| **Validation** | Must be consistent with `computed_irr_annual` — if ROI exceeds IRR by more than 15 pp, flag inconsistency. Must be consistent with `computed_net_profit / total_project_cost / total_project_duration_years`. |
| **Source** | `financial_projections` evidence |
| **Used By Rules** | RE-FIN-005 (WARN: < 0.08), RE-FIN-006 (positive signal: > 0.20) |
| **Used By Scenarios** | Annual ROI is reported for each named scenario |
| **Used By Explainability** | WHY NOT template references ROI vs. market alternative |
| **Used By Confidence** | Rule compliance dimension — advisory weight |

---

#### `computed_net_profit`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | REQUIRED |
| **Default** | none |
| **Range** | Any real number |
| **Validation** | Must be consistent with: total_revenue − total_project_cost − tax. Discrepancy > 5% triggers validation warning. |
| **Source** | `financial_projections` evidence |
| **Used By Rules** | RE-FIN-003 (CRITICAL blocking gate: ≤ 0) |
| **Used By Scenarios** | Net profit reported per scenario |
| **Used By Explainability** | WHY NOT template for RE-FIN-003 |
| **Used By Confidence** | Rule compliance dimension — CRITICAL gate |

---

#### `computed_xirr_annual`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate |
| **Required / Optional** | OPTIONAL (P2) |
| **Default** | null |
| **Range** | −1.0 to 10.0 |
| **Validation** | When present, must be within 5 pp of `computed_irr_annual`. Larger divergence must be flagged for analyst review. |
| **Source** | `cash_flow_timing` evidence (mandatory for XIRR accuracy) |
| **Used By Rules** | No direct gate; strengthens RE-FIN-002 evidence |
| **Used By Scenarios** | P2 named scenarios |
| **Used By Explainability** | WHAT CHANGED template (when XIRR diverges from IRR) |
| **Used By Confidence** | Evidence consistency dimension — corroborates IRR |

---

#### `computed_mirr_annual`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate |
| **Required / Optional** | OPTIONAL (P3) |
| **Default** | null |
| **Range** | −1.0 to 5.0 |
| **Validation** | MIRR must be ≤ `computed_irr_annual` (by definition). |
| **Source** | `financial_projections`, `capital_structure` |
| **Used By Rules** | No direct gate — supplementary |
| **Used By Scenarios** | P3 stress scenarios |
| **Used By Explainability** | WHAT IF template (reinvestment rate sensitivity) |
| **Used By Confidence** | Evidence volume dimension |

---

#### `computed_annual_roe`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate per year |
| **Required / Optional** | OPTIONAL (P2) |
| **Default** | null |
| **Range** | −2.0 to 20.0 |
| **Validation** | If `debt_amount = 0`, then ROE must equal ROI. If ROE < ROI, the leverage is value-destructive. |
| **Source** | `financial_projections`, `capital_structure` |
| **Used By Rules** | No direct gate |
| **Used By Scenarios** | P2 leveraged scenario analysis |
| **Used By Explainability** | Supplementary metric in executive-register templates |
| **Used By Confidence** | Evidence volume dimension |

---

#### `computed_np_ratio`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Dimensionless ratio (0.0 to 1.0) |
| **Required / Optional** | OPTIONAL (P2) |
| **Default** | null |
| **Range** | −1.0 to 1.0 |
| **Validation** | Must be < 1.0. Values > 0.6 trigger a check that all cost categories (tax, marketing, commission) are included. |
| **Source** | `financial_projections` |
| **Used By Rules** | No direct gate |
| **Used By Scenarios** | P2 margin sensitivity |
| **Used By Explainability** | Margin context in developer-register templates |
| **Used By Confidence** | Evidence volume dimension |

---

#### `computed_profitability_index`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Dimensionless ratio |
| **Required / Optional** | OPTIONAL (P3) |
| **Default** | null |
| **Range** | −10.0 to 100.0 |
| **Validation** | PI > 1.0 must imply computed_npv > 0. PI < 0 must imply computed_npv < 0. |
| **Source** | `financial_projections`, `capital_structure` |
| **Used By Rules** | No direct gate — used in option ranking when multiple options are compared |
| **Used By Scenarios** | P3 capital allocation scenarios |
| **Used By Explainability** | Used for option comparison explanation |
| **Used By Confidence** | Evidence volume dimension |

---

### Group 2 — Cash Flow and Capital Metrics

---

#### `computed_peak_financing_gap`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP (positive absolute value representing a cash shortfall) |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0 to any positive number (0 = project self-funds from inception) |
| **Validation** | Must be non-negative. Must be present alongside `computed_available_capital`. A value of 0 is unusual — verify the model. |
| **Source** | `cash_flow_timing` evidence (mandatory) |
| **Used By Rules** | RE-FIN-004 (CRITICAL blocking gate) |
| **Used By Scenarios** | Peak gap computed per scenario in P2 |
| **Used By Explainability** | HOW TO FIX template for RE-FIN-004 |
| **Used By Confidence** | Rule compliance dimension — CRITICAL gate |

---

#### `computed_available_capital`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | > 0 |
| **Validation** | Must be project-specific committed capital, not total developer equity. Should be validated against `capital_structure` evidence. |
| **Source** | `capital_structure` evidence |
| **Used By Rules** | RE-FIN-004 (`computed_peak_financing_gap > computed_available_capital` = FAIL) |
| **Used By Scenarios** | Capital constraint tested in pessimistic scenarios |
| **Used By Explainability** | WHY NOT template for RE-FIN-004 |
| **Used By Confidence** | Evidence quality dimension — authority of capital declaration matters |

---

#### `computed_break_even_quarter`

| Attribute | Value |
|---|---|
| **Type** | `integer` |
| **Unit** | Quarter number (1 = first three months from project start) |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 1 to 40 |
| **Validation** | Must be ≤ `total_project_duration_years × 4`. Values ≤ 2 are unusual — verify down payments are not mismodeled as Day 1 revenue. Undiscounted cumulative cash flows only. For discounted payback, see `computed_dpp_years` (P2). |
| **Source** | `cash_flow_timing` evidence (mandatory) |
| **Used By Rules** | RE-OPS-001 (WARN: > 8 quarters) |
| **Used By Scenarios** | Break-even shift tested per scenario |
| **Used By Explainability** | HOW TO FIX template for RE-OPS-001 |
| **Used By Confidence** | Rule compliance dimension — advisory weight |

---

#### `computed_dpp_years`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Years |
| **Required / Optional** | OPTIONAL (P2) |
| **Default** | null |
| **Range** | 0 to 15.0 |
| **Validation** | Must be ≥ undiscounted break-even expressed in years. Formula: DPP = Year N + (remaining cumulative / discounted cash flow in Year N+1). Computed from discounted present-value cash flows. |
| **Source** | `cash_flow_timing` evidence |
| **Used By Rules** | No direct gate (P2 supplementary) |
| **Used By Scenarios** | P2 discounted payback scenario |
| **Used By Explainability** | Supplementary in technical-register templates |
| **Used By Confidence** | Evidence volume dimension |

---

### Group 3 — Capital Structure

---

#### `hurdle_rate`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate per year |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | 0.20 (Egypt real estate market convention) |
| **Range** | 0.05 to 0.50 |
| **Validation** | For Egypt real estate, value must be 0.20 unless a documented deviation is provided. An advisory note fires when `hurdle_rate ≠ 0.20`. |
| **Source** | `market_data` (confirmation that market convention applies) |
| **Used By Rules** | RE-FIN-002 (IRR gate: `computed_irr_annual < hurdle_rate`) |
| **Used By Scenarios** | Hurdle rate is held constant across all scenarios |
| **Used By Explainability** | WHY template for RE-FIN-002 states the hurdle rate explicitly |
| **Used By Confidence** | Incorrect hurdle rate invalidates both IRR and NPV gates |

---

#### `equity_amount`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | OPTIONAL (P2) |
| **Default** | null |
| **Range** | > 0 |
| **Validation** | `equity_amount + debt_amount` must approximately equal `total_project_cost` (within 15%). |
| **Source** | `capital_structure` evidence |
| **Used By Rules** | No direct gate — used in ROE computation |
| **Used By Scenarios** | P2 leveraged scenarios |
| **Used By Explainability** | Capital structure context |
| **Used By Confidence** | Evidence volume dimension |

---

#### `debt_amount`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | OPTIONAL (P2) |
| **Default** | 0 |
| **Range** | ≥ 0 |
| **Validation** | If `debt_amount > 0`, then `financing_cost_pct` must also be supplied. |
| **Source** | `capital_structure` evidence |
| **Used By Rules** | No direct gate |
| **Used By Scenarios** | P2 leverage scenarios |
| **Used By Explainability** | Context |
| **Used By Confidence** | Evidence volume dimension |

---

#### `financing_cost_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate per year |
| **Required / Optional** | CONDITIONAL (P2) — required when `debt_amount > 0` |
| **Default** | null |
| **Range** | 0.01 to 0.40 |
| **Validation** | Not required when `debt_amount = 0`. |
| **Source** | `capital_structure` evidence |
| **Used By Rules** | No direct gate |
| **Used By Scenarios** | P3 financing cost stress |
| **Used By Explainability** | P3 templates |
| **Used By Confidence** | Evidence volume dimension |

---

### Group 4 — Project Composition

---

#### `land_area_sqm`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Square meters |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 100 to 10,000,000 |
| **Validation** | Must be positive. Used to validate `total_saleable_area_sqm` against `build_ratio`. |
| **Source** | `land_terms` evidence |
| **Used By Rules** | Supports RE-STR-003, RE-EXE-002 (land_cost / land_area_sqm range check) |
| **Used By Scenarios** | Constant across scenarios |
| **Used By Explainability** | Context in RE-specific templates |
| **Used By Confidence** | Foundational parameter — absence creates structural evidence gap |

---

#### `build_ratio`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Dimensionless ratio (GFA / land_area) |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0.1 to 10.0 (typical Egypt: 0.3 to 3.0) |
| **Validation** | Must comply with zoning regulations. Values > 3.0 for non-high-rise projects are flagged as implausible. Used to validate: `total_saleable_area_sqm ≤ land_area_sqm × build_ratio × efficiency_ratio`. |
| **Source** | `technical_feasibility`, `regulatory_compliance` evidence |
| **Used By Rules** | Supports validation of total_saleable_area_sqm |
| **Used By Scenarios** | Constant across scenarios |
| **Used By Explainability** | Context |
| **Used By Confidence** | Consistency dimension — inconsistency between build_ratio and area penalizes score |

---

#### `total_saleable_area_sqm`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Square meters |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 100 to 5,000,000 |
| **Validation** | Must be < `land_area_sqm × build_ratio`. Efficiency ratio (saleable/GFA) must be 0.60–0.90. Must equal sum of all activity area parameters (within 1%). |
| **Source** | `technical_feasibility`, `activity_mix_financial` |
| **Used By Rules** | Revenue consistency validation (total_revenue ≈ area × price) |
| **Used By Scenarios** | Constant across scenarios |
| **Used By Explainability** | Context |
| **Used By Confidence** | Consistency dimension |

---

#### `residential_area_sqm`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Square meters |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none — must reflect actual allocation |
| **Range** | 0 to `total_saleable_area_sqm` |
| **Validation** | Sum: `residential_area_sqm + commercial_area_sqm + administrative_area_sqm + medical_area_sqm = total_saleable_area_sqm` (within 1%). |
| **Source** | `activity_mix_financial` |
| **Used By Rules** | Supports activity mix rules (RE-STR-001, RE-COM-003) |
| **Used By Scenarios** | Constant across scenarios |
| **Used By Explainability** | Mix context |
| **Used By Confidence** | Evidence volume when activity_mix_financial is present |

---

#### `commercial_area_sqm`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Square meters |
| **Required / Optional** | CONDITIONAL (P1) — required when any commercial area exists |
| **Default** | 0 |
| **Range** | 0 to `total_saleable_area_sqm` |
| **Validation** | Part of mix sum constraint. |
| **Source** | `activity_mix_financial` |
| **Used By Rules** | RE-STR-001, RE-COM-003 |
| **Used By Scenarios** | Constant |
| **Used By Explainability** | Commercial mix context |
| **Used By Confidence** | Consistency dimension |

---

#### `administrative_area_sqm`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Square meters |
| **Required / Optional** | CONDITIONAL (P1) |
| **Default** | 0 |
| **Range** | 0 to `total_saleable_area_sqm` |
| **Source** | `activity_mix_financial` |
| **Used By Rules** | RE-STR-001 |
| **Used By Confidence** | Consistency dimension |

---

#### `medical_area_sqm`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Square meters |
| **Required / Optional** | CONDITIONAL (P1) |
| **Default** | 0 |
| **Range** | 0 to `total_saleable_area_sqm` |
| **Source** | `activity_mix_financial` |
| **Used By Rules** | RE-STR-001 |
| **Used By Confidence** | Consistency dimension |

---

#### `residential_mix_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio (0.0 to 1.0) |
| **Required / Optional** | PLATFORM-DERIVED — do not supply; computed by the engine from area parameters |
| **Default** | none — derived |
| **Range** | 0.0 to 1.0 |
| **Validation** | Computed by the engine as `residential_area_sqm / total_saleable_area_sqm`. The engine validates that all four mix percentages sum to 1.0 (within 0.01) after derivation. Any caller-supplied value is ignored — the engine always computes this from the raw area inputs. |
| **Source** | Derived from `residential_area_sqm` and `total_saleable_area_sqm` |
| **Used By Rules** | RE-COM-003 (used to assess non-residential dominance) |
| **Used By Scenarios** | Mix is constant across scenarios |
| **Used By Explainability** | Mix context for all commercial/mix rules |
| **Used By Confidence** | Consistency dimension |

---

#### `commercial_mix_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio |
| **Required / Optional** | PLATFORM-DERIVED — do not supply; computed by the engine from area parameters |
| **Default** | none — derived |
| **Range** | 0.0 to 1.0 |
| **Validation** | Computed by the engine as `commercial_area_sqm / total_saleable_area_sqm`. Any caller-supplied value is ignored. |
| **Source** | Derived from `commercial_area_sqm` and `total_saleable_area_sqm` |
| **Used By Rules** | RE-COM-003 (> 0.40 triggers advisory), RE-STR-001 (> 0.10 requires activity_mix evidence) |
| **Used By Confidence** | Consistency dimension |

---

#### `administrative_mix_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio |
| **Required / Optional** | PLATFORM-DERIVED — do not supply; computed by the engine from area parameters |
| **Default** | none — derived |
| **Range** | 0.0 to 1.0 |
| **Validation** | Computed by the engine as `administrative_area_sqm / total_saleable_area_sqm`. Any caller-supplied value is ignored. |
| **Source** | Derived from `administrative_area_sqm` and `total_saleable_area_sqm` |
| **Used By Rules** | RE-STR-001 (> 0.10 requires activity_mix evidence) |
| **Used By Confidence** | Consistency dimension |

---

#### `medical_mix_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio |
| **Required / Optional** | PLATFORM-DERIVED — do not supply; computed by the engine from area parameters |
| **Default** | none — derived |
| **Range** | 0.0 to 1.0 |
| **Validation** | Computed by the engine as `medical_area_sqm / total_saleable_area_sqm`. Any caller-supplied value is ignored. |
| **Source** | Derived from `medical_area_sqm` and `total_saleable_area_sqm` |
| **Used By Rules** | RE-STR-001 (> 0.10 requires activity_mix evidence) |
| **Used By Confidence** | Consistency dimension |

---

### Group 5 — Cost Structure

---

#### `total_project_cost`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | REQUIRED |
| **Default** | none |
| **Range** | > 0 |
| **Validation** | Must equal the sum of all cost line items (within 2%). Two-step verification: (1) Compute pre-tax cost: `land_cost + land_installment_interest_total + construction_cost_total + (ops_engineering_consulting_pct + ops_licensing_pct + ops_supervision_pct) × construction_cost_total + ops_hq_cost_total + marketing_cost_pct × total_revenue + sales_commission_pct × total_revenue`; (2) Compute tax provision: `tax_rate × (total_revenue − pre_tax_cost)`; (3) `total_project_cost` must equal `pre_tax_cost + tax_provision` (within 2%). Cross-check: `total_project_cost ≈ total_revenue − computed_net_profit` (within 5%). |
| **Source** | `financial_projections` |
| **Used By Rules** | Feeds RE-FIN-001, RE-FIN-003, RE-FIN-005 indirectly via computed_npv and computed_annual_roi |
| **Used By Scenarios** | Base for all financial gates |
| **Used By Explainability** | Context in cost breakdown templates |
| **Used By Confidence** | Evidence quality dimension — must match bottom-up cost evidence |

---

#### `land_cost`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | > 0 |
| **Validation** | Must include ALL land acquisition cost components: (1) purchase price, (2) market premium if applicable ("اوفر"), (3) administrative registration fees ("م ادارية"), (4) maintenance deposit. Do NOT supply land purchase price only. Seller-financing interest is NOT included in `land_cost` — supply it separately in `land_installment_interest_total`. Omitting components (1)–(4) overstates NPV and net profit. `land_cost / land_area_sqm` must be within plausible district range. |
| **Source** | `land_terms` evidence |
| **Used By Rules** | Supports RE-STR-003, RE-EXE-002. Feeds into cost totals used by RE-FIN-001, RE-FIN-003. |
| **Used By Scenarios** | Land cost is constant across scenarios (contractual) |
| **Used By Explainability** | Cost structure context |
| **Used By Confidence** | Evidence quality — signed contract vs. asking price has significant impact |

---

#### `land_is_installment_purchase`

| Attribute | Value |
|---|---|
| **Type** | `boolean` |
| **Unit** | true / false |
| **Required / Optional** | CONDITIONAL (P1) — required when land is purchased on seller-financed installments |
| **Default** | false |
| **Range** | true / false |
| **Validation** | Set to `true` when the land purchase contract specifies deferred installment payments to the seller. When `true`, `land_installment_interest_total` becomes required. When `false` (or absent, which defaults to false), `land_installment_interest_total` must be 0 or absent. |
| **Source** | `land_terms` evidence (payment structure) |
| **Used By Rules** | Stage 3 conditional trigger — controls whether `land_installment_interest_total` is required |
| **Used By Confidence** | Consistency dimension — validates installment interest requirement |

---

#### `land_installment_interest_total`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | CONDITIONAL (P1) — required when land is purchased on seller-financed installments |
| **Default** | 0 |
| **Range** | ≥ 0 |
| **Validation** | Required when `land_is_installment_purchase = true`. Total interest over all installment years, calculated from the declining balance schedule of the seller-financing arrangement. This cost must NOT be included in `land_cost` — it is a separate additive line item in `total_project_cost`. Typical seller financing structures span 3–7 years; total interest can equal or exceed the land principal. When `land_is_installment_purchase = false`, this parameter must be 0 or absent. |
| **Source** | `land_terms` evidence (installment schedule) |
| **Used By Rules** | Contributes to RE-FIN-001, RE-FIN-003 via total_project_cost accuracy |
| **Used By Scenarios** | Constant (contractual) |
| **Used By Explainability** | Land cost component context |
| **Used By Confidence** | Consistency dimension — if absent for installment purchase, total cost is suspect |

---

#### `construction_cost_total`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP (base cost before inflation adjustment) |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | > 0 |
| **Validation** | Must equal sum of `(construction_cost_per_sqm_[type] × area_sqm_[type])` for each activity type (within 5%). |
| **Source** | `cost_estimates` evidence |
| **Used By Rules** | Feeds cost totals used by RE-FIN-001, RE-FIN-003 |
| **Used By Scenarios** | Stress-tested in pessimistic scenario (+20% construction cost) |
| **Used By Explainability** | Cost breakdown context |
| **Used By Confidence** | Evidence quality — contractor BOQ (0.95) vs. rule-of-thumb (0.55) |

---

#### `construction_cost_per_sqm_residential`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP per square meter |
| **Required / Optional** | REQUIRED (P1) when `residential_area_sqm > 0` |
| **Default** | none |
| **Range** | 2,000 to 50,000 EGP/sqm |
| **Validation** | Must be within market benchmark range for the specification level and district. Values outside plausible range trigger advisory. Typical 2026 Egypt: 8,000–25,000 EGP/sqm for standard to premium. |
| **Source** | `cost_estimates` evidence |
| **Used By Rules** | RE-RSK-003 (freshness check on cost_estimates evidence) |
| **Used By Scenarios** | Pessimistic: +20%, Optimistic: −10% |
| **Used By Explainability** | Cost sensitivity templates |
| **Used By Confidence** | Evidence freshness — 90-day half-life |

---

#### `construction_cost_per_sqm_commercial`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP/sqm |
| **Required / Optional** | CONDITIONAL (P1) — when `commercial_area_sqm > 0` |
| **Default** | none |
| **Range** | 3,000 to 60,000 EGP/sqm |
| **Source** | `cost_estimates` evidence |
| **Used By Rules** | RE-RSK-003 |
| **Used By Scenarios** | Pessimistic: +20% |
| **Used By Confidence** | Evidence freshness dimension |

---

#### `construction_cost_per_sqm_administrative`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP/sqm |
| **Required / Optional** | CONDITIONAL (P1) — when `administrative_area_sqm > 0` |
| **Default** | none |
| **Range** | 3,000 to 60,000 EGP/sqm |
| **Source** | `cost_estimates` evidence |
| **Used By Confidence** | Evidence freshness dimension |

---

#### `construction_cost_per_sqm_medical`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP/sqm |
| **Required / Optional** | CONDITIONAL (P1) — when `medical_area_sqm > 0` |
| **Default** | none |
| **Range** | 5,000 to 80,000 EGP/sqm |
| **Validation** | Typically the highest cost per sqm due to specialized infrastructure (gas lines, medical plumbing, shielding). |
| **Source** | `cost_estimates` evidence |
| **Used By Confidence** | Evidence freshness dimension |

---

#### `ops_engineering_consulting_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio of construction cost |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none — must be explicitly modeled |
| **Range** | 0.005 to 0.05 |
| **Validation** | Covers engineering design and consulting fees. Market range: 1.0%–1.5% of base construction cost. If the sum of `ops_engineering_consulting_pct + ops_licensing_pct + ops_supervision_pct` applied to construction cost is < 5% of construction cost, an advisory fires: operational overhead appears underbudgeted (market benchmark: 7%–9% of total project cost). |
| **Source** | `financial_projections`, `cost_estimates` |
| **Used By Rules** | RE-OPS-004 (WARN: if aggregate operational overhead < 5% of construction cost) |
| **Used By Scenarios** | Included in cost base |
| **Used By Explainability** | Cost completeness context |
| **Used By Confidence** | Evidence volume — confirms التشغيل sheet is modeled |

---

#### `ops_licensing_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio of construction cost |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0.005 to 0.05 |
| **Validation** | Covers permits, licensing fees, and sundry administrative costs. Market range: 1.0%–1.5% of construction cost. |
| **Source** | `financial_projections`, `regulatory_compliance` |
| **Used By Rules** | RE-OPS-004 (aggregate overhead check) |
| **Used By Confidence** | Evidence volume |

---

#### `ops_supervision_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio of construction cost |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0.005 to 0.05 |
| **Validation** | Covers construction supervision, project management, and QA. Market range: 1.0%–2.0% of construction cost. |
| **Source** | `financial_projections`, `cost_estimates` |
| **Used By Rules** | RE-OPS-004 (aggregate overhead check) |
| **Used By Confidence** | Evidence volume |

---

#### `ops_hq_cost_total`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | > 0 |
| **Validation** | Covers: administrative office rental for project duration, office furniture and equipment, and administrative overhead (typically 2%–5% of the above subtotals). |
| **Source** | `financial_projections` |
| **Used By Rules** | RE-OPS-004 (aggregate overhead check) |
| **Used By Confidence** | Evidence volume |

---

#### `marketing_cost_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio of total revenue |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0.01 to 0.15 |
| **Validation** | Typical Egypt real estate: 2.5%–3.0% for marketing budget. RE-OPS-002 fires advisory when > 0.08. |
| **Source** | `financial_projections` |
| **Used By Rules** | RE-OPS-002 (WARN when > 0.08) |
| **Used By Scenarios** | Constant in base; adjusted in optimistic/pessimistic |
| **Used By Explainability** | HOW TO FIX template for RE-OPS-002 |
| **Used By Confidence** | Rule compliance dimension |

---

#### `sales_commission_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio of total revenue |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0.01 to 0.20 |
| **Validation** | Typical Egypt real estate: 10%–12% combined internal + external commission. Marketing budget is separate (see `marketing_cost_pct`). A value below 0.05 is unusual — verify that external broker commissions are included. |
| **Source** | `financial_projections` |
| **Used By Rules** | Feeds total cost (impacts RE-FIN-001, RE-FIN-003) |
| **Used By Scenarios** | Constant across scenarios |
| **Used By Explainability** | Cost breakdown context |
| **Used By Confidence** | Consistency dimension (must reconcile with total cost) |

---

#### `tax_rate`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | 0.225 (Egypt corporate tax rate, 2026) |
| **Range** | 0.0 to 0.50 |
| **Validation** | For Egypt projects, must be 0.225 unless documented tax exemption is provided. Tax is levied on project profit and typically paid as a lump sum in the years following project completion, not annually during execution. |
| **Source** | `regulatory_compliance`, `financial_projections` |
| **Used By Rules** | Feeds computed_net_profit used by RE-FIN-003 |
| **Used By Scenarios** | Constant (regulatory) |
| **Used By Confidence** | Regulatory compliance dimension |

---

#### `maintenance_deposit_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio of land cost |
| **Required / Optional** | CONDITIONAL (P2) — required when `land_cost > 10,000,000` |
| **Default** | null |
| **Range** | 0.02 to 0.07 |
| **Validation** | Set by the land authority (هيئة المجتمعات العمرانية or equivalent). Typical range: 3%–5% of land value. Rate is contractual — not negotiable. Must be confirmed from the land purchase contract. The maintenance deposit cost is already included in `land_cost` (item 4 of the land_cost definition). This parameter is a DISCLOSURE field — it allows the engine to confirm the rate was explicitly modeled. If absent when `land_cost > 10M`, RE-STR-003 fires a disclosure advisory (not a cost-omission error). |
| **Source** | `regulatory_compliance`, `land_terms` |
| **Used By Rules** | RE-STR-003 (advisory when absent for large land cost) |
| **Used By Scenarios** | Constant (contractual) |
| **Used By Confidence** | Regulatory dimension |

---

#### `inflation_rate_annual`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate per year |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0.0 to 0.50 |
| **Validation** | This is the construction cost inflation rate, not general CPI. Construction cost and revenue price escalation are separate parameters. Egypt construction inflation has historically exceeded general CPI during high-inflation periods. |
| **Source** | `financial_projections`, `market_data` |
| **Used By Rules** | RE-EXE-001 (advisory when `> 0.10` AND `execution_period_years > 2.0`) |
| **Used By Scenarios** | Pessimistic: +50% of base rate; Optimistic: current rate held constant |
| **Used By Explainability** | WHAT IF template for inflation scenario |
| **Used By Confidence** | Rule compliance dimension |

---

### Group 6 — Revenue Structure

---

#### `total_revenue`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | REQUIRED |
| **Default** | none |
| **Range** | > 0 |
| **Validation** | Must equal sum of `(activity_area × price_per_sqm)` for each activity type (within 5%). |
| **Source** | `financial_projections`, `activity_mix_financial` |
| **Used By Rules** | Feeds computed_npv and computed_net_profit used by multiple financial gates |
| **Used By Scenarios** | Stress-tested in all scenarios |
| **Used By Confidence** | Consistency dimension — must reconcile with unit price × area evidence |

---

#### `price_per_sqm_residential`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP/sqm |
| **Required / Optional** | REQUIRED (P1) when `residential_area_sqm > 0` |
| **Default** | none |
| **Range** | 5,000 to 200,000 EGP/sqm |
| **Validation** | Must be within ±30% of `market_price_benchmark_residential_per_sqm` when that benchmark is present (RE-COM-004). The price supplied should be the average selling price across all sales tranches over the sales period, not the launch price. |
| **Source** | `activity_mix_financial`, `market_data` |
| **Used By Rules** | RE-COM-004 (price deviation advisory) |
| **Used By Scenarios** | Pessimistic: −20%, Optimistic: +10% |
| **Used By Explainability** | WHAT IF template for price sensitivity |
| **Used By Confidence** | Evidence quality — market benchmark evidence required for price validation |

---

#### `price_per_sqm_commercial`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP/sqm |
| **Required / Optional** | CONDITIONAL (P1) — when `commercial_area_sqm > 0` |
| **Default** | none |
| **Range** | 8,000 to 300,000 EGP/sqm |
| **Source** | `activity_mix_financial`, `market_data` |
| **Used By Scenarios** | Pessimistic: −20% |
| **Used By Confidence** | Evidence consistency dimension |

---

#### `price_per_sqm_administrative`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP/sqm |
| **Required / Optional** | CONDITIONAL (P1) — when `administrative_area_sqm > 0` |
| **Default** | none |
| **Range** | 8,000 to 250,000 EGP/sqm |
| **Source** | `activity_mix_financial`, `market_data` |

---

#### `price_per_sqm_medical`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP/sqm |
| **Required / Optional** | CONDITIONAL (P1) — when `medical_area_sqm > 0` |
| **Default** | none |
| **Range** | 10,000 to 350,000 EGP/sqm |
| **Source** | `activity_mix_financial`, `market_data` |

---

#### `down_payment_pct`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio |
| **Required / Optional** | CONDITIONAL (P2) — required when `cash_flow_timing` evidence is present |
| **Default** | null |
| **Range** | 0.05 to 0.50 (typical Egypt: 0.10 to 0.30) |
| **Validation** | Represents the project-level weighted average down payment across all sales tranches. Individual tranches vary; this is the aggregate. Higher down payment percentages accelerate early inflows and reduce peak financing gap. Must be consistent with stated sales velocity assumptions. |
| **Source** | `sales_projections`, `cash_flow_timing` |
| **Used By Rules** | Indirectly affects RE-FIN-004 via computed_peak_financing_gap |
| **Used By Scenarios** | Pessimistic: −30% (lower down payments); Optimistic: higher down payments |
| **Used By Confidence** | Cash flow timing accuracy |

---

#### `installment_collection_period_quarters`

| Attribute | Value |
|---|---|
| **Type** | `integer` |
| **Unit** | Number of quarters |
| **Required / Optional** | CONDITIONAL (P2) |
| **Default** | null |
| **Range** | 1 to 40 (4–10 years; reference studies show up to 36 quarters = 9 years) |
| **Validation** | Average across all sales tranches. Individual tranches range from 15 to 36 quarters. Longer collection periods widen the financing gap. |
| **Source** | `sales_projections`, `cash_flow_timing` |
| **Used By Rules** | Indirectly affects RE-FIN-004, RE-OPS-001 |
| **Used By Scenarios** | Pessimistic: +25% longer |
| **Used By Confidence** | Cash flow timing precision |

---

### Group 7 — Timeline Parameters

---

#### `sales_period_years`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Years |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0.5 to 7.0 |
| **Validation** | Must be positive. Advisory fires unconditionally at > 3.5 years (RE-COM-001). Advisory fires when `> market_absorption_rate_years × 1.5` (RE-COM-002). Must be consistent with declared sales velocity percentages. |
| **Source** | `sales_projections` (mandatory), `market_data` (benchmark comparison) |
| **Used By Rules** | RE-COM-001 (WARN: > 3.5), RE-COM-002 (WARN: > 1.5× benchmark) |
| **Used By Scenarios** | Most sensitive scenario variable — ±20% in P1 scenarios; named slow/fast scenarios in P2 |
| **Used By Explainability** | HOW TO FIX template for RE-COM-001 |
| **Used By Confidence** | Rule compliance dimension; evidence quality of sales_projections critical |

---

#### `execution_period_years`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Years |
| **Required / Optional** | REQUIRED (P1) |
| **Default** | none |
| **Range** | 0.5 to 10.0 |
| **Validation** | Advisory fires when > 4.0 years (RE-OPS-003). Also used in RE-EXE-001 (inflation risk: `> 2.0` AND `inflation_rate_annual > 0.10`). |
| **Source** | `technical_feasibility` |
| **Used By Rules** | RE-EXE-001 (inflation risk), RE-OPS-003 (extended execution advisory) |
| **Used By Scenarios** | Pessimistic: +20% longer |
| **Used By Explainability** | WHAT IF template for execution delay |
| **Used By Confidence** | Rule compliance dimension |

---

#### `total_project_duration_years`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Years |
| **Required / Optional** | REQUIRED |
| **Default** | none |
| **Range** | 1.0 to 15.0 |
| **Validation** | Must equal `execution_period_years + sales_period_years` (allowing for overlap if sales begin during construction). Used to validate break-even quarter. |
| **Source** | `financial_projections` |
| **Used By Rules** | Feeds into `computed_annual_roi` computation; validates `computed_break_even_quarter` |
| **Used By Confidence** | Consistency dimension |

---

### Group 8 — Market Benchmarks

---

#### `market_absorption_rate_years`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Years |
| **Required / Optional** | CONDITIONAL (P1) — include when market data evidence with absorption rate data is available; required at P3 for RE-COM-002 evaluation |
| **Default** | null (absent → RE-COM-002 skips; when present enables benchmark comparison at P1 and full rule evaluation at P3) |
| **Range** | 0.5 to 5.0 |
| **Validation** | Must be sourced from evidence with authority ≥ 0.70 (market research or transaction data). Broker opinion only (0.55) is insufficient as sole source. |
| **Source** | `market_data` evidence |
| **Used By Rules** | RE-COM-002 (WARN: `sales_period_years > market_absorption_rate_years × 1.5`) |
| **Used By Scenarios** | Used in benchmark comparison across all scenarios |
| **Used By Explainability** | WHY template for sales period rules |
| **Used By Confidence** | Evidence quality dimension for market_data category |

---

#### `market_price_benchmark_residential_per_sqm`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP/sqm |
| **Required / Optional** | OPTIONAL (P2) |
| **Default** | null |
| **Range** | 5,000 to 200,000 |
| **Source** | `market_data` evidence |
| **Used By Rules** | RE-COM-004 (price deviation advisory) |
| **Used By Scenarios** | Price deviation tested per scenario |
| **Used By Confidence** | Evidence quality — enables price validation |

---

#### `district_irr_benchmark`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal rate |
| **Required / Optional** | OPTIONAL (P3) |
| **Default** | null (falls back to `hurdle_rate`) |
| **Range** | 0.10 to 0.60 |
| **Source** | `market_data` |
| **Used By Rules** | Supplements RE-FIN-002 with district-specific context |
| **Used By Confidence** | Evidence volume dimension |

---

#### `fi_benchmark_reference`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | OPTIONAL (P1) — documentation only, no gate |
| **Default** | null |
| **Range** | > 0 |
| **Validation** | Read-only market reference constant. Represents the benchmark Future Value of committed equity capital at market rates. This is a constant supplied by the financial study template and is NOT computed from the specific project's cash flows. Do not use for gate evaluation. |
| **Source** | `financial_projections` (as a reference field, not a computed value) |
| **Used By Rules** | None — documentation only |
| **Used By Confidence** | No impact |

---

### Group 9 — Risk and Scenario Parameters

---

#### `pessimistic_npv`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | CONDITIONAL (P2) — required when named scenario analysis is present |
| **Default** | null |
| **Range** | Any real number |
| **Validation** | `pessimistic_npv ≤ computed_npv ≤ optimistic_npv` (by definition). |
| **Source** | Named scenario analysis output |
| **Used By Rules** | RE-RSK-001 (WARN when pessimistic_npv ≤ 0 while computed_npv > 0) |
| **Used By Scenarios** | Source: pessimistic named scenario |
| **Used By Explainability** | WHY NOT template — surfaced in risk disclosure |
| **Used By Confidence** | Rule compliance dimension |

---

#### `optimistic_npv`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | EGP |
| **Required / Optional** | CONDITIONAL (P2) |
| **Default** | null |
| **Range** | Any real number |
| **Validation** | Must be ≥ `computed_npv`. |
| **Source** | Named scenario analysis output |
| **Used By Rules** | RE-RSK-002 (used to compute divergence ratio) |
| **Used By Confidence** | Evidence consistency dimension |

---

#### `scenario_divergence_ratio`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Dimensionless ratio |
| **Required / Optional** | CONDITIONAL (P2) — derived when both pessimistic_npv and optimistic_npv are present |
| **Default** | null |
| **Range** | 0.0 to 100.0 |
| **Validation** | Computed as: `(optimistic_npv − pessimistic_npv) / |computed_npv|`. Values > 5.0 trigger RE-RSK-002. Must not be manually supplied — it is derived. |
| **Source** | Derived by platform from scenario NPV values |
| **Used By Rules** | RE-RSK-002 (WARN when > 5.0) |
| **Used By Explainability** | WHAT IF template — decision fragility explanation |
| **Used By Confidence** | Rule compliance dimension |

---

#### `inflation_exposure_score`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Dimensionless score (0.0 to 1.0) |
| **Required / Optional** | OPTIONAL (P3) — derived |
| **Default** | null |
| **Range** | 0.0 to 1.0 |
| **Validation** | Computed as: `min(1.0, inflation_rate_annual × execution_period_years / 0.60)`. At 60% cumulative inflation (15% × 4 years), score = 1.0 (maximum). Must not be manually supplied. |
| **Source** | Derived by platform from `inflation_rate_annual` and `execution_period_years` |
| **Used By Rules** | Supplements RE-EXE-001 |
| **Used By Confidence** | Risk dimension in confidence scoring |

---

### Group 10 — Sales Velocity

---

#### `sales_velocity_pct_year1`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio |
| **Required / Optional** | OPTIONAL (P1) |
| **Default** | null |
| **Range** | 0.0 to 1.0 |
| **Validation** | `sales_velocity_pct_year1 + sales_velocity_pct_year2 + sales_velocity_pct_year3` must be ≤ 1.0. If sum < 1.0, remaining is sold in subsequent years. Must be consistent with `sales_period_years`. |
| **Source** | `sales_projections` |
| **Used By Rules** | Supports RE-COM-001 consistency validation |
| **Used By Scenarios** | Per-scenario velocity modeled in P2 |
| **Used By Confidence** | Consistency — velocity must reconcile with total period |

---

#### `sales_velocity_pct_year2`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio |
| **Required / Optional** | OPTIONAL (P1) |
| **Default** | null |
| **Range** | 0.0 to 1.0 |
| **Source** | `sales_projections` |

---

#### `sales_velocity_pct_year3`

| Attribute | Value |
|---|---|
| **Type** | `number` |
| **Unit** | Decimal ratio |
| **Required / Optional** | OPTIONAL (P1) |
| **Default** | null |
| **Range** | 0.0 to 1.0 |
| **Source** | `sales_projections` |

---

### Group 11 — Regulatory Compliance (Boolean / Categorical)

---

#### `permits_confirmed`

| Attribute | Value |
|---|---|
| **Type** | `boolean` |
| **Unit** | true / false |
| **Required / Optional** | OPTIONAL |
| **Default** | false |
| **Validation** | `false` triggers advisory rule — project cannot proceed to construction without permits. |
| **Source** | `regulatory_compliance` evidence |
| **Used By Rules** | Advisory |
| **Used By Confidence** | Regulatory dimension |

---

#### `zoning_compliant`

| Attribute | Value |
|---|---|
| **Type** | `boolean` |
| **Unit** | true / false |
| **Required / Optional** | OPTIONAL |
| **Default** | false |
| **Validation** | `false` triggers advisory unconditionally. |
| **Source** | `regulatory_compliance` evidence |
| **Used By Rules** | Advisory |
| **Used By Confidence** | Regulatory dimension |

---

#### `land_registration_status`

| Attribute | Value |
|---|---|
| **Type** | `string` |
| **Unit** | Categorical: `registered` / `in_progress` / `unregistered` |
| **Required / Optional** | OPTIONAL |
| **Default** | null |
| **Source** | `regulatory_compliance`, `land_terms` evidence |
| **Used By Rules** | Advisory when `unregistered` |
| **Used By Confidence** | Regulatory dimension |

---

## Section 3 — Derived Parameters

Derived parameters are values that are NOT directly supplied as raw inputs. They fall into two categories:

### Category A — Externally Computed (by the Financial Model)

These parameters carry the prefix `computed_`. They are calculated outside the Eunoia platform (by the developer's financial model or certified financial consultant) and supplied to the engine as part of the request payload.

The engine does **not** recompute these values — it trusts and evaluates them. The evidence authority assigned to the `financial_projections` evidence item determines how much the confidence engine trusts them.

| Parameter | Computed From | Who Computes |
|---|---|---|
| `computed_npv` | Sum of discounted cash flows minus initial investment | Financial model / certified consultant |
| `computed_irr_annual` | Numerical root-finding on cash flow sequence | Financial model / certified consultant |
| `computed_xirr_annual` | XIRR algorithm on dated cash flows | Financial model (P2) |
| `computed_mirr_annual` | MIRR formula with reinvestment/finance rates | Financial model (P3) |
| `computed_annual_roi` | net_profit / total_project_cost / total_project_duration_years | Financial model |
| `computed_annual_roe` | net_profit / equity_amount / total_duration_years | Financial model (P2) |
| `computed_np_ratio` | net_profit / total_revenue | Financial model (P2) |
| `computed_profitability_index` | computed_npv / equity_amount | Financial model (P3) |
| `computed_peak_financing_gap` | Maximum negative cumulative cash position | Quarterly cash flow model |
| `computed_available_capital` | Developer declaration — not computed | Supplied directly by developer |
| `computed_break_even_quarter` | First quarter where cumulative net cash ≥ 0 | Quarterly cash flow model |
| `computed_net_profit` | total_revenue − total_cost − tax | Financial model |
| `computed_dpp_years` | Discounted payback period from PV cash flows | Financial model (P2) |

### Category B — Platform-Derived (by the Eunoia Engine)

These parameters are computed by the platform from other supplied parameters. They are **never** supplied by the caller — the platform computes them during validation and populates them into the decision context.

| Parameter | Formula | When Computed |
|---|---|---|
| `residential_mix_pct` | `residential_area_sqm / total_saleable_area_sqm` | At parameter validation |
| `commercial_mix_pct` | `commercial_area_sqm / total_saleable_area_sqm` | At parameter validation |
| `administrative_mix_pct` | `administrative_area_sqm / total_saleable_area_sqm` | At parameter validation |
| `medical_mix_pct` | `medical_area_sqm / total_saleable_area_sqm` | At parameter validation |
| `scenario_divergence_ratio` | `(optimistic_npv − pessimistic_npv) / \|computed_npv\|` | During scenario evaluation (P2) |
| `inflation_exposure_score` | `min(1.0, inflation_rate_annual × execution_period_years / 0.60)` | During execution risk evaluation (P3) |

---

## Section 4 — Input Dependency Graph

The following graph shows which input parameters produce which derived values, and which derived values trigger which rules.

```
RAW INPUTS ──────────────────────────────────────────────── DERIVED ──── RULES

land_area_sqm ─────────────────────────────────────── (validates) ──── total_saleable_area_sqm
build_ratio ────────────────────────────────────────── (validates) ──── total_saleable_area_sqm

residential_area_sqm ──────────────────────────────────────────────────────────────┐
commercial_area_sqm ────────────────────────────────────────────────────────────── ├─► mix_pct ──► RE-STR-001, RE-COM-003
administrative_area_sqm ────────────────────────────────────────────────────────── │
medical_area_sqm ──────────────────────────────────────────────────────────────────┘

computed_npv ──────────────────────────────────────────────────────────────────────► RE-FIN-001
computed_irr_annual ──────────────────────────────────────────────────────────────┐
hurdle_rate ──────────────────────────────────────────────────────────────────────┘►  RE-FIN-002
computed_net_profit ───────────────────────────────────────────────────────────────► RE-FIN-003
computed_peak_financing_gap ────────────────────────────────────────────────────── ┐
computed_available_capital ────────────────────────────────────────────────────────┘► RE-FIN-004
computed_annual_roi ────────────────────────────────────────────────────────────── ► RE-FIN-005, RE-FIN-006

sales_period_years ────────────────────────────────────────────────────────────────► RE-COM-001
sales_period_years ──────────────────────────────────────────────────────────────┐
market_absorption_rate_years ───────────────────────────────────────────────────┘► RE-COM-002
commercial_mix_pct ────────────────────────────────────────────────────────────────► RE-COM-003
price_per_sqm_residential ─────────────────────────────────────────────────────── ┐
market_price_benchmark_residential_per_sqm ──────────────────────────────────────┘► RE-COM-004

computed_break_even_quarter ───────────────────────────────────────────────────────► RE-OPS-001
marketing_cost_pct ────────────────────────────────────────────────────────────────► RE-OPS-002
execution_period_years ────────────────────────────────────────────────────────────► RE-OPS-003

commercial_mix_pct > 0.10 ─────────────────────────────────────────────────────── ┐
medical_mix_pct > 0.10 ────────────────────────────────────────────────────────── ├─► RE-STR-001 (requires activity_mix_financial evidence)
administrative_mix_pct > 0.10 ─────────────────────────────────────────────────── ┘
market_data evidence absent ───────────────────────────────────────────────────────► RE-STR-002
maintenance_deposit_pct (absent) + land_cost > 10M ────────────────────────────────► RE-STR-003

inflation_rate_annual > 0.10 ────────────────────────────────────────────────────┐
execution_period_years > 2.0 ────────────────────────────────────────────────────┘► RE-EXE-001
cash_flow_timing absent + land_cost > 10M ─────────────────────────────────────────► RE-EXE-002

land_is_installment_purchase = true ───────────────────────────────────────────────► land_installment_interest_total (required)

ops_engineering_consulting_pct ──────────────────────────────────────────────────── ┐
ops_licensing_pct ───────────────────────────────────────────────────────────────── ├─► RE-OPS-004
ops_supervision_pct ─────────────────────────────────────────────────────────────── │
ops_hq_cost_total ───────────────────────────────────────────────────────────────── ┘

pessimistic_npv ────────────────────────────────────────────────────────────────── ► RE-RSK-001
optimistic_npv ─────────────────────────────────────────────────────────────────┐
pessimistic_npv ────────────────────────────────────────────────────────────────┤
computed_npv ───────────────────────────────────────────────────────────────────┘► scenario_divergence_ratio ──► RE-RSK-002
cost_estimates evidence freshness > 90 days ───────────────────────────────────────► RE-RSK-003

inflation_rate_annual ──────────────────────────────────────────────────────────┐
execution_period_years ─────────────────────────────────────────────────────────┘► inflation_exposure_score (P3)
```

---

## Section 5 — Validation Order

The following sequence defines the exact order in which inputs are validated before reaching the Decision Engine. Each stage must pass before the next executes. Validation failure at any stage returns a structured error response — the engine does not receive a malformed request.

### Stage 0 — Contract Version Check

1. Confirm `contractVersion` in the request payload matches the engine's supported version range (see Section 7).
2. If version is unsupported, return `CONTRACT_VERSION_ERROR` with the supported range.

---

### Stage 1 — Schema Validation

1. Confirm all REQUIRED parameters are present in `context.parameters`.
2. Confirm all parameter names exactly match the Canonical Parameter Registry (case-sensitive).
3. Confirm all parameter values match their declared type (number, integer, boolean, string).
4. Return `SCHEMA_VALIDATION_ERROR` with the list of failed parameters on any failure.

---

### Stage 2 — Range Validation

For every parameter that has a defined range:

1. `computed_npv` — must be finite
2. `computed_irr_annual` — must be in [−1.0, 10.0]; warn if > 5.0
3. `computed_annual_roi` — must be in [−1.0, 10.0]
4. `hurdle_rate` — must be in [0.05, 0.50]
5. `inflation_rate_annual` — must be in [0.0, 0.50]
6. `sales_period_years` — must be in [0.5, 7.0]
7. `execution_period_years` — must be in [0.5, 10.0]
8. `computed_break_even_quarter` — must be a positive integer ≤ `total_project_duration_years × 4`
9. Mix percentages — all must be in [0.0, 1.0]
10. All cost parameters — must be > 0

---

### Stage 3 — Conditional Parameter Check

Evaluate trigger conditions and confirm required conditional parameters are present:

1. **Activity mix trigger**: if any of `commercial_area_sqm`, `administrative_area_sqm`, `medical_area_sqm` > 10% of `total_saleable_area_sqm`:
   - Require: `price_per_sqm_[type]`, `construction_cost_per_sqm_[type]` for each triggered type
   - Require: `activity_mix_financial` evidence
2. **Land installment trigger**: if `land_is_installment_purchase = true`:
   - Require: `land_installment_interest_total`
3. **Financing cost trigger**: if `debt_amount > 0` (P2 and above):
   - Require: `financing_cost_pct`
4. **Capital gate trigger**: if `computed_available_capital` is present:
   - Require: `capital_structure` evidence
   - Require: `computed_peak_financing_gap`
5. **Maintenance deposit trigger**: if `land_cost > 10,000,000`:
   - Require: `maintenance_deposit_pct` (P2) or fire RE-STR-003 disclosure advisory if absent
6. **Cash flow timing trigger**: if `land_cost > 10,000,000` OR `execution_period_years > 2.0`:
   - Require: `cash_flow_timing` evidence or fire RE-EXE-002 advisory if absent

---

### Stage 4 — Arithmetic Consistency Check

Verify internal consistency across parameters:

1. `residential_mix_pct + commercial_mix_pct + administrative_mix_pct + medical_mix_pct = 1.0` (within 0.01)
2. `residential_area_sqm + commercial_area_sqm + administrative_area_sqm + medical_area_sqm = total_saleable_area_sqm` (within 1%)
3. `total_saleable_area_sqm ≤ land_area_sqm × build_ratio` (approximation — exact GFA differs from saleable)
4. `computed_npv` sign consistent with `computed_irr_annual` vs. `hurdle_rate` (positive NPV implies IRR > hurdle_rate)
5. `computed_net_profit` consistent with `total_revenue − total_project_cost − tax` (within 5%)
6. `computed_annual_roi` consistent with `computed_net_profit / total_project_cost / total_project_duration_years` (within 15 pp)
7. When `pessimistic_npv` and `optimistic_npv` are both present: `pessimistic_npv ≤ computed_npv ≤ optimistic_npv`
8. MIRR ≤ IRR when both are supplied
9. When `equity_amount` and `debt_amount` are both present: `equity_amount + debt_amount` must be within 20% of `total_project_cost`. Inconsistency suggests the capital structure declaration does not account for the full project financing requirement.

Any inconsistency above tolerance produces a `DATA_CONSISTENCY_WARNING` (not a blocking error — the engine proceeds but the consistency dimension of confidence is penalized).

---

### Stage 5 — Evidence Completeness Check

Verify that required evidence categories are represented in `context.evidence`:

1. `financial_projections` — REQUIRED; absence = `EVIDENCE_MISSING_CRITICAL`
2. `cash_flow_timing` — CONDITIONAL (REQUIRED when Stage 3 trigger fires); absence when triggered = `EVIDENCE_MISSING_ADVISORY` (non-blocking); Rule RE-EXE-002 fires at Stage 7
3. `cost_estimates` — REQUIRED; absence = `EVIDENCE_MISSING_REQUIRED`
4. `sales_projections` — REQUIRED; absence = `EVIDENCE_MISSING_REQUIRED`
5. `land_terms` — REQUIRED; absence = `EVIDENCE_MISSING_REQUIRED`
6. Compute evidence freshness for each present item against declared timestamps
7. Evidence with freshness > half-life degrades evidence_freshness dimension (not a blocking error)

---

### Stage 6 — Platform Derivation

Compute platform-derived parameters from validated inputs:

1. Compute mix percentages from area parameters
2. Compute `scenario_divergence_ratio` when scenario NPV values are present
3. Compute `inflation_exposure_score` when relevant parameters are available
4. Populate derived values into `context.parameters` for rule evaluation

---

### Stage 7 — Rule Evaluation

The validated and enriched context is passed to the Decision Engine. Rules evaluate in the following priority order:

**Priority 1 — Critical Blocking Rules (all must pass to recommend PROCEED):**
- RE-FIN-001, RE-FIN-002, RE-FIN-003, RE-FIN-004

**Priority 2 — High Advisory Rules:**
- RE-FIN-005, RE-COM-001, RE-COM-002, RE-RSK-001, RE-RSK-002, RE-STR-001

**Priority 3 — Medium Advisory Rules:**
- RE-COM-003, RE-COM-004 (evaluates at P2+ only — requires optional `market_price_benchmark_residential_per_sqm`), RE-OPS-001, RE-OPS-003, RE-OPS-004, RE-STR-002, RE-STR-003, RE-EXE-001, RE-EXE-002

**Priority 4 — Low Advisory and Scoring Rules:**
- RE-FIN-006, RE-OPS-002, RE-RSK-003

---

## Section 6 — API Contract

### Request Payload Structure

```json
{
  "contractVersion": "1.0.0",
  "domain": "real_estate",
  "decisionType": "feasibility",
  "phase": "P1",
  "requestId": "<uuid>",
  "timestamp": "<ISO-8601>",
  "context": {
    "parameters": {
      "computed_npv": 12500000,
      "computed_irr_annual": 0.26,
      "computed_annual_roi": 0.18,
      "computed_net_profit": 22000000,
      "computed_peak_financing_gap": 35000000,
      "computed_available_capital": 50000000,
      "computed_break_even_quarter": 6,
      "hurdle_rate": 0.20,
      "total_project_cost": 95000000,
      "total_revenue": 117000000,
      "land_cost": 30000000,
      "land_installment_interest_total": 0,
      "land_area_sqm": 40000,
      "build_ratio": 1.2,
      "total_saleable_area_sqm": 38000,
      "residential_area_sqm": 28000,
      "commercial_area_sqm": 5000,
      "administrative_area_sqm": 3000,
      "medical_area_sqm": 2000,
      "land_is_installment_purchase": false,
      "construction_cost_total": 45000000,
      "construction_cost_per_sqm_residential": 12000,
      "construction_cost_per_sqm_commercial": 15000,
      "construction_cost_per_sqm_administrative": 14000,
      "construction_cost_per_sqm_medical": 18000,
      "ops_engineering_consulting_pct": 0.015,
      "ops_licensing_pct": 0.015,
      "ops_supervision_pct": 0.020,
      "ops_hq_cost_total": 5000000,
      "marketing_cost_pct": 0.03,
      "sales_commission_pct": 0.12,
      "tax_rate": 0.225,
      "price_per_sqm_residential": 25000,
      "price_per_sqm_commercial": 40000,
      "price_per_sqm_administrative": 35000,
      "price_per_sqm_medical": 45000,
      "sales_period_years": 2.5,
      "execution_period_years": 3.0,
      "total_project_duration_years": 5.0,
      "market_absorption_rate_years": 1.8,
      "inflation_rate_annual": 0.15
    },
    "evidence": [
      {
        "category": "financial_projections",
        "authority": 0.95,
        "source": "human_validation",
        "timestamp": "2026-08-01T10:00:00Z",
        "items": [
          {
            "key": "certifying_party",
            "value": "Licensed Financial Consultant — Certified Study"
          },
          {
            "key": "npv_computation_method",
            "value": "Discounted cash flow at 20% hurdle rate, true NPV net of initial investment"
          }
        ]
      },
      {
        "category": "cash_flow_timing",
        "authority": 0.85,
        "source": "internal_data",
        "timestamp": "2026-08-01T10:00:00Z",
        "items": [
          {
            "key": "model_type",
            "value": "Quarterly cash flow model — 20 quarters"
          }
        ]
      },
      {
        "category": "cost_estimates",
        "authority": 0.90,
        "source": "cost_estimate",
        "timestamp": "2026-07-15T09:00:00Z",
        "items": [
          {
            "key": "source_type",
            "value": "Cost consultant estimate"
          }
        ]
      },
      {
        "category": "sales_projections",
        "authority": 0.80,
        "source": "sales_research",
        "timestamp": "2026-07-20T10:00:00Z",
        "items": [
          {
            "key": "source_type",
            "value": "Developer comparable project data"
          }
        ]
      },
      {
        "category": "land_terms",
        "authority": 0.95,
        "source": "legal_document",
        "timestamp": "2026-06-01T00:00:00Z",
        "items": [
          {
            "key": "document_type",
            "value": "Signed land purchase contract"
          },
          {
            "key": "payment_structure",
            "value": "Full payment at signing — no installment plan"
          }
        ]
      }
    ]
  }
}
```

---

### Required Fields Summary

| Field | Type | Required |
|---|---|---|
| `contractVersion` | string | YES |
| `domain` | string (`real_estate`) | YES |
| `decisionType` | string (`feasibility` / `market_entry`) | YES |
| `phase` | string (`P1` / `P2` / `P3`) | YES |
| `requestId` | string (UUID) | YES |
| `timestamp` | string (ISO-8601) | YES |
| `context.parameters` | object (flat key-value) | YES |
| `context.evidence` | array of evidence objects | YES |

### Evidence Object Fields

| Field | Type | Required |
|---|---|---|
| `category` | string — one of 10 defined evidence categories | YES |
| `authority` | number (0.0 to 1.0) | YES |
| `source` | string — source type identifier | YES |
| `timestamp` | string (ISO-8601) | YES |
| `items` | array of {key, value, notes?} objects | OPTIONAL |

### Error Response Structure

```json
{
  "status": "error",
  "stage": "SCHEMA_VALIDATION | RANGE_VALIDATION | CONDITIONAL_CHECK | CONSISTENCY_CHECK | EVIDENCE_CHECK",
  "errors": [
    {
      "parameter": "<parameter_name>",
      "code": "<error_code>",
      "message": "<human-readable description>"
    }
  ],
  "warnings": [
    {
      "parameter": "<parameter_name>",
      "code": "<warning_code>",
      "message": "<human-readable description>"
    }
  ]
}
```

---

## Section 7 — Versioning Rules

### Contract Version Scheme

This contract uses semantic versioning: `MAJOR.MINOR.PATCH`

| Increment | When | Example |
|---|---|---|
| PATCH | Fix a typo, clarify validation note, update an example | 1.0.0 → 1.0.1 |
| MINOR | Add an OPTIONAL or CONDITIONAL parameter; add a non-blocking validation rule; add a new evidence category | 1.0.0 → 1.1.0 |
| MAJOR | Add a new REQUIRED parameter; remove an existing parameter; change a parameter's type; change validation that would break existing payloads | 1.0.0 → 2.0.0 |

### Rules for Adding Parameters

**Adding an OPTIONAL parameter (MINOR increment):**
1. Add to the Canonical Parameter Registry with `Required / Optional = OPTIONAL`
2. Declare a default value that produces identical behavior when absent (null or 0 or false)
3. Ensure no existing rule fires based on the absence of this new parameter
4. No existing consumers break

**Adding a CONDITIONAL parameter (MINOR increment):**
1. Add to the Canonical Parameter Registry with `Required / Optional = CONDITIONAL`
2. Define the exact trigger condition
3. Ensure that when the trigger is not met, the parameter's absence has no effect
4. No existing consumers break when the trigger condition is not present in their payloads

**Adding a REQUIRED parameter (MAJOR increment):**
1. Cannot be added without a major version bump
2. All existing consumers must be updated before the new major version goes live
3. A migration window must be defined — old major version supported in parallel until migration is complete
4. Engineering lead must approve

**Deprecating a parameter:**
1. Mark as `DEPRECATED` in the registry with the version deprecated and expected removal version
2. Engine continues to accept and process it for two major versions
3. Emit a deprecation warning in the response when a deprecated parameter is received
4. Remove in the stated removal version

**Renaming a parameter:**
1. Treated as deprecating the old name + adding a new name — MAJOR increment
2. Both names accepted in a transition period
3. Old name removed after migration window

### Phase Gating

Parameters introduced at P2 or P3 must not be evaluated by rules before their declared phase. The request payload includes a `phase` field. Parameters marked `[NEW — P2]` are ignored by the engine when `phase = "P1"`. This ensures phase correctness without requiring separate contracts per phase.

---

## Section 8 — Future Domain Compatibility

Every parameter is classified along two dimensions: **domain scope** and **forward compatibility status**.

### Domain Scope Classifications

| Classification | Meaning |
|---|---|
| **SHARED** | Parameter name, type, unit, and validation rules are identical for Real Estate, Hotels, Medical, and Restaurants. Future domains adopt it without modification. |
| **RE-SPECIFIC** | Parameter is meaningful only in Real Estate context. Future domains may have analogues with different names, units, or ranges. |
| **FUTURE-RESERVED** | Parameter slot is reserved for a future domain (Hotels, Medical, Restaurants) that will supply a compatible analog. The exact name may differ. |
| **RESERVED** | Parameter name is reserved but has no current active use. May not be supplied in requests. |

---

### Parameter Domain Classification Table

| Parameter | Scope | Future Analog Notes |
|---|---|---|
| `computed_npv` | SHARED | Identical in Hotels, Medical, Restaurants |
| `computed_irr_annual` | SHARED | Identical across all investment domains |
| `computed_xirr_annual` | SHARED | Identical across all investment domains |
| `computed_mirr_annual` | SHARED | Identical across all investment domains |
| `computed_annual_roi` | SHARED | Identical across all investment domains |
| `computed_annual_roe` | SHARED | Identical across all investment domains |
| `computed_np_ratio` | SHARED | Identical across all investment domains |
| `computed_profitability_index` | SHARED | Identical across all investment domains |
| `computed_peak_financing_gap` | SHARED | Identical — any capital-intensive domain has a peak gap |
| `computed_available_capital` | SHARED | Identical across all domains |
| `computed_break_even_quarter` | SHARED | Identical — any capital project has a break-even point |
| `computed_net_profit` | SHARED | Identical across all investment domains |
| `computed_dpp_years` | SHARED | Identical across all investment domains |
| `hurdle_rate` | SHARED | Rate varies by domain and market, but the parameter is shared |
| `equity_amount` | SHARED | Identical |
| `debt_amount` | SHARED | Identical |
| `financing_cost_pct` | SHARED | Identical |
| `total_project_cost` | SHARED | Identical |
| `total_revenue` | SHARED | Identical |
| `marketing_cost_pct` | SHARED | Identical |
| `sales_commission_pct` | SHARED | Identical — Hotels: booking commissions; Medical: referral fees |
| `tax_rate` | SHARED | Rate varies; parameter is shared |
| `inflation_rate_annual` | SHARED | Identical — applies to construction across all domains |
| `sales_period_years` | SHARED | Hotels: occupancy ramp-up; Medical: patient acquisition period |
| `execution_period_years` | SHARED | Identical for any construction project |
| `total_project_duration_years` | SHARED | Identical |
| `pessimistic_npv` | SHARED | Identical |
| `optimistic_npv` | SHARED | Identical |
| `scenario_divergence_ratio` | SHARED | Identical |
| `inflation_exposure_score` | SHARED | Identical |
| `down_payment_pct` | SHARED | Hotels: pre-sale deposit; Medical: advance booking |
| `installment_collection_period_quarters` | SHARED | Hotels: booking payment window |
| `sales_velocity_pct_year1/2/3` | SHARED | Occupancy/booking velocity in Hotels |
| `land_cost` | RE-SPECIFIC | Hotels: property acquisition cost (same concept, shared parameter name if consistent) |
| `land_area_sqm` | RE-SPECIFIC | Hotels: site area |
| `build_ratio` | RE-SPECIFIC | Hotels: FAR compliance |
| `total_saleable_area_sqm` | RE-SPECIFIC | Hotels: total lettable area (different unit: keys, not sqm) |
| `residential_area_sqm` | RE-SPECIFIC | No hotel analog |
| `commercial_area_sqm` | RE-SPECIFIC | Hotels: F&B/retail area (partial analog) |
| `administrative_area_sqm` | RE-SPECIFIC | No direct hotel analog |
| `medical_area_sqm` | RE-SPECIFIC | Medical domain: primary metric |
| `residential_mix_pct` | RE-SPECIFIC | No hotel analog |
| `commercial_mix_pct` | RE-SPECIFIC | Hotels: F&B revenue mix (partial) |
| `administrative_mix_pct` | RE-SPECIFIC | No hotel analog |
| `medical_mix_pct` | RE-SPECIFIC | Medical domain: primary metric |
| `construction_cost_total` | SHARED | Identical for any construction |
| `construction_cost_per_sqm_residential` | RE-SPECIFIC | — |
| `construction_cost_per_sqm_commercial` | RE-SPECIFIC | Hotels: partial analog for F&B area |
| `construction_cost_per_sqm_administrative` | RE-SPECIFIC | — |
| `construction_cost_per_sqm_medical` | RE-SPECIFIC | Medical domain: primary metric |
| `ops_engineering_consulting_pct` | SHARED | Identical for any construction |
| `ops_licensing_pct` | SHARED | Identical for any regulated domain |
| `ops_supervision_pct` | SHARED | Identical for any construction |
| `ops_hq_cost_total` | SHARED | Identical for any multi-year project |
| `price_per_sqm_residential` | RE-SPECIFIC | — |
| `price_per_sqm_commercial` | RE-SPECIFIC | Hotels: revenue per room partial analog |
| `price_per_sqm_administrative` | RE-SPECIFIC | — |
| `price_per_sqm_medical` | RE-SPECIFIC | Medical: consultation/procedure revenue |
| `maintenance_deposit_pct` | RE-SPECIFIC | Egypt regulatory requirement only |
| `land_is_installment_purchase` | RE-SPECIFIC | Land acquisition structure flag |
| `land_installment_interest_total` | RE-SPECIFIC | Applies to any seller-financed land |
| `market_absorption_rate_years` | RE-SPECIFIC | Hotels: ramp-up period to stabilized occupancy |
| `market_price_benchmark_residential_per_sqm` | RE-SPECIFIC | — |
| `district_irr_benchmark` | RE-SPECIFIC | Applies across domains in same geography |
| `fi_benchmark_reference` | RE-SPECIFIC | Egypt real estate financial study constant |
| `permits_confirmed` | SHARED | Identical regulatory concept across domains |
| `zoning_compliant` | SHARED | Identical |
| `land_registration_status` | RE-SPECIFIC | Egypt land title system |

### Hotel Domain Reserved Parameters (Future)

The following parameter slots are reserved for the Hotel vertical. They must NOT be used in Real Estate payloads.

| Reserved Name | Purpose |
|---|---|
| `hotel_room_count` | Total hotel key count |
| `hotel_adr` | Average daily rate |
| `hotel_stabilized_occupancy` | Target stabilized occupancy percentage |
| `hotel_ramp_up_years` | Years to reach stabilized occupancy |
| `revpar_benchmark` | RevPAR benchmark for the market |
| `hotel_operator_fee_pct` | Management fee as % of revenue |

### Medical Domain Reserved Parameters (Future)

| Reserved Name | Purpose |
|---|---|
| `medical_bed_count` | Total licensed bed count |
| `medical_occupancy_rate` | Target bed occupancy |
| `medical_revenue_per_bed_annual` | Revenue per bed per year |
| `medical_licensing_period_years` | Time to obtain operational license |

---

## Section 9 — Executive Certification

### Certification Question

> Can every future Eunoia platform module — Hotels, Medical, Restaurants, and any domain not yet defined — reuse this contract without breaking changes?

### Answer: YES, with conditions

**What is already cross-domain reusable without modification:**

All 42 SHARED parameters in Section 8 can be consumed by future domains without any change to their names, types, ranges, or validation rules. The complete validation pipeline (Sections 5 and 6), the API payload structure (Section 6), the evidence object format, the versioning rules (Section 7), and the error response structure are all domain-agnostic.

Any future domain that submits a payload conforming to this contract's schema with `domain: "hotels"` will pass Stages 0–3 of the validation pipeline unchanged. The engine's confidence scoring, evidence freshness half-lives, and rule priority matrix are all reusable.

**What requires domain-specific extension for each future vertical:**

Future domains must supply their own parameter registry entries for domain-specific metrics (hotel: ADR, occupancy; medical: bed count, licensing period). These are added as MINOR version increments — they do not break existing Real Estate consumers. The FUTURE-RESERVED and RESERVED slots in Section 8 pre-allocate names to prevent conflicts.

**What requires explicit governance to remain compatible:**

1. The SHARED parameter list must not diverge in definition between domains. If Hotels need `sales_commission_pct` to mean something different from what Real Estate means, that is a breaking change requiring a new parameter name, not a redefinition. The Chief Platform Architect must enforce this.

2. The `domain` field in the request controls which domain's rules are loaded. The contract structure is shared; the rule set is domain-specific. This design is correct and must be preserved.

3. When the Hotel or Medical vertical is developed, their parameter registries must be checked against this contract's SHARED list. Any conflict with an existing SHARED parameter requires a MAJOR version bump and migration plan — not silent redefinition.

**Conclusion:**

This contract is forward-compatible. Every parameter classification, every versioning rule, and the complete API structure are designed for multi-domain reuse from inception. Future modules inherit the contract, extend it with domain-specific additions, and never need to break it.

**Certification is granted by the Chief Platform Architect.**
**Contract is frozen at version 1.0.0.**
**Effective: 2026-08-03**

---

## Appendix A — Complete Required Parameters by Phase

### P1 Required Parameters (Minimum Viable Decision)

```
computed_npv, computed_irr_annual, computed_annual_roi,
computed_net_profit, computed_peak_financing_gap,
computed_available_capital, computed_break_even_quarter,
hurdle_rate, total_project_cost, total_revenue, land_cost,
land_area_sqm, build_ratio, total_saleable_area_sqm,
residential_area_sqm, construction_cost_total,
construction_cost_per_sqm_residential,
price_per_sqm_residential, ops_engineering_consulting_pct,
ops_licensing_pct, ops_supervision_pct, ops_hq_cost_total,
marketing_cost_pct, sales_commission_pct, tax_rate,
inflation_rate_annual, sales_period_years, execution_period_years,
total_project_duration_years
```

**Platform-derived at P1 (computed by engine — do not supply):**
`residential_mix_pct, commercial_mix_pct, administrative_mix_pct, medical_mix_pct`

**Conditional at P1 (include when applicable):**
`land_is_installment_purchase`, `market_absorption_rate_years` (when market data evidence with absorption rate is available)

**Plus other conditional parameters triggered by project characteristics.**

**Required evidence categories for P1:**
`financial_projections`, `cost_estimates`, `sales_projections`, `land_terms`

**Conditional evidence categories for P1:**
`cash_flow_timing` (required when `land_cost > 10,000,000` OR `execution_period_years > 2.0`)

### P2 Additions

```
computed_xirr_annual, computed_annual_roe, computed_np_ratio,
computed_dpp_years, equity_amount, debt_amount,
financing_cost_pct [conditional: required when debt_amount > 0],
down_payment_pct, installment_collection_period_quarters,
maintenance_deposit_pct, pessimistic_npv, optimistic_npv,
market_price_benchmark_residential_per_sqm
```

**Platform-derived at P2 (computed by engine — do not supply):**
`scenario_divergence_ratio`

### P3 Additions

```
computed_mirr_annual, computed_profitability_index,
district_irr_benchmark
```

**Platform-derived at P3 (computed by engine — do not supply):**
`inflation_exposure_score`

---

## Appendix B — Evidence Category Quick Reference

| Category | Status | Freshness | Primary Parameters |
|---|---|---|---|
| `financial_projections` | REQUIRED | 30 days | computed_npv, computed_irr_annual, computed_net_profit, total cost/revenue |
| `cash_flow_timing` | CONDITIONAL | 30 days | computed_peak_financing_gap, computed_break_even_quarter |
| `cost_estimates` | REQUIRED | 90 days | construction_cost_per_sqm_[type] |
| `sales_projections` | REQUIRED | 90 days | sales_period_years, sales_velocity_pct |
| `land_terms` | REQUIRED | 180 days | land_cost, land_area_sqm, maintenance_deposit_pct |
| `activity_mix_financial` | CONDITIONAL | 30 days | price_per_sqm_[type], area_sqm_[type] |
| `capital_structure` | CONDITIONAL | 90 days | computed_available_capital, equity_amount, debt_amount |
| `market_data` | ADVISORY | 30 days (prices) / 90 days (absorption) | market_price_benchmark, market_absorption_rate_years |
| `technical_feasibility` | ADVISORY | 180 days | build_ratio, execution_period_years |
| `regulatory_compliance` | ADVISORY | 180 days | permits_confirmed, zoning_compliant, tax_rate |

---

*This document is frozen. Any modification requires approval from the Chief Platform Architect and a version increment per Section 7.*
