# Executive Business Report — Component Architecture
**Sprint:** Product Engineering Sprint 2  
**Date:** 2026-07-30

---

## Module Structure

```
lib/executive-report/
├── types.ts          ← ExecutiveBusinessReport type and 12 section interfaces
├── builder.ts        ← buildExecutiveReport() pure function
├── index.ts          ← Public API: export { buildExecutiveReport, ExecutiveBusinessReport }
└── __tests__/
    └── builder.test.ts
```

This module has **zero dependencies** on Next.js, React, Supabase, or any I/O. It is pure TypeScript — a data transformation layer.

---

## Public API

```typescript
// lib/executive-report/index.ts
export { buildExecutiveReport } from './builder'
export type { ExecutiveBusinessReport } from './types'
```

### `buildExecutiveReport(reportType, decisionReport, narration)`

```typescript
function buildExecutiveReport(
  reportType: string,
  decisionReport: UniversalDecisionReport,
  narration: Record<string, unknown>,
): ExecutiveBusinessReport
```

**Guarantees:**
- Never throws — all narration field access is guarded with `?? fallback`
- Returns a complete 12-section `ExecutiveBusinessReport` even when narration is empty
- Pure — no I/O, no randomness, no side effects

---

## Integration Point

The builder is called inside `app/api/intelligence/route.ts`, after both the DI Engine and OpenAI have completed:

```typescript
// app/api/intelligence/route.ts
import { buildExecutiveReport } from '@/lib/executive-report'

// After runDecisionEngine() and OpenAI parse:
let executiveReport: ExecutiveBusinessReport | null = null
try {
  if (decisionReport) {
    executiveReport = buildExecutiveReport(reportType, decisionReport, reportData)
  }
} catch (err) {
  console.error('[intelligence/executive-report]', err)
}

// In the response:
return NextResponse.json({
  success: true,
  report: reportData,
  ...(decisionReport && { decisionReport, trustScore: decisionReport.trustScore }),
  ...(executiveReport && { executiveReport }),
})
```

**Fail-safe**: If `buildExecutiveReport` throws (which it should never do), the existing `report`, `decisionReport`, and `trustScore` still return. `executiveReport` is absent but the response is not broken.

---

## Future: React Component Tree

When Sprint 5 (Customer Journey) begins, the frontend renders the report. The component tree maps to the 12-section schema:

```
<ExecutiveReportPage executiveReport={ExecutiveBusinessReport}>
  ├── <ReportHeader section={executiveSummary} />
  ├── <RecommendationCard section={finalRecommendation} />
  ├── <TrustScoreGauge section={trustScore} />
  ├── <ConfidenceBreakdown section={decisionConfidence} />
  ├── <EvidencePanel section={evidence} />
  ├── <BusinessAnalysisSection section={businessAnalysis} />
  ├── <RiskAnalysisTable section={riskAnalysis} />
  ├── <AlternativeOptionsTable section={alternativeOptions} />
  ├── <RecommendedActionsChecklist section={recommendedActions} />
  ├── <BusinessImpactMetrics section={expectedBusinessImpact} />
  ├── <ImplementationRoadmapTimeline section={implementationRoadmap} />
  └── <ReportAppendix section={appendix} />
</ExecutiveReportPage>
```

**Architecture principle:** Each component takes exactly one section as a prop. No component reaches into the parent or sibling. The schema IS the component API.

---

## Data Contract

The `executiveReport` field in the API response is the sole data contract between backend and frontend. The frontend renders ONLY from `executiveReport` — it does NOT read from `decisionReport` or `report` (narration) for display purposes.

```
Backend              Network              Frontend
─────────────────────────────────────────────────────
executiveReport  ──────────────────►  ExecutiveReportPage
decisionReport   → (available for     (NOT used for rendering)
report           →  debugging only)   (NOT used for rendering)
```

This separation ensures:
1. The report schema is the only contract — changes to DI Engine internals or narration format don't break the UI
2. The builder absorbs all normalization complexity — the frontend stays simple
3. The schema can evolve independently

---

## Section-to-Type Mapping

| Section | TypeScript Interface |
|---|---|
| `executiveSummary` | `ExecReportExecutiveSummary` |
| `finalRecommendation` | `ExecReportFinalRecommendation` |
| `trustScore` | `ExecReportTrustScore` |
| `decisionConfidence` | `ExecReportDecisionConfidence` |
| `evidence` | `ExecReportEvidence` |
| `businessAnalysis` | `ExecReportBusinessAnalysis` |
| `riskAnalysis` | `ExecReportRiskAnalysis` |
| `alternativeOptions` | `ExecReportOption[]` |
| `recommendedActions` | `ExecReportAction[]` |
| `expectedBusinessImpact` | `ExecReportBusinessImpact` |
| `implementationRoadmap` | `ExecReportImplementationRoadmap` |
| `appendix` | `ExecReportAppendix` |

---

## Non-Goals for Sprint 2

The following are explicitly NOT part of this architecture:

- React component implementation (Sprint 5)
- PDF generation (Sprint 5)
- Report storage (was Sprint 2 original, now deferred)
- Report history or versioning (Sprint 5)
- Shareable report links (Sprint 6)
- Email delivery of reports (post-Sprint 6)
- Real-time streaming of report sections (not planned)
