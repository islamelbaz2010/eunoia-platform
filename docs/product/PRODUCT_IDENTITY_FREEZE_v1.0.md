# Product Identity Freeze — Version 1.0
**Classification:** Product Authority Document — Customer-Facing Terminology  
**Date:** 2026-08-04  
**Authority:** Chief Product Officer / Executive Commercial Validation Director  
**Status: FROZEN — ACTIVE FOR PILOT v1.0**

---

## AUTHORITY STATEMENT

This document is the single authoritative source for all customer-facing product terminology in Eunoia Platform Version 1.0.

Every UI file, every label, every CTA, every navigation item, every export header, and every in-product copy must conform to this document before the first pilot client is onboarded.

Any team member who encounters a label, name, or descriptor not listed in this document must default to the frozen terms below — no exceptions without a written amendment to this document.

This document supersedes all prior naming conventions, sub-brand names, and working titles used during development.

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

- "Decision Intelligence Platform" (preferred short form)
- "Eunoia Decision Intelligence" (second acceptable short form)

It may **never** be shortened to:

- "Intelligence Platform" (generic — not distinctive)
- "Research Platform" (wrong category)
- "AI Platform" (generic — not distinctive)

---

## 3. OFFICIAL NAVIGATION TERMS

These are the only labels permitted in the sidebar and any navigation element visible to pilot clients.

| Position | Label | Route | Icon |
|----------|-------|-------|------|
| 1 | Dashboard | `/dashboard` | BarChart3 |
| 2 | Feasibility Assessment | `/dashboard/real-estate` | Building2 |
| 3 | My Reports | `/dashboard/reports` | FileText |
| 4 | Settings | `/dashboard/settings` | Settings |
| Admin-only | Admin Console | `/dashboard/admin` | ShieldCheck |

### Navigation Rules

**Never use:**
- "Real Estate" as a navigation label
- "Reports" (without "My")
- "Research Intelligence" as a pilot navigation item
- "Market Intelligence" as a pilot navigation item
- "Analytics" as a pilot navigation item
- "Modules" in any navigation context

**Hidden during Pilot v1.0 (routes preserved, links removed):**
- Research Intelligence (`/dashboard/research`)
- Market Intelligence / Analytics (`/dashboard/analytics`)
- Lead Finder (`/dashboard/research/leads`)
- Talent Finder (`/dashboard/research/talent`)

---

## 4. OFFICIAL REPORT TERMINOLOGY

Every label that describes the client's work product must use these terms exactly.

### 4.1 The Submission

| Concept | Official Term | Forbidden Terms |
|---------|--------------|-----------------|
| The act of submitting a project | **Assessment** | Report, Analysis, Study, Request, Submission |
| The form the client fills in | **Assessment Form** | Report Form, Input Form, Questionnaire |
| The primary action button | **New Assessment** | New Report, Generate Report, Create Report |
| The button returning to the form | **New Assessment** | New Report, Back to Form |
| The client's history | **My Reports** | Report History, Reports, My Analyses |

### 4.2 The Output

| Concept | Official Term | Forbidden Terms |
|---------|--------------|-----------------|
| The structured output rendered on-screen | **Decision Report** | Report, Analysis, Result, Output |
| The premium formatted PDF-grade output | **Executive Report** | Full Report, Signature Report, Premium Report |
| The recommendation from the Decision Engine | **Decision** | Verdict, Result, Answer |
| The recommendation value (proceed) | **Proceed** | مجدي / Feasible (may be used in Arabic, but "Proceed" is the engine output label) |
| The recommendation value (revise) | **Revise** | غير مجدي / Not Feasible (may be used in Arabic, but "Revise" is the engine output label) |

### 4.3 The Quality Signal

| Concept | Official Term | Forbidden Terms |
|---------|--------------|-----------------|
| The engine's certainty score | **Decision Confidence** | Accuracy, Avg Accuracy, دقة التقرير, Report Accuracy |
| The confidence percentage | **Confidence** | Accuracy %, Score % |
| The confidence badge (high) | **High Confidence** | High Accuracy, دقة عالية |
| The confidence badge (medium) | **Good Confidence** | Good Accuracy, دقة جيدة |
| The confidence badge (low) | **Limited Evidence** | Limited Data, Limited Accuracy, بيانات محدودة |
| The average confidence on Reports page | **Avg Confidence** | Avg Accuracy, متوسط الدقة |
| The trust quality signal | **Trust Score** | Trust Score is already correct — do not change |

**Critical distinction:**

> Decision Confidence is NOT historical accuracy. It is the engine's certainty in the current decision, based on available evidence. Never describe it as a percentage of past correct decisions.

### 4.4 The Supporting Content

| Concept | Official Term | Forbidden Terms |
|---------|--------------|-----------------|
| The financial table section | **Financial Analysis** | KPIs, Financials, Numbers |
| The market comparison section | **Market Reality Check** | Benchmarks, Comparison |
| The three ROI projections | **Scenarios** | Cases, Projections |
| The recommended next steps | **Recommendations** | Actions, Quick Wins, Optimizations |
| The data underpinning the decision | **Evidence** | Data, Inputs, Sources |

---

## 5. OFFICIAL BRANDING RULES

### 5.1 Permitted Customer-Facing Usage

| What | Where |
|------|-------|
| "EUNOIA" (uppercase, brand mark) | Sidebar, page topbars, export headers |
| "Decision Intelligence Platform" | Sidebar sub-text, page subtitles, login page |
| "Feasibility Assessment" | Navigation, form headers, CTA buttons |
| "Decision Report" | Report page headers, history cards, export filenames |
| "Executive Report" | Premium output header only |
| "Decision Confidence" | Confidence displays, stat cards |
| "My Reports" | Navigation, section labels |
| "New Assessment" | All primary action buttons |

