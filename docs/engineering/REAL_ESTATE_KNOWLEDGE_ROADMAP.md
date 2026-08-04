# Real Estate Decision Intelligence — Knowledge Roadmap

**Classification:** Engineering Architecture — Internal Only
**Version:** 1.0
**Date:** 2026-08-03
**Author:** Chief Decision Intelligence Architect
**Status:** AWAITING EXECUTIVE APPROVAL

---

## Preamble

This roadmap governs the knowledge layer improvements to the Eunoia Decision Intelligence Engine for the Real Estate vertical. It is strictly a knowledge roadmap — new parameters, new rules, new evidence categories, new scenarios. It does not change the engine architecture, validation pipeline, confidence model, or explainability engine. All improvements are additive.

Everything labeled as "Universal" improves cross-domain reusability. Future domains (Hotels, Medical, Restaurants) inherit the same rules and parameters without modification.

---

## P1 — Core Financial Gate Intelligence

**Rationale:** The current engine evaluates NPV and net profit as the only financial blocking conditions. Professional real estate analysis requires four financial gates. This phase closes the missing gates. Without P1, the engine will approve projects that any Egyptian real estate consultant would immediately reject.

**Timeline target:** Before first Real Estate client onboarding beyond pilot.

---

### P1.1 — IRR as a Primary Financial Gate

**Business Value**

IRR is the professional standard for real estate return measurement. NPV answers whether the project creates value. IRR answers at what rate it returns capital. A project with marginally positive NPV may have an IRR of 12% — far below the 20% Egypt market minimum. Approving such a project is the same as advising a developer to accept below-market returns. The current engine cannot distinguish this case.

**Expected Accuracy Gain**

HIGH. Eliminates false-positive feasibility approvals where NPV is marginally positive but the actual return rate is below the market minimum. In professional practice, approximately 20-30% of borderline-positive-NPV projects fail the IRR gate. Every one of those projects would currently receive a PROCEED recommendation from Eunoia.

**Dependencies**

- The IRR value must be computed externally (by the client application or financial model layer) and supplied as a parameter `computed_irr_annual`. Eunoia does not compute IRR — it evaluates it.
- No engine changes required.
- The hurdle rate parameter `hurdle_rate` must also be supplied.

**Risk**

LOW. The only implementation risk is incorrect IRR computation by the caller. Mitigated by: (1) the parameter validation rule rejecting IRR values outside plausible range, and (2) the evidence source authority scoring penalizing unverified financial models.

**Acceptance Criteria**

1. A feasibility decision with `computed_irr_annual = 0.15` and `hurdle_rate = 0.20` produces a FAIL status on the business validation stage.
2. A feasibility decision with `computed_irr_annual = 0.25` and `hurdle_rate = 0.20` passes the IRR gate.
3. The explainability output WHY_NOT for a blocked option identifies the IRR shortfall in business language.
4. The benchmark gold dataset includes at least 2 cases that exercise the IRR gate.
5. 100% benchmark accuracy maintained after rule addition.

**Estimated Implementation Effort**

SMALL. One new parameter in context schema. One new blocking rule. Two new benchmark cases. Explainability already surfaces rule context — no new explainability work needed.

**Cross-Domain Reusability**

UNIVERSAL. The IRR gate applies identically to Hotels, Medical, Restaurants, and any capital investment domain. The rule ID and parameter name are domain-agnostic.

---

### P1.2 — Financing Gap as a Capital Risk Gate

**Business Value**

The most common cause of Egyptian real estate project failure is not insufficient return — it is running out of capital mid-construction. A project can have positive NPV and IRR above the hurdle rate, and still stall when the developer's available capital is exhausted at the point of maximum cash draw. This is the financing gap: the maximum negative cumulative cash position during execution. Without this gate, Eunoia approves projects that will fail during execution, not for financial reasons but for capital structure reasons.

**Expected Accuracy Gain**

HIGH. Capital structure failures account for a disproportionate share of Egyptian real estate project stalls. Projects that pass NPV and IRR gates but fail this gate represent a distinct class of decision error that currently has no coverage.

**Dependencies**

