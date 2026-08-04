# Real Estate Decision Intelligence — Explainability Library

**Classification:** Engineering Architecture — Internal Only
**Version:** 1.0
**Date:** 2026-08-03
**Author:** Chief Decision Intelligence Architect
**Status:** AWAITING EXECUTIVE APPROVAL

---

## Purpose

This document defines the executive explanations for every major Real Estate rule and decision pattern. For each rule, six explanation types are specified:

- **WHY** — Why is this option being recommended?
- **WHY NOT** — Why is this option NOT recommended, and what blocked it?
- **HOW TO FIX** — What specific change would unblock this option?
- **WHAT CHANGED** — When parameters change, how does the explanation update?
- **WHAT IF** — How does the scenario analysis affect this decision?

Each explanation is provided in three registers:
- **CEO Language** — one or two sentences, financial impact, no jargon
- **Analyst Language** — specific metrics, thresholds, calculation references
- **Operator Language** — what data to gather, what to verify, what to correct

This library extends the existing WHY, WHY_NOT, EVIDENCE_USED, and RULES_TRIGGERED explainability structure. These templates are consumed by the AI narration layer to generate the executive report sections.

---

## Explainability: RE-FIN-001 — NPV Gate

---

### WHY (Proceed option — NPV gate passed)

**CEO Language**
"This project creates real financial value. When all future cash flows are discounted at the market minimum return rate of 20%, the project still delivers a positive surplus — meaning it earns more than what investors would require for a comparable-risk alternative."

**Analyst Language**
"NPV at 20% hurdle rate is positive (value: [computed_npv]). This confirms the project's discounted cash flows exceed the initial investment. The NPV surplus is [computed_npv / total_project_cost × 100]% of total cost, providing a buffer against assumption errors."

**Operator Language**
"NPV gate passed. The financial model's NPV computation is based on: total_project_cost = [value], total_revenue = [value], discount_rate = 20%, sales_period = [value] years. Verify these inputs against the signed financial study to confirm NPV is correctly computed."

---

### WHY NOT (Blocked option — NPV gate failed)

**CEO Language**
"This option destroys financial value. Even at the starting investment cost, the expected returns — when discounted for time and risk — do not recover the full amount invested. Proceeding would earn less than the market minimum for a real estate investment."

**Analyst Language**
"NPV at 20% hurdle rate is negative or zero (value: [computed_npv]). The project's discounted cash flows do not recover the cost of capital. This is a fundamental viability failure: the project earns less than the Egypt real estate market minimum return of 20%. Rule RE-FIN-001 is blocking."

**Operator Language**
"NPV gate failed. Current NPV: [computed_npv]. Required: > 0. Root cause analysis: check (1) whether price per sqm assumptions are below market benchmark, (2) whether construction cost estimates are inflated, (3) whether the sales period assumption is too long. All three directly reduce NPV."

---

### HOW TO FIX

**CEO Language**
"To make this project viable, the financial model must be revised to achieve a positive NPV. The most direct levers are: increasing the selling price per sqm toward the market ceiling, reducing construction costs through contractor renegotiation, or shortening the expected sales period."

**Analyst Language**
"NPV crossover point: NPV = 0 when [sensitivity threshold — most sensitive parameter] changes from [current value] to [threshold value]. Priority fixes: (1) price_per_sqm_residential increase of [X EGP/sqm] to [Y EGP/sqm] would increase NPV by approximately [Z]. (2) Reducing construction cost by [A%] would increase NPV by approximately [B]. (3) Reducing sales_period_years from [C] to [D] would increase NPV by approximately [E]."

**Operator Language**
"Update the financial model with revised assumptions and resubmit the decision. Ensure updated assumptions are supported by current market evidence (price benchmarks < 30 days old, contractor quotes < 90 days old). NPV sensitivity to each assumption is visible in the scenario analysis section."

---

### WHAT CHANGED (When parameters update)

