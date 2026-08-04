# Pilot Metrics Dashboard Specification
**Eunoia Platform — Controlled Pilot v1.0**  
**Effective:** 2026-08-04  
**Owner:** Pilot Director

---

## Purpose

This specification defines the metrics that must be tracked throughout the 20-submission pilot, how each is calculated, what the target values are, and what action is triggered when a metric falls outside the acceptable range.

These metrics are the only evidence base for the PASS / PARTIAL PASS / FAIL decision at the end of the pilot. They must be updated after every submission.

---

## Metric 1: Recommendation Accuracy

**Definition:** Percentage of submissions where the system recommendation matches the consultant's final recommendation (before any consultant override).

**Formula:**
```
Recommendation Accuracy = (Submissions where system matches consultant) / (Total submissions reviewed) × 100
```

**Data source:** Consultant Review Sheet, Section G (Agreement field)

**Target:** ≥ 80%  
**Warning threshold:** 70–79%  
**Fail threshold:** < 70%

**Tracking frequency:** After every submission

**Action if below warning threshold:**
- Pilot Director reviews all disagreement cases for pattern
- If 3+ consecutive disagreements share the same root cause, Engineering is notified
- Exit criteria assessment is triggered early (see `PILOT_EXIT_CRITERIA.md`)

**Notes:**
- For pilot submissions where the system produces `revise` but the consultant assesses `proceed` due to the financing gap false alarm, this counts as a disagreement. These are tracked separately under False Negative Rate.
- The baseline expectation from benchmark testing is 100% on gold cases, but real-world data will inevitably show patterns not captured in the benchmark.

---

## Metric 2: Consultant Agreement Percentage

**Definition:** Same as Recommendation Accuracy. Tracked as a separate metric because it is the primary trust signal for the platform's commercial readiness.

**Formula:** Same as Metric 1

**Cumulative target:** ≥ 80% across all 20 submissions  
**Interim target (at submission 10):** ≥ 75%

**Disaggregation required:**
- Agreement rate by submission outcome (proceed vs revise)
- Agreement rate by disagreement severity (Critical / Major / Minor / Cosmetic)

**Critical agreement rate:** Percentage of Critical-severity disagreements. Must be 0% for pilot to PASS.

---

## Metric 3: Client Acceptance Rate

**Definition:** Percentage of delivered submissions where the client accepted the final recommendation without objection.

**Formula:**
```
Client Acceptance Rate = (Submissions where client response = "Accept") / (Total submissions delivered) × 100
```

**Data source:** Submission Tracker (Client Response field)

**Target:** ≥ 70%  
**Warning threshold:** 55–69%  
**Fail threshold:** < 55%

**Notes:**
- Client "Accept" means the client found the recommendation credible and commercially useful, not necessarily that they agreed to proceed or revise.
- Client "Query" counts as partial acceptance if the query is answered satisfactorily within 48 hours. Track resolved queries separately.
- Client "Reject" means the client found the recommendation commercially implausible or unhelpful.

**Tracking frequency:** Rolling, updated within 72 hours of each delivery (after client follow-up)

---

## Metric 4: False Positive Rate

**Definition:** Percentage of submissions where the system output `proceed` but the consultant's correct answer was `revise`, `defer`, or `reject`.

**Formula:**
```
False Positive Rate = (Submissions: system=proceed, consultant≠proceed) / (Total submissions where system output proceed) × 100
```

**Estimated baseline:** 5–10% (from Pilot Readiness Report — thin-margin projects in 8–10% ROI band)

**Target:** ≤ 15%  
**Warning threshold:** 15–25%  
**Fail threshold:** > 25%

**Subcategories to track:**
- FP-ROI: False proceed due to marginal ROI (8–10%) that a consultant would flag
- FP-MARKET: False proceed due to market conditions not captured in inputs
- FP-RISK: False proceed due to risk factors not in the financial model

---

## Metric 5: False Negative Rate

**Definition:** Percentage of submissions where the system output `revise` but the consultant's correct answer was `proceed`.

**Formula:**
```
False Negative Rate = (Submissions: system=revise, consultant=proceed) / (Total submissions where system output revise) × 100
```

**Estimated baseline:** 10–15% (from Pilot Readiness Report — financing gap false alarm when developer has >30% equity)

**Target:** ≤ 20%  
**Warning threshold:** 20–30%  
**Fail threshold:** > 30%

**Primary expected cause:** `feasibility-financing-gap-blocks-proceed` firing on well-capitalized developers who did not provide `equityAmount`.

**Action when FNR > 15%:** Prompt collection of equity amount on every future intake call. Add to intake checklist.

---

## Metric 6: Average Confidence Score