- Requires `computed_peak_financing_gap` (maximum negative cumulative cash, computed externally from the quarterly cash flow model).
- Requires `computed_available_capital` (developer's total equity available for this project).
- Both values must be supplied by the caller. Eunoia evaluates the relationship, not the computation.

**Risk**

MEDIUM. The financing gap calculation requires a complete quarterly cash flow model. If the caller provides only headline financials without the quarterly breakdown, this gate cannot fire. Risk is mitigated by making `cash_flow_timing` evidence a required coverage category — the confidence stage will penalize the decision if this evidence is absent.

**Acceptance Criteria**

1. A feasibility decision where `computed_peak_financing_gap = 50,000,000` and `computed_available_capital = 30,000,000` produces a FAIL on the business validation stage.
2. A feasibility decision where `computed_peak_financing_gap = 25,000,000` and `computed_available_capital = 40,000,000` passes the capital gate.
3. The WHY_NOT explanation for a blocked option identifies the specific capital shortfall.
4. The benchmark gold dataset includes at least 2 cases exercising this gate.
5. 100% benchmark accuracy maintained.

**Estimated Implementation Effort**

SMALL. Two new parameters. One new blocking rule. Two new benchmark cases.

**Cross-Domain Reusability**

UNIVERSAL. Capital gap analysis applies to any capital-intensive investment decision. Hotels, medical facilities, and restaurants all face the same execution capital risk.

---

### P1.3 — Sales Velocity as a Decision Parameter and Scenario Axis

**Business Value**

Sales velocity (sales period in years) is identified in the knowledge review as the single most sensitive input in professional real estate models. A 1-year extension in the sales period — from 2 years to 3 years — can reduce annual ROI by 30-40% and turn an IRR-passing project into an IRR-failing one. Eunoia currently has no representation of this risk. There is no parameter to score, no rule to fire, and no scenario to test.

**Expected Accuracy Gain**

HIGH. Addresses the primary failure mode in real estate decisions. Additionally enables automatic scenario analysis by the existing scenario engine — once `sales_period_years` is a named parameter in context, the ±20% scenario engine will automatically generate "if sales take 20% longer, does the recommendation hold?" This is a compound gain from a single parameter.

**Dependencies**

- Requires `sales_period_years` parameter (expected total time to sell all units, in years).
- Requires `market_absorption_rate_years` parameter (district benchmark for comparable projects).
- The scenario engine gain is automatic once the parameter exists and a rule references it.

**Risk**

LOW. The implementation is pure addition: one new parameter, one new rule. The automatic scenario gain requires no additional work.

**Acceptance Criteria**

1. A feasibility decision with `sales_period_years = 4.0` fires the sales period advisory rule.
2. A feasibility decision with `sales_period_years = 2.5` does not fire the advisory rule.
3. The scenario engine produces a named "Extended Sales Period" scenario when the sales period rule fires.
4. The WHY explanation includes the sales velocity assumption when the sales period rule is relevant.
5. At least 2 benchmark cases exercise the sales velocity parameter.

**Estimated Implementation Effort**

SMALL. Two new parameters. One new advisory rule. Automatic scenario gain requires no extra work. Two new benchmark cases.

**Cross-Domain Reusability**

UNIVERSAL. Sales period applies to any product or service business decision. Hotel occupancy ramp-up, medical patient acquisition, restaurant customer base development — all are equivalent to sales velocity in their respective domains.

---

### P1.4 — Evidence Freshness Calibration for Financial Data

**Business Value**

The current evidence freshness half-lives (`external_source: 24h`) are tuned for digital marketing data (CPL metrics, campaign performance). A real estate construction cost estimate from 30 days ago is being scored as severely stale by the current model, artificially deflating the confidence score. This means real estate feasibility decisions with completely appropriate evidence arrive at the confidence stage with degraded scores — potentially causing the confidence gate to block decisions that should proceed, or assigning LOW confidence to well-supported recommendations.

**Expected Accuracy Gain**

MEDIUM (confidence accuracy). This improvement does not change which recommendation is made — it changes whether the confidence score correctly reflects the quality of the evidence. Without this fix, the confidence score is systematically incorrect for all real estate decisions.

**Dependencies**

- Requires adding a new evidence source type `financial_model` with a 720h (30-day) half-life.
- Or: extending the evidence source type system to support domain-specific half-lives.
- No rule changes required.

**Risk**

LOW. The change is isolated to the freshness scoring configuration. It cannot cause false-positive approvals — it only corrects artificially deflated confidence. The worst outcome is a more accurate confidence score.

**Acceptance Criteria**

1. A feasibility decision with construction cost evidence timestamped 48 hours ago achieves a freshness score above 0.80 (currently would be near zero under 24h half-life).
2. The same evidence timestamped 45 days ago achieves a freshness score below 0.50 (correctly penalized as getting stale for monthly-relevant financial data).
3. Confidence bands for well-supported feasibility decisions land in HIGH or VERY_HIGH, not MEDIUM, when all evidence is recent.
4. The marketing domain unaffected — its evidence freshness scores remain unchanged.

**Estimated Implementation Effort**

SMALL. One new evidence source type. One configuration change. No rule changes. Existing benchmark cases should continue to pass.

**Cross-Domain Reusability**

UNIVERSAL. Financial model evidence source type applies across all capital investment domains.

---

### P1.5 — Activity Mix Financial Coverage Requirement

**Business Value**

Professional real estate feasibility always computes revenue and cost at the activity type level (residential, commercial, administrative, medical). A project with 40% commercial exposure has fundamentally different risk from one that is 90% residential — commercial absorbs more slowly, costs more per sqm, and generates different margins. A feasibility decision based solely on total project revenue and cost misses this compositional risk entirely. The current evidence coverage requirements do not mandate activity-type-specific financial evidence.

**Expected Accuracy Gain**

MEDIUM. Forces the evidence collection layer to require complete financial evidence before the decision proceeds. Decisions made with aggregate-only financials will now score lower on evidence coverage, reducing confidence, which may prevent overconfident recommendations on under-specified projects.

**Dependencies**

- Requires adding `activity_mix_financial` as a required evidence category for the feasibility report type.
- Requires parameters `residential_mix_pct`, `commercial_mix_pct`, `administrative_mix_pct`, `medical_mix_pct`.
- No engine changes required.

**Risk**

MEDIUM. This requirement may cause currently-passing feasibility decisions to score lower on coverage if activity-type evidence is absent. This is intentional behavior — but must be communicated clearly to operators. Risk is that operators submit decisions without the new required evidence and experience unexpected confidence degradation.

**Acceptance Criteria**

1. A feasibility decision without activity mix evidence scores below the minimum coverage threshold.
2. A feasibility decision with complete activity mix evidence achieves higher coverage score than one with aggregate-only financials.
3. The evidence coverage report explicitly names `activity_mix_financial` as a missing category when absent.
4. At least 1 benchmark case exercises the coverage requirement.

**Estimated Implementation Effort**

SMALL. Four new parameters. One new evidence coverage requirement. One or two updated benchmark cases.

**Cross-Domain Reusability**

PARTIAL. The concept of activity/product mix financial analysis is domain-agnostic. The specific categories (residential, commercial, etc.) are Real Estate specific. Future domains will add their own mix parameters (hotel room types, medical specialties, restaurant revenue streams) using the same coverage requirement mechanism.

---

## P2 — Scenario Intelligence and Explainability Enhancement

**Rationale:** P2 improvements extend the information quality of decisions rather than adding new blocking conditions. After P1, the engine correctly blocks bad decisions. P2 makes the engine better at explaining what would make a blocked decision viable, and better at quantifying the risk range around good decisions.

**Timeline target:** After P1 complete and first pilot client in production.

---

### P2.1 — Named Scenario Support (Pessimistic / Base / Optimistic)

**Business Value**

The current scenario engine tests each parameter independently at ±20%. Professional real estate analysis uses three named scenarios that modify multiple parameters simultaneously and coherently. The difference: a pessimistic scenario is not "NPV at -20%" — it is "NPV under the assumption that sales take 1 year longer, construction cost is 10% higher from inflation, and prices are 8% below expectation, all at once." This compound assumption testing is qualitatively different from independent parameter variation. Named scenarios tell executives: "Under base case: Proceed. Under pessimistic: Revise." This is the decision format executives use.

**Expected Accuracy Gain**

MEDIUM. Named scenarios do not change the primary recommendation — they describe the risk envelope. But the risk envelope is what separates a ROBUST Proceed from a FRAGILE Proceed, and executives need this distinction before committing capital.

**Dependencies**

- Requires the existing scenario engine to be extended with a `NamedScenario` type and `runNamedScenarios()` function.
- The named scenarios themselves are defined in the Real Estate Scenario Library (document 5 of this sprint).
- P1.3 (sales velocity parameter) should be complete first — named scenarios reference `sales_period_years`.

**Risk**

MEDIUM. Named scenarios require the caller to supply the scenario parameter sets, not just a single base case. This changes the decision input shape. May require changes to the Executive Report builder to surface named scenario results.

**Acceptance Criteria**

1. A feasibility decision can accept a `namedScenarios` input with pessimistic, base, and optimistic parameter sets.
2. The output includes a named scenario comparison table: recommendation under each scenario.
3. The executive report includes a "Scenario Range" section.
4. At least 2 benchmark cases exercise named scenarios.

**Estimated Implementation Effort**

MEDIUM. New types + new scenario function + executive report extension + benchmark cases.

**Cross-Domain Reusability**

UNIVERSAL. Named scenarios apply identically to Hotels, Medical, and any other domain where the same decision has a range of plausible input assumptions.

---

### P2.2 — Revision Parameter Guidance in WHY_NOT Explainability

**Business Value**

When the engine recommends REVISE, the WHY_NOT explanation currently identifies which rule blocked the option and what the blocking condition was. What it does not provide: "To unblock this option, `computed_irr_annual` must increase from 0.14 to at least 0.20. The sensitivity threshold is 0.20." This is actionable intelligence. The scenario engine already computes sensitivity thresholds (the crossover value for each numeric parameter). The data exists but does not flow into the explainability output.

**Expected Accuracy Gain**

INDIRECT. Revision guidance does not improve the accuracy of the current decision — it improves the accuracy of the next decision by telling the analyst exactly what needs to change. In practice, this transforms REVISE from a terminal dead end into an actionable optimization target.

**Dependencies**

- Requires wiring `sensitivityThresholds` from the scenario engine output into the explainability `WHY_NOT` section.
- P1.1, P1.2, P1.3 must be complete — revision guidance is most valuable when the blocking conditions are IRR, financing gap, and sales velocity.
- Requires the explainability engine to accept scenario output as an additional input.

**Risk**

MEDIUM. Sensitivity threshold crossover values may not be computable for all parameters (non-continuous rule conditions, boolean parameters). Must define behavior when no threshold is computable.

**Acceptance Criteria**

1. When the IRR rule fires, the WHY_NOT explanation for the blocked option includes the IRR gap (current value vs. minimum required).
2. When the financing gap rule fires, WHY_NOT includes the capital shortfall amount.
3. When no threshold is computable, WHY_NOT degrades gracefully — no threshold shown, blocking condition still explained.
4. Executive-language phrasing used for all threshold descriptions.

**Estimated Implementation Effort**

MEDIUM. Explainability engine extension. New data flow from scenario output. No new rules.

**Cross-Domain Reusability**

UNIVERSAL. Sensitivity-threshold-driven WHY_NOT applies to any domain with numeric blocking conditions.

---

### P2.3 — Pessimistic Scenario NPV as an Advisory Rule

**Business Value**

After P2.1 introduces named scenarios, the pessimistic scenario NPV becomes a computable value. A rule "if pessimistic scenario NPV is negative → WARN" surfaces the information that the project is NPV-positive only under base or better assumptions. This is a critical risk signal for executive decision making — it does not block the recommendation but it flags downside risk explicitly.

**Expected Accuracy Gain**

MEDIUM. Advisory (non-blocking) — does not change the primary recommendation. Improves the risk profile surfaced to the executive, which may change the executive's decision even when Eunoia recommends Proceed.

**Dependencies**

- Requires P2.1 (named scenarios) to be complete first.
- Requires `pessimistic_npv` to be available as an output of the named scenario run.

**Risk**

LOW. Advisory rule — cannot cause false-positive blocks.

**Acceptance Criteria**

1. A decision where the pessimistic scenario produces NPV < 0 includes a WARN risk flag even when the base case recommends Proceed.
2. The risk flag is labeled "Downside Risk: Project NPV turns negative under pessimistic assumptions."
3. No blocking behavior — recommendation is unchanged.

**Estimated Implementation Effort**

SMALL. One new advisory rule. One new parameter reference from scenario output.

**Cross-Domain Reusability**

UNIVERSAL. Pessimistic-scenario NPV advisory applies to any investment domain with named scenarios.

---

## P3 — Advanced Cost Intelligence

**Rationale:** P3 improvements address longer-horizon accuracy concerns. They require more complex integration and more operator behavioral change than P1 and P2. These improvements should be deferred until P1 and P2 have demonstrated clear accuracy gains in production.

**Timeline target:** After Real Estate is in production with at least 10 live decisions reviewed.

---

### P3.1 — Inflation-Adjusted Construction Cost Confidence

**Business Value**

For projects with execution periods longer than 2 years, inflation-adjusted construction cost is materially different from the cost input at project inception. In Egypt's inflationary environment, a 4-year construction project will experience significant cost escalation. A project evaluated with Year 1 construction cost estimates becomes progressively less accurate as execution proceeds. The confidence engine currently has no mechanism to penalize decisions where long execution horizon compounds with high inflation to erode cost certainty.

**Expected Accuracy Gain**

MEDIUM. Prevents false confidence on long-horizon projects. A decision that looks well-supported may be poorly supported for construction cost when the execution period is 4+ years.

**Dependencies**

- Requires `inflation_rate_annual` and `execution_period_years` as input parameters.
- Requires a new mechanism in the confidence quality scoring to apply a modifier based on execution period × inflation rate.
- This is the only P3 item that touches confidence scoring logic (architecture-adjacent).

**Risk**

MEDIUM. Modifying confidence scoring logic is architecture-adjacent. Must be implemented carefully to avoid disrupting existing confidence bands. Should use an additive penalty, not a multiplier, to prevent catastrophic confidence collapse.

**Acceptance Criteria**

1. A project with 5-year execution period and 15% annual inflation scores lower on evidence_quality than an identical project with 2-year execution.
2. The confidence degradation is proportional: longer execution + higher inflation = larger penalty.
3. The penalty does not collapse confidence to zero — it shifts the band, not nullifies it.
4. Existing benchmark cases unaffected.

**Estimated Implementation Effort**

MEDIUM. Requires confidence engine modification. Careful boundary testing required.

**Cross-Domain Reusability**

UNIVERSAL. Any long-horizon project in any inflationary economy has this problem. Hotels under construction, medical facility fit-out, restaurant renovations — all face execution-period cost uncertainty.

---

### P3.2 — Regulatory Compliance Evidence Category

**Business Value**

Legal and regulatory risk is addressed in step 7 of the 9-step feasibility methodology. The current Eunoia evidence coverage requirements for feasibility have no regulatory evidence category. A project without confirmed building permits, zoning clearance, and land registration can receive a confident PROCEED recommendation — despite facing significant execution risk from regulatory delays.

**Expected Accuracy Gain**

LOW for most decisions (most well-prepared feasibility studies have regulatory clearance). HIGH for the specific case where regulatory evidence is absent — in that case, the current engine gives the same confidence score as a fully-cleared project.

**Dependencies**

- Requires adding `regulatory_compliance` as an optional (not required) evidence category for feasibility.
- Requires parameters `permits_confirmed`, `zoning_compliant`, `land_registration_status`.

**Risk**

LOW. Optional (not required) — its absence penalizes coverage score but does not block the decision.

**Acceptance Criteria**

1. A feasibility decision with regulatory evidence achieves higher coverage score than one without.
2. A feasibility decision with `zoning_compliant = false` fires an advisory rule.
3. Regulatory compliance evidence is shown in the evidence coverage section of the report.

**Estimated Implementation Effort**

SMALL. Three new parameters. One new optional evidence category. One advisory rule.

**Cross-Domain Reusability**

UNIVERSAL. Regulatory compliance evidence applies to every business domain. Hotel licensing, medical facility certification, restaurant health permits — all are equivalent regulatory evidence categories.

---

### P3.3 — Sales Velocity Benchmark Comparison

**Business Value**

P1.3 adds sales period as a parameter and rule. P3.3 extends this by comparing the project's assumed sales period against the market benchmark for comparable projects in the same district. "Sales period of 2.5 years" means nothing in isolation. "Sales period of 2.5 years vs. district benchmark of 1.8 years for comparable projects" is a meaningful risk signal: this project assumes slower absorption than the market average.

**Expected Accuracy Gain**

MEDIUM. Converts an absolute threshold rule (sales period > 3.5 years) into a relative rule (sales period vs. market benchmark). Relative rules are more accurate because they account for district-specific absorption patterns.

**Dependencies**

- Requires P1.3 (sales velocity parameter) to be complete.
- Requires `market_absorption_rate_years` parameter (district benchmark, from market data evidence).
- Requires market data evidence category to include district-level absorption rates.

**Risk**

MEDIUM. The benchmark value is only as good as the market data evidence. Districts with limited comparable data will have unreliable benchmarks. The advisory rule should only fire when the benchmark evidence has sufficient authority.

**Acceptance Criteria**

1. A project assuming 3-year sales in a district with 1.8-year benchmark fires an advisory rule.
2. A project assuming 3-year sales in a district with 3.2-year benchmark does not fire (within benchmark range).
3. When benchmark evidence is absent, the rule does not fire — it cannot compare without a benchmark.

**Estimated Implementation Effort**

SMALL. One new parameter. One new advisory rule (replaces or augments P1.3 rule).

**Cross-Domain Reusability**

PARTIAL. The benchmark comparison pattern is universal. The specific market absorption metric is domain-specific (real estate). Future domains would supply their own benchmark parameters.

---

## Not Recommended — Permanently Rejected

| Item | Rejection Reason | Revisit Condition |
|------|-----------------|-------------------|
| WACC/CAPM Calculator | Requires live market data feed; stale inputs produce wrong WACC | If a managed market data feed is added to platform infrastructure |
| Construction Cost Database | Data decays faster than the database can be maintained | Never — cost data belongs with the caller |
| Building Permit Workflow | Operational process, not decision intelligence | Never |
| Installment Schedule Calculator | Financial calculation, not intelligence | Never |
| CAD/Design Integration | Outside decision intelligence domain | Never |
| LTV/CAP Rate as Primary Gates | Investor/bank metrics, not developer feasibility metrics | Never for feasibility; revisit only if an investor decision type is added |

---

## Phase Summary

| Phase | Items | Blocking Rules Added | Advisory Rules Added | Effort | Accuracy Gain |
|-------|-------|---------------------|---------------------|--------|---------------|
| P1 | 5 | 3 (IRR, Financing Gap, Coverage enforcement) | 2 (Sales Period, Mix Coverage) | S×5 = M | HIGH |
| P2 | 3 | 0 | 1 (Pessimistic NPV) | M×2 + S×1 = M-L | MEDIUM |
| P3 | 3 | 0 | 3 | S×2 + M×1 = S-M | LOW-MEDIUM |

---

## Success Metrics

After full implementation (P1 + P2 + P3), the following should be measurable:

1. **False Positive Rate** — feasibility decisions that Eunoia recommends PROCEED and which subsequently fail in execution. Baseline must be established from pilot decisions before P1.
2. **Evidence Coverage Score** — average coverage score for real estate decisions should increase as operators supply the new required evidence categories.
3. **Confidence Band Distribution** — the distribution of confidence bands (VERY_HIGH / HIGH / MEDIUM / LOW / VERY_LOW) should become more accurate — i.e., decisions with HIGH confidence should proceed more often than decisions with LOW confidence.
4. **Scenario Divergence** — after P2.1, the gap between pessimistic and optimistic recommendations surfaces in structured form. Track what fraction of HIGH-confidence decisions are FRAGILE under pessimistic assumptions.
