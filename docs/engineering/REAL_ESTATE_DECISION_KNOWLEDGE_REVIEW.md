# Real Estate Decision Knowledge Review

**Classification:** Engineering Architecture — Internal Only
**Author:** Chief Decision Intelligence Architect
**Date:** 2026-08-03
**Scope:** Reverse-engineering of professional real estate feasibility methodology against the Eunoia Decision Intelligence Engine

---

## 1. Executive Summary

Real estate feasibility in the Egyptian market is not a single-point decision. It is a sequence of layered financial gates, each eliminating a class of risk before advancing to the next. Professional consultants approach these decisions with a deterministic financial model first — NPV, IRR, cash flow timing — and a qualitative risk layer second.

Eunoia currently handles the qualitative and rule-compliance layer with high sophistication. What the reference methodology reveals is that the financial gate layer — specifically the temporal dimension of cash flows, IRR as a return metric, and financing gap risk — is entirely absent from the evidence model. This is the highest-value gap.

The platform's confidence engine, validation pipeline, explainability engine, and scenario intelligence are architecturally superior to anything in the reference methodology. The reference methodology has no equivalent for these. The gap is entirely in domain-specific financial intelligence, not in decision architecture.

**Verdict:** Eunoia is architecturally ready for Real Estate. The missing intelligence is additive (new evidence parameters, new rules, new evidence coverage requirements), not architectural. No engine changes are needed for the improvements recommended here.

---

## 2. Report Architecture Analysis

### 2.1 The 9-Step Professional Feasibility Structure

Professional real estate feasibility follows a strict sequential methodology that establishes why each analytical section exists. Each step answers a business question before the next step is permitted to begin.

| Step | Business Question | Evidence Expected | Decision Gate |
|------|-------------------|-------------------|---------------|
| 1. Project Definition | What are we deciding about? | Scope, parameters, land | Proceed to analysis |
| 2. Preliminary Analysis | Is this worth a full study? | Pre-screen indicators | Stop or continue |
| 3. Market Analysis | Is there demand at this price? | Market data, competition, location | Demand viable? |
| 4. Technical Feasibility | Can this be built as designed? | Engineering, permits, GFA ratios | Buildable? |
| 5. Operational Planning | Can we run this project? | Team, structure, timeline | Executable? |
| 6. Financial Evaluation | Does it make financial sense? | DCF, NPV, IRR, ROI, cash flows | Financially viable? |
| 7. Legal & Regulatory | Is it legally permissible? | Permits, zoning, licenses | Legally clear? |
| 8. Risk Assessment | What could go wrong? | Risk scenarios, mitigations | Acceptable risk? |
| 9. Final Report | Go or No-Go? | All above synthesized | Decision |

**What this means for Eunoia:** Steps 6 and 8 are the primary analytical targets for the DI engine. Steps 1-5 and 7 are input-gathering stages. The current Eunoia feasibility rules operate at step 6 level (NPV, ROI gates) but miss the temporal and compositional complexity that professional consultants treat as mandatory within step 6.

### 2.2 The Financial Study Architecture

The professional financial study is organized around three distinct analytical layers:

**Layer 1 — Cost Decomposition:** Land cost → Construction cost (by activity type, inflation-adjusted) → Engineering and consulting → Administrative overhead → Marketing and sales commission. These are summed to total project cost.

**Layer 2 — Revenue Modeling:** Saleable area by activity type × price per sqm per district. Revenue spread across a sales period (typically 2-3 years, quarterly). Payment collection modeled per quarter: down payment received at contract, installments collected over 6-8 subsequent quarters. This produces the inflow schedule.

**Layer 3 — Capital Intelligence:** NPV at a specific discount rate (the 20% hurdle rate is market-standard in Egypt). IRR on the full cash flow sequence. Break-even quarter (when cumulative net cash flow turns positive). Annual ROI (profit / total cost / years). Revenue Rate per period.

The layers interact: a project can have positive NPV but negative cumulative cash flow at quarter 8, requiring bridge financing. This is a financing gap risk that NPV alone does not reveal.

---

## 3. Business Thinking Patterns

### 3.1 The Go/No-Go Is Not Binary — It Is Layered

Professional consultants do not ask "should we proceed?" as a single question. They ask it at each analytical gate:
- Does market demand justify the unit mix? If yes → proceed to financial.
- Does the NPV exceed zero at the hurdle rate? If yes → proceed.
- Does the IRR exceed the cost of capital? If yes → proceed.
- Is the maximum financing gap within available capital? If yes → proceed.
- Are the scenarios coherent with market absorption rates? If yes → Go.

Each gate can block further analysis. A project with excellent NPV but a financing gap exceeding available capital is a No-Go. The consultant stops at the financing gate, not at the NPV gate.

