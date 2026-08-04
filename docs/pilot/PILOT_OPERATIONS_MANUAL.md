# Pilot Operations Manual
**Eunoia Platform — Controlled Pilot v1.0**  
**Scope:** 20 Real Estate Feasibility Submissions  
**Effective:** 2026-08-04  
**Owner:** Executive Pilot Operations Director

---

## Purpose

This manual governs every step from client intake to final delivery for the 20-submission controlled pilot. Its purpose is not to maximize throughput. Its purpose is to ensure every submission either validates or challenges a hypothesis about Eunoia's commercial trustworthiness.

**Every submission is an experiment. Every disagreement is data.**

---

## Operational Constraints (from Pilot Readiness Report)

Before any submission is processed, all personnel must be briefed on the following non-negotiable constraints:

| Constraint | Operational Response |
|------------|---------------------|
| System never outputs `defer` | Consultant must explicitly evaluate defer suitability on every case. If defer is correct, override is mandatory. |
| Confidence always shows HIGH (68–84) | Do not represent HIGH as "strong confidence." Explain to clients: system confidence reflects data completeness, not market certainty. |
| Financing gap uses 30% proxy when `equityAmount` not provided | Collect equity amount verbally on every intake call before submission. Enter into the `equityAmount` form field. |
| GPT narrative text may reference a confidence percentage | Consultant must read the full narrative before delivery and remove or correct any stale confidence percentage references. |
| System cannot output `null` recommendation | If consultant believes the project should be rejected outright, the consultant override recommendation is `reject` (not a system output). |
| 23 advisory RE rules not evaluated in production | For high-value submissions, consultant must manually check the advisory rule categories: RE-COM, RE-OPS, RE-STR, RE-EXE, RE-RSK. A checklist is included in the Consultant Review Sheet. |

---

## Roles

| Role | Responsibility |
|------|---------------|
| **Submission Analyst** | Intake, form entry, submission tracking, delivery packaging |
| **Senior RE Consultant** | Every submission review, recommendation sign-off, learning loop classification |
| **Pilot Director** | Daily metrics review, escalation decisions, exit criteria assessment |
| **Engineering Contact** | On-call for technical failures during pilot hours |

---

## Workflow 1: Standard Submission Workflow

```
CLIENT INTAKE → FORM ENTRY → SYSTEM RUN → ANALYST REVIEW → CONSULTANT REVIEW → DELIVERY → FEEDBACK COLLECTION
```

### Step 1.1 — Client Intake Call (pre-submission)

Before entering any data into the system:

1. Assign a **Submission ID** in the format `PILOT-{nn}` (e.g., `PILOT-01` through `PILOT-20`)
2. Record in the Submission Tracker: client name, project location, project type, intake date
3. Collect the following explicitly:
   - Number of units
   - Unit area (sqm)
   - Land area (sqm) if different from unit area × 1.3
   - Selling price per sqm
   - Build cost per sqm
   - Land cost (total EGP)
   - Build duration (months)
   - Sales duration (months)
   - Down payment percentage
   - Cash sales percentage
   - **Equity amount available (EGP)** — ask directly: "What is the total equity capital committed to this project before external financing?"
4. Note any missing fields. Do not proceed if equity amount is unavailable — estimate is acceptable only if the client explicitly cannot provide it.

### Step 1.2 — Form Entry

1. Open the Real Estate Decision Intelligence dashboard
2. Enter all collected parameters
3. Enter `equityAmount` in the equity field (do NOT rely on the 30% proxy if actual equity is known)
4. Verify all fields before submission. Do not submit with placeholder values.

### Step 1.3 — System Run

1. Submit the form
2. Record the exact timestamp of submission
3. Capture the full API response for archiving:
   - `report` (AI narrative)
   - `decisionReport` (DI engine output including confidence and recommendation)
   - `trustScore`
   - `executiveReport` (if generated)
4. Record the system recommendation (`proceed` / `revise`)
5. Record the DI engine confidence score and trust score
6. If any API error occurs, go to **Workflow 5: Failed Submission**

### Step 1.4 — Analyst Pre-Review

Before passing to the consultant, the analyst must confirm:

- [ ] Report narrative is in Arabic (expected) and reads coherently
- [ ] System recommendation is present (`proceed` or `revise`)
- [ ] Confidence score is present and in range 60–90
- [ ] Executive report section is present (if generated)
- [ ] No error messages or JSON artifacts visible in the output
- [ ] No stale `confidence_score` percentage visible in the narrative text that contradicts the DI engine score

If any check fails, flag to Engineering before passing to consultant.

### Step 1.5 — Consultant Review

Consultant completes the **Consultant Review Sheet** (see `CONSULTANT_REVIEW_TEMPLATE.md`) in full.

Mandatory checks:
- [ ] Manually assess whether `defer` is the correct recommendation (system cannot output defer)
- [ ] Assess financing gap: is the 30% proxy appropriate, or does the client's actual equity change the picture?
- [ ] Manually evaluate the 6 uncovered advisory rule categories (see Advisory Rule Checklist below)
- [ ] Read the full AI narrative for coherence and accuracy
- [ ] Verify that no confidential client data appears in a form that could be inferred from the report

**Advisory Rule Manual Checklist (substituting for unavailable pipeline rules):**

| Category | Check |
|----------|-------|
| RE-COM (Commercial) | Is the market absorption rate consistent with the sales duration assumption? |
| RE-OPS (Operational) | Is the construction timeline realistic for this project size and location? |
| RE-STR (Strategic) | Does the project fit the declared target buyer profile and location positioning? |
| RE-EXE (Execution) | Does the developer have a track record consistent with this project scale? |
| RE-RSK (Risk) | Are there any macro or political risk factors that invalidate the cashflow assumptions? |
| RE-LGL (Legal) | Is land registration status confirmed? Any unregistered title should be flagged. |

Consultant documents findings in the Review Sheet. Signs off with final recommendation.

### Step 1.6 — Client Delivery

1. Analyst prepares the client deliverable:
   - Use the executive report section as the primary deliverable
   - Append the consultant's signed-off recommendation and rationale
   - If consultant has overridden the system recommendation, the deliverable must show the **consultant recommendation**, not the system recommendation
   - Do not expose raw DI engine JSON, rule scores, or confidence numbers to the client
2. Deliver via agreed channel (email / platform portal)
3. Record delivery timestamp

### Step 1.7 — Client Feedback Collection

Within 72 hours of delivery:
1. Follow up with the client
2. Record: Did the client accept the recommendation? (Yes / Query / Reject)
3. If the client queried or rejected, record the specific objection
4. Pass objection to the Pilot Director for Learning Loop classification

---

## Workflow 2: Analyst Workflow (Daily)

Each morning the Analyst:
1. Opens the Submission Tracker
2. Verifies no submissions are pending beyond 24 hours without consultant review
3. Updates the running metrics in the Pilot Dashboard
4. Flags any submissions approaching the escalation threshold (see Workflow 4)

---

## Workflow 3: Consultant Review Workflow

The consultant must complete a Review Sheet for every submission within 4 business hours of receiving it.

**Review sequence:**
1. Read the system recommendation and confidence score first — form a prior before reading the narrative
2. Read the full AI narrative
3. Review the structured executive report
4. Apply the Advisory Rule Manual Checklist
5. Complete the Review Sheet
6. Record time spent
7. Return to the Analyst with:
   - Final recommendation
   - Any corrections required to the narrative before delivery
   - Learning loop classification (if there is disagreement)

