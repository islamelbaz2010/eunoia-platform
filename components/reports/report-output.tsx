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
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, unknown>
  }
  return {}
}

function asString(val: unknown): string {
  return typeof val === 'string' ? val : ''
}

function asNumber(val: unknown): number {
  return typeof val === 'number' ? val : 0
}

export function ReportOutput({ data, type }: ReportOutputProps) {
  const label = REPORT_TYPE_LABELS[type]
  const dims = asRecord(data.score_dimensions)
  const execSummary = asRecord(data.executive_summary)
  const confidenceScore = asRecord(data.confidence_score)

  return (
    <div className="space-y-5">
      {/* Report header */}
      <div className="bg-surface border border-white/8 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-gold text-xs font-semibold uppercase tracking-wider mb-1">
              {label?.en ?? asString(data.report_type)}
            </div>
            {asString(execSummary.headline) && (
              <h2 className="text-cream text-xl font-bold mb-2 leading-snug">
                {asString(execSummary.headline)}
              </h2>
            )}
            {asString(execSummary.strategic_direction) && (
              <p className="text-cream/60 text-sm">{asString(execSummary.strategic_direction)}</p>
            )}
            {typeof data.executive_summary === 'string' && (
              <p className="text-cream/60 text-sm">{data.executive_summary}</p>
            )}
          </div>
          <div className="shrink-0 text-center">
            <div className="text-3xl font-bold text-gold">{asNumber(data.marketing_score)}</div>
            <div className="text-cream/40 text-xs">Marketing Score</div>
          </div>
        </div>

        {/* Key findings */}
        {Array.isArray(execSummary.key_findings) && (
          <div className="mt-4 space-y-1.5">
            {(execSummary.key_findings as string[]).map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-cream/70">
                <span className="text-gold shrink-0">→</span>
                {f}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score dimensions */}
      {Object.keys(dims).length > 0 ? (
        <ScoreCard dimensions={dims as Record<string, number>} />
      ) : null}

      {/* Confidence score */}
      {asNumber(confidenceScore.pct) > 0 ? (
        <div className="bg-surface border border-white/8 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-cream text-sm font-medium">
              Confidence: {asString(confidenceScore.label)} ({asNumber(confidenceScore.pct)}%)
            </div>
            <div className="text-cream/40 text-xs mt-0.5">{asString(confidenceScore.reason)}</div>
          </div>
          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all"
              style={{ width: `${asNumber(confidenceScore.pct)}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Section-specific content */}
      {Boolean(data.market_overview) && (
        <SectionCard title="Market Overview" data={asRecord(data.market_overview)} />
      )}

      {Boolean(data.competitor_analysis) && (
        <SectionCard title="Competitor Analysis" data={asRecord(data.competitor_analysis)} />
      )}

      {Boolean(data.swot) && (
        <SectionCard title="SWOT Analysis" data={asRecord(data.swot)} />
      )}

      {Boolean(data.target_audience) && (
        <SectionCard title="Target Audience" data={asRecord(data.target_audience)} />
      )}

      {Boolean(data.budget_allocation) && (
        <SectionCard title="Budget Allocation" data={asRecord(data.budget_allocation)} />
      )}

      {Boolean(data.clv_analysis) && (
        <SectionCard title="CLV Analysis" data={asRecord(data.clv_analysis)} />
      )}

      {Boolean(data.s6_investment_recommendation) && (
        <SectionCard title="Investment Recommendation" data={asRecord(data.s6_investment_recommendation)} />
      )}

      {Boolean(data.opportunity_score) && (
        <SectionCard title="Opportunity Score" data={asRecord(data.opportunity_score)} />
      )}

      {/* Quick wins */}
      {Array.isArray(data.quick_wins) && data.quick_wins.length > 0 && (
        <QuickWins items={asArray(data.quick_wins)} />
      )}

      {Array.isArray(data.s5_quick_wins) && data.s5_quick_wins.length > 0 && (
        <QuickWins items={asArray(data.s5_quick_wins)} />
      )}

      {/* Risk alerts */}
      {Array.isArray(data.risk_alerts) && data.risk_alerts.length > 0 && (
        <RiskAlerts items={asArray(data.risk_alerts)} />
      )}

      {/* 90-day plan */}
      {Boolean(data.plan_90_days) && (
        <SectionCard title="90-Day Plan" data={asRecord(data.plan_90_days)} />
      )}

      {/* Audit checklist */}
      {Array.isArray(data.audit_checklist) && data.audit_checklist.length > 0 && (
        <AuditChecklist items={asArray(data.audit_checklist)} />
      )}

      {/* Proposal */}
      {Array.isArray(data.proposal) && data.proposal.length > 0 && (
        <ProposalCards items={asArray(data.proposal)} />
      )}

      {/* Why us */}
      {Array.isArray(data.why_us) && data.why_us.length > 0 && (
        <div className="bg-surface border border-white/8 rounded-xl p-5">
          <h3 className="text-cream/60 text-xs font-semibold uppercase tracking-wider mb-3">
            Why Eunoia
          </h3>
          <ul className="space-y-2">
            {(data.why_us as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-cream/70">
                <span className="text-gold shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data quality note */}
      {asString(data.data_quality_note) && (
        <div className="bg-white/3 border border-white/5 rounded-lg px-4 py-3 text-cream/40 text-xs">
          📊 {asString(data.data_quality_note)}
        </div>
      )}
    </div>
  )
}