**Implication for Eunoia:** The current rule structure evaluates NPV and net profit as blocking conditions. This is correct. The missing gates are IRR vs. cost of capital, and financing gap vs. available capital. These are not edge cases — they are standard professional practice.

### 3.2 Activity Mix Is a Strategic Variable, Not a Given

Professional consultants treat the allocation between residential, commercial, administrative, and medical uses as a decision variable. The mix affects: total revenue, cost of construction (different sqm costs per type), marketing cost (commercial sells differently from residential), and absorption rate (commercial is slower to sell).

A project with 80% residential and 20% commercial has different risk from one with 50% residential and 50% commercial — even with identical land area and total budget.

**Implication for Eunoia:** The current feasibility model treats the financial summary as a single number. The reference methodology computes it by activity type. Evidence of "what is the activity mix and does it match market demand?" is entirely absent from the current evidence coverage requirements.

### 3.3 Sales Velocity Is the Single Largest Financial Risk

Every financial model reviewed has multiple sales duration scenarios (2 years, 2.5 years, 3 years). Why? Because the difference between selling 70% of units in 2 years versus 3 years is the difference between project success and capital destruction.

When sales are slow:
- Land installments continue (fixed outflow)
- Construction draws continue (fixed outflow)
- Revenue inflows are delayed
- The financing gap grows
- The effective IRR collapses
- The net profit per year (annualized ROI) drops sharply

Professional consultants treat the sales period assumption as the single most sensitive input to the financial model.

**Implication for Eunoia:** Eunoia currently has no sales velocity evidence. The scenario engine tests ±20% on parameters from fired rules. None of the current rules reference a sales velocity parameter. This is a blind spot.

### 3.4 Inflation Is a Cost Risk, Not a Market Risk

All three financial models apply an annual inflation coefficient to construction costs. Why? Because in Egypt's inflationary environment, the construction cost at year 3 is materially higher than at year 1 of a 4-year execution timeline.

A project that is NPV-positive on static costs may be NPV-negative when inflation is applied. Consultants model this explicitly, typically with an annual inflation rate applied compounded over the execution period.

**Implication for Eunoia:** Evidence freshness (the 0.20-weight dimension) captures data staleness but not cost escalation risk. Construction cost evidence needs a separate inflation-adjustment signal. A 2-year-old construction cost estimate is not just "stale" — it may be systematically incorrect due to cost escalation.

### 3.5 The 20% Discount Rate Is a Market Convention, Not an Arbitrary Choice

The Egyptian real estate market has standardized on a 20% discount rate (hurdle rate) for NPV calculations. This is not a risk-free rate — it is the minimum acceptable return for a real estate development project in the Egyptian context. It reflects: inflation risk, currency risk, construction risk, and market risk.

When NPV at 20% is negative, the project is returning less than what would be required in the Egyptian market — not less than a risk-free investment.

**Implication for Eunoia:** The current feasibility rule `npv_negative_blocks_proceed` already uses NPV as a gate but doesn't make the hurdle rate relationship explicit. The IRR complement — "IRR must exceed the 20% hurdle rate" — is missing as a second financial gate.

---

## 4. Decision Patterns

### 4.1 Decision Typology in Professional Real Estate

Professional consultants implicitly classify real estate investment decisions into four types:

| Decision Type | Primary Driver | Secondary Driver | Kill Condition |
|---------------|---------------|------------------|----------------|
| Land acquisition | Location score × demand | Price per sqm vs. market | Negative NPV at hurdle rate |
| Project go/no-go | NPV + IRR | Cash flow gap | IRR < cost of capital |
| Activity mix optimization | Revenue per sqm by activity | Demand absorption by type | No-sales activity present |
| Sales strategy | Price × velocity | Payment terms competitiveness | Break-even > acceptable period |

Eunoia's current feasibility report type maps to "project go/no-go" — the correct scope. Market entry maps to "land acquisition." The review confirms the current report type mapping is correct.

### 4.2 The Recommendation Logic in Professional Consulting

Professional consultants do not simply say "proceed" or "don't proceed." They say:
- "Proceed under the base scenario with the following conditions..."
- "Revise the activity mix to reduce commercial allocation from X% to Y%..."
- "Defer until sales velocity benchmarks for this district are confirmed..."

The option labels `proceed / revise / defer` in Eunoia's current feasibility benchmark cases are precisely correct. The issue is that "revise" needs to carry specific revision guidance (revise what? by how much?). The current explainability engine produces WHY_NOT explanations but not actionable revision parameters.

### 4.3 Compound Decision Dependencies

Professional consultants recognize that real estate decisions are compound: each sub-decision depends on the outcome of the prior one. You cannot answer "what is the optimal sales strategy?" before answering "is the project financially viable?" You cannot answer "is it financially viable?" before answering "is there market demand?"

