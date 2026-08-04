# Real Estate Decision Intelligence — Evidence Library

**Classification:** Engineering Architecture — Internal Only
**Version:** 1.0
**Date:** 2026-08-03
**Author:** Chief Decision Intelligence Architect
**Status:** AWAITING EXECUTIVE APPROVAL

---

## Purpose

This document defines every evidence category that the Eunoia Decision Intelligence Engine evaluates for Real Estate decisions. Each evidence type is defined at the knowledge level: what it represents, who can provide it, how current it must be, and what happens to decision confidence when it is absent or low-quality.

Evidence categories marked **[REQUIRED]** must be present for the feasibility decision to achieve a confidence score above the minimum threshold. Categories marked **[ADVISORY]** improve confidence when present but do not block the decision when absent. Categories marked **[CONDITIONAL]** are required only when specific project characteristics apply.

Evidence categories marked **[UNIVERSAL]** will be reused by future domains. Categories marked **[RE-SPECIFIC]** are Real Estate knowledge.

---

## Evidence Category: financial_projections

**Status:** [REQUIRED] [UNIVERSAL]
**Purpose:** Provides the primary financial outputs of the project's financial model: total cost, total revenue, net profit, NPV, IRR, annual ROI. This is the foundation of any feasibility decision. Without financial projections, no financial gate can evaluate.
**Parameters Produced:**
- `computed_npv` (mandatory)
- `computed_irr_annual` (mandatory from P1)
- `computed_annual_roi` (mandatory)
- `computed_net_profit` (mandatory)
- `total_project_cost` (mandatory)
- `total_revenue` (mandatory)
- `inflation_rate_annual` (mandatory)
- `tax_rate` (mandatory)
- `marketing_cost_pct` (required)
- `sales_commission_pct` (required)

**Authority Hierarchy:**
1. Certified financial study by licensed consultant (authority: 0.95 — `human_validation`)
2. Developer's internal financial model reviewed by CFO (authority: 0.85 — `internal_data`)
3. Developer's unreviewed internal model (authority: 0.75 — `user_input`)
4. Analyst estimate (authority: 0.65 — `user_input`)

**Freshness:** Financial projections for capital investment decisions decay at a domain-specific rate. For Egypt real estate:
- Full financial model: 720 hours (30 days) — use `financial_model` source type
- Key metrics only (NPV summary): 168 hours (7 days) — use `internal_data` source type
- Construction cost component: 2,160 hours (90 days) — use `cost_estimate` source type

**Validation:**
- NPV must be computable from stated cash flows at stated discount rate (consistency check)
- net_profit must equal total_revenue − total_cost − tax (arithmetic consistency)
- IRR must be consistent with NPV sign (positive NPV at 20% hurdle → IRR > 20%)

**Coverage Requirement:** Financial projections is a mandatory coverage item for all feasibility decisions. Coverage score is zero until this category is present.

**Confidence Contribution:**
- evidence_volume: +1 item (or +N if detailed line-item evidence is provided)
- evidence_quality: weighted by authority (certified = 0.95, internal = 0.85, user = 0.75)
- evidence_freshness: degraded if older than 30 days for a full model
- rule_compliance: primary source of data for RE-FIN-001, RE-FIN-002, RE-FIN-003, RE-FIN-005

**Conflict Resolution:** When two financial projection evidence items disagree on NPV by more than 10%, flag as contradictory. The higher-authority source takes precedence for rule evaluation. Contradictory financial projections severely penalize evidence_consistency dimension.

---

## Evidence Category: cash_flow_timing

**Status:** [REQUIRED] [UNIVERSAL]
**Purpose:** Documents the quarterly timing of all cash flows: land installment outflows, construction draw schedule, sales collection inflows (down payments + installment collections). Enables computation of peak_financing_gap, break_even_quarter, and quarterly cash position.
**Parameters Produced:**
- `computed_peak_financing_gap` (mandatory)
- `computed_break_even_quarter` (mandatory)
- `installment_collection_period_quarters`
- `down_payment_pct`
- `land_payment_period_quarters`

**Authority Hierarchy:**
1. Full quarterly cash flow model by licensed consultant (authority: 0.95)
2. Developer's quarterly model reviewed by CFO (authority: 0.85)
3. Developer's quarterly model, unreviewed (authority: 0.75)
4. Annual (not quarterly) cash flow — significantly less accurate (authority: 0.60)

