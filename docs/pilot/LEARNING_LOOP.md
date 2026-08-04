# Learning Loop
**Eunoia Platform — Controlled Pilot v1.0**  
**Effective:** 2026-08-04  
**Owner:** Pilot Director + Senior RE Consultant

---

## Purpose

The Learning Loop converts every disagreement, correction, and client objection into a structured lesson that improves either:
1. The platform (Phase 2 engineering priorities)
2. The operational process (immediate improvements within the pilot)
3. The intake process (better client preparation)
4. The consultant briefing (better interpretation of system outputs)

A pilot that produces zero learnings is a failed pilot, even if all metrics pass. A pilot that produces clear, classified learnings has commercial value regardless of the accuracy rate.

---

## Trigger Conditions

The Learning Loop is triggered by any of the following events:

| Event | Trigger |
|-------|---------|
| Consultant disagrees with system recommendation | Mandatory classification |
| Client queries the recommendation | Classification required |
| Client rejects the recommendation | Mandatory classification |
| Narrative correction required | Classification required |
| Submission fails (API error, null report) | Classification required |
| Consultant applies a manual advisory rule flag not caught by system | Log as evidence deficiency |

---

## Root Cause Taxonomy

Every disagreement or correction is classified into exactly one primary root cause. If multiple causes apply, select the one that would have been sufficient to prevent the disagreement if fixed alone.

---

### RC-01: Missing Input

**Definition:** The client did not provide a parameter that was critical to an accurate recommendation, and the system used a proxy or default that produced an incorrect result.

**Examples:**
- Equity amount not provided → system used 30% proxy → financing gap false alarm → consultant had to override
- Sales pace not provided → system used default → absorption rate assumption was too optimistic

**Operational response:** Add the missing parameter to the intake checklist. Make it a required field for the next 5 submissions.

**Engineering signal:** If this root cause exceeds 3 occurrences, consider adding the parameter to the form as a required field (not a Phase 2 item — an intake fix).

---

### RC-02: Incorrect Parameter

**Definition:** The client provided a parameter but the value entered was unrealistic, misunderstood, or entered in the wrong unit, and the system accepted it without flagging.

**Examples:**
- Build cost per sqm entered as total construction cost
- Sales months entered as build months
- Land cost entered in millions but system expected thousands

**Operational response:** Analyst must add a verbal sanity check on all financial inputs during intake ("You said EGP 50,000 per sqm — is that the net selling price or the gross?").

**Engineering signal:** If this root cause exceeds 2 occurrences for the same parameter, consider adding a range validation warning to the form for that parameter.

---

### RC-03: Rule Deficiency

**Definition:** All inputs were correct and complete, but the system's 7-rule set did not capture a business condition that a competent RE advisor would use to form the recommendation.

**Examples:**
- Project is in a segment with currently oversupplied inventory — no rule captures supply-demand imbalance
- Selling price per sqm is significantly below the developer's cost base for that location — rule doesn't check price realism
- Project relies on a land payment schedule that defers 80% for 10 years — the cashflow model benefits from this but it's a legal/contract risk the system doesn't flag

**Operational response:** Consultant must explicitly check the Advisory Rule Manual Checklist (Section D of Review Sheet). Flag specific rule gap for Phase 2.

**Engineering signal:** Each rule deficiency is logged with a proposed new rule. These become Phase 2 engineering inputs. Do NOT implement rules during the pilot.

---

### RC-04: Evidence Deficiency

**Definition:** The system's 4 evidence items (user input, Egypt benchmarks, cashflow analysis, benchmark comparison) did not contain information that was necessary to form the correct recommendation.

**Examples:**
- Comparable recent sales data for the specific location was not available
- Construction cost index for the project's delivery timeframe was not in the benchmark database
- Market absorption rates for the specific unit type and price point were not in the evidence set

**Operational response:** Consultant must supplement with market knowledge and note what evidence would have changed the recommendation.

**Engineering signal:** Specific evidence types required. Phase 2 priority: satellite data, comparable sales APIs, construction cost indices.

---

### RC-05: Financial Model Issue

**Definition:** The cashflow engine's assumptions were structurally inappropriate for this project type, producing incorrect NPV, ROI, or net profit values.

**Examples:**
- Project is a mixed-use development (residential + commercial) but the model only handles residential
- Revenue recognition assumes a flat sales pace but the actual project has a launch spike followed by slow absorption
- Construction cost includes specialized MEP that the cost-per-sqm model significantly underestimates

**Operational response:** Consultant must manually recalculate the affected metrics and note the delta. Do NOT re-run the submission with modified inputs during the pilot.

**Engineering signal:** Financial model extension required for this project type. Phase 2 scope.

---

### RC-06: Narrative Issue

**Definition:** The system recommendation was correct, but the AI narrative misrepresented it, missed a key point, or framed it in a way that would mislead the client.

**Examples:**
- System said `revise` correctly, but narrative explained only minor cosmetic reasons, missing the primary financial concern
- Narrative referenced a confidence percentage inconsistent with the DI engine score
- Narrative missed the land registration risk the consultant identified

**Operational response:** Consultant corrects the narrative (Section I of Review Sheet). Note the specific gap in framing.

**Engineering signal:** Prompt improvement required. Phase 2: include additional structured data in the prompt to ensure the AI narrative covers the material reasons.

---

### RC-07: Prompt Issue

**Definition:** The AI narrative did not address a material input because the prompt did not include or sufficiently emphasize the corresponding parameter.