Eunoia currently evaluates all rules in a single pass per option. The dependency structure between financial viability and strategic questions is not encoded.

---

## 5. Financial Intelligence Patterns

### 5.1 The Primary Financial Decision Framework

Professional real estate analysis establishes four primary financial KPIs. A project is viable only if all four pass their respective gates:

**Gate 1 — NPV ≥ 0 at the hurdle rate.** Net Present Value measures whether the discounted future cash flows exceed the cost. If NPV < 0, the project destroys value in present-value terms regardless of headline profit.

**Gate 2 — IRR > cost of capital (minimum: hurdle rate).** Internal Rate of Return is the discount rate at which NPV equals zero. If IRR < 20% (Egypt hurdle), the project is returning less than what the market expects for comparable risk.

**Gate 3 — Break-even quarter is within acceptable range.** When does cumulative net cash flow first turn positive? In Egypt professional practice, the acceptable range is 6-9 months for fast-moving projects, up to 12-18 months for large mixed-use. Beyond 24 months, financing risk becomes excessive.

**Gate 4 — Peak financing gap is within available capital.** The maximum negative cumulative cash position during execution. A project may have positive NPV but require capital in excess of what is available. This is a capital structure failure, not a return failure.

### 5.2 Supporting Financial Metrics

These metrics provide context for executive communication but are not decision gates in isolation:

- **Annual ROI:** Project profit / total cost / years. Used for comparison across projects of different scales and durations. Not a gate — a communication metric.
- **Annual ROE:** Return on equity (profit / equity invested). Relevant when leverage is used. Not a primary gate.
- **NP Ratio (Net Profit Ratio):** Net profit / total revenue. Gross margin equivalent. Useful for tracking margin erosion across scenarios.
- **Revenue Rate per Period:** Revenue per quarter. Used to validate sales pacing assumptions.
- **Profitability Index:** NPV / initial investment. Used to rank competing projects when capital is constrained.

### 5.3 Cost Architecture (Mandatory Categories)

Professional feasibility models always decompose costs into these categories. Missing any category is an evidence gap:

1. **Land cost** — purchase price + down payment terms + installment schedule
2. **Construction cost** — by activity type (residential, commercial, administrative, medical), inflation-adjusted over execution period
3. **Engineering and consulting** — design, supervision, permits, as % of construction cost
4. **Administrative overhead** — project management, office, staff
5. **Marketing cost** — as % of total sales revenue
6. **Sales commission** — internal (% of sales) + external (% of sales)
7. **Tax** — corporate tax on profit (22.5% in Egypt)
8. **Maintenance deposit** — statutory requirement (typically 3-5% of land value, paid upfront)
9. **Financing cost** — interest on construction financing if debt-funded

### 5.4 Revenue Architecture (Mandatory Categories)

Revenue decomposition always follows this pattern:

1. **Saleable area by activity type** — residential sqm, commercial sqm, administrative sqm, medical sqm
2. **Price per sqm by type and district** — location-differentiated pricing
3. **Sales collection schedule** — % collected at contract, % per installment period
4. **Total revenue projection** — saleable area × price per sqm × sales percentage by period

### 5.5 Capital Structure Intelligence

The reference methodology includes WACC-based capital structure analysis:

- **Cost of equity:** CAPM (risk-free rate + beta × market premium) or DDM
- **Cost of debt:** Interest rate × (1 - tax rate)
- **WACC:** Weighted blend of equity and debt costs
- **LTV (Loan-to-Value):** Total debt / property value — used by banks as a risk metric
- **CAP Rate:** NOI / Property value — standard real estate valuation metric

These are inputs to the investment decision for equity-funded vs. debt-funded projects. A project that looks attractive on an all-equity basis may be unattractive after financing costs.

---

## 6. Risk Intelligence Patterns

### 6.1 Financial Risk Taxonomy

Professional consultants identify five categories of financial risk in real estate development:

| Risk Category | Driver | Measurement | Current Eunoia Coverage |
|--------------|--------|-------------|-------------------------|
| Return risk | IRR < hurdle rate | IRR vs. 20% | PARTIAL — uses ROI, not IRR |
| Capital risk | Peak financing gap > available capital | Max negative cumulative cash | ABSENT |
| Sales velocity risk | Slower-than-projected absorption | Sales period assumption | ABSENT |
| Construction cost risk | Inflation eroding margins | Inflation coefficient × execution period | ABSENT |
| Timing risk | Break-even period beyond acceptable range | Break-even quarter | PARTIAL — uses months, not quarter-by-quarter |

### 6.2 The Scenario Risk Framework

Professional consultants always model three scenarios to bound the risk range:

