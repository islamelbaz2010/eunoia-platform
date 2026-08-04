# Product Identity Freeze — Version 1.1
**Classification:** Product Authority Document — Customer-Facing Terminology  
**Date:** 2026-08-04  
**Authority:** Chief Product Officer / Executive Commercial Validation Director  
**Supersedes:** PRODUCT_IDENTITY_FREEZE_v1.0.md  
**Status: FROZEN — ACTIVE FOR PILOT v1.0**

---

## AUTHORITY STATEMENT

This document is the single authoritative source for all customer-facing product terminology in Eunoia Platform Version 1.0.

Every UI file, every label, every CTA, every navigation item, every export header, and every in-product copy must conform to this document before the first pilot client is onboarded.

Any team member who encounters a label, name, or descriptor not listed in this document must default to the frozen terms below — no exceptions without a written amendment to this document.

This document supersedes PRODUCT_IDENTITY_FREEZE_v1.0.md and all prior naming conventions, sub-brand names, and working titles used during development.

---

## WHAT CHANGED IN v1.1

| Section | Change | Reason |
|---------|--------|--------|
| Section 3 | Navigation label under executive review; Arabic labels added | v1.0 navigation label "Feasibility Assessment" covers only 1 of 5 report types; Arabic column was absent |
| Section 4.1 | Added product type name distinction | v1.0 forbidden list included "Study" and "Analysis" which are valid proper nouns in report type names |
| Section 4.2 | Clarified Decision Engine output vs Arabic display labels | v1.0 contradictorily listed "مجدي" as both forbidden and permitted |
| Section 4.3 | Trust Score entry formalized | v1.0 used informal language "already correct" |
| Section 5.1 | Removed "Feasibility Assessment" from CTA context | CTAs use "New Assessment" — "Feasibility Assessment" belongs to navigation only |
| Section 5.3 | Separated nav label Arabic from report type Arabic | v1.0 mapped "Feasibility Assessment" nav label to "دراسة الجدوى" (the report type name) |
| Section 6 | Topbar title updated to be type-agnostic | v1.0 title referenced "Feasibility" only, but the page covers all 5 report types |
| Section 7 | Export filename standard extended to all 5 report types | v1.0 only specified feasibility filename |
| Section 10 | Decision Confidence field path specified | v1.0 referenced "correct field path" without naming it |
| Section 11 | NEW — Navigation Label Analysis (Mandatory Revision 1) | Formal comparison and executive recommendation for nav label |
| Section 12 | NEW — Product Architecture Map (Mandatory Revision 2) | Official product hierarchy for all future UI decisions |
| Section 13 | NEW — Vocabulary Governance (Mandatory Revision 3) | Approval workflow for any new customer-facing terminology |

---

## 1. OFFICIAL PRODUCT NAME

```
Eunoia
```

The product name is **Eunoia**. One word. No suffix. No sub-brand.

### Usage Rules

| Context | Correct | Incorrect |
|---------|---------|-----------|
| Sidebar brand mark | EUNOIA | EUNOIA ZONES / EUNOIA INTELLIGENCE / EUNOIA AI |
| Page topbars | EUNOIA | EUNOIA ZONES / EUNOIA INTELLIGENCE |
| Export file headers | Eunoia | Eunoia Zones Intelligence Platform / Eunoia AI OS |
| Email signatures | Eunoia | Eunoia Zones / Eunoia Intelligence |
| Document headers | Eunoia Platform | Eunoia Zones Platform / Eunoia AI Platform |

---

## 2. OFFICIAL PRODUCT DESCRIPTOR

```
Decision Intelligence Platform for Egypt Real Estate
```

**One sentence. Not negotiable. Used in full or not at all.**

### Usage Rules

| Context | Correct | Incorrect |
|---------|---------|-----------|
| Sidebar brand sub-text | Decision Intelligence Platform | Research & Intelligence / AI Research Platform |
| Dashboard subtitle | Decision Intelligence Platform | AI Research & Intelligence Platform |
| Login page | Decision Intelligence Platform — Egypt Real Estate | Intelligence Dashboard |
| Page topbar sub-text | Decision Intelligence Platform | Real Estate Intelligence Engine |
| Onboarding screens | Decision Intelligence Platform | Research & Intelligence Platform |