**CEO Language**
"The NPV has [improved / declined] from [previous value] to [current value] following the update to [parameter name]. The recommendation has [changed / not changed]."

**Analyst Language**
"NPV delta: [previous_npv] → [current_npv] ([+/−] [delta amount]). Change driven by [parameter name] moving from [old value] to [new value]. NPV elasticity for this parameter is approximately [elasticity coefficient]."

**Operator Language**
"Parameter updated: [parameter name]. NPV recalculated. Verify that all other parameters are still current — in particular, if price per sqm was updated, confirm the updated price is supported by market data evidence dated within 30 days."

---

### WHAT IF (Scenario interpretation)

**CEO Language**
"Under the base case, NPV is positive. Under the pessimistic scenario (slower sales, higher costs, lower prices), NPV [remains positive at / falls to] [pessimistic_npv]. [This project is financially robust / This project is viable only under favorable assumptions]."

**Analyst Language**
"Named scenario NPV range: Pessimistic [pessimistic_npv] | Base [computed_npv] | Optimistic [optimistic_npv]. Scenario divergence ratio: [scenario_divergence_ratio]. Stability assessment: [ROBUST / MODERATE / FRAGILE] based on whether pessimistic NPV remains positive."

**Operator Language**
"Review the named scenario comparison table in the executive report. If pessimistic NPV is negative, advisory rule RE-RSK-001 has fired. Identify which pessimistic assumptions drive NPV below zero and assess their probability of materializing."

---

## Explainability: RE-FIN-002 — IRR Gate

---

### WHY (Proceed — IRR gate passed)

**CEO Language**
"This project delivers returns above the minimum that real estate investors require in Egypt. The internal return rate — the rate at which this project's cash flows break even in present value terms — exceeds the 20% market threshold."

**Analyst Language**
"IRR = [computed_irr_annual × 100]%, exceeding hurdle rate of [hurdle_rate × 100]%. The margin above hurdle is [computed_irr_annual − hurdle_rate] × 100 percentage points. This margin provides a buffer against IRR erosion from adverse scenarios."

**Operator Language**
"IRR gate passed. IRR = [computed_irr_annual]. Hurdle rate = [hurdle_rate]. Confirm IRR was computed from the full quarterly cash flow sequence (not from simplified annual approximation). If computed_xirr_annual is available, verify it is within 5 pp of computed_irr_annual."

---

### WHY NOT (Blocked — IRR gate failed)

**CEO Language**
"This project does not earn enough to justify the investment. The effective annual return rate is [computed_irr_annual × 100]% — below the [hurdle_rate × 100]% minimum that Egypt real estate investors require. Capital deployed here would earn less than what is achievable in lower-risk alternatives."

**Analyst Language**
"IRR = [computed_irr_annual × 100]%, below hurdle rate of [hurdle_rate × 100]%. Shortfall: [hurdle_rate − computed_irr_annual] × 100 percentage points. Rule RE-FIN-002 is blocking. Note: NPV and IRR together provide the complete picture — IRR failure may occur with marginally positive NPV when the project is long-duration."

**Operator Language**
"IRR gate failed. Required: IRR ≥ [hurdle_rate × 100]%. Current: IRR = [computed_irr_annual × 100]%. Primary drivers of low IRR in real estate: (1) long sales period (IRR is most sensitive to timing), (2) high upfront costs relative to delayed revenue, (3) price per sqm below optimal level. The IRR crossover analysis shows: reducing sales_period_years from [X] to [Y] would bring IRR to approximately [Z]."

---

### HOW TO FIX

**CEO Language**
"To reach the 20% return threshold, the project needs to either earn more revenue in the same time, or earn the same revenue in less time. Price increase or sales acceleration are the fastest routes. Cost reduction is secondary — it improves NPV but has less impact on IRR than timing does."