**Pessimistic:** Slower sales (add 1 year to sales period), lower prices (subtract market appreciation), higher construction cost (apply higher inflation). What is the NPV/IRR under worst-case assumptions?

**Base:** Most likely sales pace, expected market prices, standard inflation rate. The primary recommendation scenario.

**Optimistic:** Faster sales (subtract 6 months from sales period), higher prices (add appreciation), controlled costs. What is the upside?

The gap between pessimistic NPV and optimistic NPV defines the **decision risk range**. A project where pessimistic NPV is still positive is fundamentally different from one where pessimistic NPV is severely negative.

### 6.3 Legal and Regulatory Risk

Professional feasibility identifies four regulatory risk categories:
- **Permits and licenses** — are they obtainable in the required timeframe?
- **Building ratio compliance** — does the designed GFA comply with FAR regulations?
- **Zoning** — is the activity mix permitted in this location?
- **Tax compliance** — is the tax structure correctly modeled?

Eunoia has no legal/regulatory risk evidence category.

---

## 7. Evidence Patterns

### 7.1 What Evidence a Professional Consultant Collects

For a feasibility study, the mandatory evidence categories (ordered by decision criticality):

1. **Financial projections** — NPV, IRR, break-even, annual ROI, cash flow table
2. **Market data** — price per sqm by district and activity type, competitor projects
3. **Cost estimates** — construction cost per sqm by type, engineering rates, admin rates
4. **Sales projections** — absorption rate by project type in the target district, comparable sales velocity
5. **Land terms** — purchase price, payment schedule, maintenance deposit
6. **Regulatory** — permits required, timeline, zoning compliance
7. **Financing** — available capital, financing terms, capital structure

The **most critical evidence gap** that causes decision errors is missing sales velocity data. Consultants see projects approved on strong NPV assumptions that fail because the sales period was grossly underestimated.

### 7.2 Evidence Authority in the Real Estate Context

Professional consultant evidence sources, ranked by reliability:

1. **Historical transaction data** — actual sales prices in comparable projects (highest authority)
2. **Certified appraisals** — third-party professional valuation
3. **Market research reports** — consultancy research on absorption rates
4. **Developer internal models** — assumptions from similar completed projects
5. **Broker price opinions** — market practitioners' pricing estimates
6. **Management projections** — developer's own assumptions (lowest authority for external validation)

The current Eunoia evidence authority mapping (`human_validation: 1.00, internal_data: 0.90, user_input: 0.80`) maps reasonably to this hierarchy, with `internal_data` corresponding to developer internal models and `user_input` to management projections.

### 7.3 Evidence Freshness in Real Estate

Real estate evidence decays at different rates by type:

- **Transaction prices:** 30-90 days (market moves quickly)
- **Absorption rates / sales velocity:** 90-180 days (quarterly market reports)
- **Construction costs:** 90-180 days (material prices fluctuate)
- **Regulatory / permits:** 6-12 months (zoning changes slowly)
- **Land valuation:** 90-180 days
- **Demographic / demand data:** 12-24 months

The current Eunoia freshness half-lives (`external_source: 24h, internal_data: 168h`) are tuned for marketing data (CPL, campaign metrics). For real estate financial data, these half-lives are far too short. A construction cost estimate from 30 days ago is still highly relevant. Setting external_source to 24h would mark all real estate market data as stale within a day, degrading confidence scores inappropriately.

---

## 8. Executive Communication Patterns

### 8.1 The Investment Summary Structure

Every professional real estate feasibility report delivers the executive summary in a fixed structure:

**Section A — Investment Parameters:**
- Land area and location
- Project composition (activity types and allocation percentages)
- Execution timeline
- Sales timeline

**Section B — Financial Summary:**
- Total cost (land + construction + operating + marketing + sales)
- Total revenue
- Gross profit
- Tax
- Net profit
- Annual ROI
- Key return metrics (NPV, IRR)

**Section C — Cash Flow Timeline:**
- Annual inflows and outflows for each year
- Cumulative cash position
- When break-even is achieved

**Section D — Recommendation:**
- Go / No-Go with specific conditions
- Sensitivity to key assumptions
- Next steps

### 8.2 The Executive Always Wants Three Things

Regardless of the report type, executives at real estate decisions consistently want to know:

1. **What is the return?** (Annual ROI, IRR, net profit)
2. **How long until I get my money back?** (Break-even, capital recovery schedule)
3. **What is the worst case?** (Pessimistic scenario, maximum capital at risk)

The current Executive Report covers (1) through the `expectedBusinessImpact` section but provides only structured risk flags for (2) and (3). The pessimistic scenario is absent from the structured output.

### 8.3 The 90-Day Action Plan Is Standard Practice

