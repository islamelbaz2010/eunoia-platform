# Pilot Exit Criteria
**Eunoia Platform — Controlled Pilot v1.0**  
**Effective:** 2026-08-04  
**Owner:** Executive Pilot Operations Director

---

## Purpose

This document defines the measurable conditions under which the 20-submission controlled pilot is classified as PASS, PARTIAL PASS, or FAIL.

The classification must be made using only evidence collected during the pilot. No engineering assumptions, benchmark projections, or prior validation scores may substitute for real pilot data.

The classification is made at two points:
1. **Interim assessment** — after submission 10
2. **Final assessment** — after submission 20

---

## Assessment Authority

| Decision | Authority |
|----------|-----------|
| PASS | Pilot Director (no further approval required) |
| PARTIAL PASS | Pilot Director + Executive Team sign-off |
| FAIL | Pilot Director + Executive Team + Engineering Lead — root cause review required before any further action |

---

## Interim Assessment (After Submission 10)

At submission 10, the Pilot Director reviews all metrics and classifies the pilot trajectory. The interim assessment does not produce a final PASS/FAIL — it produces one of three actions:

| Interim Status | Conditions | Action |
|---------------|-----------|--------|
| **On Track** | All metrics at target; 0 Critical disagreements; no architecture issues flagged | Continue to submission 20 |
| **Monitor** | 1–2 metrics in warning zone; no Critical disagreements; root causes are operational or missing input | Continue with heightened review cadence. Pilot Director reviews every submission personally. |
| **At Risk** | Any metric in fail zone; OR 1+ Critical disagreement; OR architecture issue triggered | Pilot pause. Pilot Director + Engineering Lead assess within 48 hours. Decision: resume, reduce scope, or halt. |

---

## Final Assessment (After Submission 20)

### PASS Criteria

All of the following must be true:

| # | Criterion | Target | Measurement |
|---|-----------|--------|-------------|
| P1 | Recommendation Accuracy | ≥ 80% (16/20 submissions) | Consultant Review Sheet — Agreement field |
| P2 | Client Acceptance Rate | ≥ 70% (14/20 deliveries) | Submission Tracker — Client Response field |
| P3 | False Positive Rate | ≤ 15% of proceed outputs | Calculated from tracker data |
| P4 | False Negative Rate | ≤ 20% of revise outputs | Calculated from tracker data |
| P5 | Critical Disagreements | 0 | Consultant Review Sheet — Severity field |
| P6 | Average Decision Time | ≤ 24 hours | Delivery timestamp − intake timestamp |
| P7 | Average Narrative Revisions | ≤ 1.5 per submission | Consultant Review Sheet — Section I count |
| P8 | API Success Rate | ≥ 95% (≤ 1 failed submission) | Submission Tracker — Status field |
| P9 | No Unresolved Architecture Issues | 0 active RC-10 issues without documented mitigation | Learning Loop |
| P10 | Consultant workload is sustainable | Consultant assessed review as reasonable in debrief | Post-pilot consultant interview |

**If ALL P1–P10 pass:**
→ **PASS: Authorized to proceed to Phase 2 (50-submission expanded pilot)**

---

### PARTIAL PASS Criteria

**PARTIAL PASS is declared when:**
- P5 (Critical Disagreements = 0) is met — no safety failures
- P1 (Recommendation Accuracy) is met at ≥ 80%
- But 1–3 of P2–P4, P6–P10 are in warning or fail zone

**PARTIAL PASS means:** The platform's core recommendation engine is commercially sound but the operational process, evidence quality, or specific rule gaps require addressed remediation before expanding volume.

**PARTIAL PASS outcome:** Engineering and operations sprint to address the specific failing metrics. Re-run 5 additional submissions targeting the identified failure mode. Re-assess against full PASS criteria.

---

### FAIL Criteria

**FAIL is declared when ANY of the following is true:**

| Fail Condition | Code | Definition |
|---------------|------|-----------|
| Critical disagreement occurred | F1 | System produced PROCEED; consultant assessed outcome would be client financial harm |
| Recommendation accuracy below 70% | F2 | System and consultant disagree more often than they agree |
| Client acceptance rate below 55% | F3 | Clients find the recommendations commercially implausible |
| 3+ Architecture issues flagged | F4 | The platform cannot handle the real submission population |
| Any submission leaked a confidential parameter from another submission | F5 | Data isolation failure — immediate halt regardless of other metrics |
| Consultant review found unsafe to remove | F6 | Debrief reveals platform outputs are not commercially viable without permanent consultant correction |

**FAIL outcome:**
- Halt all client-facing operations immediately
- Engineering and commercial review within 5 business days
- Specific remediation plan required before any re-pilot
- Executive Team notified within 24 hours of FAIL classification

---

## Decision Tree

```
After 20 Submissions:

P5 (Critical Disagreements = 0)?
├── NO → FAIL (F1)
└── YES → continue

P1 ≥ 80%?
├── NO → FAIL (F2)  [unless in 70-79% → PARTIAL PASS consideration]
└── YES → continue

Any F2–F6 condition true?
├── YES (F2 through F6) → FAIL
└── NO → continue

All P1–P10 at target?
├── YES → PASS
└── 1-3 metrics in warning/fail (excluding P5, P1, F2-F6) → PARTIAL PASS
```

---

## Post-Pilot Mandatory Actions (regardless of outcome)

Whether PASS, PARTIAL PASS, or FAIL, the following must be completed:

1. **Learning Log synthesis** — All root causes consolidated into Phase 2 priority backlog
2. **Consultant debrief** — Structured interview with the reviewing consultant on platform usability, output quality, and process friction
3. **Client feedback synthesis** — All client responses (Accept / Query / Reject) reviewed for patterns
4. **Recommendation distribution audit** — Was the 50%/50% proceed/revise split from the benchmark borne out in production? Or did real submissions cluster in one category?
5. **Benchmark update** — Any new patterns discovered in pilot submissions become new benchmark cases before Phase 2

---

## Phase 2 Authorization Conditions

Even a full PASS does not authorize Phase 2 until:

| Condition | Requirement |
|-----------|------------|
| `equityAmount` form field | Added to the UI, collected explicitly, no proxy used |
| Phase 2 engineering sprint | At minimum: top 3 Learning Loop root causes addressed |
| Consultant capacity | At least one additional senior consultant trained and ready |
| Submission volume SLA | Revised SLA defined for higher submission rates |
| Phase 2 pilot scope defined | New scope document approved: report types, submission count, client segment |

---

## Outcome Registry

| Assessment Point | Date | Outcome | Authorized By | Notes |
|-----------------|------|---------|--------------|-------|
| Interim (Sub 10) | | | | |
| Final (Sub 20) | | | | |

*This table is updated by the Pilot Director at each assessment point and retained as the official pilot record.*