**Freshness:** 720 hours (30 days). The cash flow timing is directly derived from the payment schedules, which are contractual — they do not change daily. However, sales collection projections embedded in the timing model may shift if market conditions change.

**Validation:**
- Sum of all quarterly outflows must equal total_project_cost (within 5%)
- Sum of all quarterly inflows must equal total_revenue (within 5%)
- Peak financing gap must be at the point where cumulative net cash is most negative (mathematical consistency)

**Coverage Requirement:** Required when any of the following apply: `land_cost > 10,000,000`, `execution_period_years > 2.0`, or `computed_available_capital` is provided. Without cash flow timing evidence, the financing gap gate (RE-FIN-004) cannot evaluate — this is a critical capability gap.

**Confidence Contribution:**
- evidence_volume: +1 item (significant, as this is high-information evidence)
- evidence_quality: weighted by authority
- evidence_freshness: financial_model half-life (720h)
- rule_compliance: enables RE-FIN-004, RE-OPS-001 — without this, those rules cannot evaluate

**Conflict Resolution:** When quarterly cash flow total differs from financial_projections total by > 5%, flag as contradictory and alert the analyst. The contradiction must be resolved before the financing gap gate can be trusted.

---

## Evidence Category: market_data

**Status:** [ADVISORY] [RE-SPECIFIC]
**Purpose:** Provides market context for the project: price benchmarks per sqm by activity type and district, market absorption rates, competitive inventory, and demand indicators. Enables price validation (RE-COM-004) and sales velocity benchmarking (RE-COM-002).
**Parameters Produced:**
- `market_price_benchmark_residential_per_sqm`
- `market_price_benchmark_commercial_per_sqm`
- `market_absorption_rate_years`
- `district_irr_benchmark`
- `hurdle_rate` (market convention confirmation)

**Authority Hierarchy:**
1. Published market research from recognized consultancy (authority: 0.90 — `external_source`)
2. Historical transaction database (authority: 0.95 — `human_validation` if verified)
3. Developer's comparable project sales data (authority: 0.80 — `internal_data`)
4. Broker price opinions (multiple brokers aggregated) (authority: 0.70 — `external_source`)
5. Single broker opinion (authority: 0.55 — insufficient as sole source)

**Freshness:** 720 hours (30 days) for price benchmarks. 2,160 hours (90 days) for absorption rates (from quarterly market reports). Price data in Egypt's real estate market can shift 5-15% per quarter — staleness is a material concern.

**Validation:**
- Market price benchmark must be within a plausible range for Egypt real estate (500 to 200,000 EGP/sqm)
- Absorption rate benchmark must be from a comparable project type (residential → residential comparison, not commercial)

**Coverage Requirement:** Advisory (not required) but absence reduces evidence_volume and prevents price deviation rule (RE-COM-004) from evaluating.

**Confidence Contribution:**
- evidence_volume: +1 item per market data source
- evidence_quality: varies significantly by authority
- evidence_freshness: 30-day half-life for price data
- rule_compliance: enables RE-COM-002, RE-COM-004

**Conflict Resolution:** Multiple market data sources often produce different price benchmarks. When two sources differ by more than 15%: use the average weighted by authority. Disagreements above 30% indicate a market segmentation issue (different product types being compared) — flag for analyst review.

---

## Evidence Category: cost_estimates

**Status:** [REQUIRED] [UNIVERSAL]
**Purpose:** Provides unit-level cost data: construction cost per sqm by activity type, engineering cost rates, administrative overhead rates. Enables validation of total_construction_cost and detection of implausible cost assumptions.
**Parameters Produced:**
- `construction_cost_per_sqm_residential`
- `construction_cost_per_sqm_commercial`
- `construction_cost_per_sqm_administrative`
- `construction_cost_per_sqm_medical`
- Engineering cost percentage
- Administrative overhead rate

**Authority Hierarchy:**
1. Signed contractor bill of quantities (authority: 0.95)
2. Cost consultant estimate (authority: 0.90)
3. Developer's cost department estimate from comparable projects (authority: 0.80)
4. Rule-of-thumb estimate without comparable project basis (authority: 0.55)

**Freshness:** 2,160 hours (90 days). Construction cost data in Egypt decays significantly faster than in stable economies due to material price volatility and currency-linked import costs. A 90-day-old estimate in an inflationary environment may understate current costs by 5-15%.

