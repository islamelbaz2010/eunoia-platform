# Executive Business Report — Rendering Plan
**Sprint:** Product Engineering Sprint 2  
**Date:** 2026-07-30

---

## Rendering Philosophy

The Executive Business Report is rendered as a **single-page structured document**, not a dashboard. The customer receives a coherent business document — not a collection of widgets. Every section builds on the previous one, producing a narrative arc:

> What did we decide? → How confident are we? → What's the evidence? → What's the business case? → What are the risks? → What are the alternatives? → What do we do next?

---

## Data Flow

```
POST /api/intelligence
  │
  ├── [DI Engine] runDecisionEngine() → UniversalDecisionReport
  │
  ├── [OpenAI]    chat.completions.create() → narration JSON
  │
  └── [Builder]   buildExecutiveReport(reportType, diReport, narration)
                    → ExecutiveBusinessReport
                    → included in API response as `executiveReport`
```

No additional API calls. No additional database reads. The builder is a pure function that takes both outputs and assembles the canonical report.

---

## API Response Structure

```json
{
  "success": true,
  "report": { /* OpenAI narration (existing, unchanged) */ },
  "decisionReport": { /* UniversalDecisionReport from DI Engine (Sprint 1) */ },
  "trustScore": { /* promoted from decisionReport.trustScore (Sprint 1) */ },
  "executiveReport": { /* NEW: ExecutiveBusinessReport (Sprint 2) */ }
}
```

`executiveReport` is the primary client-facing deliverable. `report` (narration) and `decisionReport` remain available for clients that need raw data.

---

## Section Rendering Order

The 12 sections render top-to-bottom in the order specified by the schema:

| # | Section | Display Priority | Length |
|---|---|---|---|
| 1 | Executive Summary | Critical — always visible | 3–5 lines |
| 2 | Final Recommendation | Critical — always visible | 2–3 lines + badge |
| 3 | Trust Score | High | Score gauge + band + interpretation |
| 4 | Decision Confidence | High | Overall % + dimension breakdown |
| 5 | Evidence | Medium | Count + source types + key items |
| 6 | Business Analysis | High | Summary + SWOT or performance data |
| 7 | Risk Analysis | High | Risk level + flags table |
| 8 | Alternative Options | Medium | Options table with scores |
| 9 | Recommended Actions | Critical | Prioritized action list |
| 10 | Expected Business Impact | High | Impact metrics |
| 11 | Implementation Roadmap | Medium | Phase timeline |
| 12 | Appendix | Low — collapsed by default | Report IDs, metadata |

---

## Visual Rendering Specification

### Section 1: Executive Summary
```
┌─────────────────────────────────────────────────────────────────┐
│ EXECUTIVE SUMMARY                                               │
├─────────────────────────────────────────────────────────────────┤
│ Headline: [bold, large text]                                    │
│ Summary: [body text, 2–3 sentences]                             │
│                                                                 │
│ Decision Status: [VALIDATED badge] [Domain chip]                │
│ Generated: [timestamp]                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Section 2: Final Recommendation
```
┌─────────────────────────────────────────────────────────────────┐
│ FINAL RECOMMENDATION                                            │
├─────────────────────────────────────────────────────────────────┤
│ ● [Option Label]  [RECOMMENDED badge]                           │
│ Rationale: [rationale text]                                     │
│ Confidence: [score]%  Band: [HIGH badge]                        │
│ Basis: [Rule-determined ✓ / AI-assisted]                        │
└─────────────────────────────────────────────────────────────────┘
```

### Section 3: Trust Score
```
┌─────────────────────────────────────────────────────────────────┐
│ TRUST SCORE                          [72]                       │
├──────────────────────────────────────────────────────────────── │
│  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████] HIGH                  │
│  0          25          50          75          100             │
│                                                                 │
│ "This decision is well-supported..."                            │
└─────────────────────────────────────────────────────────────────┘
```

### Section 4: Decision Confidence
```
┌─────────────────────────────────────────────────────────────────┐
│ DECISION CONFIDENCE         Overall: 72%  [HIGH]               │
├─────────────────────────────────────────────────────────────────┤
│ evidence volume     ████████████░░░░░░░░  61%                   │
│ evidence quality    ████████████████░░░░  78%                   │
│ evidence freshness  ████████████████████  100%                  │
│ evidence consistency████████████████████  100%                  │
│ rule compliance     ████████████████████  100%                  │
│                                                                 │
│ Weakest: evidence volume  ·  Strongest: evidence freshness      │
└─────────────────────────────────────────────────────────────────┘
```

### Section 5: Evidence
```
┌─────────────────────────────────────────────────────────────────┐
│ EVIDENCE                    2 items  ·  Avg freshness: 100%    │
├─────────────────────────────────────────────────────────────────┤
│ USER INPUT     Client-submitted analysis parameters             │
│ INTERNAL DATA  Egypt Real Estate Market Benchmarks 2026         │
│                                                                 │
│ [Freshness: 100%]  [Avg Confidence: 82.5%]  [No contradictions] │
└─────────────────────────────────────────────────────────────────┘
```

### Section 6: Business Analysis
```
┌─────────────────────────────────────────────────────────────────┐
│ BUSINESS ANALYSIS                                               │
├─────────────────────────────────────────────────────────────────┤
│ [AI Executive Summary text]                                     │
│                                                                 │
│ SWOT ANALYSIS (if applicable)                                   │
│ ┌───────────────────┬───────────────────┐                      │
│ │ Strengths         │ Weaknesses        │                      │
│ │ • ...             │ • ...             │                      │
│ ├───────────────────┼───────────────────┤                      │
│ │ Opportunities     │ Threats           │                      │
│ │ • ...             │ • ...             │                      │
│ └───────────────────┴───────────────────┘                      │
│                                                                 │
│ Market Overview / Performance Data (if applicable)              │
└─────────────────────────────────────────────────────────────────┘
```

### Section 7: Risk Analysis
```
┌─────────────────────────────────────────────────────────────────┐
│ RISK ANALYSIS               Overall Risk: [LOW badge]           │
├─────────────────────────────────────────────────────────────────┤
│ Validation Status: PASSED                                       │
│                                                                 │
│ ⚠ [MEDIUM] Low overall confidence                              │
│   [description]                                                 │
│   Mitigation: [advice]                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Section 8: Alternative Options
```
┌─────────────────────────────────────────────────────────────────┐
│ ALTERNATIVE OPTIONS                                             │
├──────────────────────┬───────────┬──────────┬───────────────── │
│ Option               │ Score     │ Status   │ Notes            │
├──────────────────────┼───────────┼──────────┼───────────────── │
│ ★ Enter market now   │ 100/100   │ RECOMMENDED │             │
│   Enter phased       │ 100/100   │ Available │              │
│   Hold market entry  │ 100/100   │ Available │              │
└──────────────────────┴───────────┴──────────┴───────────────── │
```

