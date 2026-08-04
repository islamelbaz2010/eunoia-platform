'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Report {
  id: string
  report_type: string
  company_name: string | null
  city: string | null
  created_at: string
  report_data: Record<string, unknown> | null
  decision_report: { confidence?: number; recommendation?: string; trust_score?: number } | null
}

interface FailedRequest {
  id: string
  module: 'lead_finder' | 'talent_finder' | 'market_intelligence'
  input: Record<string, unknown> | null
  error: string | null
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  feasibility:   '📐',
  campaign_roi:  '📊',
  market_entry:  '🗺️',
  lead_gen:      '🎯',
  full_analysis: '🏆',
  lead_finder:   '🎯',
  talent_finder: '🧑‍💼',
}

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  feasibility:   { ar: 'دراسة الجدوى',   en: 'Feasibility Study' },
  campaign_roi:  { ar: 'تدقيق الحملات',  en: 'Campaign ROI Audit' },
  market_entry:  { ar: 'دخول السوق',      en: 'Market Entry Intel' },
  lead_gen:      { ar: 'توليد العملاء',   en: 'Lead Generation Intel' },
  full_analysis: { ar: 'التحليل الشامل', en: 'Full Marketing Analysis' },
  lead_finder:   { ar: 'البحث عن عملاء',  en: 'Lead Finder' },
  talent_finder: { ar: 'البحث عن مواهب',  en: 'Talent Finder' },
}