Professional consultants always close with a phased 90-day implementation plan:
- Phase 1 (Days 1-30): Land acquisition completion, team assembly
- Phase 2 (Days 31-60): Permits, design finalization, contractor selection
- Phase 3 (Days 61-90): Construction mobilization, sales launch preparation

The current Eunoia `implementationRoadmap` section already reflects this structure. This is an existing strength.

---

## 9. Missing Intelligence Compared to Eunoia

### 9.1 Gaps in Evidence Coverage Requirements

The current feasibility report type evidence coverage requirements are missing:

| Missing Evidence Category | Business Question It Answers | Decision Impact |
|---------------------------|------------------------------|-----------------|
| `irr_analysis` | Does the project return exceed cost of capital? | Critical — primary financial gate |
| `cash_flow_timing` | Will we run out of cash before break-even? | Critical — financing gap risk |
| `sales_velocity` | How fast will units actually sell? | High — single biggest failure mode |
| `activity_mix_financial` | Does the unit mix optimize revenue vs. cost? | High — optimization decision |
| `inflation_adjusted_costs` | What does inflation do to margins? | Medium — execution period risk |
| `capital_structure` | How is the project financed and at what cost? | Medium — leveraged vs. equity |
| `regulatory_compliance` | Are permits obtainable and on what timeline? | Medium — execution risk |

### 9.2 Gaps in Rule Intelligence

The current feasibility rules check: NPV ≤ 0 (FAIL), net profit ≤ 0 (FAIL), ROI < 8% (WARN), strong ROI warns against defer/revise.

Missing rules (not yet implemented):

| Missing Rule | Condition | Action | Priority |
|--------------|-----------|--------|----------|
| IRR below hurdle rate | `irr_annual < 0.20` | FAIL | P1 |
| Financing gap exceeds capital | `peak_financing_gap > available_capital` | FAIL | P1 |
| Sales period too long | `sales_period_years > 3.5` | WARN | P1 |
| Pessimistic NPV negative | `pessimistic_npv <= 0` | WARN | P2 |
| Inflation-eroded margin | `effective_margin_after_inflation < 0.10` | WARN | P2 |
| Construction cost basis stale | evidence age > 90 days | WARN (via evidence freshness) | P1 |
| Maintenance deposit missing from cost | `maintenance_deposit_included == false` | WARN | P2 |

### 9.3 Gaps in Scenario Intelligence

The current scenario engine tests ±20% on parameters from fired rules. What is missing:

| Missing Scenario Type | Description | Decision Impact |
|-----------------------|-------------|-----------------|
| Named scenario comparison | Pessimistic vs. Base vs. Optimistic as distinct model runs | High |
| Sales velocity scenarios | What happens if sales take 1 year longer? | High |
| Construction cost inflation scenario | What if inflation is 5% higher than assumed? | Medium |
| Phase delay scenario | What if Phase 2 is delayed 6 months? | Medium |
| Price appreciation scenario | What if district prices fall 15%? | Medium |

The ±20% parameter variation is correct architecture. Named scenarios are additive (new scenario types, not a new engine).

### 9.4 Gaps in Confidence Scoring

The five-dimensional confidence model (volume, quality, freshness, consistency, rule_compliance) does not capture:

| Missing Confidence Signal | Description | Architecture Path |
|--------------------------|-------------|-------------------|
| Financial model vintage | Age of the underlying financial assumptions | Penalize evidence_quality when financial evidence > 90 days old |
| Scenario divergence | Gap between pessimistic and optimistic NPV | New signal added to rule_compliance dimension |
| Sales velocity assumption quality | How well-supported is the absorption rate? | New evidence category → coverage score |
| Activity mix completeness | Are all activity types represented in evidence? | Coverage requirement for feasibility |

### 9.5 Gaps in Explainability

The current explainability engine produces WHY, WHY_NOT, EVIDENCE_USED, and RULES_TRIGGERED. What is missing:

| Missing Explainability Element | Description | Value |
|-------------------------------|-------------|-------|
| Revision parameter guidance | "To change recommendation from REVISE to PROCEED, NPV must increase from X to Y" | High |
| Scenario comparison narrative | "Under base case: proceed. Under pessimistic: defer." | High |
| Financial gate hierarchy | Which financial gate blocked the decision and why | Medium |

---

## 10. Existing Eunoia Strengths

### 10.1 Decision Architecture Strengths

