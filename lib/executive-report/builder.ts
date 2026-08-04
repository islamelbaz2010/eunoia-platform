/**
 * Executive Business Report builder — pure function, no I/O.
 *
 * Takes a UniversalDecisionReport (from the DI Engine) and the AI narration
 * (parsed JSON from OpenAI) and assembles a canonical ExecutiveBusinessReport
 * with all 12 sections.
 *
 * All narration field access is guarded — an empty narration ({}) produces
 * a valid report with empty-string / null / [] defaults. This function never
 * throws under normal conditions.
 */

import type { UniversalDecisionReport } from '@/lib/decision-intelligence'
import type {
  ExecutiveBusinessReport,
  ExecReportAction,
  ExecReportBusinessAnalysis,
  ExecReportBusinessImpact,
  ExecReportEvidence,
  ExecReportImplementationRoadmap,
  ExecReportRiskAnalysis,
  ExecReportSWOT,
  ExecReportTrustScore,
} from './types'

// ---------------------------------------------------------------------------
// Trust score interpretation — what each band means in plain language
// ---------------------------------------------------------------------------

const TRUST_INTERPRETATION: Record<string, string> = {
  VERY_HIGH: 'This decision is backed by strong, fresh, and consistent evidence with high rule compliance. High confidence in the recommendation.',
  HIGH:      'This decision is well-supported. Evidence quality and rule compliance are both solid.',
  MEDIUM:    'This decision has adequate support but has some evidence gaps or rule concerns. Review before committing.',
  LOW:       'This decision has limited evidence support. Seek additional validation before acting.',
}