**Analyst Language**
"IRR crossover: IRR = hurdle_rate when [most sensitive parameter] changes from [current] to [threshold value]. IRR sensitivity ranking for this project: (1) sales_period_years — a 6-month reduction in sales period improves IRR by approximately [X]pp. (2) price_per_sqm_residential — a [Y]% price increase improves IRR by approximately [Z]pp. (3) construction_cost reduction — [A]% cost reduction improves IRR by approximately [B]pp."

**Operator Language**
"To unblock the IRR gate, revise the financial model with improved assumptions and resubmit. The sensitivity analysis in the report identifies the parameter with the highest IRR leverage for this specific project. Confirm revised assumptions against current market evidence before resubmission."

---

### WHAT IF

**CEO Language**
"Under the pessimistic scenario, IRR [remains above 20% at / falls to] [pessimistic_irr]%. [This investment maintains its return in adverse conditions / This investment's return depends on assumptions being correct]."

**Analyst Language**
"Scenario IRR range: Pessimistic [pessimistic_irr × 100]% | Base [computed_irr_annual × 100]% | Optimistic [optimistic_irr × 100]%. If pessimistic IRR < hurdle_rate: the decision is IRR-fragile — the return rate is conditional on base or better conditions."

---

## Explainability: RE-FIN-004 — Financing Gap Gate

---

### WHY (Proceed — financing gap within capital)

**CEO Language**
"The developer has sufficient capital to fund this project through its most cash-intensive period. Even at the point of maximum cash draw — when construction is ongoing and sales revenue is still ramping up — the available capital covers the shortfall."

**Analyst Language**
"Peak financing gap = [computed_peak_financing_gap] EGP at quarter [gap_peak_quarter]. Available capital = [computed_available_capital] EGP. Capital buffer = [computed_available_capital − computed_peak_financing_gap] EGP ([buffer_ratio × 100]% buffer above minimum required)."

**Operator Language**
"Financing gap gate passed. Verify that computed_available_capital is current (< 90 days) and documented (bank statement or financing commitment). If the capital buffer is less than 20%, flag for monitoring — small adverse variances may consume the buffer."

---

### WHY NOT (Blocked — financing gap exceeds capital)

**CEO Language**
"This project will run out of money before it generates enough revenue to sustain itself. The gap between what is paid out (for land and construction) and what comes in (from unit sales) exceeds the developer's available capital at its widest point. Proceeding risks a project stall mid-construction."

**Analyst Language**
"Peak financing gap = [computed_peak_financing_gap] EGP at quarter [gap_peak_quarter]. Available capital = [computed_available_capital] EGP. Capital shortfall = [computed_peak_financing_gap − computed_available_capital] EGP. Rule RE-FIN-004 is blocking. This is a capital structure failure, not a return failure — NPV and IRR may be positive while this gate fails."

**Operator Language**
"Financing gap gate failed. Capital shortfall: [amount] EGP. To resolve: Option 1 — Secure additional capital or financing of at least [shortfall + 15% buffer]. Option 2 — Restructure payment schedule: increase down payment % or shorten installment collection period. Option 3 — Restructure land payment: negotiate delayed land installments to reduce early outflows. Option 4 — Phase the project: launch Phase 1 with its own capital sufficiency, defer Phase 2 until Phase 1 generates returns."

---

### HOW TO FIX

**CEO Language**
"The capital gap can be closed through three approaches: securing more funding, collecting more cash earlier from buyers, or restructuring when land payments are due. The first approach is a financing decision. The second and third are negotiation and structuring decisions."

**Analyst Language**
"Capital gap = [shortfall] EGP. Sensitivity: (1) Increasing down_payment_pct from [current] to [threshold] reduces peak gap by approximately [amount]. (2) Shortening installment_collection_period_quarters from [current] to [threshold] reduces peak gap by approximately [amount]. (3) Back-loading land payments (shifting [X]% of land installments from Q1-Q4 to Q8-Q12) reduces peak gap by approximately [amount]."

