# Commercial Validation Program
**Eunoia Platform — Controlled Pilot v1.0**  
**Classification:** Internal — Program Governance  
**Date:** 2026-08-04  
**Authority:** Executive Commercial Validation Director  
**Status: ACTIVE**

---

## Executive Summary

The Commercial Validation Program governs the 20-submission controlled pilot that converts the Eunoia Decision Intelligence Platform from a completed engineering build into a commercially validated product. The program answers a single business question:

> **Can Eunoia consistently deliver recommendations that a senior real estate consultant agrees with, and that clients accept?**

The answer determines whether the platform expands to full commercial operations or requires Phase 2 engineering investment first.

---

## 1. Pilot Objectives

### Primary Objective
Validate that the Decision Intelligence Engine produces recommendations accurate enough to be delivered to real clients under consultant oversight.

**Success threshold:** ≥ 80% recommendation accuracy (consultant agreement rate across 20 submissions).

### Secondary Objectives

| Objective | Target |
|-----------|--------|
| Client acceptance | ≥ 70% of delivered reports accepted without rejection |
| False positive control | ≤ 15% of proceed recommendations later judged incorrect |
| False negative control | ≤ 20% of revise recommendations where consultant would have said proceed |
| Zero critical disagreements | No case where the system produced a materially dangerous recommendation |
| Decision cycle time | ≤ 24 hours from intake to client delivery |
| Narrative quality | ≤ 1.5 consultant corrections per report on average |

### What the Pilot Does NOT Validate

- GPT accuracy on hypothetical edge cases (only real submissions count)
- Performance at scale (20 submissions is controlled volume)
- Any domain other than Egypt Real Estate feasibility
- Architecture for Phase 2 (this decision is made after exit criteria are met)

---

## 2. Learning Objectives

For each submission where consultant and system disagree, the pilot must produce a documented answer to:

1. Which component failed? (rules, confidence, evidence, knowledge, GPT, process)
2. What was the correct answer?
3. How would we detect this class of error in future?
4. How frequently does this failure mode appear?
5. What is the business risk of this error reaching a client?

These answers populate the Commercial Validation Register and Phase 2 Backlog.

**The 20 submissions must collectively produce enough evidence to prioritize Phase 2 engineering with confidence — not guesswork.**

---

## 3. Weekly Review Cadence

### Weekly Pilot Review (Every Friday)

**Attendees:** Pilot Director, Senior RE Consultant, Engineering Contact (on-call)  
**Duration:** 60 minutes  
**Format:** Standing agenda, no exceptions

| Agenda Item | Time | Owner |
|-------------|------|-------|
| Submissions completed this week | 5 min | Pilot Director |
| Metrics dashboard review (10 KPIs) | 10 min | Pilot Director |
| Consultant review outcomes | 15 min | Senior Consultant |
| New CVR entries: root cause confirmation | 15 min | Pilot Director + Consultant |
| Emerging patterns (≥ 2 occurrences) | 10 min | All |
| Next week submissions: scheduling | 5 min | Pilot Director |

**Mandatory outputs from each weekly review:**
- Updated metrics in `/dashboard/admin/pilot`
- CVR entries for all disagreements from the week (Priority and Approval set)
- Updated Phase 2 Backlog (approved items added)
- Decision: continue pilot / pause / escalate

### Interim Assessment (After Submission 10)

At submission 10, the Pilot Director produces a written Interim Assessment:
- Current metrics vs. targets
- Patterns identified
- Phase 2 backlog items approved to date
- Go/No-Go recommendation for submissions 11–20
- Any adjustments to the review process

**If any P5 exit criterion is threatened (Critical Disagreement > 0), the Pilot Director may pause the pilot immediately without waiting for the Friday review.**

---

## 4. Engineering Cadence

### During the Pilot

**Engineering is in STANDBY MODE during the pilot.**

The Engineering Contact attends the Friday review but does NOT implement any changes during the pilot unless:

1. A security vulnerability is confirmed (immediate fix authorized)
2. A data integrity failure is confirmed (immediate fix authorized)
3. The Pilot Director declares a pilot-stopping issue (RC-10 Architecture, Critical severity, ≥ 3 occurrences)

All other engineering observations are logged in the CVR and deferred.

### After Pilot Completion (Phase 2)

Phase 2 engineering begins only after the pilot exit criteria are evaluated. The Phase 2 sprint plan is drawn directly from the approved Phase 2 Backlog. Priority order:

1. All P1 items (safety-critical, prevent dangerous recommendations)
2. P2 items with frequency ≥ 4
3. P2 items with frequency ≥ 3
4. P3 items in dependency order