// ---------------------------------------------------------------------------
// Narration field extractor helpers
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function obj(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

// ---------------------------------------------------------------------------
// Section 6: Business Analysis
// ---------------------------------------------------------------------------

function extractBusinessAnalysis(reportType: string, n: Record<string, unknown>): ExecReportBusinessAnalysis {
  const summary = str(n.executive_summary)

  const swotRaw = obj(n.swot)
  const swot: ExecReportSWOT | null = swotRaw ? {
    strengths:    arr<string>(swotRaw.strengths),
    weaknesses:   arr<string>(swotRaw.weaknesses),
    opportunities:arr<string>(swotRaw.opportunities),
    threats:      arr<string>(swotRaw.threats),
  } : null

  let marketOverview: Record<string, unknown> | null = null
  let performanceData: Record<string, unknown> | null = null

  switch (reportType) {
    case 'feasibility':
      performanceData = obj(n.financials)
      break
    case 'campaign_roi':
      performanceData = obj(n.kpi_scorecard)
      break
    case 'market_entry':
      marketOverview  = obj(n.market_overview)
      break
    case 'lead_gen':
      performanceData = obj(n.pipeline_health)
      break
    case 'full_analysis':
      marketOverview  = obj(n.market_overview)
      performanceData = obj(n.campaign_performance)
      break
  }

  return { summary, swot, marketOverview, performanceData }
}

// ---------------------------------------------------------------------------
// Section 7: Risk Analysis
// ---------------------------------------------------------------------------

function extractRiskAnalysis(
  diReport: UniversalDecisionReport,
  n: Record<string, unknown>,
): ExecReportRiskAnalysis {
  const flags = diReport.riskFlags.map(f => ({
    severity:    f.severity,
    category:    f.category,
    title:       f.title,
    description: f.description,
    mitigation:  f.mitigationAdvice,
  }))

  const overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' =
    flags.some(f => f.severity === 'HIGH') ? 'HIGH' :
    flags.some(f => f.severity === 'MEDIUM') ? 'MEDIUM' : 'LOW'

  return {
    overallRisk,
    flags,
    validationStatus: diReport.validation.pipelineStatus,
    riskScorecard: obj(n.risk_scorecard),
  }
}

// ---------------------------------------------------------------------------
// Section 9: Recommended Actions
// ---------------------------------------------------------------------------

type RawAction = Record<string, unknown>

function extractRecommendedActions(reportType: string, n: Record<string, unknown>): ExecReportAction[] {
  if (reportType === 'market_entry') {
    const strategy = obj(n.entry_strategy_90days)
    if (!strategy) return []
    const actions: ExecReportAction[] = []
    let priority = 1
    for (const phase of Object.values(strategy)) {
      const p = obj(phase)
      if (!p) continue
      for (const action of arr<string>(p.actions)) {
        actions.push({ action, timeline: str(p.title), impact: str(p.kpi), priority: priority++ })
        if (actions.length >= 6) break
      }
      if (actions.length >= 6) break
    }
    return actions
  }

  const fieldMap: Record<string, string> = {
    feasibility:   'immediate_actions',
    campaign_roi:  'optimizations',
    lead_gen:      'improvements',
    full_analysis: 'quick_wins',
  }

  const field = fieldMap[reportType]
  if (!field) return []
  const raw = arr<RawAction>(n[field])

  return raw.slice(0, 5).map((a, i) => ({
    action:   str(a.action),
    timeline: str(a.timeline),
    impact:   str(a.impact ?? a.expected_impact ?? a.expected_cpl_reduction),
    priority: typeof a.rank === 'number' ? a.rank : i + 1,
  }))
}

// ---------------------------------------------------------------------------
// Section 10: Expected Business Impact
// ---------------------------------------------------------------------------

function extractBusinessImpact(reportType: string, n: Record<string, unknown>): ExecReportBusinessImpact {
  switch (reportType) {
    case 'feasibility': {
      const f = obj(n.financials) as Record<string, string> | null
      return {
        summary: f ? `Net profit: ${f.net_profit ?? 'N/A'}  ·  ROI: ${f.roi_pct ?? 'N/A'}` : '',
        metrics: f ? [
          { metric: 'Net Profit',  value: f.net_profit  ?? 'N/A', timeframe: 'Project lifetime' },
          { metric: 'Annual ROI',  value: f.roi_pct     ?? 'N/A', timeframe: 'Annual' },
          { metric: 'NPV',         value: str(f.npv_assessment).split('—')[0]?.trim() || 'N/A', timeframe: 'At 20% discount rate' },
        ] : [],
        financialHighlights: f,
      }
    }
    case 'campaign_roi': {
      const p = obj(n.projection_optimized) as Record<string, string> | null
      return {
        summary: p ? `Target CPL: ${p.target_cpl ?? 'N/A'}  ·  ${p.projected_leads_month1 ?? 'N/A'} leads/month projected` : '',
        metrics: p ? [
          { metric: 'Target CPL',       value: p.target_cpl             ?? 'N/A', timeframe: '30 days' },
          { metric: 'Projected Leads',  value: p.projected_leads_month1 ?? 'N/A', timeframe: 'Month 1' },
          { metric: 'Additional Leads', value: p.additional_leads_monthly ?? 'N/A', timeframe: 'Monthly' },
          { metric: 'ROI Improvement',  value: p.roi_improvement        ?? 'N/A', timeframe: 'Monthly' },
        ] : [],
        financialHighlights: null,
      }
    }
    case 'market_entry': {
      const c = obj(n.cpl_intelligence) as Record<string, string> | null
      return {
        summary: c ? `Expected ${c.meta_cpl_expected ?? 'N/A'} Meta CPL  ·  Break-even: ${c.payback_timeline ?? 'N/A'}` : '',
        metrics: c ? [
          { metric: 'Expected Meta CPL',      value: c.meta_cpl_expected        ?? 'N/A', timeframe: 'Monthly' },
          { metric: 'Budget for 100 Leads',   value: c.budget_required_100leads ?? 'N/A', timeframe: 'Monthly' },
          { metric: 'Break-even',             value: c.payback_timeline         ?? 'N/A', timeframe: 'From launch' },
          { metric: 'Test Budget (30 leads)', value: c.recommended_test_budget  ?? 'N/A', timeframe: 'First month' },
        ] : [],
        financialHighlights: null,
      }
    }
    case 'lead_gen': {
      const ph = obj(n.pipeline_health) as Record<string, unknown> | null
      return {
        summary: ph
          ? `${String(ph.estimated_monthly_revenue ?? 'N/A')} monthly revenue from ${String(ph.estimated_monthly_deals ?? 'N/A')} projected deals`
          : '',
        metrics: ph ? [
          { metric: 'Est. Monthly Deals',   value: String(ph.estimated_monthly_deals   ?? 'N/A'), timeframe: 'Monthly' },
          { metric: 'Est. Monthly Revenue', value: String(ph.estimated_monthly_revenue ?? 'N/A'), timeframe: 'Monthly' },
          { metric: 'LTV/CAC Ratio',        value: String(ph.ltv_cac_ratio            ?? 'N/A'), timeframe: 'Lifetime' },
        ] : [],
        financialHighlights: null,
      }
    }
    case 'full_analysis': {
      const score = n.marketing_score
      return {
        summary: typeof score === 'number' ? `Marketing performance score: ${score}/100` : '',
        metrics: typeof score === 'number'
          ? [{ metric: 'Marketing Score', value: `${score}/100`, timeframe: 'Current' }]
          : [],
        financialHighlights: null,
      }
    }
    default:
      return { summary: '', metrics: [], financialHighlights: null }
  }
}

// ---------------------------------------------------------------------------
// Section 11: Implementation Roadmap
// ---------------------------------------------------------------------------

function extractImplementationRoadmap(reportType: string, n: Record<string, unknown>): ExecReportImplementationRoadmap {
  type PhaseRaw = Record<string, unknown>

  if (reportType === 'market_entry' || reportType === 'full_analysis') {
    const key = reportType === 'market_entry' ? 'entry_strategy_90days' : 'strategy_90days'
    const strategy = obj(n[key])
    if (!strategy) return { phases: [] }

    return {
      phases: Object.entries(strategy).map(([, phase], i) => {
        const p = obj(phase) as PhaseRaw | null ?? {}
        return {
          phase:   `Phase ${i + 1}`,
          title:   str(p.title ?? p.focus),
          actions: arr<string>(p.actions),
          kpi:     str(p.kpi),
          budget:  typeof p.budget === 'string' ? p.budget : null,
        }
      }),
    }
  }

  if (reportType === 'feasibility') {
    const sc = obj(n.scenarios) as { pessimistic?: PhaseRaw; base?: PhaseRaw; optimistic?: PhaseRaw } | null
    if (!sc) return { phases: [] }
    const entries: [string, PhaseRaw | undefined][] = [
      ['Pessimistic Scenario', sc.pessimistic],
      ['Base Scenario',        sc.base],
      ['Optimistic Scenario',  sc.optimistic],
    ]
    return {
      phases: entries
        .filter(([, v]) => v !== undefined)
        .map(([title, v], i) => ({
          phase:   `Phase ${i + 1}`,
          title,
          actions: [str((v as PhaseRaw).assumption)].filter(Boolean),
          kpi:     `ROI: ${str((v as PhaseRaw).roi_annual_pct || (v as PhaseRaw).roi_pct)}`,
          budget:  null,
        })),
    }
  }

  // campaign_roi / lead_gen — top 3 actions as phases
  const rawKey = reportType === 'campaign_roi' ? 'optimizations' : 'improvements'
  const rawItems = arr<PhaseRaw>(n[rawKey])
  return {
    phases: rawItems.slice(0, 3).map((item, i) => ({
      phase:   `Phase ${i + 1}`,
      title:   `Optimization ${i + 1}`,
      actions: [str(item.action)].filter(Boolean),
      kpi:     str(item.timeline),
      budget:  null,
    })),
  }
}

// ---------------------------------------------------------------------------
// Section 3: Trust Score (with interpretation)
// ---------------------------------------------------------------------------

function buildTrustScore(diReport: UniversalDecisionReport): ExecReportTrustScore {
  const { trustScore } = diReport
  return {
    score:          trustScore.score,
    band:           trustScore.band,
    label:          trustScore.label,
    interpretation: TRUST_INTERPRETATION[trustScore.band] ?? TRUST_INTERPRETATION.LOW,
  }
}

// ---------------------------------------------------------------------------
// Section 5: Evidence
// ---------------------------------------------------------------------------

function buildEvidence(diReport: UniversalDecisionReport): ExecReportEvidence {
  const { evidence, evidenceSummary } = diReport
  return {
    totalItems:         evidenceSummary.totalItems,
    averageFreshness:   evidenceSummary.averageFreshness,
    averageConfidence:  evidenceSummary.averageConfidence,
    contradictionCount: evidenceSummary.contradictionCount,
    bySourceType:       evidenceSummary.bySourceType,
    items: evidence.items.slice(0, 10).map(item => ({
      title:      item.title,
      source:     item.source.label,
      confidence: item.confidence,
      freshness:  item.freshness,
    })),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildExecutiveReport(
  reportType: string,
  diReport: UniversalDecisionReport,
  narration: Record<string, unknown>,
): ExecutiveBusinessReport {
  const rec = diReport.recommendation
  const recommendedOption = diReport.executiveSummary.recommendedOption

  return {
    schemaVersion: '2.0.0',
    reportType,
    sections: {
      // Section 1
      executiveSummary: {
        headline:          diReport.executiveSummary.headline,
        summary:           diReport.executiveSummary.summary,
        recommendedOption,
        decisionStatus:    diReport.decision.status,
        domain:            diReport.metadata.decisionDomain,
        generatedAt:       diReport.metadata.generatedAt,
      },

      // Section 2
      finalRecommendation: {
        option:          recommendedOption,
        rationale:       rec?.rationale ?? 'No recommendation could be issued with the available evidence.',
        confidenceScore: diReport.trustScore.score,
        confidenceBand:  diReport.trustScore.band,
        isRuleDetermined:diReport.trustScore.isRuleDetermined,
      },

      // Section 3
      trustScore: buildTrustScore(diReport),

      // Section 4
      decisionConfidence: {
        overall:           diReport.confidence.overall,
        band:              diReport.confidence.band,
        dimensions: diReport.confidence.dimensions.map(d => ({
          name:           d.dimension.replace(/_/g, ' '),
          rawScore:       d.rawScore,
          weightedScore:  d.weightedScore,
          primaryFactor:  d.primaryFactor,
        })),
        weakestDimension:  diReport.confidence.weakestDimension.replace(/_/g, ' '),
        strongestDimension:diReport.confidence.strongestDimension.replace(/_/g, ' '),
      },

      // Section 5
      evidence: buildEvidence(diReport),

      // Section 6
      businessAnalysis: extractBusinessAnalysis(reportType, narration),

      // Section 7
      riskAnalysis: extractRiskAnalysis(diReport, narration),

      // Section 8
      alternativeOptions: diReport.options.map(o => ({
        label:         o.label,
        description:   o.description,
        ruleScore:     o.ruleScore,
        isRecommended: (o.id as string) === (rec?.recommendedOptionId as string | null),
        isBlocked:     o.blockedByRules,
      })),

      // Section 9
      recommendedActions: extractRecommendedActions(reportType, narration),

      // Section 10
      expectedBusinessImpact: extractBusinessImpact(reportType, narration),

      // Section 11
      implementationRoadmap: extractImplementationRoadmap(reportType, narration),

      // Section 12
      appendix: {
        reportId:              diReport.metadata.reportId as string,
        decisionId:            diReport.metadata.decisionId,
        schemaVersion:         diReport.metadata.schemaVersion,
        domain:                diReport.metadata.decisionDomain,
        decisionName:          diReport.metadata.decisionName,
        ruleEvaluationCount:   diReport.ruleEvaluations.length,
        validationStageCount:  diReport.validation.stages.length,
        generatedBy:           diReport.metadata.generatedBy,
      },
    },
  }
}