---

### WHAT IF

**CEO Language**
"Under the pessimistic scenario, where sales are slower and collections are delayed, the peak capital draw increases to [pessimistic_peak_gap]. Your available capital [would / would not] cover this increased requirement."

**Analyst Language**
"Capital gap scenario range: Base [computed_peak_financing_gap] | Pessimistic [pessimistic_peak_gap]. If pessimistic peak gap > available_capital even after base case passes: the financing gate is fragile — a realistic adverse scenario creates a capital crisis."

---

## Explainability: RE-COM-001 — Sales Period Advisory

---

### WHY (Advisory fires — sales period too long)

**CEO Language**
"The project assumes it will take [sales_period_years] years to sell all units — longer than the [3.5-year] advisory threshold. Extended sales periods delay cash recovery, increase the financing gap duration, and reduce annual return significantly."

**Analyst Language**
"sales_period_years = [value], exceeding advisory threshold of 3.5 years. IRR impact of 1-year sales extension from this project's base: approximately −[X] percentage points. Annual ROI impact: −[Y]%. Rule RE-COM-001 has fired as WARN (non-blocking)."

**Operator Language**
"Sales period advisory triggered. Validate: (1) Is this sales period supported by market absorption data? (2) Is the district's average absorption rate known and comparable? (3) What is the marketing strategy to achieve this sales pace? Provide market_data evidence with district absorption rate to contextualize the advisory."

---

### HOW TO FIX

**CEO Language**
"A more aggressive sales strategy — higher marketing investment, pre-launch reservations, more favorable payment terms for early buyers — could shorten the sales period and significantly improve returns."

**Analyst Language**
"Sales period threshold for advisory: ≤ 3.5 years. Current: [value]. To suppress advisory: reduce sales_period_years to ≤ 3.5. Financial impact of 6-month reduction: IRR improvement of approximately [X]pp, annual ROI improvement of approximately [Y]%. Sensitivity is highest in years 2-3 of the sales period."

---

### WHAT IF

**CEO Language**
"If the market is slower than assumed and sales take [X] years instead of [Y], annual return drops to [Z]%. If sales accelerate to [A] years, return improves to [B]%."

**Analyst Language**
"±20% scenario engine output for sales_period_years: [+20% case: sales_period_years = X → IRR = Y%] | [−20% case: sales_period_years = Z → IRR = W%]. Decision [holds / flips] under the extended sales scenario."

---

## Explainability: RE-RSK-001 — Pessimistic Scenario NPV Advisory

---

### WHY (Advisory fires — base case positive, pessimistic case negative)

**CEO Language**
"This project is financially viable under expected conditions — but under adverse conditions (slower sales, higher costs, lower prices), the financial case weakens to the point where the project would destroy value. This is not a reason to stop — it is a reason to understand and manage the downside risk."

**Analyst Language**
"Base case NPV = [computed_npv] (positive). Pessimistic scenario NPV = [pessimistic_npv] (negative). The recommendation holds under base and optimistic assumptions but fails under pessimistic assumptions. Advisory rule RE-RSK-001 has fired. Scenario divergence ratio: [value]. Stability: FRAGILE."

**Operator Language**
"Pessimistic NPV advisory triggered. Identify which pessimistic assumptions drive NPV below zero: (1) Is it primarily the sales period extension? (2) The construction cost increase? (3) The price reduction? The named scenario comparison report shows each assumption's relative contribution."

---

### HOW TO FIX

**CEO Language**
"To make this project robust in all scenarios, the base case financial model needs more margin — either higher revenue, lower costs, or a shorter timeline — so that even under adverse conditions, the project remains above the viability threshold."

**Analyst Language**
"To make pessimistic_npv > 0: the base case NPV must increase by [|pessimistic_npv|] to absorb the pessimistic scenario downside. The pessimistic scenario applies [X]% revenue reduction and [Y]% cost increase. To maintain positive NPV under these conditions, base NPV must exceed [threshold]."