**Validation:**
- Total_construction_cost must equal sum of (cost_per_sqm × area) for each activity type (within 5%)
- Residential cost per sqm must be ≤ commercial per sqm ≤ administrative per sqm ≤ medical per sqm in most standard constructions
- Values outside plausible Egypt market range trigger advisory

**Coverage Requirement:** Required for all feasibility decisions. Without cost estimates, the financial model cannot be validated for internal consistency.

**Confidence Contribution:**
- evidence_quality: most sensitive dimension — cost estimates directly drive financial gate outcomes
- evidence_freshness: 90-day half-life (cost_estimate source type)
- rule_compliance: data quality for RE-FIN-001, RE-FIN-002, RE-FIN-003

**Conflict Resolution:** When the stated total_construction_cost conflicts with the sum computed from per-sqm rates × areas: the per-sqm × area computation takes precedence for rule evaluation (more granular is more reliable). Flag the aggregate discrepancy.

---

## Evidence Category: sales_projections

**Status:** [REQUIRED] [UNIVERSAL]
**Purpose:** Documents the sales timeline assumptions: how long it will take to sell all units, what percentage sells in each year, down payment terms, and installment collection period. This is the evidence that supports `sales_period_years` and `sales_velocity_pct_year1/2/3`.
**Parameters Produced:**
- `sales_period_years` (mandatory from P1)
- `sales_velocity_pct_year1`
- `sales_velocity_pct_year2`
- `sales_velocity_pct_year3`
- `down_payment_pct`
- `installment_collection_period_quarters`

**Authority Hierarchy:**
1. Market research report confirming absorption rates for comparable projects in same district (authority: 0.90)
2. Developer's own comparable project sales data (actual results, not projections) (authority: 0.85)
3. Industry consultancy report on district absorption (authority: 0.80)
4. Developer's projection without comparable basis (authority: 0.60)
5. Management's optimistic sales target (authority: 0.50)

**Freshness:** 2,160 hours (90 days). Absorption rate data is updated quarterly by market research firms. Monthly fluctuations are noise; quarterly is the meaningful update cycle.

**Validation:**
- sales_velocity_pct_year1 + sales_velocity_pct_year2 + sales_velocity_pct_year3 must sum to ≤ 1.0
- If sum < 1.0, remaining percentage sold in subsequent years must be specified
- sales_period_years must be consistent with the velocity percentages (if 80% sold in year 1, period cannot be 3 years)

**Coverage Requirement:** Required. Sales projections are the most critical evidence category because they drive the single most sensitive parameter (sales_period_years). Without sales projections evidence, the sales velocity rule cannot evaluate, and the financial model's sales period assumption is unsupported.

**Confidence Contribution:**
- evidence_quality: heavily weighted — unsupported sales assumptions are the #1 cause of feasibility decision errors
- evidence_freshness: 90-day half-life
- rule_compliance: enables RE-COM-001, RE-COM-002

**Conflict Resolution:** When the developer's sales projection (60% in year 1) conflicts with market research showing 35% typical absorption in year 1: the market research takes precedence for risk assessment. The developer's projection is evaluated as optimistic and the advisory rule triggers a warning.

---

## Evidence Category: activity_mix_financial

**Status:** [CONDITIONAL] [RE-SPECIFIC]
**Condition:** Required when any non-residential activity exceeds 10% of saleable area.
**Purpose:** Provides activity-type-disaggregated financial evidence: separate revenue and cost computations for residential, commercial, administrative, and medical components. Enables the activity mix rules and ensures the aggregate financials do not mask unfavorable activity-level economics.
**Parameters Produced:**
- `residential_area_sqm`, `commercial_area_sqm`, `administrative_area_sqm`, `medical_area_sqm`
- `residential_mix_pct`, `commercial_mix_pct`, `administrative_mix_pct`, `medical_mix_pct`
- `price_per_sqm_residential`, `price_per_sqm_commercial`, `price_per_sqm_administrative`, `price_per_sqm_medical`

**Authority Hierarchy:**
1. Financial study with activity-level breakdown by certified consultant (authority: 0.95)
2. Developer's internal model with activity-level detail (authority: 0.85)
3. Architectural area schedule + market price per type applied (authority: 0.75)

**Freshness:** 720 hours (30 days) for price inputs. Activity areas are from architectural plans — more stable, 2,160h (90 days).