The descriptor may be shortened in space-constrained contexts to:

- "Decision Intelligence Platform" — preferred short form
- "Eunoia Decision Intelligence" — second acceptable short form

It may **never** be shortened to:

- "Intelligence Platform" — generic, not distinctive
- "Research Platform" — wrong category
- "AI Platform" — generic, not distinctive

---

## 3. OFFICIAL NAVIGATION TERMS

These are the only labels permitted in the sidebar and any navigation element visible to pilot clients.

> ⚠️ **EXECUTIVE REVIEW PENDING** — Navigation item 2 label is under formal review.  
> See **Section 11** for the full analysis and executive recommendation.  
> The implementing engineer must NOT change the navigation label until executive approval is recorded in Section 11.  
> Current frozen label: **"Assessments"** — see Section 11 for the rationale replacing v1.0's "Feasibility Assessment."

| Position | Label (EN) | Label (AR) | Route | Icon |
|----------|-----------|-----------|-------|------|
| 1 | Dashboard | لوحة التحكم | `/dashboard` | BarChart3 |
| 2 | Assessments ⚠️ | تقييمات ⚠️ | `/dashboard/real-estate` | Building2 |
| 3 | My Reports | تقاريري | `/dashboard/reports` | FileText |
| 4 | Settings | الإعدادات | `/dashboard/settings` | Settings |
| Admin-only | Admin Console | لوحة الإدارة | `/dashboard/admin` | ShieldCheck |

> ⚠️ marks the label subject to executive approval in Section 11. If executive rejects the recommendation, revert to "Feasibility Assessment" / "تقييم الجدوى" and update Section 11 accordingly.

### Navigation Rules

**Never use as navigation labels:**
- "Real Estate" — domain category, not a product action
- "Reports" alone (without "My")
- "Research Intelligence" — hidden during pilot
- "Market Intelligence" — hidden during pilot
- "Analytics" — hidden during pilot
- "Modules" — never a navigation concept
- "Hub" — never a navigation concept

**Hidden during Pilot v1.0 (routes preserved, sidebar links removed):**
- Research Intelligence (`/dashboard/research`)
- Market Intelligence / Analytics (`/dashboard/analytics`)
- Lead Finder (`/dashboard/research/leads`)
- Talent Finder (`/dashboard/research/talent`)

---

## 4. OFFICIAL REPORT TERMINOLOGY

Every label that describes the client's work product must use these terms exactly.

### 4.0 CRITICAL DISTINCTION — Product Type Names vs Generic Terms

The forbidden terms in Sections 4.1–4.4 apply to **generic action and concept labels**.

They do NOT apply to **product type proper nouns** — the names of specific assessment types displayed on report type selection cards and form headers. Those are product names, not generic terms.

| Category | Example | Status |
|----------|---------|--------|
| Generic action term | "Generate a study" | ❌ Forbidden — use "Generate an assessment" |
| Generic concept term | "Submit an analysis" | ❌ Forbidden — use "Submit an assessment" |
| Product type proper noun | "Feasibility Study" | ✅ Permitted — this is the specific product name |
| Product type proper noun | "Full Marketing Analysis" | ✅ Permitted — this is the specific product name |
| Product type proper noun | "Market Entry Intel" | ✅ Permitted — this is the specific product name |

The five frozen product type names are:

| ID | English Name | Arabic Name |
|----|-------------|-------------|
| `feasibility` | Feasibility Study | دراسة الجدوى العقارية |
| `campaign_roi` | Campaign ROI Audit | تدقيق أداء الحملات |
| `market_entry` | Market Entry Intel | استخبارات دخول السوق |
| `lead_gen` | Lead Generation Intel | استخبارات توليد العملاء |
| `full_analysis` | Full Marketing Analysis | التحليل التسويقي الشامل |

These five names are frozen. No renaming during Pilot v1.0.

### 4.1 The Submission

