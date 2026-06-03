'use client'

import type { ReportType } from '@services/ai-engine/prompt-builder'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'
import { ScoreCard } from './score-card'
import { SectionCard } from './section-card'
import { QuickWins } from './quick-wins'
import { RiskAlerts } from './risk-alerts'
import { AuditChecklist } from './audit-checklist'
import { ProposalCards } from './proposal-cards'
import { PainPoints } from './pain-points'
import { KpiCards } from './kpi-cards'

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

      {/* ── KPI Cards (Feasibility) ── */}
      {Boolean(data.kpis) && (() => {
        const k = asRecord(data.kpis)
        const kpiItems = [
          k.total_investment && { label: 'إجمالي الاستثمار', value: `${Number(k.total_investment).toLocaleString('ar-EG')} ج`, variant: 'accent' as const },
          k.monthly_revenue_y1 && { label: 'إيرادات شهرية (س1)', value: `${Number(k.monthly_revenue_y1).toLocaleString('ar-EG')} ج`, variant: 'default' as const },
          k.monthly_profit_y1 !== undefined && { label: 'صافي ربح شهري', value: `${Number(k.monthly_profit_y1).toLocaleString('ar-EG')} ج`, variant: Number(k.monthly_profit_y1) > 0 ? 'good' as const : 'alert' as const },
          k.roi_pct && { label: 'ROI الإجمالي', value: `${k.roi_pct}%`, variant: Number(k.roi_pct) >= 20 ? 'good' as const : 'accent' as const },
          k.npv !== undefined && { label: 'صافي القيمة الحالية', value: `${Number(k.npv).toLocaleString('ar-EG')} ج`, variant: Number(k.npv) > 0 ? 'good' as const : 'alert' as const },
          k.irr_pct && { label: 'معدل العائد الداخلي', value: `${k.irr_pct}%`, variant: 'highlight' as const },
          k.payback_months && { label: 'فترة الاسترداد', value: `${k.payback_months} شهر`, variant: 'default' as const },
          k.net_margin_pct && { label: 'هامش الربح الصافي', value: `${k.net_margin_pct}%`, variant: 'default' as const },
        ].filter(Boolean) as { label: string; value: string; variant: 'highlight' | 'accent' | 'good' | 'alert' | 'default' }[]

        return kpiItems.length > 0 ? <KpiCards items={kpiItems} title="المؤشرات المالية الرئيسية" /> : null
      })()}

      {/* ── Scenarios (Feasibility) ── */}
      {Boolean(data.scenarios) && (() => {
        const sc = asRecord(data.scenarios)
        const scenarios = [
          { key: 'pessimist', label: '😟 سيناريو متشائم', cls: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.2)', color: '#dc2626' },
          { key: 'base', label: '⚖ السيناريو المتوازن', cls: 'var(--gold-bg)', border: 'var(--gold-border)', color: 'var(--gold)' },
          { key: 'optimist', label: '😊 سيناريو متفائل', cls: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.2)', color: '#16a34a' },
        ]
        const hasScenarios = scenarios.some(s => sc[s.key])
        if (!hasScenarios) return null
        return (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">📊</span>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--gold)'}}>السيناريوهات الثلاثة</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {scenarios.map(sc_item => {
                const s = asRecord(sc[sc_item.key])
                if (!s || Object.keys(s).length === 0) return null
                return (
                  <div key={sc_item.key} className="rounded-xl p-4 border" style={{background: sc_item.cls, borderColor: sc_item.border}}>
                    <div className="text-xs font-bold mb-3" style={{color: sc_item.color}}>{sc_item.label}</div>
                    {s.monthly_profit !== undefined && (
                      <div>
                        <div className="text-xl font-bold" style={{color: sc_item.color}}>
                          {Number(s.monthly_profit).toLocaleString('ar-EG')} ج
                        </div>
                        <div className="text-xs text-muted-foreground">صافي ربح شهري</div>
                      </div>
                    )}
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {Boolean(s.roi_pct) && <div>ROI: <span className="font-bold" style={{color: sc_item.color}}>{String(s.roi_pct)}%</span></div>}
                      {Boolean(s.payback_months) && <div>استرداد: <span className="font-bold">{String(s.payback_months)} شهر</span></div>}
                      {Boolean(s.assumption) && <div className="mt-2 italic">{String(s.assumption)}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── Income Statement Table ── */}
      {Array.isArray(data.income_statement) && data.income_statement.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/20">
            <span className="text-lg">📋</span>
            <h3 className="text-sm font-bold text-foreground">قائمة الدخل (EGP)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase">البند</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">السنة 1</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">السنة 2</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">السنة 3</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">%</th>
                </tr>
              </thead>
              <tbody>
                {(data.income_statement as Array<{item:string;year1:number;year2:number;year3:number;pct:string}>).map((row, i) => {
                  const isTotal = (row.item||'').includes('صافي') || (row.item||'').includes('إجمالي') || (row.item||'').includes('EBITDA')
                  return (
                    <tr key={i} className={`border-b border-border/50 last:border-0 ${isTotal ? 'bg-gold/5 font-bold' : 'hover:bg-muted/20'}`}>
                      <td className="px-5 py-3 text-foreground">{row.item}</td>
                      <td className={`px-4 py-3 text-left font-mono text-sm ${Number(row.year1)<0?'text-red-500':'text-foreground'}`}>{Number(row.year1||0).toLocaleString('ar-EG')}</td>
                      <td className={`px-4 py-3 text-left font-mono text-sm ${Number(row.year2)<0?'text-red-500':'text-foreground'}`}>{Number(row.year2||0).toLocaleString('ar-EG')}</td>
                      <td className={`px-4 py-3 text-left font-mono text-sm ${Number(row.year3)<0?'text-red-500':'text-foreground'}`}>{Number(row.year3||0).toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 text-left text-muted-foreground text-xs">{row.pct||''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Cash Flow Table ── */}
      {Array.isArray(data.cash_flow) && data.cash_flow.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/20">
            <span className="text-lg">💰</span>
            <h3 className="text-sm font-bold text-foreground">التدفقات النقدية (EGP)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase">السنة</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">الإيرادات</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">المصاريف</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">صافي الربح</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">التراكمي</th>
                </tr>
              </thead>
              <tbody>
                {(data.cash_flow as Array<{year:string;revenue:number;opex:number;net_profit:number;cumulative:number}>).map((row, i) => {
                  const cumPositive = Number(row.cumulative||0) >= 0
                  return (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-5 py-3 font-semibold text-foreground">{row.year}</td>
                      <td className="px-4 py-3 text-left font-mono text-sm text-foreground">{Number(row.revenue||0).toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 text-left font-mono text-sm text-muted-foreground">{Number(row.opex||0).toLocaleString('ar-EG')}</td>
                      <td className={`px-4 py-3 text-left font-mono text-sm font-bold ${Number(row.net_profit||0)>0?'text-emerald-600 dark:text-emerald-400':'text-red-500'}`}>{Number(row.net_profit||0).toLocaleString('ar-EG')}</td>
                      <td className={`px-4 py-3 text-left font-mono text-sm font-bold ${cumPositive?'text-emerald-600 dark:text-emerald-400':'text-red-500'}`}>{Number(row.cumulative||0).toLocaleString('ar-EG')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reality Check Table ── */}
      {Array.isArray(data.reality_check) && data.reality_check.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/20">
            <span className="text-lg">🔍</span>
            <h3 className="text-sm font-bold text-foreground">صدمة الواقع — مقارنة افتراضاتك بالسوق</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase">المدخل</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">افتراضك</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">البنشمارك</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">الفجوة</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">التقييم</th>
                </tr>
              </thead>
              <tbody>
                {(data.reality_check as Array<{input:string;client_assumption:string;market_benchmark:string;gap_pct:number;assessment:string;comment:string}>).map((row, i) => {
                  const isOk = row.assessment === 'realistic'
                  const isWarn = row.assessment === 'optimistic'
                  const color = isOk ? '#16a34a' : isWarn ? 'var(--gold)' : '#dc2626'
                  const label = isOk ? 'واقعي ✅' : isWarn ? 'متفائل ⚠️' : 'غير واقعي ❌'
                  return (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-foreground">{row.input}</div>
                        {row.comment && <div className="text-xs text-muted-foreground mt-0.5">{row.comment}</div>}
                      </td>
                      <td className="px-4 py-3 text-left text-foreground">{row.client_assumption||'—'}</td>
                      <td className="px-4 py-3 text-left text-muted-foreground">{row.market_benchmark||'—'}</td>
                      <td className="px-4 py-3 text-left font-bold text-sm" style={{color}}>{row.gap_pct!==undefined?`${row.gap_pct}%`:'—'}</td>
                      <td className="px-4 py-3 text-left text-xs font-bold" style={{color}}>{label}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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

      {/* ── Pain Points ── */}
      {Array.isArray(data.pain_points) && data.pain_points.length > 0 && (
        <PainPoints items={asArray(data.pain_points)} />
      )}

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