Each Phase 2 sprint is followed by a benchmark regression run. If any benchmark case regresses, the sprint item that caused the regression is reverted.

---

## 5. Go / No-Go Gates

### Gate 1 — Pilot Launch (Before Submission 1)

| Check | Required |
|-------|----------|
| `supabase/pilot-tables.sql` deployed | ✅ |
| `/dashboard/admin/pilot` loads for admin | ✅ |
| Consultant has reviewed Operations Manual and Review Template | ✅ |
| Engineering Contact briefed on standby protocol | ✅ |
| First submission scheduled with a real client | ✅ |

### Gate 2 — Pilot Continuation (After Submission 10)

| Check | Pass condition |
|-------|---------------|
| No critical disagreements | 0 critical severity |
| Recommendation accuracy not catastrophically low | ≥ 60% (warning zone) |
| No RC-10 architecture issues × 3 occurrences | True |
| No data isolation failure | True |

If Gate 2 FAILS → pause pilot, convene emergency review, decide: fix and restart or terminate.

### Gate 3 — Phase 2 Authorization (After Submission 20)

Full exit criteria evaluation per `docs/pilot/PILOT_EXIT_CRITERIA.md`.

| Outcome | Criteria |
|---------|----------|
| **PASS → Full Expansion** | All P1–P10 targets met. Consultant review may be reduced in Phase 2. |
| **PARTIAL PASS → Conditional Expansion** | P5 (zero critical) + P1 (accuracy) met. 1–3 secondary criteria in warning zone. Phase 2 begins immediately; expansion waits for Phase 2 fixes. |
| **FAIL → Engineering Required** | Any F1–F6 failure condition met. No expansion. Phase 2 sprint before any commercial activity. |

---

## 6. Expansion Criteria

After a PASS or PARTIAL PASS at Gate 3, expansion is authorized under the following conditions:

### Volume Expansion (20 → 50 submissions)

All of:
- Gate 3 PASS or PARTIAL PASS
- Phase 2 P1 items resolved (if any)
- Consultant review maintained per submission
- Metrics dashboard operational

### Geographic Expansion (additional Egypt cities)

Additional to volume expansion:
- Knowledge library validated against new city data (separate CVR process)
- At least 3 pilot submissions from the target city geography
- Consultant with local market knowledge involved in reviews

### Domain Expansion (new vertical)

**Not authorized during pilot or Phase 2.**  
Domain expansion requires a separate program with its own knowledge acquisition, rule development, and controlled pilot. This document does not govern domain expansion.

### Reduced Consultant Oversight

Only authorized if:
- ≥ 40 total submissions completed (not just pilot)
- Recommendation accuracy ≥ 90% sustained over last 20 submissions
- False positive rate ≤ 5% sustained over last 20 submissions
- Zero critical disagreements in last 20 submissions
- Pilot Director + Executive sign-off

---

## 7. Roles and Responsibilities

| Role | Primary Responsibility | During Pilot |
|------|----------------------|-------------|
| **Pilot Director** | Program governance, weekly reviews, CVR approvals | Active daily |
| **Senior RE Consultant** | Every submission review, root cause confirmation | Reviews within 48h of submission |
| **Submission Analyst** | Intake, form entry, client delivery, client response capture | Active per submission |
| **Engineering Contact** | Standby for emergencies, Friday review attendance | Standby; no implementation |
| **Executive** | Gate 3 decision, Phase 2 authorization | Gate reviews only |

---

## 8. Communication Protocol

| Event | Notification | Within |
|-------|-------------|--------|
| Submission completed | Analyst → Pilot Director | 1 hour |
| Consultant review completed | Consultant → Analyst + Pilot Director | 48 hours |
| Disagreement (any severity) | Pilot Director notified | Immediately |
| Critical disagreement | Pilot Director → Executive | Immediately (escalates pilot) |
| Pattern identified (≥ 2 same root cause) | Pilot Director flags at Friday review | Next Friday |
| Gate 2 fail condition triggered | Pilot Director → Executive | Same day |

---

## 9. Success Definition

**The pilot is a commercial success if:**

The platform delivers 20 real estate feasibility assessments, with a consultant review on each, achieving ≥ 80% recommendation agreement and ≥ 70% client acceptance, with zero critical disagreements, in ≤ 24 hours per submission.

This means clients received decision support they found valuable, and the consultant found the system's recommendations aligned with professional judgment most of the time.

**The pilot is an engineering success if:**

Every disagreement is documented with a root cause, every root cause is classified, and the Phase 2 backlog at pilot completion contains a prioritized, evidence-backed list of improvements that will raise accuracy above 90%.

Both are required. Neither alone is sufficient.