| Concept | Official Term | Forbidden Generic Terms |
|---------|--------------|------------------------|
| The act of submitting a project | **Assessment** | Report, Request, Submission |
| The form the client fills in | **Assessment Form** | Report Form, Input Form, Questionnaire |
| The primary action button | **New Assessment** | New Report, Generate Report, Create Report |
| The button returning to the form | **New Assessment** | New Report, Back to Form |
| The client's history section | **My Reports** | Report History, Reports, My Analyses |

> Note: "Study" and "Analysis" are forbidden as generic terms but permitted as part of product type proper nouns (see Section 4.0).

### 4.2 The Output

| Concept | Official Term | Forbidden Terms |
|---------|--------------|-----------------|
| The structured output rendered on-screen | **Decision Report** | Verdict, Result, Output |
| The premium formatted output | **Executive Report** | Full Report, Premium Report |
| The recommendation from the Decision Engine | **Decision** | Verdict, Result, Answer |
| The engine output value — positive | **Proceed** | Feasible |
| The engine output value — negative | **Revise** | Not Feasible |

**Decision Engine Output vs Arabic Display Labels:**

The Decision Engine produces structured output in English: `proceed` or `revise`. These are code-level labels.

The Arabic UI may display verdict language generated by the AI narrative layer (e.g., مجدي / غير مجدي). This is display text, not the engine's structured output. Both may coexist provided:
- The engine's structured Decision (Proceed / Revise) is always labeled "Decision" in any English context
- Arabic display verdicts are clearly contextual to the narrative layer, not to the Decision Engine output
- Neither layer uses "Accuracy" or "Feasibility" as an engine output label

### 4.3 The Quality Signal

| Concept | Official Term | Forbidden Terms |
|---------|--------------|-----------------|
| The engine's certainty score | **Decision Confidence** | Accuracy, Report Accuracy, دقة التقرير |
| The confidence percentage in context | **Confidence** | Accuracy %, Score % |
| The confidence badge — high tier | **High Confidence** | High Accuracy, دقة عالية |
| The confidence badge — medium tier | **Good Confidence** | Good Accuracy, دقة جيدة |
| The confidence badge — low tier | **Limited Evidence** | Limited Data, Limited Accuracy, بيانات محدودة |
| The average on the My Reports page | **Avg Confidence** | Avg Accuracy, متوسط الدقة |
| The evidence quality signal | **Trust Score** | Accuracy Score, Quality Score |

**Critical definition — Decision Confidence:**

> Decision Confidence is the Decision Engine's certainty in the current assessment, derived from evidence quality and rule coverage. It is not a historical accuracy rate. It is not a claim about whether past decisions proved correct. Never describe it as a percentage of historically correct decisions.

**DB field path for My Reports page:**  
Decision Confidence is stored at `reports.decision_report.confidence` (integer, 0–100).  
Do NOT read from `reports.report_data.confidence_score` — this field is stripped from the API response before saving and will always be null in the database.

### 4.4 The Supporting Content

| Concept | Official Term | Forbidden Terms |
|---------|--------------|-----------------|
| The financial tables section | **Financial Analysis** | KPIs, Financials, Numbers |
| The market comparison section | **Market Reality Check** | Benchmarks, Comparison |
| The three ROI projections | **Scenarios** | Cases, Projections |
| The recommended next steps | **Recommendations** | Actions, Quick Wins, Optimizations |
| The data underpinning the decision | **Evidence** | Data, Inputs, Sources |

---

## 5. OFFICIAL BRANDING RULES

### 5.1 Permitted Customer-Facing Usage

| Term | Permitted Contexts |
|------|--------------------|
| "EUNOIA" (uppercase brand mark) | Sidebar brand mark, page topbars, export headers |
| "Decision Intelligence Platform" | Sidebar sub-text, page subtitles, login page |
| "Assessments" | Sidebar navigation label, section headers |
| "Decision Report" | Report page headers, history cards, export filenames |
| "Executive Report" | Premium output header only |
| "Decision Confidence" | Confidence displays, stat cards |
| "My Reports" | Sidebar navigation label, section labels |
| "New Assessment" | All primary action CTA buttons |
| Product type proper nouns | Report type selection cards, form headers (see Section 4.0) |

### 5.2 Forbidden in All Customer-Facing Surfaces

The following terms are **permanently forbidden** in any text visible to a pilot client. Permitted only in: source code variable names, internal developer documentation, `.env` files, admin-only interfaces.