**Consultant override authority:**
The consultant has full authority to override the system recommendation. Override is expected in the following scenarios:
- System outputs `revise` but consultant assesses the project as `proceed` (likely false negative from financing proxy)
- System outputs `proceed` but consultant assesses the project should be `defer` or `reject`
- System outputs `revise` but consultant assesses the project should be `reject` (beyond the system's current capability)

All overrides must be recorded with a reason code from the Learning Loop taxonomy.

---

## Workflow 4: Escalation Workflow

**Escalation criteria — Pilot Director must be notified immediately:**

| Trigger | Action |
|---------|--------|
| System outputs `proceed` on a project that consultant assesses as `reject` | Escalate to Pilot Director + Engineering. Do not deliver to client until reviewed. |
| Two or more consecutive submissions produce the same disagreement pattern | Escalate to Pilot Director. Potential systematic rule deficiency. |
| Client explicitly rejects a recommendation as commercially dangerous | Escalate to Pilot Director. Learning Loop classification mandatory. |
| API failure rate exceeds 20% on a single day | Escalate to Engineering. Halt new submissions until resolved. |
| Consultant cannot complete a review within 4 business hours | Pilot Director assigns a second consultant or extends the SLA |

**Escalation chain:**
1. Analyst → Consultant (first contact)
2. Consultant → Pilot Director (if criteria above met)
3. Pilot Director → Engineering (if technical failure or systematic rule deficiency)
4. Pilot Director → Executive Team (if commercial damage risk)

---

## Workflow 5: Failed Submission Workflow

A submission is classified as **FAILED** if any of the following occur:
- API returns a non-2xx status code
- API returns `error` field in the response
- `decisionReport` is null (DI engine fail-safe triggered)
- `executiveReport` is null and no alternative report section is present
- The AI narrative is empty, in English when Arabic is expected, or contains JSON artifacts

**Steps:**
1. Do NOT deliver to client
2. Record the failure in the Submission Tracker with the error code / description
3. Engineering Contact notified within 1 hour
4. Determine if the failure is retryable:
   - API timeout → retry once after 5 minutes
   - Parse error → Engineering investigates before retry
   - DI engine fail-safe → Engineering investigates before retry
5. If retry succeeds: proceed through standard workflow, note the failure in the Review Sheet
6. If retry fails: submission counted as a failed submission in pilot metrics
7. Failed submissions do not count toward the 20 successful submissions. A replacement submission may be taken.

---

## Workflow 6: Correction Workflow

A correction is required when an error is discovered **after** client delivery.

**Error types that require correction:**
- Factually incorrect financial number in the narrative (not matching the input parameters)
- System recommendation contradicts client's clearly correct project assessment (post-delivery discovery)
- Confidential data from one submission appears in another submission's output

**Steps:**
1. Analyst immediately notifies Pilot Director
2. Pilot Director assesses severity (cosmetic / material / commercial damage)
3. For cosmetic errors: issue a corrected report with a cover note explaining the correction
4. For material errors: issue a corrected report, schedule a call with the client to review the correction
5. For commercial damage: Pilot Director escalates to Executive Team before any client contact
6. All corrections logged in the Submission Tracker and classified in the Learning Loop
7. Engineering notified of all material and commercial damage corrections

**Correction does not reset the submission counter.** The original submission is counted as a learning case. The corrected version replaces it in the delivery record.

---

## Submission Tracker Schema

Maintain one row per submission in a shared spreadsheet or document:

| Field | Type | Notes |
|-------|------|-------|
| Submission ID | String | `PILOT-01` to `PILOT-20` |
| Date submitted | Date | — |
| Client identifier | String | Internal reference only |
| Project type | String | Feasibility (all pilot submissions) |
| System recommendation | Enum | proceed / revise |
| System confidence | Integer | 60–90 expected |
| Trust score | Integer | Same as confidence in current build |
| Consultant recommendation | Enum | proceed / revise / defer / reject |
| Agreement | Boolean | — |
| Override reason code | String | From Learning Loop taxonomy |
| Client response | Enum | Accept / Query / Reject |
| Delivery date | Date | — |
| Status | Enum | Pending / In Review / Delivered / Failed / Corrected |
| Notes | Text | Free text |

---

## Operating Hours

Pilot submissions accepted: Sunday–Thursday, 09:00–17:00 EET  
Consultant review SLA: 4 business hours from analyst handoff  
Client delivery SLA: 24 business hours from submission  
Engineering on-call: Available during operating hours via direct message

---

## Pilot Duration

Target: 20 successful submissions within 8 weeks of pilot launch.  
Maximum duration: 12 weeks (if submission rate is lower than expected).  
Exit criteria assessment: After submission 10 (interim) and submission 20 (final). See `PILOT_EXIT_CRITERIA.md`.