| Strength | Description | Competitive Advantage |
|----------|-------------|----------------------|
| Five-dimensional confidence | Quality, volume, freshness, consistency, rule compliance independently scored | No equivalent in any reference model |
| Compile-time weight guard | `CONFIDENCE_DIMENSION_WEIGHTS` sum enforced at compile time | Prevents silent model corruption |
| Pure function architecture | All engines accept arguments and return results — no I/O | Fully testable, perfectly reproducible |
| Branded TypeScript IDs | `DecisionId`, `EvidenceId`, `RuleId` — cross-domain mixing caught at compile time | Engineering correctness |
| Scenario stability score | ROBUST/MODERATE/FRAGILE + stabilityScore | No equivalent in professional consulting |
| 5-stage validation pipeline | Structural → Business → Evidence → Confidence → Consistency | Forces data quality before decision |
| Halt-on-blocking-failure | Pipeline stops and reports why — doesn't produce garbage output | Error transparency |
| Gold dataset benchmark | 16 cases, 100% recommendation accuracy — regression gate | No equivalent in any reference |

### 10.2 Rule Engine Strengths

| Strength | Description |
|----------|-------------|
| 11 operators | eq, neq, gt, gte, lt, lte, in, not_in, exists, not_exists, matches |
| Weighted rule scoring | Rules carry weights → scoring reflects business priority, not rule count |
| OR-between-groups / AND-within-group | Correct semantics for complex business conditions |
| Condition trace | Every rule evaluation records factPath, operator, expected, actual, matched |
| Domain filtering | Rules scoped to domains — prevents cross-domain rule pollution |

### 10.3 Explainability Strengths

| Strength | Description |
|----------|-------------|
| WHY | Explains the recommendation with reasons and weights |
| WHY_NOT | Explains each rejected option with blocking rules and score comparison |
| EVIDENCE_USED | Every evidence item with source, weight, freshness |
| RULES_TRIGGERED | Every fired rule with context |
| Alternatives considered | Could-be-recommended-if guidance |

### 10.4 Report Strengths

| Strength | Description |
|----------|-------------|
| 12-section executive report | Structured output covering all executive needs |
| 90-day implementation roadmap | Already matches professional consulting practice |
| Trust score (4-band) | Consumer-facing confidence interpretation |
| Risk flags with mitigation | Structured risk surface with actionable advice |
| Immutable report versioning | Supersedes not deletes — audit trail |

---

## 11. High-Value Improvements (Highest ROI First)

### Improvement 1 — IRR as a Primary Financial Gate

**What is missing:** IRR is the professional standard for real estate return measurement. NPV answers "is this project worth doing?" IRR answers "at what rate is it returning capital?" A project with positive NPV at 20% discount rate has an IRR ≥ 20%. But an analyst who inputs too-optimistic cash flow projections can get positive NPV with an IRR far below 20%.

**How it improves decisions:** Adding `computed_irr_annual` as an evidence parameter and a rule `irr_annual < hurdle_rate → FAIL (blocking)` closes the return-rate gate. An AI-generated analysis could hallucinate a positive NPV but computing IRR from the same cash flows provides an independent check.

**Architecture fit:** New evidence parameter in `context.parameters`. New business rule in the feasibility rule set. No engine change.

**Accuracy gain:** Eliminates false-positive feasibility approvals where NPV is marginally positive but IRR is below market minimum.

---

### Improvement 2 — Financing Gap as a Capital Risk Rule

**What is missing:** A project can have positive NPV and positive IRR but require capital in a single quarter that exceeds what the developer has available. This is called the financing gap — the maximum negative cumulative cash position during execution. Professional models compute this explicitly.

**How it improves decisions:** A rule `peak_financing_gap > available_capital → FAIL (blocking)` prevents recommending projects that will stall at execution. Current Eunoia approves projects based on NPV and ROI, which are lifetime measures — they miss within-project capital crises.

**Architecture fit:** New evidence parameter `computed_peak_financing_gap` and `computed_available_capital`. New blocking rule. No engine change.

**Accuracy gain:** Prevents the most common real estate project failure mode: runs out of money mid-construction.

---

### Improvement 3 — Sales Velocity as a Decision Parameter and Scenario Axis

**What is missing:** Sales period (how long it takes to sell units) is the single most sensitive input in professional real estate models. A 1-year extension in sales period can turn a profitable project into a loss. Eunoia has no sales velocity evidence.

**How it improves decisions:**
1. New evidence parameter `computed_sales_period_years` enables a rule: `sales_period_years > 3.5 → WARN` (extended sales risk).
2. The scenario engine would test `sales_period_years ±20%`, generating scenarios like "if sales take 20% longer, recommendation flips from PROCEED to DEFER."
3. Sales velocity becomes a scenario axis automatically once the parameter is in `context.parameters`.

**Architecture fit:** New evidence parameter. New rule. Scenario engine automatically picks it up (it tests all numeric parameters from fired rules). No engine change.

**Accuracy gain:** The current scenario engine only tests parameters from fired rules. Adding sales velocity as an explicit parameter enables automatic what-if analysis on the most critical real estate assumption.

---

### Improvement 4 — Multi-Named Scenario Support (Pessimistic / Base / Optimistic)