| Forbidden Term | Reason |
|----------------|--------|
| `EUNOIA ZONES` | Sub-brand discontinued at v1.0 freeze |
| `EUNOIA INTELLIGENCE` | Sub-brand discontinued at v1.0 freeze |
| `Research & Intelligence Platform` | Wrong product descriptor |
| `AI Research Platform` | Wrong product descriptor |
| `AI Research & Intelligence Platform` | Wrong product descriptor |
| `Real Estate Intelligence Engine` | Internal component name — not a customer label |
| `Feasibility Decision Engine` | Internal component name — not a customer label |
| `OpenAI` | Infrastructure vendor — never customer-facing |
| `OpenAI API key` | Infrastructure configuration — never customer-facing |
| `AI Engine` | Infrastructure language — never customer-facing |
| `environment variables` | Infrastructure language — never customer-facing |
| `API key` | Infrastructure language — never customer-facing |
| `Copy JSON` | Developer action — never customer-facing |
| `Show Full JSON Data` | Developer artifact — never customer-facing |
| `User ID` (as a displayed label) | Internal identifier — no customer value |
| `Avg Accuracy` | Incorrect concept — replace with Avg Confidence |
| `Report Accuracy` | Incorrect concept — replace with Decision Confidence |
| `دقة التقرير` | Incorrect concept — replace with ثقة القرار |
| `متوسط الدقة` | Incorrect concept — replace with متوسط الثقة |
| `New Report` (as a CTA) | Incorrect action label — replace with New Assessment |
| `تقرير جديد` (as a CTA) | Incorrect action label — replace with تقييم جديد |

### 5.3 Arabic Terminology Freeze

For all Arabic-language labels visible to pilot clients:

| Concept | Official Arabic | Forbidden Arabic |
|---------|----------------|-----------------|
| Navigation: Assessments | تقييمات | عقارات / تقارير / أبحاث |
| Navigation: My Reports | تقاريري | التقارير / سجل التقارير |
| Navigation: Dashboard | لوحة التحكم | — |
| Navigation: Settings | الإعدادات | — |
| New Assessment CTA | تقييم جديد | تقرير جديد |
| Decision Report | تقرير القرار | — |
| Decision Confidence | ثقة القرار | دقة التقرير |
| Avg Confidence | متوسط الثقة | متوسط الدقة |
| High Confidence badge | ثقة عالية | دقة عالية |
| Good Confidence badge | ثقة جيدة | دقة جيدة |
| Limited Evidence badge | أدلة محدودة | بيانات محدودة |
| My Reports section | تقاريري | التقارير |
| Assessment form (generic) | نموذج التقييم | نموذج التقرير |

**Product type names in Arabic are frozen in Section 4.0 and are NOT subject to the generic forbidden terms.**

---

## 6. TOPBAR BRANDING STANDARD

Every page that renders its own topbar must conform to this structure:

```
Brand Tag:   EUNOIA
Page Title:  [Page-specific — see table below]
Brand Sub:   Decision Intelligence Platform
```

| Page | English Title | Arabic Title |
|------|--------------|-------------|
| Assessments (all report types) | Real Estate Assessment Engine | محرك تقييم الجدوى العقارية |
| My Reports | My Reports | تقاريري |

**Rules:**
- Brand tag must always read **"EUNOIA"** — never "EUNOIA ZONES" or "EUNOIA INTELLIGENCE"
- Brand sub must always read **"Decision Intelligence Platform"** — never a variant
- Page title must not include the words "Intelligence Engine," "AI Engine," or "Powered by"

---

## 7. EXPORT AND FILE NAMING STANDARD

### File Header (all exports)

```
Eunoia Decision Intelligence Platform
```

### CSV Export Filenames

| Report Type | Filename Pattern |
|-------------|-----------------|
| Feasibility Study | `feasibility-[project-name]-[YYYY-MM-DD].csv` |
| Campaign ROI Audit | `campaign-roi-[company-name]-[YYYY-MM-DD].csv` |
| Market Entry Intel | `market-entry-[city]-[YYYY-MM-DD].csv` |
| Lead Generation Intel | `lead-gen-[company-name]-[YYYY-MM-DD].csv` |
| Full Marketing Analysis | `full-analysis-[company-name]-[YYYY-MM-DD].csv` |