**Examples:**
- Down payment percentage was 30% (higher than market norm) but the narrative didn't mention it
- Financing gap was flagged by the rule system but the narrative didn't explain what that means for the developer
- The prompt generates a generic conclusion paragraph regardless of the recommendation type

**Operational response:** Note the specific omission. Do not re-generate.

**Engineering signal:** Prompt template revision required. Phase 2 prompt engineering sprint.

---

### RC-08: User Misunderstanding

**Definition:** The client misunderstood what the system was asking for and provided inputs that were correct in their interpretation but incorrect in the system's expected schema.

**Examples:**
- "Selling price per sqm" was interpreted as the gross price inclusive of VAT
- "Build months" was interpreted as the total project timeline including sales
- "Land cost" was interpreted as market value rather than acquisition cost

**Operational response:** Correct the misunderstanding during intake. Re-run the submission with corrected inputs. Count the original and re-run as a single submission.

**Engineering signal:** Form label improvements required. Phase 2: add helper text and examples to each form field.

---

### RC-09: Operational Issue

**Definition:** The disagreement or error was caused by a process failure, not a platform or knowledge failure.

**Examples:**
- Analyst entered the wrong value (data entry error)
- Consultant reviewed the wrong submission ID
- Client was delivered an uncorrected draft

**Operational response:** Correct immediately. Add a checklist step to prevent recurrence.

**Engineering signal:** None. Operational fix only.

---

### RC-10: Architecture Issue

**Definition:** The disagreement cannot be addressed by rules, evidence, prompts, or process — it requires a fundamental change to how the system is structured.

**Examples:**
- System always outputs `revise` for a class of projects where the correct answer is `defer` (defer reachability blocker)
- System cannot handle a project type (commercial-only, land subdivision) because the cashflow model is residential-only by design
- The 3-option recommendation structure (proceed/revise/defer) is insufficient for the actual decision this client needs to make

**Operational response:** Document the case in full. Escalate to Pilot Director. Do not attempt a workaround.

**Engineering signal:** Architecture change required. This is a Post-Pilot Phase 2 strategic item, not a pilot fix.

---

## Learning Loop Process

### Step 1: Classify (immediately after disagreement)

When a disagreement is recorded in Section G of the Consultant Review Sheet, the consultant immediately classifies the primary root cause (RC-01 through RC-10).

### Step 2: Document (same session)

The consultant completes the Learning Loop entry in the shared Learning Log:

```
PILOT-{nn} | Date | Root Cause | RC-{code} | Severity | Summary
```

Include:
- What the system produced
- What the correct answer was
- Why the difference occurred
- What would have prevented it (operationally or technically)

### Step 3: Aggregate (after every 5 submissions)

Pilot Director reviews the Learning Log and produces:
- Root cause frequency table
- Severity distribution
- Repeat pattern identification

### Step 4: Immediate Action (if pattern detected)

If the same root cause appears 3+ times across the first 10 submissions, the Pilot Director decides:

| Root Cause | Immediate Action Authority |
|-----------|--------------------------|
| RC-01 (Missing Input) | Pilot Director — update intake checklist |
| RC-02 (Incorrect Parameter) | Pilot Director — update analyst sanity check |
| RC-03 (Rule Deficiency) | Log only — do not modify rules during pilot |
| RC-04 (Evidence Deficiency) | Log only — do not modify evidence during pilot |
| RC-05 (Financial Model) | Log only — do not modify model during pilot |
| RC-06 (Narrative Issue) | Log only — do not modify prompts during pilot |
| RC-07 (Prompt Issue) | Log only — do not modify prompts during pilot |
| RC-08 (User Misunderstanding) | Pilot Director — update intake script |
| RC-09 (Operational Issue) | Pilot Director — update process immediately |
| RC-10 (Architecture Issue) | Escalate to Executive Team. Consider pilot pause. |

**The pilot does not pause for engineering fixes.** The only exception is RC-10 Architecture Issues that produce Critical-severity disagreements (system outputs PROCEED when the correct answer is REJECT, or vice versa).

### Step 5: Phase 2 Backlog Entry (end of pilot)

At the end of the pilot, the Learning Log is synthesized into a Phase 2 Priority Backlog. Each root cause cluster becomes one or more engineering or product tickets, ranked by frequency × severity.

---

## Learning Log Schema

Maintain one entry per learning event:

| Field | Values |
|-------|--------|
| Submission ID | PILOT-01 to PILOT-20 |
| Date | YYYY-MM-DD |
| Event Type | Disagreement / Client Query / Client Reject / Narrative Correction / API Failure |
| Primary Root Cause | RC-01 through RC-10 |
| Secondary Root Cause (if any) | RC-01 through RC-10 |
| Severity | Critical / Major / Minor / Cosmetic |
| System Output | proceed / revise / error |
| Correct Output | proceed / revise / defer / reject |
| What Would Have Prevented It | Free text |
| Phase 2 Engineering Ticket Required | Yes / No |
| Ticket Description (if Yes) | Free text |

---

## Quarterly Learning Review (Post-Pilot)

After the 20-submission pilot concludes, the Pilot Director and Engineering Lead conduct a structured review:

1. Which root causes appeared most frequently?
2. Which caused the highest severity disagreements?
3. What was the total client impact (accepted vs rejected recommendations)?
4. Which Phase 2 engineering tickets are now confirmed as priorities vs hypothesis?
5. What process changes are needed before any Phase 2 pilot (50+ submissions)?
6. Is the platform's core recommendation engine commercially trustworthy in its current form?

The output of this review is the **Phase 2 Authorization Document**.
