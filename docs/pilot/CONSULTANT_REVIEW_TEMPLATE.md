# Consultant Review Sheet
**Eunoia Platform — Controlled Pilot v1.0**  
**One sheet per submission. Complete in full before signing off.**

---

## Section A: Submission Identification

| Field | Value |
|-------|-------|
| **Submission ID** | PILOT- |
| **Review Date** | |
| **Reviewer Name** | |
| **Client Identifier** | |
| **Project Location** | |
| **Project Type** | Real Estate Feasibility |

---

## Section B: System Output

*Taken directly from the platform output. Do not modify.*

| Field | Value |
|-------|-------|
| **System Recommendation** | ☐ proceed   ☐ revise |
| **DI Engine Confidence** | / 100 |
| **Trust Score** | / 100 |
| **Financing Gap Exceeded** | ☐ Yes (blocked proceed)   ☐ No |
| **Rules Fired (from decisionReport)** | |
| **Blocked Options** | |
| **Executive Report Generated** | ☐ Yes   ☐ No |

---

## Section C: Mandatory Pre-Review Checks

Complete before forming your own assessment.

| Check | Status | Notes |
|-------|--------|-------|
| Narrative is in Arabic and reads coherently | ☐ Pass   ☐ Fail | |
| No stale confidence percentage in narrative text | ☐ Pass   ☐ Fail | |
| Financial figures in narrative match input parameters | ☐ Pass   ☐ Fail | |
| No JSON artifacts or error text visible | ☐ Pass   ☐ Fail | |
| Executive report section is present | ☐ Pass   ☐ Fail | |

If any check is **Fail**, halt and notify the Analyst. Do not proceed to Section D until resolved.

---

## Section D: Advisory Rule Manual Evaluation

*These 6 rule categories are not evaluated by the production system. Consultant must assess manually.*

### RE-COM — Commercial Viability

**Question:** Is the market absorption rate (sales pace assumption) consistent with current conditions in this location and segment?

- Sales months entered: ______
- Your assessment of realistic sales months: ______
- Consistent? ☐ Yes   ☐ No   ☐ Insufficient data

**Notes:**

---

### RE-OPS — Operational Feasibility

**Question:** Is the construction timeline realistic for this project size, contractor availability, and location?

- Build months entered: ______
- Your assessment of realistic build months: ______
- Consistent? ☐ Yes   ☐ No   ☐ Insufficient data

**Notes:**

---

### RE-STR — Strategic Fit

**Question:** Does the unit mix, price point, and location align with the declared target buyer profile?

- Your assessment: ☐ Aligned   ☐ Partial misalignment   ☐ Significant misalignment

**Notes:**

---

### RE-EXE — Execution Capability

**Question:** Does the developer have a demonstrated track record appropriate to this project scale?

- Your assessment: ☐ Track record confirmed   ☐ First project of this scale   ☐ Track record unknown

**Notes:**

---

### RE-RSK — Macro and Market Risk

**Question:** Are there current macro, political, or market conditions that materially invalidate the cashflow assumptions?

- FX rate risk: ☐ Low   ☐ Medium   ☐ High
- Interest rate environment: ☐ Stable   ☐ Rising   ☐ Declining
- Political / regulatory risk: ☐ None   ☐ Monitor   ☐ Active concern

**Notes:**

---

### RE-LGL — Legal Title

**Question:** Is land registration status confirmed? Unregistered title is a significant financing and legal risk.

- Land registration status: ☐ Registered   ☐ In Progress   ☐ Unregistered   ☐ Unknown
- If unregistered or unknown: ☐ Flag in delivery   ☐ Escalate before delivery

**Notes:**

---

## Section E: Financing Gap Assessment

*The system uses a 30% equity proxy when equityAmount is not provided. Consultant must verify this is appropriate.*

| Field | Value |
|-------|-------|
| Equity amount provided by client (EGP) | |
| System-estimated available capital (if proxy used) | 30% of total project cost |
| Total project cost (from report) | |
| Peak cash shortfall (from report, if visible) | |
| Financing gap flag triggered by system | ☐ Yes   ☐ No |