### PDF Export Filenames

```
decision-report-[project-name]-[YYYY-MM-DD].pdf
```

**Rules:**
- Never include "zones," "intelligence-engine," "ai," or any sub-brand in filenames
- Filenames use lowercase kebab-case
- Project/company name may be slugified (spaces to hyphens, no special characters)

---

## 8. WHAT THIS DOCUMENT DOES NOT CHANGE

This freeze applies exclusively to customer-facing copy and labels. The following are explicitly outside scope:

| Element | Status |
|---------|--------|
| Source code variable names (e.g., `report_type`, `confidence_score`) | Unchanged — internal |
| Database column names | Unchanged — infrastructure |
| API request/response field names | Unchanged — infrastructure |
| Internal admin console labels | Unchanged — admin-only |
| Engineering documentation | Unchanged — internal |
| The Decision Engine logic, rules, or outputs | Frozen separately under BASELINE_v1.0.md |
| The five product type names on report selection cards | Governed by Section 4.0 — not subject to generic forbidden terms |

---

## 9. AMENDMENT PROCESS

This document may only be amended:

1. After the 20-submission pilot is complete, OR
2. For an executive-approved pre-pilot governance change (must follow Section 13 Vocabulary Governance workflow)

Any amendment must:
- Increment the version number (v1.1 → v1.2)
- Generate a companion `_APPROVAL.md` document
- Be committed before any UI file is modified

No individual engineer, consultant, or analyst may modify customer-facing terminology during the pilot without an amendment to this document.

---

## 10. PRE-SPRINT VERIFICATION CHECKLIST

Before any UI file is modified, confirm all items:

- [ ] This document (v1.1) has been read in full by the implementing engineer
- [ ] The implementing engineer can state the Official Product Descriptor from memory: "Decision Intelligence Platform for Egypt Real Estate"
- [ ] The implementing engineer knows that "EUNOIA ZONES" is forbidden and the replacement is "EUNOIA"
- [ ] The implementing engineer knows that "Avg Accuracy" is forbidden and the replacement is "Avg Confidence"
- [ ] The implementing engineer knows that "AI Engine" / "OpenAI" are forbidden in all customer-facing text
- [ ] The implementing engineer knows that "Copy JSON" and "Show Full JSON Data" must be removed
- [ ] The implementing engineer knows the Decision Confidence field path: `reports.decision_report.confidence`
- [ ] The implementing engineer knows the navigation label under executive review (Section 11) and has received approval before implementing
- [ ] This document is committed to the repository before any Task A–E changes are committed
- [ ] The implementing engineer has read Section 4.0 and understands the distinction between product type proper nouns and forbidden generic terms

---

## 11. NAVIGATION LABEL ANALYSIS
### Mandatory Revision 1 — Executive Review Required

**Question:** Does "Feasibility Assessment" correctly represent all current assessment types available on the `/dashboard/real-estate` page?

**The five assessment types on that page:**
1. Feasibility Study — project viability analysis
2. Campaign ROI Audit — marketing spend performance
3. Market Entry Intel — new market entry evaluation
4. Lead Generation Intel — lead pipeline quality
5. Full Marketing Analysis — comprehensive SWOT + strategy

**Finding:** "Feasibility Assessment" correctly describes type 1 only. A client who navigates to "Feasibility Assessment" in the sidebar and finds a page offering Campaign ROI Audit, Market Entry Intel, and Full Marketing Analysis encounters an immediate label-content mismatch. If a pilot client submits a Campaign ROI report, it will appear under "Feasibility Assessment" in their navigation — creating permanent labeling confusion.

---

### Comparison

#### Current Label: "Feasibility Assessment"

| Dimension | Assessment |
|-----------|-----------|
| Coverage | 1 of 5 report types |
| Pilot accuracy | Correct for the primary pilot use case (feasibility) |
| Page-content match | ❌ Mismatch — page shows all 5 types |
| Scalability | ❌ Cannot accommodate future report types |
| CTA consistency | ❌ "New Assessment" CTA does not match "Feasibility Assessment" nav label |
| Arabic equivalent | تقييم الجدوى |