### Section 9: Recommended Actions
```
┌─────────────────────────────────────────────────────────────────┐
│ RECOMMENDED ACTIONS                                             │
├─────────────────────────────────────────────────────────────────┤
│ #1  [Action text]                                               │
│     Timeline: [timeline]    Impact: [impact]                    │
│                                                                 │
│ #2  [Action text]                                               │
│     Timeline: [timeline]    Impact: [impact]                    │
└─────────────────────────────────────────────────────────────────┘
```

### Section 10: Expected Business Impact
```
┌─────────────────────────────────────────────────────────────────┐
│ EXPECTED BUSINESS IMPACT                                        │
├─────────────────────────────────────────────────────────────────┤
│ [Impact summary text]                                           │
│                                                                 │
│ ┌────────────────┬──────────────┬──────────────────┐           │
│ │ Metric         │ Value        │ Timeframe        │           │
│ ├────────────────┼──────────────┼──────────────────┤           │
│ │ Target CPL     │ EGP 495      │ 30 days          │           │
│ │ Proj. Leads    │ 101/month    │ Month 1          │           │
│ └────────────────┴──────────────┴──────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Section 11: Implementation Roadmap
```
┌─────────────────────────────────────────────────────────────────┐
│ IMPLEMENTATION ROADMAP                                          │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 1 ─── التأسيس الرقمي ────────────────────────────────── │
│ ● Action 1                                                      │
│ ● Action 2                                                      │
│ KPI: [measurable target]         Budget: EGP XX,XXX            │
│                                                                 │
│ PHASE 2 ─── اختبار السوق ──────────────────────────────────── │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Section 12: Appendix (collapsed by default)
```
┌─────────────────────────────────────────────────────────────────┐
│ APPENDIX  [▼ expand]                                            │
├─────────────────────────────────────────────────────────────────┤
│ Report ID: r-xxx       Decision ID: dec-xxx                     │
│ Domain: market_intelligence                                     │
│ Engine: decision-engine-v1  Schema: 1.0.0                       │
│ Rules Evaluated: 0     Validation Stages: 0                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rendering Priority (Progressive Enhancement)

**Tier 1 — Minimum Viable Report** (Sections 1, 2, 3, 9):
- Executive Summary
- Final Recommendation
- Trust Score
- Recommended Actions

If these 4 sections are present, the report is usable. All other sections enhance but are not required.

**Tier 2 — Full Report** (All 12 sections):
- All sections present and populated

**Tier 3 — Enhanced Report** (Future — Sprint 5):
- PDF export
- Shareable link
- Historical comparison

---

## Rendering Environment

The initial rendering target is the existing Next.js app at `/dashboard/`. The `executiveReport` JSON from the API is passed to a React component tree that maps each section to a corresponding card/section component.

No new routing. No new pages in Sprint 2. The report renders within the existing market intelligence dashboard view.

---

## Language Handling

- Section 1–4, 7–8, 12: English (from DI Engine — always English)
- Section 5: English source labels (always English)
- Section 6, 9, 10, 11: Arabic (from OpenAI narration — rendered as-is, RTL where applicable)

The frontend must handle mixed LTR/RTL text. Arabic sections render with `dir="rtl"`.