**Validation:**
- Sum of activity areas must equal total_saleable_area_sqm (within 1%)
- Sum of activity mix percentages must equal 1.0 (within 0.01)
- Revenue computed from (area × price per sqm) must approximately match total_revenue (within 5%)

**Coverage Requirement:** Conditional (required when triggered). The coverage score drops below acceptable when this evidence is absent for mixed-use projects. Triggers RE-STR-001.

**Confidence Contribution:**
- evidence_volume: significant — provides N+4 additional evidence items when present
- evidence_quality: enables consistency cross-checks between aggregate and activity-level financials
- rule_compliance: enables RE-COM-003, RE-STR-001

---

## Evidence Category: land_terms

**Status:** [REQUIRED] [RE-SPECIFIC]
**Purpose:** Documents the land acquisition: purchase price, payment schedule (lump sum or installments), down payment, maintenance deposit, and land registration status.
**Parameters Produced:**
- `land_cost`
- `land_area_sqm`
- `maintenance_deposit_pct`
- Land payment schedule (for cash_flow_timing model)

**Authority Hierarchy:**
1. Signed land purchase contract (authority: 0.95)
2. Binding letter of intent with agreed price (authority: 0.85)
3. Negotiated term sheet (authority: 0.75)
4. Asking price without binding agreement (authority: 0.50)

**Freshness:** 4,320 hours (180 days). Land terms are contractual — they do not change once signed. However, asking prices in a negotiation can shift within weeks.

**Validation:**
- land_cost / land_area_sqm must be within plausible range for the district
- If `land_payment_period_quarters > 0`, a payment schedule must be provided for the cash flow timing model

**Coverage Requirement:** Required. Land terms are foundational — without them, the cost structure is incomplete and the cash flow timing model cannot be built.

**Confidence Contribution:**
- evidence_quality: signed contract (0.95) vs. asking price (0.50) — significant range
- rule_compliance: land cost data feeds into NPV, net profit (RE-FIN-001, RE-FIN-003)

---

## Evidence Category: capital_structure

**Status:** [CONDITIONAL] [UNIVERSAL]
**Condition:** Required when `computed_available_capital` is supplied and the financing gap gate (RE-FIN-004) is expected to evaluate.
**Purpose:** Documents how the project is capitalized: equity vs. debt amounts, cost of debt, developer's total available capital commitment, and whether any external co-investment is involved.
**Parameters Produced:**
- `computed_available_capital`
- `equity_amount`
- `debt_amount`
- `financing_cost_pct`
- `hurdle_rate` (confirmation)

**Authority Hierarchy:**
1. Audited balance sheet + signed financing commitment (authority: 0.95)
2. Bank financing pre-approval letter (authority: 0.90)
3. Developer's financial statement (authority: 0.80)
4. Developer's declaration without documentation (authority: 0.60)

**Freshness:** 2,160 hours (90 days). Capital availability can change due to parallel projects, market conditions, or banking relationships. Declarations older than 90 days should be refreshed.

**Validation:**
- equity_amount + debt_amount must approximately equal total_project_cost (within 15% — gap funded from sales proceeds)
- If `computed_available_capital < computed_peak_financing_gap`: financing gate fails (RE-FIN-004)

**Coverage Requirement:** Conditional. Strongly recommended for projects where `land_cost > 10,000,000` or `execution_period_years > 2.0`. Without it, the financing gap gate cannot evaluate, leaving a critical blind spot.

**Confidence Contribution:**
- evidence_quality: highly dependent on authority — declared vs. documented capital is a meaningful distinction
- rule_compliance: enables RE-FIN-004 — the most impactful new P1 gate

---

## Evidence Category: technical_feasibility

**Status:** [ADVISORY] [UNIVERSAL]
**Purpose:** Documents the physical buildability of the project: build ratio (FAR), GFA compliance with regulations, structural requirements, utility access, and execution timeline.
**Parameters Produced:**
- `build_ratio`
- `execution_period_years`
- `total_saleable_area_sqm`

**Authority Hierarchy:**
1. Licensed architect's technical report (authority: 0.90)
2. Structural engineer's feasibility assessment (authority: 0.85)
3. Developer's internal technical assessment (authority: 0.70)

**Freshness:** 4,320 hours (180 days). Technical feasibility parameters change slowly — regulatory limits and physical constraints are stable. Execution timeline estimates may need refreshing if scope changes.

**Validation:**
- total_saleable_area_sqm must be ≤ land_area_sqm × build_ratio × efficiency_ratio
- execution_period_years must be plausible given project scale