#### Candidate A: "Assessments"

| Dimension | Assessment |
|-----------|-----------|
| Coverage | All 5 current report types |
| Pilot accuracy | ✅ Pilot submits feasibility — still an assessment |
| Page-content match | ✅ Page shows multiple assessment types |
| Scalability | ✅ Accommodates any future report type |
| CTA consistency | ✅ "New Assessment" CTA → "Assessments" nav — perfect pair |
| Arabic equivalent | تقييمات |
| Sidebar fit | Single word — parallel to "Dashboard," "Settings" |

#### Candidate B: "Real Estate Analysis"

| Dimension | Assessment |
|-----------|-----------|
| Coverage | All 5 report types (all are real estate analysis) |
| Pilot accuracy | ✅ All current types are Egypt real estate |
| Page-content match | ✅ Accurate |
| Scalability | ❌ Locked to real estate domain |
| CTA consistency | ❌ "New Assessment" CTA conflicts with "Analysis" nav label |
| Forbidden term risk | ⚠️ "Analysis" is a forbidden generic term (Section 5.2) in non-product-name contexts |
| Arabic equivalent | تحليل عقاري |

---

### Executive Recommendation

**Recommended label: "Assessments" (تقييمات)**

**Justification:**

1. **Internal consistency.** The CTA ("New Assessment") and the navigation section ("Assessments") form a coherent semantic pair. The client clicks "New Assessment," submits their project, and finds it in "Assessments." This is clean information architecture.

2. **Full coverage.** All five report types are assessments. The label does not over-promise or under-represent.

3. **Scalability.** Phase 2 may introduce additional report types. "Assessments" accommodates all of them without another nav label revision.

4. **Sidebar appropriateness.** Single-word noun labels are the correct convention for sidebar navigation items ("Dashboard," "Settings," "Assessments," "My Reports").

5. **Forbidden term avoidance.** "Candidate B: Real Estate Analysis" uses "Analysis" which is restricted to product type proper nouns — using it as a nav section label would violate Section 4.1.

---

### EXECUTIVE DECISION REQUIRED

```
[ ] APPROVE: Change navigation label to "Assessments" / تقييمات
             Authorized for Task A implementation.

[ ] REJECT: Retain "Feasibility Assessment" / تقييم الجدوى for Pilot v1.0.
            Task A implements "Feasibility Assessment" instead.
            Reassess at Phase 2.
```

**Decision recorded by:** ______________________  
**Date:** ______________________

Until this checkbox is completed, Task A must not be implemented.

---

## 12. PRODUCT ARCHITECTURE MAP
### Mandatory Revision 2 — Official Customer Experience Hierarchy

This map is the official product hierarchy. Every future UI decision that adds, removes, or repositions a screen, section, or element must conform to this hierarchy. Any element not represented here is not part of the Pilot v1.0 customer experience.