**What is missing:** The current scenario engine tests ±20% parameter variations. Professional consultants run three named scenarios with distinct, coherent sets of assumptions — not independent parameter tweaks. The gap: ±20% on NPV is not the same as "what is the NPV under a pessimistic scenario where sales are slower, costs are higher, and prices are lower simultaneously?"

**How it improves decisions:** Named scenarios allow the recommendation to surface as: "Under base case: Proceed. Under pessimistic: Revise." This is the decision format that executives actually use. The current stability assessment (ROBUST/MODERATE/FRAGILE) is correct but tells you nothing about the direction of risk.

**Architecture fit:** New `ScenarioSet` type in scenario.types.ts with `pessimistic`, `base`, `optimistic` fields. New `runNamedScenarios()` function in scenario-engine.ts. The existing `runScenarioAnalysis()` is complementary, not replaced.

**Accuracy gain:** Enables compound scenario reasoning. The scenario engine currently tests parameters independently. Named scenarios test them jointly — closer to how professionals assess risk.

---

### Improvement 5 — Evidence Freshness Half-Lives for Real Estate Financial Data

**What is missing:** The current freshness half-lives are tuned for marketing data (CPL campaigns: `external_source: 24h`). A construction cost estimate from 7 days ago has a freshness score near zero under the current model. For real estate financial data, the relevant staleness horizon is 30-90 days, not 24 hours.

**How it improves decisions:** The confidence engine penalizes fresh financial evidence as if it were stale marketing data. This means confidence scores for real estate feasibility decisions are artificially depressed, potentially causing the confidence stage to block decisions that should proceed.

**Architecture fit:** The evidence collector uses `SOURCE_HALF_LIVES` which is a constant in `evidence-collector.ts`. This can be extended to support report-type-specific half-lives, or a new source type `financial_model` can be added with a 720h (30-day) half-life.

**Accuracy gain:** Prevents confidence score deflation from freshness misclassification. Allows real estate decisions to achieve appropriate confidence bands on legitimately current financial data.

---

### Improvement 6 — Activity Mix Financial Coverage Requirement

**What is missing:** Professional feasibility models decompose revenue and cost by activity type (residential, commercial, administrative, medical). Eunoia's evidence coverage requirements for feasibility do not require activity-type-specific financial evidence. A feasibility decision based on a single total-project revenue figure misses the mix risk.

**How it improves decisions:** Adding `activity_mix_financial` as a required evidence category for feasibility reports means: the coverage score penalizes decisions where activity-specific revenue and cost evidence is absent. This propagates to the quality dimension of confidence and ultimately to the recommendation.

**Architecture fit:** New entry in evidence coverage requirements in `evidence-coverage.ts`. No engine change.

**Accuracy gain:** Forces analysts to supply complete financial evidence. Prevents feasibility approvals based on headline numbers that hide unfavorable activity-level economics.

---

### Improvement 7 — Revision Parameter Guidance in Explainability

**What is missing:** When the recommendation is REVISE, the explainability output tells the user that a lower score or blocking rule caused the non-recommendation. It does not tell the user: "To change the recommendation from REVISE to PROCEED, the NPV must increase by X (from negative to positive), which requires either reducing construction cost by Y or increasing price per sqm by Z."

**How it improves decisions:** Actionable revision guidance transforms a blocking "No" into a conditional "Not yet — here's what changes it." Professional consultants always provide this. The current WHY_NOT explanation says which rule blocked the option but not what value change would unblock it.

**Architecture fit:** The scenario engine already computes sensitivity thresholds — the crossover value for each numeric parameter. This information is available in `SensitivityThreshold.changeDescription`. Surfacing this in the WHY_NOT explainability output requires wiring `sensitivityThresholds` into `generateExplainability()`. The data already exists; it needs to flow into the explainability output.

**Accuracy gain:** Does not directly improve recommendation accuracy. Improves decision quality by telling the operator what to change — which makes subsequent decisions more accurate.

---

## 12. Low-Value Ideas (Rejected with Reasons)

### Rejected: Full WACC/CAPM Calculator Inside the Engine

**Why rejected:** WACC requires real-time market inputs (beta, risk-free rate, market return) that change daily. Embedding a WACC calculator inside Eunoia would create a stale data problem — the engine would compute WACC from fixed parameters while the real market cost of capital has changed. Better approach: WACC is computed externally and supplied as evidence (`computed_wacc`). The engine evaluates it as a comparison value in rules. No calculator needed.

### Rejected: Construction Cost Database

**Why rejected:** Construction costs per sqm vary by material source, contractor, district, and season. A hardcoded database becomes incorrect within months. Better approach: cost data is supplied as evidence with appropriate freshness scoring. Eunoia's evidence freshness mechanism already handles the staleness problem.