**Coverage Requirement:** Advisory — absence reduces confidence but does not block. Its absence means execution risk rules (RE-EXE-001, RE-OPS-003) cannot evaluate.

---

## Evidence Category: regulatory_compliance

**Status:** [ADVISORY] [UNIVERSAL]
**Purpose:** Documents legal and regulatory clearance: building permits status, zoning compliance, land registration, tax structure compliance, and maintenance deposit obligation.
**Parameters Produced:**
- `permits_confirmed` (boolean)
- `zoning_compliant` (boolean)
- `land_registration_status` (categorical)
- `tax_rate` (confirmation)
- `maintenance_deposit_pct`

**Authority Hierarchy:**
1. Official permit approval from relevant authority (authority: 1.00)
2. Legal counsel confirmation of regulatory status (authority: 0.90)
3. Developer's regulatory status declaration (authority: 0.65)

**Freshness:** 8,760 hours (365 days) for zoning and land registration (changes annually at most). 4,320 hours (180 days) for permit status (active permit required at construction start).

**Validation:**
- If `permits_confirmed = false`, advisory rule fires (project cannot proceed to construction without permits)
- If `zoning_compliant = false`, advisory rule fires unconditionally

**Coverage Requirement:** Advisory — improves confidence when present. Required for decision confidence to reach VERY_HIGH band on any feasibility decision.

**Confidence Contribution:**
- evidence_quality: enables regulatory advisory rules
- evidence_volume: regulatory clearance adds high-authority items to the evidence pool

---

## Evidence Freshness Reference Table

| Evidence Category | Source Type (NEW) | Half-Life | Rationale |
|-------------------|-------------------|-----------|-----------|
| financial_projections | `financial_model` | 720h (30 days) | Monthly financial review cycle |
| cash_flow_timing | `financial_model` | 720h (30 days) | Tied to financial model cycle |
| market_data (prices) | `market_price_data` | 720h (30 days) | Monthly price movements material |
| market_data (absorption) | `market_research` | 2,160h (90 days) | Quarterly market report cycle |
| cost_estimates | `cost_estimate` | 2,160h (90 days) | Contractor quotes valid 90 days |
| sales_projections | `sales_research` | 2,160h (90 days) | Quarterly absorption data |
| activity_mix_financial | `financial_model` | 720h (30 days) | Tied to financial model cycle |
| land_terms | `legal_document` | 4,320h (180 days) | Contractual — stable |
| capital_structure | `financial_model` | 2,160h (90 days) | Capital availability refreshed quarterly |
| technical_feasibility | `technical_report` | 4,320h (180 days) | Physical parameters stable |
| regulatory_compliance | `legal_document` | 4,320h (180 days) | Regulatory status stable |

*All half-lives in this table replace the current `external_source: 24h` and `internal_data: 168h` defaults for Real Estate evidence. The existing defaults remain in place for Marketing Intelligence and other non-RE domains.*

---

## Evidence Coverage Requirements by Decision Type

### Feasibility Report Type

| Evidence Category | Required? | Without It: |
|------------------|-----------|-------------|
| financial_projections | REQUIRED | Coverage = 0; all financial gates fail to evaluate |
| cash_flow_timing | REQUIRED | RE-FIN-004 (financing gap) cannot evaluate; coverage gap |
| cost_estimates | REQUIRED | Financial model cannot be validated |
| sales_projections | REQUIRED | RE-COM-001 cannot evaluate; sales period unsupported |
| land_terms | REQUIRED | Cost structure incomplete |
| activity_mix_financial | CONDITIONAL | Required when non-residential > 10%; coverage gap otherwise |
| capital_structure | CONDITIONAL | Required when financing gap gate is included |
| market_data | ADVISORY | Benchmark rules cannot evaluate; confidence reduced |
| technical_feasibility | ADVISORY | Execution rules cannot evaluate |
| regulatory_compliance | ADVISORY | Regulatory advisory rules cannot evaluate |

### Market Entry Report Type

| Evidence Category | Required? | Without It: |
|------------------|-----------|-------------|
| market_data | REQUIRED | Decision has no market basis |
| financial_projections | REQUIRED | Financial gates cannot evaluate |
| sales_projections | REQUIRED | Demand validation absent |
| cost_estimates | ADVISORY | Land acquisition focused — construction cost less critical |
| regulatory_compliance | ADVISORY | Important for location clearance |