**Consultant financing assessment:**

Is the system's financing conclusion correct given the actual equity amount?

☐ **Confirmed** — System correctly assessed the financing position  
☐ **Override — False Alarm** — Developer is well-capitalized; system fired due to proxy. Recommend changing to `proceed`.  
☐ **Override — Correct Block** — Developer is undercapitalized even with actual equity; system correctly blocked `proceed`.  
☐ **Insufficient Data** — Cannot confirm without additional financial information from client

**Notes:**

---

## Section F: Defer Assessment

*The system cannot output `defer`. Consultant must explicitly evaluate this option.*

**Question:** Is deferring this project the correct commercial decision given current market conditions?

Defer indicators to consider:
- Project is financially viable but market timing is unfavorable (high inflation, supply glut, buyer sentiment decline)
- Key regulatory or planning approvals are pending and will materially affect NPV
- Macro conditions expected to improve within 6–18 months in a way that significantly changes project economics
- Developer has superior alternative capital deployment available

**Defer assessment:**

☐ **Defer NOT appropriate** — proceed or revise is the correct recommendation  
☐ **Defer IS appropriate** — consultant will override to `defer` in Section G

**Defer rationale (if applicable):**

---

## Section G: Consultant Recommendation

| Field | Value |
|-------|-------|
| **Consultant Recommendation** | ☐ proceed   ☐ revise   ☐ defer   ☐ reject |
| **Agreement with System** | ☐ Yes   ☐ No |
| **Confidence in Final Recommendation** | ☐ Very High   ☐ High   ☐ Medium   ☐ Low |

### If DISAGREE — Root Cause (select primary):

☐ Missing input — client did not provide a critical parameter  
☐ Incorrect parameter — client provided a parameter that appears unrealistic  
☐ Rule deficiency — system rules did not capture a relevant business condition  
☐ Evidence deficiency — system lacked market data needed to assess correctly  
☐ Financial model issue — cashflow model assumptions do not match this project type  
☐ Narrative issue — AI narrative misrepresented the recommendation or financials  
☐ Prompt issue — AI narrative missed or misframed a key input  
☐ User misunderstanding — client's inputs reflect a misunderstanding of the question  
☐ Operational issue — data entry error or process failure  
☐ Architecture issue — system design cannot handle this case type  

**Detailed reason for disagreement:**

---

## Section H: Severity Classification

*Only complete if there is disagreement (Section G Agreement = No)*

| Severity | Definition | ☐ |
|----------|-----------|---|
| **Critical** | System recommendation, if followed without review, would cause direct commercial harm (capital loss, legal exposure, reputational damage) | ☐ |
| **Major** | System recommendation is incorrect and would lead to a suboptimal business decision, but not direct harm | ☐ |
| **Minor** | System recommendation is directionally correct but imprecise (e.g., `revise` when the revision is small and client could arguably `proceed`) | ☐ |
| **Cosmetic** | Recommendation is correct but narrative quality, framing, or confidence presentation has issues | ☐ |

---

## Section I: Narrative Corrections

List any corrections needed to the AI narrative before delivery to the client.

| # | Location in Report | Original Text | Corrected Text |
|---|-------------------|---------------|----------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

☐ No corrections needed — narrative may be delivered as generated

---

## Section J: Delivery Sign-Off

| Field | Value |
|-------|-------|
| **Final Recommendation for Client** | |
| **Final Recommendation Rationale** | |
| **Narrative approved for delivery** | ☐ Yes   ☐ Yes with corrections   ☐ No — escalate |
| **Time Spent on Review** | minutes |
| **Sign-off** | |
| **Sign-off Date/Time** | |

---

## Section K: Lessons Learned

*To be completed after client feedback is received (may be added post-delivery)*

**What did this submission teach us about the system?**

**What did this submission teach us about the process?**

**What should be changed before the next 20 submissions?**

**Would this submission have been safe to deliver without consultant review?**

☐ Yes — system output was correct and complete  
☐ No — consultant review was necessary and changed the output  
☐ Uncertain

---

*This sheet is a pilot record. Retain for the full duration of the pilot and post-pilot review.*