---

## Explainability: RE-EXE-001 — Inflation Risk Advisory

---

### WHY (Advisory fires — long execution + high inflation)

**CEO Language**
"This project will be under construction for [execution_period_years] years. With annual construction cost inflation of [inflation_rate_annual × 100]%, costs in year [N] of construction will be significantly higher than today's estimates. The financial model should reflect this — if it uses current prices for all years, it underestimates total construction cost."

**Analyst Language**
"inflation_exposure_score = [value]. Rule RE-EXE-001 fires when inflation_rate_annual > 10% AND execution_period_years > 2. Cumulative construction cost inflation over [execution_period_years] years at [inflation_rate_annual × 100]% per year: approximately [cumulative_%]. If the financial model uses static construction cost, total construction cost is understated by approximately [amount]."

**Operator Language**
"Verify: Is the construction cost in the financial model inflation-adjusted? It should apply an annual inflation coefficient to construction draws in each year. If not, the total_project_cost and computed_npv are overstated. Request an updated financial model with inflation-adjusted construction draws."

---

### HOW TO FIX

**CEO Language**
"Rerun the financial model with construction costs adjusted for inflation each year. If the project remains viable after that adjustment, the inflation risk is already priced in. If NPV or IRR deteriorates below the threshold, the cost structure needs revision or the project needs construction cost hedging."

**Analyst Language**
"Inflation-adjusted construction cost = construction_cost_total × (1 + inflation_rate_annual)^(execution_period_years / 2) [simplified average draw midpoint]. Revised NPV with inflation adjustment: [recalculated value]. If this falls below zero, RE-FIN-001 will trigger on the revised model."

---

## Explainability Cross-Reference

| Rule | WHY | WHY NOT | HOW TO FIX | WHAT CHANGED | WHAT IF |
|------|-----|---------|------------|--------------|---------|
| RE-FIN-001 (NPV) | ✓ | ✓ | ✓ | ✓ | ✓ |
| RE-FIN-002 (IRR) | ✓ | ✓ | ✓ | Inherits pattern | ✓ |
| RE-FIN-003 (Net Profit) | Inherits pattern | ✓ | ✓ | Inherits pattern | Inherits |
| RE-FIN-004 (Financing Gap) | ✓ | ✓ | ✓ | Inherits pattern | ✓ |
| RE-FIN-005 (ROI minimum) | Inherits pattern | Inherits pattern | Inherits pattern | — | — |
| RE-COM-001 (Sales Period) | — | ✓ | ✓ | — | ✓ |
| RE-COM-003 (Commercial Mix) | — | Advisory | Advisory | — | — |
| RE-EXE-001 (Inflation) | — | ✓ | ✓ | — | — |
| RE-RSK-001 (Pessimistic NPV) | — | ✓ | ✓ | — | ✓ |
| RE-RSK-002 (Scenario Divergence) | — | Advisory | Advisory | — | — |

---

## Language Register Guidelines

### CEO Language Rules
- Maximum 3 sentences per explanation
- No formula references
- Lead with business impact: "This project will / will not..."
- Anchor to familiar concepts: "earns more than a bank deposit", "runs out of money before break-even"
- Never use abbreviations (IRR, NPV, ROI must be written out or rephrased)

### Analyst Language Rules
- Include specific metric values: [parameter name] = [value]
- Reference rule ID when the rule fires
- Include sensitivity estimates when available from scenario engine
- Show calculation path: "A × B = C, therefore..."
- Compare to threshold explicitly: "Current [X] vs. required [Y]"

### Operator Language Rules
- Lead with action: "Verify:", "Update:", "Request:", "Confirm:"
- Specify which evidence to collect and from what source
- Identify the exact file or document to update
- State time constraints on evidence freshness
- Reference specific parameter names (factPath format)