**Definition:** Mean DI engine confidence score across all completed submissions.

**Formula:**
```
Average Confidence = Sum(decisionReport.confidence for all submissions) / Total submissions
```

**Expected range:** 68–84 (structural ceiling from Pilot Readiness Report)

**Target:** 70–84 (sustained HIGH band)  
**Warning:** < 68 (evidence quality below expected minimum)  
**Fail:** < 60 (evidence structure severely degraded)

**Notes:**
- If average confidence is consistently below 68, it may indicate that submitted projects have incomplete inputs. Review intake completeness on all flagged submissions.
- If average confidence is above 84, this is unexpected and should be investigated (may indicate a change in engine behavior).

---

## Metric 7: Average Trust Score

**Definition:** Mean `trustScore` value returned from the API across all submissions.

**Expected behavior:** In the current build, trust score = confidence score (confirmed as identical signal). Tracked separately to detect future divergence.

**Target:** Same range as Metric 6  
**Action if Trust Score ≠ Confidence Score on any submission:** Notify Engineering. Do not deliver until understood.

---

## Metric 8: Decision Time (End-to-End)

**Definition:** Time from client intake call to client delivery.

**Formula:**
```
Decision Time = Delivery Timestamp − Intake Call Start Timestamp (hours)
```

**Target:** ≤ 24 hours  
**Warning:** 24–48 hours  
**Fail:** > 48 hours

**Decomposition (track separately):**
- Intake to submission: target ≤ 2 hours
- Submission to system output: target ≤ 5 minutes
- System output to analyst pre-review: target ≤ 1 hour
- Analyst handoff to consultant sign-off: target ≤ 4 hours
- Consultant sign-off to client delivery: target ≤ 2 hours

---

## Metric 9: Average Revision Count

**Definition:** Number of narrative corrections the consultant makes per submission before delivery.

**Formula:**
```
Average Revision Count = Sum(corrections per submission from Review Sheet Section I) / Total submissions
```

**Target:** ≤ 1.5 per submission  
**Warning:** 1.5–3.0  
**Fail:** > 3.0 (narrative quality is not commercially viable)

**Subcategories:**
- Financial figure corrections (numbers wrong)
- Confidence reference corrections (GPT narrative mentions outdated confidence %)
- Language / coherence corrections
- Factual market claim corrections

---

## Metric 10: Top Failure Causes

**Definition:** Ranked distribution of disagreement root causes from the Learning Loop taxonomy, across all disagreements.

**Data source:** Consultant Review Sheet Section G (Root Cause) + Learning Loop classification

**Calculated:** After every 5 submissions and at end of pilot

**Format:**

| Rank | Root Cause | Count | % of Disagreements |
|------|-----------|-------|-------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| ... | | | |

**Action trigger:** Any single root cause > 30% of all disagreements is a systematic signal requiring Engineering review before moving beyond 20 submissions.

---

## Dashboard Update Schedule

| After submission # | Action |
|-------------------|--------|
| 5 | First interim dashboard review. Pilot Director reviews all 10 metrics. |
| 10 | Interim exit criteria assessment (see `PILOT_EXIT_CRITERIA.md`). Decision: continue / halt / adjust. |
| 15 | Second interim review. Any metric in warning zone triggers remediation plan. |
| 20 | Final exit criteria assessment. PASS / PARTIAL PASS / FAIL decision. |

---

## Metrics Reporting Format

After every 5 submissions, the Pilot Director produces a one-page snapshot:

```
PILOT METRICS SNAPSHOT — After Submission #{n}
Date: YYYY-MM-DD

RECOMMENDATION ACCURACY:     XX%   [Target: ≥80%]   ✅ / ⚠️ / ❌
CLIENT ACCEPTANCE RATE:       XX%   [Target: ≥70%]   ✅ / ⚠️ / ❌
FALSE POSITIVE RATE:          XX%   [Target: ≤15%]   ✅ / ⚠️ / ❌
FALSE NEGATIVE RATE:          XX%   [Target: ≤20%]   ✅ / ⚠️ / ❌
AVG CONFIDENCE:               XX    [Target: 70–84]  ✅ / ⚠️ / ❌
AVG DECISION TIME:           XXh    [Target: ≤24h]   ✅ / ⚠️ / ❌
AVG REVISION COUNT:           X.X   [Target: ≤1.5]   ✅ / ⚠️ / ❌
TOP FAILURE CAUSE:            [cause name]

CRITICAL DISAGREEMENTS:       X     [Must be 0]      ✅ / ❌

OVERALL PILOT STATUS:         ✅ ON TRACK  /  ⚠️ MONITORING  /  ❌ AT RISK
```