### 5.2 Forbidden in All Customer-Facing Surfaces

The following terms are **permanently forbidden** in any text visible to a pilot client. They may appear only in:
- Source code variable names (not labels)
- Internal developer documentation
- `.env` files and server configuration
- Admin-only interfaces

| Forbidden Term | Reason |
|----------------|--------|
| `EUNOIA ZONES` | Sub-brand discontinued at v1.0 freeze |
| `EUNOIA INTELLIGENCE` | Sub-brand discontinued at v1.0 freeze |
| `Research & Intelligence Platform` | Wrong product descriptor |
| `AI Research Platform` | Wrong product descriptor |
| `AI Research & Intelligence Platform` | Wrong product descriptor |
| `Real Estate Intelligence Engine` | Internal component name — not a customer label |
| `OpenAI` | Infrastructure vendor — never customer-facing |
| `OpenAI API key` | Infrastructure configuration — never customer-facing |
| `AI Engine` | Infrastructure language — never customer-facing |
| `environment variables` | Infrastructure language — never customer-facing |
| `API key` | Infrastructure language — never customer-facing |
| `Copy JSON` | Developer action — never customer-facing |
| `Show Full JSON Data` | Developer action — never customer-facing |
| `User ID` (as a displayed field) | Internal identifier — never customer-facing |
| `Avg Accuracy` | Incorrect concept — replace with Avg Confidence |
| `Report Accuracy` | Incorrect concept — replace with Decision Confidence |
| `دقة التقرير` | Incorrect concept — replace with ثقة القرار |
| `متوسط الدقة` | Incorrect concept — replace with متوسط الثقة |
| `New Report` (as a CTA) | Incorrect action label — replace with New Assessment |

### 5.3 Arabic Terminology Freeze

For all Arabic-language labels visible to pilot clients:

| Concept | Official Arabic | Forbidden Arabic |
|---------|----------------|-----------------|
| New Assessment CTA | تقييم جديد | تقرير جديد |
| Decision Report | تقرير القرار | — |
| Decision Confidence | ثقة القرار | دقة التقرير |
| Avg Confidence | متوسط الثقة | متوسط الدقة |
| High Confidence badge | ثقة عالية | دقة عالية |
| Good Confidence badge | ثقة جيدة | دقة جيدة |
| Feasibility Assessment | دراسة الجدوى | — (existing form label is correct) |
| My Reports | تقاريري | التقارير |

---

## 6. TOPBAR BRANDING STANDARD

Every page that renders its own topbar (Real Estate, Reports) must conform to this structure:

```
Brand Tag:   EUNOIA
Page Title:  [Page-specific — see below]
Brand Sub:   Decision Intelligence Platform
```

| Page | Page Title |
|------|-----------|
| Real Estate / Feasibility Assessment | محرك قرار الجدوى العقارية / Feasibility Decision Engine |
| Reports / My Reports | سجل التقييمات / My Reports |

The brand tag must always read **"EUNOIA"** — never "EUNOIA ZONES" or "EUNOIA INTELLIGENCE."

---

## 7. EXPORT AND FILE NAMING STANDARD

Every file generated for a client (CSV, PDF) must use this header:

```
Eunoia Decision Intelligence Platform
```

Export filenames must follow:

```
feasibility-[project-name]-[YYYY-MM-DD].csv
decision-report-[project-name]-[YYYY-MM-DD].pdf
```

Never include "zones," "intelligence-engine," or any sub-brand in filenames or export headers.

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

Renaming a source code variable to match the product terminology is welcome but is NOT required by this document and is NOT part of the pilot UI sprint.

---

## 9. AMENDMENT PROCESS

This document may only be amended:

1. After the 20-submission pilot is complete
2. With written approval from the Pilot Director
3. As part of a documented Phase 2 product review

No individual engineer, consultant, or analyst may modify customer-facing terminology during the pilot without an amendment to this document.

---

## 10. PRE-SPRINT VERIFICATION CHECKLIST

Before any UI file is modified, confirm the following:

- [ ] This document has been read by the implementing engineer
- [ ] The implementing engineer can name the Official Product Descriptor without looking
- [ ] The implementing engineer knows the five forbidden terms that replace internal sub-brands
- [ ] The implementing engineer knows the correct field path for Decision Confidence in My Reports
- [ ] This document is committed to the repository before any Task A–E changes are committed

---

## IMPLEMENTATION TASKS AUTHORIZED BY THIS DOCUMENT

Upon approval of this document, the following tasks are authorized to proceed in order:

| Task | File | Primary Change |
|------|------|---------------|
| A | `components/dashboard/sidebar.tsx` | Navigation freeze + brand tagline |
| B | `app/dashboard/page.tsx` | Dashboard copy + module grid removal |
| C | `app/dashboard/reports/reports-client.tsx` | Confidence fix + label corrections + developer tool removal |
| D | `app/dashboard/real-estate/page.tsx` | Brand tag + confidence labels + developer tool removal |
| E | `app/dashboard/settings/page.tsx` | AI Engine section removal + UUID removal |

No task may introduce terminology not listed in this document.  
No task may modify engine logic, database schema, or API response structure.  
No task may add new features, new sections, or new navigation items.

---

## AUTHORIZATION

| Role | Name | Date |
|------|------|------|
| Chief Product Officer | Eunoia Executive Team | 2026-08-04 |
| Engineering Lead | Engineering | _______________ |

---

## EUNOIA PLATFORM v1.0 — PRODUCT IDENTITY IS HEREBY FROZEN.

**One product. One name. One descriptor. One vocabulary.**

All customer-facing surfaces must reflect this document before the first pilot client logs in.