```
EUNOIA
Decision Intelligence Platform for Egypt Real Estate
│
├── DASHBOARD  /dashboard
│   ├── Greeting + date
│   ├── Stat Cards
│   │   ├── Total Assessments
│   │   ├── This Month
│   │   ├── Plan Usage
│   │   └── Last Assessment
│   ├── Recent Assessments list (last 5)
│   │   └── Each row: project name · type · date → links to My Reports
│   └── New Assessment [PRIMARY CTA]
│       └── → Assessments (/dashboard/real-estate)
│
├── ASSESSMENTS  /dashboard/real-estate
│   ├── Report Type Selector
│   │   ├── 📐 Feasibility Study          [PILOT PRIMARY]
│   │   ├── 📊 Campaign ROI Audit
│   │   ├── 🗺️  Market Entry Intel
│   │   ├── 🎯 Lead Generation Intel
│   │   └── 🏆 Full Marketing Analysis
│   ├── Assessment Form (per selected type)
│   │   ├── Field groups per report type
│   │   └── Generate Decision Report [FORM SUBMIT CTA]
│   └── Decision Report (inline — same page)
│       ├── Report Header
│       │   ├── Project name + city
│       │   ├── Decision Confidence %
│       │   └── Confidence reason
│       ├── Decision  ← FIRST CONTENT BLOCK
│       │   ├── Proceed / Revise
│       │   └── Decision reason
│       ├── Executive Summary
│       ├── Financial Analysis
│       │   ├── Financial KPIs
│       │   ├── Cost Breakdown
│       │   └── Three Scenarios
│       ├── Market Reality Check
│       ├── Risk Scorecard
│       ├── Sensitivity Analysis
│       ├── Recommendations (Immediate Actions)
│       ├── SWOT Analysis
│       ├── 90-Day Strategy
│       ├── Executive Report (when available)
│       └── Export Actions
│           ├── New Assessment [BACK CTA]
│           ├── Excel / CSV
│           └── Print / PDF
│
├── MY REPORTS  /dashboard/reports
│   ├── Summary Stats
│   │   ├── Total Assessments
│   │   ├── This Month
│   │   └── Avg Confidence          ← reads from decision_report.confidence
│   ├── Search bar
│   ├── Filter bar
│   │   ├── All
│   │   ├── Feasibility (جدوى)
│   │   ├── Campaign ROI (حملات)
│   │   ├── Market Entry (سوق)
│   │   ├── Lead Gen (عملاء)
│   │   └── Full Analysis (شامل)
│   └── Assessment Cards (per report)
│       ├── Report type icon + name
│       ├── Project / company name
│       ├── Decision verdict (Proceed / Revise)
│       ├── Decision Confidence %
│       ├── Date
│       └── Expanded view
│           ├── Key Metrics (4 max, per type)
│           ├── Executive Summary excerpt
│           ├── Excel / CSV export
│           └── Print / PDF export
│
├── SETTINGS  /dashboard/settings
│   ├── Account
│   │   └── Email address
│   ├── Plan
│   │   ├── Current plan name
│   │   ├── Monthly usage (used / limit)
│   │   ├── Usage progress bar
│   │   └── Upgrade contact (hello@eunoia.eg)
│   └── Account Actions
│       ├── Export data
│       └── Delete account
│
└── ADMIN CONSOLE  /dashboard/admin  [admin-only]
    ├── Pilot Submissions list
    ├── Submission Review
    │   ├── Consultant review form
    │   └── Outcome recording
    └── Learning Log
        └── CVR entries
```

**Elements absent from this map are NOT part of the Pilot v1.0 customer experience:**

| Element | Status |
|---------|--------|
| Research Intelligence hub | Hidden — route preserved |
| Market Intelligence / Analytics | Hidden — route preserved |
| Lead Finder | Hidden — route preserved |
| Talent Finder | Hidden — route preserved |
| "Copy JSON" action | Removed |
| "Show Full JSON Data" toggle | Removed |
| User ID field | Removed |
| AI Engine section | Removed |
| Platform Modules tile grid | Removed |

---

## 13. VOCABULARY GOVERNANCE
### Mandatory Revision 3 — Terminology Approval Workflow

### 13.1 Governing Principle

No engineer, designer, consultant, or product owner may introduce new customer-facing terminology into any product surface — including labels, CTA text, section headers, stat card names, badge text, export headers, filename patterns, or error messages — without prior written approval under this section.

"New customer-facing terminology" means any word or phrase that:
- Appears in a rendered UI element visible to a client
- Is not already listed in Sections 1–7 of this document
- Describes a product concept, an action, an output, a quality signal, or a navigation destination

### 13.2 What Requires Approval

| Change Type | Requires Approval? |
|------------|-------------------|
| Using a frozen term from this document | No — implement directly |
| Modifying the case or punctuation of a frozen term | No — minor formatting |
| Renaming a frozen term | Yes — full approval required |
| Adding a new UI section with a new label | Yes |
| Adding a new CTA button with new label text | Yes |
| Adding a new stat card with a new name | Yes |
| Adding a new badge type | Yes |
| Adding a new export filename pattern | Yes |
| Adding a new error message visible to clients | Yes — error message text must not expose infrastructure |
| Adding a new navigation item | Yes — also requires Product Architecture Map update |
| Changing a product type proper noun (Section 4.0) | Yes — requires pilot evidence first |

### 13.3 Approval Workflow