### Rejected: Building Permit Workflow Integration

**Why rejected:** Legal and regulatory workflow (permit applications, follow-up, approval tracking) is an operational process, not a decision intelligence function. It belongs in a project management system. Eunoia decides whether to proceed, not how to file paperwork.

### Rejected: Installment Schedule Calculator

**Why rejected:** Payment schedule modeling (computing quarterly installment amounts and collection dates) is a financial calculation, not decision intelligence. The output of that calculation (`computed_peak_financing_gap`, `computed_break_even_quarter`) is what matters for decisions. The calculator itself belongs in the client application layer, not in the DI engine.

### Rejected: Unit Mix CAD/Design Integration

**Why rejected:** Architectural design is outside the decision intelligence domain. The decision engine consumes the *financial outputs* of design decisions (GFA by activity type, construction cost per sqm) — it does not produce design decisions.

### Rejected: Real-Time Market Price Feed

**Why rejected:** Real-time price feeds require data provider contracts, API integration, caching, and failure handling. This is infrastructure, not intelligence. Better approach: market price evidence is supplied by the caller with a timestamp. Freshness scoring handles the "how current is this?" question automatically.

### Rejected: LTV/CAP Rate as Primary Decision Gates

**Why rejected:** CAP rate and LTV are secondary valuation metrics used by investors and banks, not by developers making project go/no-go decisions. They are relevant for asset pricing and financing decisions, not for development feasibility. Including them as primary gates would produce incorrect recommendations for development projects (which are assessed on IRR/NPV, not CAP rate).

---

## 13. Final Recommendation

### 13.1 Overall Assessment

The Eunoia Decision Intelligence Engine is architecturally superior to professional consulting spreadsheet models in every dimension except domain-specific financial intelligence. The platform has correct evidence architecture, correct confidence modeling, correct rule semantics, and correct explainability — none of which exist in the reference methodology.

The gaps are narrow and additive: new evidence parameters, new rules, updated coverage requirements, and one new scenario type. No architectural changes are required.

The highest-leverage improvement — IRR as a primary financial gate combined with financing gap detection — would materially improve decision accuracy for the feasibility report type. These two rules address the two most common causes of feasibility approval failures: insufficient return and insufficient capital.

### 13.2 Priority Table

| Recommendation | Expected Accuracy Gain | Complexity | Priority | Implement Now? |
|---------------|----------------------|------------|----------|----------------|
| IRR as primary financial gate | HIGH — closes the return-rate gap in feasibility blocking | LOW — new parameter + new rule | P1 | YES |
| Financing gap rule | HIGH — prevents the most common execution failure mode | LOW — new parameter + new rule | P1 | YES |
| Sales velocity parameter + rule | HIGH — enables automatic scenario analysis on the most sensitive assumption | LOW — new parameter + new rule | P1 | YES |
| Evidence freshness half-life for financial data | MEDIUM — prevents artificial confidence deflation on real estate data | LOW — new source type or report-type-specific half-life | P1 | YES |
| Activity mix financial coverage requirement | MEDIUM — forces complete evidence on project composition | LOW — new coverage category | P1 | YES |
| Named scenario support (Pessimistic/Base/Optimistic) | MEDIUM — enables compound assumption testing | MEDIUM — new scenario type + types | P2 | After P1 complete |
| Revision parameter guidance in explainability | LOW (accuracy) / HIGH (decision quality) — actionable NOT recommendations | MEDIUM — wires scenario thresholds into explainability | P2 | After P1 complete |
| Inflation-adjusted cost confidence signal | MEDIUM — reduces false confidence on long-horizon projects | MEDIUM — new modifier to evidence_quality dimension | P3 | Deferred |
| Regulatory compliance evidence category | LOW — rarely the blocking factor in well-prepared feasibility | LOW — new coverage category | P3 | Deferred |
| Capital structure analysis (WACC-based) | LOW — useful for investor decisions, not developer go/no-go | HIGH — requires external data feed | NOT RECOMMENDED | No |

### 13.3 The Correct Sequencing

P1 improvements (items 1-5 above) require only new evidence parameters and new rules. They can be implemented within the existing architecture without modifying any engine. They should be implemented before any Real Estate client is onboarded beyond pilot.

P2 improvements (items 6-7) extend existing engines (scenario, explainability) with new capabilities. They improve the quality of decisions rather than changing the blocking structure.

P3 improvements (item 8) are long-horizon platform enhancements. They improve confidence accuracy for a specific class of long-execution projects.

The capital structure improvement (WACC/CAP Rate) should not be implemented. It would add complexity without material improvement to go/no-go decision accuracy for development projects.

---

*This document does not contain any financial data, projections, company names, project names, or identifying information from the reference reports. It extracts methodology and architecture patterns only.*
