'use client'

import type { ReportType } from '@services/ai-engine/prompt-builder'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'
import { ScoreCard } from './score-card'
import { SectionCard } from './section-card'
import { QuickWins } from './quick-wins'
import { RiskAlerts } from './risk-alerts'
import { AuditChecklist } from './audit-checklist'
import { ProposalCards } from './proposal-cards'

interface ReportOutputProps {
  data: Record<string, unknown>
  type: ReportType
}

function asArray<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : []
}
function asRecord(val: unknown): Record<string, unknown> {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>
  return {}
}
function asString(val: unknown): string { return typeof val === 'string' ? val : '' }
function asNumber(val: unknown): number { return typeof val === 'number' ? val : 0 }

export function ReportOutput({ data, type }: ReportOutputProps) {
  const label = REPORT_TYPE_LABELS[type]
  const dims = asRecord(data.score_dimensions)
  const execSummary = asRecord(data.executive_summary)
  const confidenceScore = asRecord(data.confidence_score)
  const score = asNumber(data.marketing_score)

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-7">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full"
             style={{background:'radial-gradient(circle,rgba(184,146,42,0.12) 0%,transparent 70%)'}} />

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Report type badge */}
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider"
                 style={{borderColor:'var(--gold-border)',background:'var(--gold-bg)',color:'var(--gold)'}}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'var(--gold)'}} />
              {label?.en ?? asString(data.report_type)}
            </div>

            {/* Headline */}
            {asString(execSummary.headline) && (
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3 leading-snug">
                {asString(execSummary.headline)}
              </h2>
            )}

            {/* Strategic direction */}
            {asString(execSummary.strategic_direction) && (
              <p className="text-muted-foreground text-base leading-relaxed">
                {asString(execSummary.strategic_direction)}
              </p>
            )}
            {typeof data.executive_summary === 'string' && (
              <p className="text-muted-foreground text-base leading-relaxed">{data.executive_summary}</p>
            )}
          </div>

          {/* Score circle */}
          {score > 0 && (
            <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2"
                 style={{
                   borderColor: score >= 70 ? '#16a34a' : score >= 50 ? 'var(--gold)' : '#dc2626',
                   background: score >= 70 ? 'rgba(22,163,74,0.08)' : score >= 50 ? 'var(--gold-bg)' : 'rgba(220,38,38,0.08)',
                 }}>
              <div className="text-3xl font-bold"
                   style={{color: score >= 70 ? '#16a34a' : score >= 50 ? 'var(--gold)' : '#dc2626'}}>
                {score}
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                Score
              </div>
            </div>
          )}
        </div>

        {/* Key findings */}
        {Array.isArray(execSummary.key_findings) && (execSummary.key_findings as string[]).length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'var(--gold)'}}>
              Key Findings
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(execSummary.key_findings as string[]).map((f, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed bg-muted/40 rounded-xl px-4 py-3">
                  <span className="shrink-0 font-bold mt-0.5" style={{color:'var(--gold)'}}>→</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Score Breakdown ── */}
      {Object.keys(dims).length > 0 && <ScoreCard dimensions={dims as Record<string, number>} />}

      {/* ── Confidence Bar ── */}
      {asNumber(confidenceScore.pct) > 0 && (
        <div className="bg-card border border-border rounded-xl px-6 py-4 flex items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                Confidence: {asString(confidenceScore.label)}
              </span>
              <span className="text-lg font-bold" style={{color:'var(--gold)'}}>
                {asNumber(confidenceScore.pct)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{asString(confidenceScore.reason)}</p>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${asNumber(confidenceScore.pct)}%`,
                  background: `linear-gradient(90deg,var(--gold),var(--gold-light))`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      {Boolean(data.market_overview) && <SectionCard title="Market Overview" data={asRecord(data.market_overview)} icon="📊" />}
      {Boolean(data.s2_market_overview) && <SectionCard title="Market Overview" data={asRecord(data.s2_market_overview)} icon="📊" />}
      {Boolean(data.competitor_analysis) && <SectionCard title="Competitor Analysis" data={asRecord(data.competitor_analysis)} icon="🎯" />}
      {Boolean(data.competitors) && data.competitors !== undefined && (
        <SectionCard title="Competitor Analysis" data={{ competitors: data.competitors }} icon="🎯" />
      )}
      {Boolean(data.swot) && <SectionCard title="SWOT Analysis" data={asRecord(data.swot)} icon="🔲" />}
      {Boolean(data.target_audience) && <SectionCard title="Target Audience" data={asRecord(data.target_audience)} icon="👥" />}
      {Boolean(data.budget_allocation) && <SectionCard title="Budget Allocation" data={asRecord(data.budget_allocation)} icon="💰" />}
      {Boolean(data.clv_analysis) && <SectionCard title="CLV Analysis" data={asRecord(data.clv_analysis)} icon="📈" />}
      {Boolean(data.channel_strategy) && <SectionCard title="Channel Strategy" data={asRecord(data.channel_strategy)} icon="📡" />}
      {Boolean(data.content_requirements) && <SectionCard title="Content Requirements" data={asRecord(data.content_requirements)} icon="📝" />}
      {Boolean(data.media_budget) && <SectionCard title="Media Budget" data={asRecord(data.media_budget)} icon="💵" />}
      {Boolean(data.kpis) && <SectionCard title="KPIs" data={asRecord(data.kpis)} icon="📐" />}
      {Boolean(data.market_timing) && <SectionCard title="Market Timing" data={asRecord(data.market_timing)} icon="⏱" />}
      {Boolean(data.target_segments) && <SectionCard title="Target Segments" data={{ segments: data.target_segments }} icon="🎯" />}
      {Boolean(data.funnel_analysis) && <SectionCard title="Funnel Analysis" data={asRecord(data.funnel_analysis)} icon="🔽" />}
      {Boolean(data.channel_performance) && <SectionCard title="Channel Performance" data={{ channels: data.channel_performance }} icon="📊" />}
      {Boolean(data.financial_projections) && <SectionCard title="Financial Projections" data={asRecord(data.financial_projections)} icon="💹" />}
      {Boolean(data.opportunity_score) && <SectionCard title="Opportunity Score" data={asRecord(data.opportunity_score)} icon="⭐" />}
      {Boolean(data.s6_investment_recommendation) && <SectionCard title="Investment Recommendation" data={asRecord(data.s6_investment_recommendation)} icon="💡" />}
      {Boolean(data.go_nogo_recommendation) && <SectionCard title="Go / No-Go Recommendation" data={asRecord(data.go_nogo_recommendation)} icon="✅" />}
      {Boolean(data.launch_readiness_score) && <SectionCard title="Launch Readiness" data={asRecord(data.launch_readiness_score)} icon="🚀" />}
      {Boolean(data.positioning_matrix) && <SectionCard title="Positioning Matrix" data={asRecord(data.positioning_matrix)} icon="🗺" />}
      {Boolean(data.differentiation_strategy) && <SectionCard title="Differentiation Strategy" data={asRecord(data.differentiation_strategy)} icon="💎" />}
      {Boolean(data.current_performance) && <SectionCard title="Current Performance" data={asRecord(data.current_performance)} icon="📉" />}
      {Boolean(data.optimization_opportunities) && <SectionCard title="Optimization Opportunities" data={asRecord(data.optimization_opportunities)} icon="⚡" />}

      {/* ── Quick Wins ── */}
      {Array.isArray(data.quick_wins) && data.quick_wins.length > 0 && <QuickWins items={asArray(data.quick_wins)} />}
      {Array.isArray(data.s5_quick_wins) && data.s5_quick_wins.length > 0 && <QuickWins items={asArray(data.s5_quick_wins)} />}

      {/* ── Risk Alerts ── */}
      {Array.isArray(data.risk_alerts) && data.risk_alerts.length > 0 && <RiskAlerts items={asArray(data.risk_alerts)} />}
      {Array.isArray(data.risk_factors) && data.risk_factors.length > 0 && <RiskAlerts items={asArray(data.risk_factors)} />}

      {/* ── 90-Day Plan ── */}
      {Boolean(data.plan_90_days) && <SectionCard title="90-Day Action Plan" data={asRecord(data.plan_90_days)} icon="📅" />}

      {/* ── Audit Checklist ── */}
      {Array.isArray(data.audit_checklist) && data.audit_checklist.length > 0 && <AuditChecklist items={asArray(data.audit_checklist)} />}

      {/* ── Proposal ── */}
      {Array.isArray(data.proposal) && data.proposal.length > 0 && <ProposalCards items={asArray(data.proposal)} />}

      {/* ── Why Us ── */}
      {Array.isArray(data.why_us) && data.why_us.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏆</span>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>Why Eunoia</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(data.why_us as string[]).map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed">
                <span className="shrink-0 font-bold" style={{color:'var(--gold)'}}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Data Disclaimer ── */}
      {asString(data.data_quality_note) && (
        <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-xl px-5 py-4 text-sm text-muted-foreground">
          <span className="text-lg shrink-0">📊</span>
          {asString(data.data_quality_note)}
        </div>
      )}
      {asString(data.data_disclaimer) && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl px-5 py-4 text-sm text-amber-800 dark:text-amber-300">
          <span className="text-lg shrink-0">⚠️</span>
          {asString(data.data_disclaimer)}
        </div>
      )}
    </div>
  )
}