```
STEP 1 — PROPOSAL
  Proposer (any role) writes a terminology proposal containing:
  ├── Proposed new term (English)
  ├── Proposed new term (Arabic, if customer-facing)
  ├── Context (which screen / element)
  ├── Why existing frozen vocabulary cannot cover this need
  └── Proposed forbidden alternatives (if applicable)

STEP 2 — CONFLICT CHECK
  Proposer checks proposed term against:
  ├── Section 5.2 Forbidden list
  ├── Section 4.0 Product type proper nouns
  ├── Section 4.1–4.4 Official terminology tables
  └── Section 12 Product Architecture Map
  If the need is already met by a frozen term → proposal rejected at this step.

STEP 3 — PILOT DIRECTOR REVIEW
  Pilot Director reviews within 48 hours:
  ├── Does the new term conflict with any existing term?
  ├── Does the new term create confusion with Decision Engine concepts?
  ├── Does the new term expose infrastructure language?
  └── Is the Arabic equivalent accurate and consistent?

STEP 4 — EXECUTIVE APPROVAL
  Chief Product Officer approves or rejects.
  Decision recorded in a Product Identity Amendment document
  (format: PRODUCT_IDENTITY_FREEZE_v[version]_APPROVAL.md).

STEP 5 — DOCUMENT AMENDMENT
  Approved term is added to the appropriate section of this document.
  Document version is incremented.
  Amendment document is committed.
  ONLY THEN may the term be implemented in UI files.
```

### 13.4 Emergency Terminology Handling

If a new customer-facing label must be deployed urgently (security incident, data integrity failure, or pilot-stopping issue), the following abbreviated process applies:

1. Engineering lead proposes label in writing (Slack DM or email to Pilot Director)
2. Pilot Director approves within 2 hours
3. Label is implemented
4. Full amendment document is created within 24 hours of deployment
5. Version is incremented retroactively

Emergency process does NOT apply to feature additions, UX improvements, or marketing copy changes.

### 13.5 Enforcement

Any customer-facing terminology found in a UI file that is not listed in this document and does not have a recorded approval is a governance violation.

Remediation process:
1. Flag the violation in code review
2. Either replace with the nearest frozen term immediately
3. Or submit a terminology proposal (Section 13.3) before merging

No pull request that introduces unapproved customer-facing terminology may be merged during Pilot v1.0.

---

## 14. IMPLEMENTATION TASKS AUTHORIZED BY THIS DOCUMENT

Upon completion of the executive decision in Section 11 (navigation label), all five tasks below are authorized to proceed.

| Task | File | Primary Change | Dependency |
|------|------|---------------|------------|
| A | `components/dashboard/sidebar.tsx` | Navigation freeze + brand tagline | Section 11 decision required first |
| B | `app/dashboard/page.tsx` | Dashboard copy + module grid removal | Task A |
| C | `app/dashboard/reports/reports-client.tsx` | Confidence fix + label corrections + dev tool removal | None |
| D | `app/dashboard/real-estate/page.tsx` | Brand tag + confidence labels + dev tool removal | None |
| E | `app/dashboard/settings/page.tsx` | AI Engine section removal + UUID removal | None |

**Constraints applicable to all tasks:**
- No task may introduce terminology not listed in Sections 1–7 of this document
- No task may modify engine logic, database schema, or API response structure
- No task may add new features, new sections, or new navigation items
- Tasks C, D, and E have no dependency on Section 11 decision and may proceed immediately upon v1.1 approval

---

## AUTHORIZATION

| Role | Signature | Date |
|------|-----------|------|
| Chief Product Officer | [Executive] | 2026-08-04 |
| Engineering Lead | [Engineering] | _______________ |
| Navigation Label Decision (Section 11) | [Executive] | _______________ |

---

## EUNOIA PLATFORM v1.0 — PRODUCT IDENTITY v1.1 IS HEREBY FROZEN.

**One product. One name. One descriptor. One vocabulary. One architecture.**

All customer-facing surfaces must reflect this document.  
All future terminology must pass through Section 13 before implementation.  
Task A requires Section 11 executive decision before implementation.  
Tasks C, D, E may proceed immediately upon v1.1 approval.
