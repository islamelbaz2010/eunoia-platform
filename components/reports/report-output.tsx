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
    <div className="space-y-6">
      {/* Report header */}
      <div className="bg-surface border border-white/10 rounded-2xl p-7">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="text-[#c9a962] text-xs font-semibold uppercase tracking-widest mb-2">
              {label?.en ?? asString(data.report_type)}
            </div>
            {asString(execSummary.headline) && (
              <h2 className="text-[#faf9f7] text-2xl font-bold mb-3 leading-snug">
                {asString(execSummary.headline)}
              </h2>
            )}
            {asString(execSummary.strategic_direction) && (
              <p className="text-cream/70 text-base leading-relaxed">{asString(execSummary.strategic_direction)}</p>
            )}
            {typeof data.executive_summary === 'string' && (
              <p className="text-cream/70 text-base leading-relaxed">{data.executive_summary}</p>
            )}
          </div>
          {asNumber(data.marketing_score) > 0 && (
            <div className="shrink-0 text-center bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl px-6 py-4">
              <div className="text-4xl font-bold text-[#c9a962]">{asNumber(data.marketing_score)}</div>
              <div className="text-cream/50 text-xs mt-1 whitespace-nowrap">Marketing Score</div>
            </div>
          )}
        </div>

        {/* Key findings */}
        {Array.isArray(execSummary.key_findings) && (execSummary.key_findings as string[]).length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/8 space-y-2">
            <div className="text-[#c9a962] text-xs font-semibold uppercase tracking-wider mb-3">Key Findings</div>
            {(execSummary.key_findings as string[]).map((f, i) => (
              <div key={i} className="flex items-start gap-3 text-[15px] text-cream/75 leading-relaxed">
                <span className="text-[#c9a962] shrink-0 font-bold">→</span>
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
        <div className="bg-surface border border-white/10 rounded-xl px-6 py-5 flex items-center gap-5">
          <div className="flex-1">
            <div className="text-[#faf9f7] text-base font-semibold">
              Confidence: {asString(confidenceScore.label)} — {asNumber(confidenceScore.pct)}%
            </div>
            <div className="text-cream/50 text-sm mt-1">{asString(confidenceScore.reason)}</div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#c9a962] rounded-full transition-all"
                style={{ width: `${asNumber(confidenceScore.pct)}%` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-2xl font-bold text-[#c9a962]">
            {asNumber(confidenceScore.pct)}%
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
        <div className="bg-surface border border-white/10 rounded-2xl p-6">
          <h3 className="text-[#c9a962] text-base font-bold mb-4">
            Why Eunoia
          </h3>
          <ul className="space-y-3">
            {(data.why_us as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] text-cream/75 leading-relaxed">
                <span className="text-[#c9a962] shrink-0 font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data quality note */}
      {asString(data.data_quality_note) && (
        <div className="bg-white/3 border border-white/8 rounded-xl px-5 py-4 text-cream/50 text-sm">
          📊 {asString(data.data_quality_note)}
        </div>
      )}
    </div>
  )
}