const styles = `
  .rh-page { background: #FAF5EF; min-height: 100vh; font-family: 'Inter','Cairo','Segoe UI',sans-serif; }
  .rh-topbar { background: linear-gradient(135deg,#2D0A3E,#4A1042,#1A0520); padding: 18px 24px; }
  .rh-topbar-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .rh-brand-tag { font-size: 10px; font-weight: 800; letter-spacing: 3px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 3px; }
  .rh-brand-title { font-size: 20px; font-weight: 900; color: #fff; }
  .rh-brand-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .rh-back-btn { background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .rh-back-btn:hover { background: rgba(255,255,255,0.18); color: #fff; }

  .rh-body { max-width: 900px; margin: 0 auto; padding: 24px 16px; }

  .rh-toolbar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
  .rh-search { flex: 1; min-width: 200px; background: #fff; border: 1.5px solid #E8E2DA; border-radius: 9px; padding: 9px 14px; font-size: 13px; color: #1A1018; outline: none; font-family: inherit; transition: border-color 0.15s; }
  .rh-search:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .rh-search::placeholder { color: #B0A9A2; }
  .rh-filter-btn { padding: 9px 14px; border: 1.5px solid #E8E2DA; border-radius: 9px; font-size: 12px; font-weight: 600; cursor: pointer; background: #fff; color: #6B6560; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
  .rh-filter-btn:hover { border-color: #7C3AED; color: #7C3AED; background: #FAF5FF; }
  .rh-filter-btn.active { background: #4A1042; color: #fff; border-color: #4A1042; }

  .rh-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
  .rh-stat { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 11px; padding: 14px 16px; }
  .rh-stat-num { font-size: 28px; font-weight: 900; color: #4A1042; line-height: 1; }
  .rh-stat-label { font-size: 11px; color: #9A9090; margin-top: 4px; }

  .rh-empty { text-align: center; padding: 60px 20px; background: #fff; border: 1.5px solid #E8E2DA; border-radius: 14px; }
  .rh-empty-icon { font-size: 48px; margin-bottom: 12px; }
  .rh-empty-title { font-size: 16px; font-weight: 800; color: #1A1018; margin-bottom: 6px; }
  .rh-empty-sub { font-size: 13px; color: #9A9090; }

  .rh-list { display: flex; flex-direction: column; gap: 8px; }
  .rh-failed-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .rh-failed-card { background: #FFF8E8; border: 1.5px solid #F0DDA0; border-radius: 12px; padding: 14px 16px; }
  .rh-failed-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .rh-failed-title { font-size: 13px; font-weight: 800; color: #3A2A08; }
  .rh-failed-meta { font-size: 11px; color: #8A6310; margin-top: 3px; }
  .rh-failed-error { font-size: 11px; color: #8A6310; margin-top: 8px; line-height: 1.5; }
  .rh-retry-btn { flex-shrink: 0; background: #4A1042; color: #fff; text-decoration: none; font-size: 11px; font-weight: 800; border-radius: 8px; padding: 8px 12px; }
  .rh-report-card { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; }
  .rh-report-card:hover { border-color: #7C3AED; box-shadow: 0 2px 12px rgba(124,58,237,0.08); transform: translateY(-1px); }
  .rh-report-card.expanded { border-color: #7C3AED; background: #FDFAFF; }
  .rh-card-row { display: flex; align-items: center; gap: 12px; }
  .rh-card-icon { font-size: 22px; width: 40px; height: 40px; background: #F8F6F3; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rh-card-info { flex: 1; min-width: 0; }
  .rh-card-type { font-size: 13px; font-weight: 800; color: #1A1018; }
  .rh-card-company { font-size: 11px; color: #6B6560; margin-top: 2px; }
  .rh-card-meta { display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
  .rh-card-city { font-size: 10px; background: #F0E8EF; color: #4A1042; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .rh-card-date { font-size: 10px; color: #9A9090; }
  .rh-card-conf { font-size: 11px; font-weight: 800; }

  .rh-expand { margin-top: 14px; padding-top: 14px; border-top: 1px solid #E8E2DA; }
  .rh-expand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .rh-expand-kv { background: #FAF5EF; border-radius: 8px; padding: 10px 12px; border: 1px solid #E8E2DA; }
  .rh-expand-label { font-size: 10px; color: #9A9090; margin-bottom: 2px; }
  .rh-expand-value { font-size: 12px; font-weight: 700; color: #4A1042; }
  .rh-expand-actions { display: flex; gap: 8px; }
  .rh-expand-btn { flex: 1; padding: 8px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1.5px solid #E8E2DA; background: #fff; color: #6B6560; font-family: inherit; transition: all 0.15s; text-align: center; }
  .rh-expand-btn:hover { border-color: #7C3AED; color: #7C3AED; }
  .rh-expand-btn.green { background: #0D9488; color: #fff; border-color: #0D9488; }
  .rh-expand-btn.red { background: #D4183D; color: #fff; border-color: #D4183D; }

  .rh-verdict { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; margin-top: 6px; }

  @media print {
    .rh-topbar, .rh-toolbar, .rh-expand-actions { display: none !important; }
    .rh-report-card { break-inside: avoid; }
  }
`

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function getConfidence(report: Report): number {
  const dr = report.decision_report as Record<string, unknown> | null | undefined
  if (dr?.confidence != null) {
    const c = dr.confidence
    if (typeof c === 'number') return c
    if (typeof c === 'object' && c !== null && typeof (c as Record<string, unknown>).overall === 'number') {
      return (c as Record<string, unknown>).overall as number
    }
  }
  // Fallback: historical reports store confidence in report_data.confidence_score.pct
  const rd = report.report_data as Record<string, unknown> | null | undefined
  const cs = rd?.confidence_score as { pct?: number } | undefined
  return cs?.pct ?? 0
}

function getExportFilename(report: Report): string {
  const TYPE_PREFIX: Record<string, string> = {
    feasibility:   'feasibility',
    campaign_roi:  'campaign-roi',
    market_entry:  'market-entry',
    lead_gen:      'lead-gen',
    full_analysis: 'full-analysis',
  }
  const prefix = TYPE_PREFIX[report.report_type] || report.report_type
  const slug = (report.company_name || 'assessment')
    .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
  return `${prefix}-${slug}-${report.created_at.split('T')[0]}.csv`
}

function getVerdict(report_data: Record<string, unknown> | null): string | null {
  if (!report_data) return null
  return report_data.verdict as string | null
}

