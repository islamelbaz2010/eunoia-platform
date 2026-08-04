# Engineering Intake Policy
**Eunoia Platform — Post-Freeze (v1.0 onwards)**  
**Classification:** Internal — Engineering Governance  
**Effective date:** 2026-08-04  
**Authority:** Executive Commercial Validation Director  
**Status: ACTIVE**

---

## Purpose

The platform is frozen at Baseline v1.0. No engineering work is authorized without a documented pilot evidence trail. This policy defines the single gate that every engineering request must pass before entering the Phase 2 backlog.

The intent is not to slow engineering. It is to ensure that every hour of engineering time delivers validated business value — not hypothetical improvement.

---

## The Gate

A new engineering task may only enter the Phase 2 backlog if it satisfies ALL six criteria:

| Criterion | Required Evidence |
|-----------|------------------|
| **1. Appeared in pilot** | A Commercial Validation Register (CVR) entry exists for this issue. The entry cites a specific PILOT-XX case. |
| **2. Confirmed by consultant** | The consultant's review (in `pilot_reviews` table) documents the same failure. Agreement = NO, or the consultant explicitly flagged this issue in the review notes. |
| **3. Business impact documented** | The CVR entry specifies the client business impact (Low / Medium / High / Critical). High or Critical automatically sets priority to P1. |
| **4. Root cause classified** | The CVR entry carries a root cause code (RC-01 through RC-10). The classification has been reviewed by the Pilot Director, not self-assigned by the submitting analyst. |
| **5. Frequency known** | The issue has appeared in at least 2 pilot submissions (P1 issues) or at least 3 submissions (P2/P3 issues). A single occurrence may be documented but does not qualify for backlog entry without director exception. |
| **6. Priority approved** | The Pilot Director has reviewed the CVR entry, set a priority, and marked it `Approved for Backlog = YES`. |

---

## Decision Flow

```
Request arrives
      │
      ▼
Does a CVR entry exist?
      │ NO → REJECT. Log the request as PENDING PILOT EVIDENCE.
      │       Revisit if the same issue appears in a future pilot submission.
      ▼ YES
Is the CVR entry complete (all fields filled)?
      │ NO → RETURN TO SUBMITTER. Complete the entry first.
      ▼ YES
Has the Pilot Director approved it (Approved for Backlog = YES)?
      │ NO → HOLD. Add to next Friday review agenda.
      ▼ YES
Does it fall within an allowed backlog category?
      │ NO → ESCALATE to Pilot Director. New categories require executive sign-off.
      ▼ YES
ACCEPT → Create Phase 2 Backlog item referencing CVR-[NNN]
```

---

## Rejection Responses

When a request is rejected, the submitter receives a standard response:

> **Request rejected — insufficient pilot evidence.**
> 
> This request cannot enter the Phase 2 backlog because it does not yet have a completed Commercial Validation Register entry citing a confirmed pilot case. The platform is frozen at v1.0. Engineering changes are driven exclusively by pilot evidence.
>
> If this issue appears in a pilot submission, log it in the Commercial Validation Register. It will be reviewed at the next weekly cadence.

---

## Emergency Exception Process

Two scenarios allow bypassing the normal gate:

### Security Vulnerability
- Applies if: a vulnerability exposes client data or allows unauthorized access.
- Process: Engineering Lead raises directly to Pilot Director. Work begins immediately.
- Required after-action: CVR entry filed as RC-10, severity Critical, with fix description.

### Data Integrity Failure
- Applies if: the platform is writing incorrect data to the database (e.g., report_id mismatched, trust_score corrupted).
- Process: same as Security. Immediate fix. Post-hoc CVR entry.

No other exception category exists. Convenience, performance, or "while we're in there" changes do not qualify.

---

## What This Policy Does Not Govern

This policy applies to the Phase 2 engineering backlog only. It does not govern:

- Operational changes to `docs/pilot/` documentation (no code change = no intake needed)
- Admin dashboard cosmetic changes that do not modify data structures
- Monitoring and alerting additions that emit no side effects
- Changes to the Commercial Validation Register itself

---

## Enforcement

The Pilot Director enforces this policy at every weekly review. Engineering Lead enforces it at sprint planning. Any attempt to add a task to the Phase 2 backlog without a CVR reference will be rejected by the Engineering Lead.

Engineering tasks created without a CVR reference are automatically tagged `UNAUTHORIZED — PENDING EVIDENCE` and removed from the active backlog.
