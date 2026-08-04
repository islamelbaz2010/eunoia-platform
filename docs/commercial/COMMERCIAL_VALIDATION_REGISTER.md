# Commercial Validation Register
**Eunoia Platform — Controlled Pilot v1.0**  
**Classification:** Internal — Pilot Operations  
**Date opened:** 2026-08-04  
**Authority:** Executive Commercial Validation Director

---

## Purpose

This register is the single source of truth for every improvement request that surfaces during the 20-submission controlled pilot.

**No engineering task may enter the Phase 2 backlog without a completed entry in this register.**

No exceptions. No direct Slack-to-backlog tickets. No verbal approvals.

---

## Register Schema

Every entry must complete ALL fields. Incomplete entries are rejected at intake.

| Field | Required | Description |
|-------|----------|-------------|
| **Register ID** | Yes | Sequential: CVR-001, CVR-002, … |
| **Pilot Case ID** | Yes | PILOT-01 through PILOT-20 |
| **Date Observed** | Yes | Date the discrepancy was identified |
| **Client Type** | Yes | Category of client project (e.g., residential compound, mixed-use, commercial) |
| **System Decision** | Yes | `proceed` / `revise` — what the platform output |
| **Consultant Decision** | Yes | `proceed` / `revise` / `defer` — consultant's independent assessment |
| **Agreement** | Yes | `YES` / `NO` |
| **Root Cause Code** | Yes | RC-01 through RC-10 (see Learning Loop taxonomy) |
| **Root Cause Description** | Yes | Free text: specific failure mode observed |
| **Evidence** | Yes | What information confirmed the root cause |
| **Affected Component** | Yes | Which system component produced the error |
| **Business Impact** | Yes | Client risk if error had gone undetected (Low / Medium / High / Critical) |
| **Frequency** | Yes | How many times this root cause has appeared (updated across entries) |
| **Priority** | Yes | P1 / P2 / P3 (set by Pilot Director at intake review) |
| **Estimated ROI of Fix** | Yes | Qualitative: accuracy gain estimate, client risk reduction, or time saved |
| **Recommended Action** | Yes | Engineering fix / Knowledge update / Process change / No action |
| **Approved for Backlog** | Yes | YES / NO / PENDING — approved by Pilot Director |
| **Phase 2 Backlog Item** | Conditional | Reference to PHASE2_BACKLOG_TEMPLATE.md entry (if approved) |
| **Notes** | Optional | Any additional context |

---

## Root Cause Codes (Reference)

| Code | Name |
|------|------|
| RC-01 | Missing Input Data |
| RC-02 | Incorrect Input Data |
| RC-03 | Rule Gap |
| RC-04 | Rule Error |
| RC-05 | Confidence Miscalibration |
| RC-06 | Evidence Gap |
| RC-07 | Knowledge Gap |
| RC-08 | GPT Narrative Error |
| RC-09 | Process / Operations Gap |
| RC-10 | Architecture Issue |

Full definitions and operational responses in `docs/pilot/LEARNING_LOOP.md`.

---

## Priority Definitions

| Priority | Criteria |
|----------|----------|
| **P1** | Safety-critical: system would deliver a materially wrong recommendation to a client without consultant correction. Root cause RC-03, RC-04, RC-05, RC-06, or RC-10. Frequency ≥ 2. |
| **P2** | Quality-significant: recommendation is directionally correct but confidence, narrative, or evidence quality is degraded. Root cause RC-07, RC-08. Frequency ≥ 3. |
| **P3** | Operational: UX friction, slow workflows, minor process gaps. Frequency ≥ 3 or consultant-requested. |

---

## Intake Gate

The Pilot Director reviews new entries every Friday (weekly cadence). At each review:

1. Verify all fields are complete.
2. Confirm the root cause classification with the consultant.
3. Set Priority.
4. Estimate ROI.
5. Approve or reject backlog entry.
6. If approved, assign a Phase 2 Backlog Item reference.

Entries not reviewed within 7 days of logging are escalated to Pilot Director immediately.

---

## Register Entries

*(No entries at pilot open. Entries added as submissions are reviewed.)*

---

### CVR-[NNN] — Template

```
Register ID:         CVR-[NNN]
Pilot Case ID:       PILOT-[XX]
Date Observed:       YYYY-MM-DD
Client Type:         [e.g., Residential compound — suburban Cairo]

System Decision:     [proceed / revise]
Consultant Decision: [proceed / revise / defer]
Agreement:           [YES / NO]

Root Cause Code:     [RC-XX]
Root Cause Desc:     [Specific failure mode]
Evidence:            [What confirmed it]
Affected Component:  [e.g., feasibility-financing-gap-blocks-proceed rule,
                      GPT narrative, confidence engine, evidence collector]

Business Impact:     [Low / Medium / High / Critical]
                     [Explanation: what a client would have done with wrong output]
Frequency:           [1 (first occurrence) / N (Nth occurrence)]
Priority:            [P1 / P2 / P3] — set by Pilot Director
Estimated ROI:       [e.g., prevents critical client error; saves 30min per review]

Recommended Action:  [Engineering fix / Knowledge update / Process change / No action]
Approved for Backlog: [YES / NO / PENDING]
Phase 2 Backlog Item: [BACK-XXX if approved]
Notes:               [Optional]
```

---

## Aggregate Tracking

Updated by Pilot Director at each weekly review.

| Metric | Count |
|--------|-------|
| Total entries | 0 |
| P1 entries | 0 |
| P2 entries | 0 |
| P3 entries | 0 |
| Approved for backlog | 0 |
| Rejected / no-action | 0 |
| Pending review | 0 |

| Root Cause | Frequency |
|------------|-----------|
| RC-01 Missing Input | 0 |
| RC-02 Incorrect Input | 0 |
| RC-03 Rule Gap | 0 |
| RC-04 Rule Error | 0 |
| RC-05 Confidence Miscalibration | 0 |
| RC-06 Evidence Gap | 0 |
| RC-07 Knowledge Gap | 0 |
| RC-08 GPT Narrative Error | 0 |
| RC-09 Process Gap | 0 |
| RC-10 Architecture Issue | 0 |