function getKeyMetrics(type: string, data: Record<string, unknown> | null): Array<{ label: string; value: string }> {
  if (!data) return []
  const metrics: Array<{ label: string; value: string }> = []

  if (type === 'feasibility') {
    const fin = data.financials as Record<string, string> | undefined
    if (fin?.net_profit)       metrics.push({ label: 'صافي الربح',    value: fin.net_profit })
    if (fin?.roi_pct)          metrics.push({ label: 'ROI',            value: fin.roi_pct })
    if (fin?.npv_assessment)   metrics.push({ label: 'NPV',            value: fin.npv_assessment.substring(0, 30) })
    if (fin?.payback_months)   metrics.push({ label: 'فترة الاسترداد', value: fin.payback_months })
  } else if (type === 'campaign_roi') {
    const kpi = data.kpi_scorecard as Record<string, string> | undefined
    if (kpi?.current_cpl)             metrics.push({ label: 'CPL الحالي',     value: kpi.current_cpl })
    if (kpi?.cpl_gap_pct)             metrics.push({ label: 'الفجوة',         value: kpi.cpl_gap_pct })
    if (kpi?.wasted_budget_estimate)  metrics.push({ label: 'ميزانية مهدرة', value: kpi.wasted_budget_estimate })
    if (kpi?.leads_gap)               metrics.push({ label: 'عملاء ضائعة',   value: kpi.leads_gap })
  } else if (type === 'market_entry') {
    const cpl = data.cpl_intelligence as Record<string, string> | undefined
    if (cpl?.meta_cpl_expected)      metrics.push({ label: 'CPL المتوقع',  value: cpl.meta_cpl_expected })
    if (cpl?.monthly_leads_at_budget) metrics.push({ label: 'عملاء/شهر',   value: cpl.monthly_leads_at_budget })
    if (cpl?.budget_sufficiency)     metrics.push({ label: 'الميزانية',    value: cpl.budget_sufficiency })
  } else if (type === 'lead_gen') {
    const ph = data.pipeline_health as Record<string, unknown> | undefined
    if (ph?.qualification_rate)        metrics.push({ label: 'معدل التأهيل',  value: ph.qualification_rate as string })
    if (ph?.qualified_leads)           metrics.push({ label: 'عملاء مؤهلون', value: ph.qualified_leads as string })
    if (ph?.estimated_monthly_deals)   metrics.push({ label: 'صفقات/شهر',    value: ph.estimated_monthly_deals as string })
  } else if (type === 'full_analysis') {
    if (data.marketing_score)  metrics.push({ label: 'نقاط التسويق', value: `${data.marketing_score}/100` })
    if (data.performance_tier) metrics.push({ label: 'المستوى',       value: data.performance_tier as string })
    const cp = data.campaign_performance as Record<string, Record<string, string>> | undefined
    if (cp?.cpl_analysis?.gap) metrics.push({ label: 'فجوة CPL',     value: cp.cpl_analysis.gap })
  } else if (type === 'lead_finder') {
    const companies = data.companies as Array<{ lead_score?: number }> | undefined
    if (companies?.length) metrics.push({ label: 'الشركات', value: String(companies.length) })
    if (companies?.length) {
      const avg = Math.round(companies.reduce((s, c) => s + (c.lead_score ?? 0), 0) / companies.length)
      metrics.push({ label: 'متوسط النقاط', value: `${avg}/100` })
    }
  } else if (type === 'talent_finder') {
    const sal = data.salary_range as Record<string, string | number> | undefined
    if (sal?.min !== undefined && sal?.max !== undefined) metrics.push({ label: 'الراتب', value: `${sal.min}-${sal.max} ${sal.currency ?? ''}` })
    const demand = data.hiring_demand as Record<string, string> | undefined
    if (demand?.level) metrics.push({ label: 'الطلب', value: demand.level })
  }
  return metrics.slice(0, 4)
}

