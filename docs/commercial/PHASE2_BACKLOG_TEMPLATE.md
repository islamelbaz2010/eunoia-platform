# Phase 2 Backlog Template
**Eunoia Platform — Post-Pilot Engineering**  
**Classification:** Internal — Engineering Planning  
**Date:** 2026-08-04  
**Authority:** Executive Commercial Validation Director  
**Status: TEMPLATE — No items authorized until pilot evidence exists**

---

## Purpose

This is the Phase 2 backlog template. It will be populated with engineering items during and after the controlled pilot. Every item must reference a Commercial Validation Register (CVR) entry.

**No item may be added until `Approved for Backlog = YES` in the CVR.**

---

## Backlog Categories

Items are organized into 10 categories. Each category has its own section. Items are added in CVR approval order.

---

## Item Schema

Every backlog item must contain:

```
Backlog ID:       BACK-[NNN]
CVR Reference:    CVR-[NNN]
Pilot Case IDs:   PILOT-XX, PILOT-YY (all cases where issue appeared)
Frequency:        N occurrences across N submissions
Root Cause:       RC-XX — [Name]
Priority:         P1 / P2 / P3
Business Impact:  [Low / Medium / High / Critical]
Estimated ROI:    [Quantified or qualified benefit]

Title:            [Short action-oriented title]
Problem:          [What the system does wrong, as observed in pilot]
Expected Fix:     [What correct behavior looks like]
Scope:            [Specific files / components affected]
Acceptance Test:  [How to verify the fix in the next benchmark or pilot]
Dependencies:     [Other backlog items that must precede this one]
Effort Estimate:  [S / M / L — engineering days]
```

---

## Category 1 — Decision Logic

*Improvements to rules, scoring, recommendation logic.*

Items here fix cases where the rules engine produced a wrong recommendation confirmed by a consultant.

*(No items — awaiting pilot evidence)*

---

## Category 2 — Knowledge

*Updates to the Real Estate knowledge libraries.*

Items here correct or extend: parameter definitions, rule thresholds, evidence categories, scenario descriptions, explainability templates.

All knowledge items must reference `docs/engineering/REAL_ESTATE_KNOWLEDGE_FREEZE_CERTIFICATION.md` and specify which section requires update.

*(No items — awaiting pilot evidence)*

---

## Category 3 — Financial Models

*Corrections to cashflow computation, ROI calculation, NPV logic, financing gap proxy.*

Items here address cases where a computed financial metric was wrong relative to the actual project financials.

All financial model changes require a corresponding benchmark case update before deployment.

*(No items — awaiting pilot evidence)*

---

## Category 4 — Evidence

*Improvements to evidence collection, weighting, or coverage.*

Items here address cases where the evidence layer produced insufficient or incorrect signals for the confidence engine.

*(No items — awaiting pilot evidence)*

---

## Category 5 — Reports

*Improvements to the executive report output.*

Items here address cases where the GPT narrative was inaccurate, incomplete, or required more than 1.5 corrections on average.

All report changes must pass: the existing narrative quality checklist in `CONSULTANT_REVIEW_TEMPLATE.md` Section J (Narrative Corrections).

*(No items — awaiting pilot evidence)*

---

## Category 6 — Operations

*Improvements to the pilot operations workflow.*

Items here address process gaps identified by the Submission Analyst or Pilot Director during operations — not by consultants during reviews.

Operations items do not require benchmark coverage but must reference a CVR entry documenting the process failure.

*(No items — awaiting pilot evidence)*

---

## Category 7 — UX

*Improvements to the user interface.*

Items here address UX friction that measurably delayed submission processing or caused data entry errors. UX items require Frequency ≥ 3 AND a documented time impact before entry.

*(No items — awaiting pilot evidence)*

---

## Category 8 — Infrastructure

*Improvements to the API, database schema, deployment pipeline, or admin tooling.*

Items here address platform reliability failures: API errors, missing data, incorrect schema behavior. All infrastructure items must reference a Critical or High business-impact CVR entry.

*(No items — awaiting pilot evidence)*

---

## Category 9 — Performance

*Improvements to API response time, report generation time, or dashboard load performance.*

Items here are only authorized if: average decision time (metric P6 in `PILOT_METRICS_SPEC.md`) exceeds the 24-hour target AND the cause is traced to platform performance (not process latency).

*(No items — awaiting pilot evidence)*

---

## Category 10 — Security

*Security hardening items.*

Security items bypass the normal CVR requirement ONLY if they address an active vulnerability. Post-incident hardening items still require a CVR entry (incident as evidence).

*(No items — awaiting pilot evidence)*

---

## Backlog Governance

### Weekly Triage (Every Friday)
- Pilot Director reviews new CVR entries approved that week.
- Engineering Lead estimates effort for newly approved items.
- Items are placed in the category and ordered by Priority (P1 first, then P2, then P3), then by frequency.

### Phase 2 Sprint Planning
- Phase 2 sprints begin after pilot exit criteria are met.
- Sprint scope is drawn from this backlog, P1 items first.
- No sprint item may be added to the sprint without a completed backlog entry.

### Backlog Freeze Rules
- No item is added without a CVR reference.
- No item priority may be escalated without Pilot Director approval.
- No item may be removed once approved (mark as `DEFERRED` or `COMPLETED`, never deleted).

---

## Backlog Summary (Updated Weekly)

| Category | Item Count | P1 | P2 | P3 |
|----------|-----------|----|----|-----|
| Decision Logic | 0 | — | — | — |
| Knowledge | 0 | — | — | — |
| Financial Models | 0 | — | — | — |
| Evidence | 0 | — | — | — |
| Reports | 0 | — | — | — |
| Operations | 0 | — | — | — |
| UX | 0 | — | — | — |
| Infrastructure | 0 | — | — | — |
| Performance | 0 | — | — | — |
| Security | 0 | — | — | — |
| **Total** | **0** | — | — | — |