function exportReportCSV(report: Report) {
  const rows = [
    ['Eunoia Decision Intelligence Platform'],
    [report.report_type, report.company_name || '', report.city || ''],
    [formatDate(report.created_at)],
    [],
    ...Object.entries(report.report_data || {}).map(([k, v]) => [k, JSON.stringify(v)])
  ]
  const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
    download: getExportFilename(report)
  })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

function retryHref(request: FailedRequest): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(request.input ?? {})) {
    if (typeof value === 'string' && value.trim()) params.set(key, value)
  }
  const query = params.toString()
  if (request.module === 'lead_finder') return `/dashboard/research/leads${query ? `?${query}` : ''}`
  if (request.module === 'talent_finder') return `/dashboard/research/talent${query ? `?${query}` : ''}`
  return '/dashboard/real-estate'
}

function failedRequestTitle(request: FailedRequest): string {
  if (request.module === 'lead_finder') return 'Lead Finder request failed'
  if (request.module === 'talent_finder') return 'Talent Finder request failed'
  return 'Market Intelligence request failed'
}

export default function ReportsClient({
  reports,
  failedRequests,
  userEmail,
}: {
  reports: Report[]
  failedRequests: FailedRequest[]
  userEmail: string
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = reports.filter(r => {
    const matchSearch = !search ||
      r.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.city?.toLowerCase().includes(search.toLowerCase()) ||
      r.report_type?.includes(search)
    const matchFilter = filter === 'all' || r.report_type === filter
    return matchSearch && matchFilter
  })

  const totalReports = reports.length
  const thisMonth = reports.filter(r => {
    const d = new Date(r.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const avgConf = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + getConfidence(r), 0) / reports.length)
    : 0

  return (
    <>
      <style>{styles}</style>
      <div className="rh-page" dir="rtl">
        {/* Topbar */}
        <div className="rh-topbar">
          <div className="rh-topbar-inner">
            <div>
              <div className="rh-brand-tag">EUNOIA</div>
              <div className="rh-brand-title">تقاريري / My Reports</div>
              <div className="rh-brand-sub">{userEmail}</div>
            </div>
            <button className="rh-back-btn" onClick={() => window.history.back()}>
              &#8592; العودة / Back
            </button>
          </div>
        </div>

        <div className="rh-body">
          {/* Stats */}
          <div className="rh-stats">
            <div className="rh-stat">
              <div className="rh-stat-num">{totalReports}</div>
              <div className="rh-stat-label">إجمالي التقييمات / Total Assessments</div>
            </div>
            <div className="rh-stat">
              <div className="rh-stat-num">{thisMonth}</div>
              <div className="rh-stat-label">هذا الشهر / This Month</div>
            </div>
            <div className="rh-stat">
              <div className="rh-stat-num" style={{ color: avgConf >= 75 ? '#0D9488' : '#F0A020' }}>{avgConf}%</div>
              <div className="rh-stat-label">متوسط الثقة / Avg Confidence</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="rh-toolbar">
            <input
              className="rh-search"
              placeholder="ابحث بالشركة أو المدينة / Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className={`rh-filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>الكل / All</button>
            <button className={`rh-filter-btn${filter === 'feasibility' ? ' active' : ''}`} onClick={() => setFilter('feasibility')}>&#128208; جدوى</button>
            <button className={`rh-filter-btn${filter === 'campaign_roi' ? ' active' : ''}`} onClick={() => setFilter('campaign_roi')}>&#128202; حملات</button>
            <button className={`rh-filter-btn${filter === 'market_entry' ? ' active' : ''}`} onClick={() => setFilter('market_entry')}>&#128506; سوق</button>
            <button className={`rh-filter-btn${filter === 'lead_gen' ? ' active' : ''}`} onClick={() => setFilter('lead_gen')}>&#127919; عملاء</button>
            <button className={`rh-filter-btn${filter === 'full_analysis' ? ' active' : ''}`} onClick={() => setFilter('full_analysis')}>&#127942; شامل</button>
          </div>

          {failedRequests.length > 0 && (
            <div className="rh-failed-list">
              {failedRequests.map(request => (
                <div key={request.id} className="rh-failed-card">
                  <div className="rh-failed-row">
                    <div>
                      <div className="rh-failed-title">{failedRequestTitle(request)}</div>
                      <div className="rh-failed-meta">{formatDate(request.created_at)}</div>
                    </div>
                    <Link className="rh-retry-btn" href={retryHref(request)}>Try again</Link>
                  </div>
                  {request.error && <div className="rh-failed-error">{request.error}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="rh-empty">
              <div className="rh-empty-icon">{search || filter !== 'all' ? '&#128269;' : '&#128203;'}</div>
              <div className="rh-empty-title">
                {search || filter !== 'all' ? 'لا نتائج / No results' : 'لا توجد تقييمات بعد / No assessments yet'}
              </div>
              <div className="rh-empty-sub">
                {search || filter !== 'all'
                  ? 'جرب بحثاً مختلفاً / Try different search'
                  : 'ابدأ تقييمك الأول من قسم التقييمات / Start your first assessment from the Assessments section'}
              </div>
            </div>
          )}

          {/* Report list */}
          <div className="rh-list">
            {filtered.map(report => {
              const conf = getConfidence(report)
              const confColor = conf >= 80 ? '#0D9488' : conf >= 65 ? '#F0A020' : '#9A9090'
              const verdict = getVerdict(report.report_data)
              const verdictColor = verdict && !verdict.includes('مشروط') && verdict.includes('مجدي')
                ? '#0D9488'
                : verdict?.includes('مشروط') ? '#F0A020'
                : verdict ? '#D4183D'
                : null
              const metrics = getKeyMetrics(report.report_type, report.report_data)
              const isExpanded = expanded === report.id
              const typeInfo = TYPE_LABELS[report.report_type] || { ar: report.report_type, en: report.report_type }

              return (
                <div
                  key={report.id}
                  className={`rh-report-card${isExpanded ? ' expanded' : ''}`}
                  onClick={() => setExpanded(isExpanded ? null : report.id)}
                >
                  <div className="rh-card-row">
                    <div className="rh-card-icon">{TYPE_ICONS[report.report_type] || '📄'}</div>
                    <div className="rh-card-info">
                      <div className="rh-card-type">{typeInfo.ar} / {typeInfo.en}</div>
                      <div className="rh-card-company">
                        {report.company_name || '—'}
                        {verdict && verdictColor && (
                          <span className="rh-verdict" style={{ background: verdictColor + '18', color: verdictColor }}>
                            {!verdict.includes('مشروط') && verdict.includes('مجدي') ? '✓' : verdict.includes('مشروط') ? '⚠' : '✗'} {verdict}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="rh-card-meta">
                      {report.city && <span className="rh-card-city">{report.city}</span>}
                      <span className="rh-card-conf" style={{ color: confColor }}>{conf}%</span>
                      <span className="rh-card-date">{formatDate(report.created_at)}</span>
                      <span style={{ fontSize: 12, color: '#B0A9A2' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="rh-expand" onClick={e => e.stopPropagation()}>
                      {metrics.length > 0 && (
                        <div className="rh-expand-grid">
                          {metrics.map((m, i) => (
                            <div key={i} className="rh-expand-kv">
                              <div className="rh-expand-label">{m.label}</div>
                              <div className="rh-expand-value">{m.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {!!report.report_data?.executive_summary && (
                        <div style={{ fontSize: 12, color: '#6B6560', lineHeight: 1.6, marginBottom: 12, padding: '10px 12px', background: '#FAF5EF', borderRadius: 8 }}>
                          {String(report.report_data.executive_summary)}
                        </div>
                      )}
                      <div className="rh-expand-actions">
                        <button
                          className="rh-expand-btn green"
                          onClick={() => exportReportCSV(report)}
                        >
                          &#128202; Excel / CSV
                        </button>
                        <button
                          className="rh-expand-btn red"
                          onClick={() => window.print()}
                        >
                          &#128424; Print / PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
