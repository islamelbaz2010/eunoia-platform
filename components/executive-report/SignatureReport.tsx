'use client'

import type {
  ExecutiveBusinessReport,
  ExecReportAction,
  ExecReportRiskFlag,
  ExecReportOption,
  ExecReportImpactMetric,
  ExecReportRoadmapPhase,
  ExecReportConfidenceDimension,
} from '@/lib/executive-report/types'

// ── COLOR HELPERS ──────────────────────────────────────────────────────────

function trustColor(band: string): string {
  if (band === 'VERY_HIGH') return '#10B981'
  if (band === 'HIGH')      return '#0EA5E9'
  if (band === 'MEDIUM')    return '#F59E0B'
  return '#EF4444'
}

function riskColor(risk: string): string {
  if (risk === 'LOW')    return '#10B981'
  if (risk === 'MEDIUM') return '#F59E0B'
  return '#EF4444'
}

function bandBg(band: string): string {
  if (band === 'VERY_HIGH') return '#D1FAE5'
  if (band === 'HIGH')      return '#E0F2FE'
  if (band === 'MEDIUM')    return '#FEF3C7'
  return '#FEE2E2'
}

function riskBg(risk: string): string {
  if (risk === 'LOW')    return '#D1FAE5'
  if (risk === 'MEDIUM') return '#FEF3C7'
  return '#FEE2E2'
}

function severityColor(s: string): string {
  if (s === 'HIGH')   return '#EF4444'
  if (s === 'MEDIUM') return '#F59E0B'
  return '#10B981'
}

// ── STYLES ─────────────────────────────────────────────────────────────────

const styles = `
  .sr-wrap { background: #F8F9FB; min-height: 100vh; font-family: 'Inter','Cairo','Segoe UI',sans-serif; }

  /* ── header ── */
  .sr-header { background: linear-gradient(135deg,#0F0520 0%,#2D0A3E 40%,#4A1042 80%,#1A0520 100%); padding: 0; }
  .sr-header-inner { max-width: 900px; margin: 0 auto; padding: 20px 20px 0; }
  .sr-header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-bottom: 16px; }
  .sr-brand-tag { font-size: 9px; font-weight: 900; letter-spacing: 3px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 4px; }
  .sr-brand-name { font-size: 13px; font-weight: 900; color: rgba(255,255,255,0.85); letter-spacing: 0.5px; }
  .sr-report-meta { text-align: right; }
  .sr-report-type { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
  .sr-report-entity { font-size: 15px; font-weight: 900; color: #fff; }
  .sr-report-date { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 3px; }

  .sr-actions { display: flex; gap: 8px; padding: 0 0 18px; flex-wrap: wrap; }
  .sr-action-btn { padding: 7px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1.5px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); font-family: inherit; transition: all 0.15s; }
  .sr-action-btn:hover { background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.35); }
  .sr-action-btn.accent { background: rgba(124,58,237,0.4); border-color: #7C3AED; color: #fff; }
  .sr-action-btn.accent:hover { background: rgba(124,58,237,0.6); }

  /* ── body ── */
  .sr-body { max-width: 900px; margin: 0 auto; padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 12px; }

  /* ── section card ── */
  .sr-card { background: #fff; border: 1.5px solid #E8ECF1; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .sr-card-head { padding: 12px 18px 10px; border-bottom: 1px solid #F1F4F8; display: flex; align-items: flex-start; gap: 10px; }
  .sr-card-accent { width: 3px; border-radius: 2px; flex-shrink: 0; align-self: stretch; }
  .sr-card-head-text { flex: 1; }
  .sr-card-section-id { font-size: 9px; font-weight: 900; letter-spacing: 2.5px; color: #94A3B8; text-transform: uppercase; margin-bottom: 2px; }
  .sr-card-question { font-size: 13px; font-weight: 800; color: #0F172A; }
  .sr-card-body { padding: 16px 18px; }

  /* ── verdict / executive summary ── */
  .sr-verdict-card { border-radius: 14px; padding: 18px 20px; border: 2px solid; }
  .sr-verdict-headline { font-size: 20px; font-weight: 900; line-height: 1.25; margin-bottom: 8px; }
  .sr-verdict-summary { font-size: 13px; line-height: 1.7; color: #334155; margin-bottom: 12px; }
  .sr-verdict-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .sr-chip { font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 20px; }

  /* ── recommendation ── */
  .sr-rec-option { font-size: 22px; font-weight: 900; color: #0F172A; margin-bottom: 6px; }
  .sr-rec-rationale { font-size: 13px; color: #475569; line-height: 1.65; margin-bottom: 12px; }
  .sr-rec-meta { display: flex; gap: 10px; flex-wrap: wrap; }
  .sr-rec-meta-item { font-size: 11px; color: #64748B; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 4px 10px; }
  .sr-rec-meta-item strong { color: #0F172A; }

  /* ── trust score ── */
  .sr-trust-layout { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
  .sr-trust-gauge { text-align: center; flex-shrink: 0; }
  .sr-trust-number { font-size: 56px; font-weight: 900; line-height: 1; }
  .sr-trust-denom { font-size: 16px; color: #94A3B8; font-weight: 600; }
  .sr-trust-band { font-size: 11px; font-weight: 900; letter-spacing: 2px; margin-top: 4px; padding: 3px 12px; border-radius: 20px; display: inline-block; }
  .sr-trust-bar-wrap { margin-top: 10px; width: 120px; }
  .sr-trust-bar-track { height: 6px; background: #F1F4F8; border-radius: 3px; overflow: hidden; }
  .sr-trust-bar-fill { height: 6px; border-radius: 3px; }
  .sr-trust-info { flex: 1; min-width: 200px; }
  .sr-trust-interp { font-size: 13px; color: #334155; line-height: 1.65; margin-bottom: 12px; padding: 12px 14px; background: #F8FAFC; border-left: 3px solid; border-radius: 0 8px 8px 0; }
  .sr-trust-rule { font-size: 11px; color: #64748B; display: flex; align-items: center; gap: 6px; }
  .sr-trust-rule-badge { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 20px; }

  /* ── confidence ── */
  .sr-conf-overall { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #F1F4F8; }
  .sr-conf-overall-num { font-size: 36px; font-weight: 900; color: #0F172A; line-height: 1; }
  .sr-conf-overall-pct { font-size: 18px; color: #94A3B8; font-weight: 600; }
  .sr-conf-band { font-size: 12px; font-weight: 800; padding: 3px 10px; border-radius: 20px; }
  .sr-dim-row { margin-bottom: 12px; }
  .sr-dim-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
  .sr-dim-name { font-weight: 600; color: #334155; }
  .sr-dim-score { font-weight: 800; color: #0F172A; }
  .sr-dim-track { height: 6px; background: #F1F4F8; border-radius: 3px; overflow: hidden; margin-bottom: 2px; }
  .sr-dim-fill { height: 6px; border-radius: 3px; }
  .sr-dim-factor { font-size: 10px; color: #94A3B8; }
  .sr-conf-footer { display: flex; gap: 16px; margin-top: 8px; padding-top: 10px; border-top: 1px solid #F1F4F8; font-size: 11px; color: #64748B; }
  .sr-conf-footer-item strong { color: #0F172A; font-weight: 700; }

  /* ── evidence ── */
  .sr-evidence-stats { display: grid; grid-template-columns: repeat(auto-fit,minmax(110px,1fr)); gap: 8px; margin-bottom: 14px; }
  .sr-ev-stat { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 9px; padding: 10px 12px; text-align: center; }
  .sr-ev-stat-num { font-size: 22px; font-weight: 900; color: #0F172A; line-height: 1; }
  .sr-ev-stat-label { font-size: 10px; color: #64748B; margin-top: 3px; }
  .sr-ev-items { display: flex; flex-direction: column; gap: 6px; }
  .sr-ev-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; }
  .sr-ev-source { font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #7C3AED; background: #F0E8FF; padding: 2px 7px; border-radius: 4px; flex-shrink: 0; text-transform: uppercase; }
  .sr-ev-title { font-size: 12px; font-weight: 600; color: #0F172A; flex: 1; }
  .sr-ev-meta { font-size: 10px; color: #94A3B8; flex-shrink: 0; }

  /* ── business analysis ── */
  .sr-biz-summary { font-size: 13px; color: #334155; line-height: 1.7; margin-bottom: 14px; padding: 12px 14px; background: #F8FAFC; border-radius: 9px; }
  .sr-swot { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .sr-swot-q { border-radius: 10px; padding: 12px; border: 1.5px solid; }
  .sr-swot-label { font-size: 10px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
  .sr-swot-items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
  .sr-swot-li { font-size: 11px; color: #334155; display: flex; gap: 6px; line-height: 1.45; }
  .sr-swot-dot { flex-shrink: 0; margin-top: 3px; font-size: 9px; }
  @media (max-width: 540px) { .sr-swot { grid-template-columns: 1fr; } }

  /* ── risk ── */
  .sr-risk-banner { border-radius: 10px; padding: 14px 16px; border: 2px solid; display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .sr-risk-level-num { font-size: 36px; font-weight: 900; line-height: 1; }
  .sr-risk-level-label { font-size: 16px; font-weight: 800; }
  .sr-risk-level-sub { font-size: 11px; margin-top: 3px; }
  .sr-risk-flags { display: flex; flex-direction: column; gap: 8px; }
  .sr-risk-flag { border-left: 3px solid; padding: 10px 12px; background: #F8FAFC; border-radius: 0 8px 8px 0; }
  .sr-risk-flag-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .sr-risk-sev { font-size: 9px; font-weight: 900; letter-spacing: 1px; padding: 2px 7px; border-radius: 4px; color: #fff; text-transform: uppercase; }
  .sr-risk-flag-title { font-size: 12px; font-weight: 800; color: #0F172A; }
  .sr-risk-flag-desc { font-size: 11px; color: #475569; line-height: 1.5; margin-bottom: 6px; }
  .sr-risk-flag-mit { font-size: 11px; color: #0F172A; display: flex; gap: 6px; align-items: flex-start; }
  .sr-risk-mit-label { font-size: 9px; font-weight: 900; color: #7C3AED; background: #F0E8FF; padding: 2px 6px; border-radius: 3px; flex-shrink: 0; margin-top: 1px; }

  /* ── options ── */
  .sr-options { display: flex; flex-direction: column; gap: 6px; }
  .sr-option-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1.5px solid; border-radius: 10px; }
  .sr-option-row.recommended { border-color: #7C3AED; background: #FDFAFF; }
  .sr-option-row.blocked { opacity: 0.5; }
  .sr-option-star { font-size: 16px; flex-shrink: 0; width: 22px; }
  .sr-option-info { flex: 1; min-width: 0; }
  .sr-option-label { font-size: 13px; font-weight: 800; color: #0F172A; }
  .sr-option-desc { font-size: 11px; color: #64748B; margin-top: 2px; }
  .sr-option-score { text-align: right; flex-shrink: 0; }
  .sr-option-score-num { font-size: 18px; font-weight: 900; color: #0F172A; }
  .sr-option-score-label { font-size: 9px; color: #94A3B8; }

  /* ── business impact ── */
  .sr-impact-summary { font-size: 13px; color: #334155; line-height: 1.65; margin-bottom: 14px; padding: 12px 14px; background: #F8FAFC; border-radius: 9px; }
  .sr-impact-metrics { display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 8px; }
  .sr-impact-metric { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 12px 14px; }
  .sr-impact-metric-val { font-size: 18px; font-weight: 900; color: #4A1042; line-height: 1.2; }
  .sr-impact-metric-name { font-size: 11px; color: #64748B; margin-top: 4px; }
  .sr-impact-metric-time { font-size: 10px; color: #94A3B8; }

  /* ── actions ── */
  .sr-actions-list { display: flex; flex-direction: column; gap: 10px; }
  .sr-action-row { display: flex; gap: 12px; align-items: flex-start; }
  .sr-action-num { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#4A1042,#7C3AED); color: #fff; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .sr-action-body { flex: 1; }
  .sr-action-text { font-size: 13px; font-weight: 700; color: #0F172A; line-height: 1.5; margin-bottom: 5px; }
  .sr-action-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .sr-action-chip { font-size: 10px; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
  .sr-action-chip.time { background: #E0F2FE; color: #0369A1; }
  .sr-action-chip.impact { background: #D1FAE5; color: #047857; }

  /* ── roadmap ── */
  .sr-phases { display: flex; flex-direction: column; gap: 10px; }
  .sr-phase { border: 1.5px solid #E2E8F0; border-radius: 11px; overflow: hidden; }
  .sr-phase-head { background: linear-gradient(135deg,#FAF5FF,#F8F6F3); border-bottom: 1px solid #E2E8F0; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
  .sr-phase-num { width: 24px; height: 24px; border-radius: 50%; background: #4A1042; color: #fff; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sr-phase-title { font-size: 13px; font-weight: 800; color: #0F172A; flex: 1; }
  .sr-phase-budget { font-size: 11px; font-weight: 700; color: #7C3AED; background: #F0E8FF; padding: 2px 8px; border-radius: 12px; }
  .sr-phase-body { padding: 12px 14px; }
  .sr-phase-actions { list-style: none; padding: 0; margin: 0 0 8px; display: flex; flex-direction: column; gap: 4px; }
  .sr-phase-action { font-size: 11px; color: #334155; display: flex; gap: 6px; line-height: 1.4; }
  .sr-phase-dot { color: #7C3AED; flex-shrink: 0; font-size: 9px; margin-top: 3px; }
  .sr-phase-kpi { font-size: 11px; color: #047857; background: #D1FAE5; border-radius: 6px; padding: 5px 9px; display: inline-flex; gap: 6px; align-items: center; }

  /* ── ceo notes ── */
  .sr-ceo-note { font-size: 14px; line-height: 1.8; color: #1E293B; padding: 16px 18px; background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 0 10px 10px 0; }
  .sr-ceo-rec { margin-top: 12px; font-size: 13px; line-height: 1.7; color: #334155; padding: 12px 14px; background: #F0E8FF; border-left: 4px solid #7C3AED; border-radius: 0 9px 9px 0; }

  /* ── conclusion ── */
  .sr-conclusion { font-size: 14px; font-weight: 700; color: #0F172A; line-height: 1.7; background: linear-gradient(135deg,#F0E8FF 0%,#E0F2FE 100%); padding: 18px 20px; border-radius: 12px; border: 1.5px solid #C4B5FD; }

  /* ── appendix (details) ── */
  .sr-appendix-toggle { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 11px; overflow: hidden; }
  .sr-appendix-summary { padding: 12px 16px; cursor: pointer; font-size: 12px; font-weight: 700; color: #64748B; list-style: none; display: flex; align-items: center; justify-content: space-between; }
  .sr-appendix-summary:hover { color: #0F172A; background: #F1F4F8; }
  .sr-appendix-body { padding: 12px 16px; border-top: 1px solid #E2E8F0; }
  .sr-appendix-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 6px; }
  .sr-appendix-kv { display: flex; flex-direction: column; gap: 1px; }
  .sr-appendix-key { font-size: 9px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
  .sr-appendix-val { font-size: 11px; color: #0F172A; font-family: monospace; }

  /* ── divider ── */
  .sr-divider { height: 1px; background: #E8ECF1; margin: 4px 0; }

  /* ── print ── */
  @media print {
    .sr-actions { display: none !important; }
    .sr-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sr-card { break-inside: avoid; box-shadow: none; }
    body { background: white !important; }
    @page { margin: 15mm; size: A4 portrait; }
  }

  @media (max-width: 600px) {
    .sr-trust-layout { flex-direction: column; }
    .sr-trust-gauge { display: flex; align-items: center; gap: 16px; }
    .sr-trust-bar-wrap { margin-top: 0; }
  }
`

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function SectionCard({
  id,
  question,
  accentColor,
  children,
}: {
  id: string
  question: string
  accentColor: string
  children: React.ReactNode
}) {
  return (
    <div className="sr-card">
      <div className="sr-card-head">
        <div className="sr-card-accent" style={{ background: accentColor }} />
        <div className="sr-card-head-text">
          <div className="sr-card-section-id">{id}</div>
          <div className="sr-card-question">{question}</div>
        </div>
      </div>
      <div className="sr-card-body">{children}</div>
    </div>
  )
}

function ConfidenceDimensionBar({ dim }: { dim: ExecReportConfidenceDimension }) {
  const pct = Math.round(dim.weightedScore * 100 / 20)
  const fillColor = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <div className="sr-dim-row">
      <div className="sr-dim-header">
        <span className="sr-dim-name">{dim.name}</span>
        <span className="sr-dim-score" style={{ color: fillColor }}>
          {Math.round(dim.rawScore)}
          <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: 10 }}>/100</span>
        </span>
      </div>
      <div className="sr-dim-track">
        <div className="sr-dim-fill" style={{ width: `${Math.min(dim.rawScore, 100)}%`, background: fillColor }} />
      </div>
      <div className="sr-dim-factor">{dim.primaryFactor.replace(/_/g, ' ')}</div>
    </div>
  )
}

function RiskFlagCard({ flag }: { flag: ExecReportRiskFlag }) {
  const sc = severityColor(flag.severity)
  return (
    <div className="sr-risk-flag" style={{ borderLeftColor: sc }}>
      <div className="sr-risk-flag-header">
        <span className="sr-risk-sev" style={{ background: sc }}>{flag.severity}</span>
        <span className="sr-risk-flag-title">{flag.title}</span>
      </div>
      <div className="sr-risk-flag-desc">{flag.description}</div>
      {flag.mitigation && (
        <div className="sr-risk-flag-mit">
          <span className="sr-risk-mit-label">MITIGATION</span>
          <span style={{ color: '#475569' }}>{flag.mitigation}</span>
        </div>
      )}
    </div>
  )
}

function OptionRow({ opt }: { opt: ExecReportOption }) {
  const borderColor = opt.isRecommended ? '#7C3AED' : opt.isBlocked ? '#EF4444' : '#E2E8F0'
  return (
    <div
      className={`sr-option-row${opt.isRecommended ? ' recommended' : opt.isBlocked ? ' blocked' : ''}`}
      style={{ borderColor }}
    >
      <div className="sr-option-star">
        {opt.isRecommended ? '★' : opt.isBlocked ? '✗' : '○'}
      </div>
      <div className="sr-option-info">
        <div className="sr-option-label">{opt.label}</div>
        {opt.description && <div className="sr-option-desc">{opt.description}</div>}
      </div>
      <div className="sr-option-score">
        <div className="sr-option-score-num">{opt.ruleScore}</div>
        <div className="sr-option-score-label">score</div>
      </div>
      {opt.isRecommended && (
        <span className="sr-chip" style={{ background: '#F0E8FF', color: '#7C3AED', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 12 }}>
          RECOMMENDED
        </span>
      )}
      {opt.isBlocked && (
        <span className="sr-chip" style={{ background: '#FEE2E2', color: '#EF4444', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 12 }}>
          BLOCKED
        </span>
      )}
    </div>
  )
}

function ActionItem({ action, idx }: { action: ExecReportAction; idx: number }) {
  return (
    <div className="sr-action-row">
      <div className="sr-action-num">{action.priority || idx + 1}</div>
      <div className="sr-action-body">
        <div className="sr-action-text">{action.action || '—'}</div>
        <div className="sr-action-chips">
          {action.timeline && (
            <span className="sr-action-chip time">⏱ {action.timeline}</span>
          )}
          {action.impact && (
            <span className="sr-action-chip impact">📈 {action.impact}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function RoadmapPhaseCard({ phase, idx }: { phase: ExecReportRoadmapPhase; idx: number }) {
  return (
    <div className="sr-phase">
      <div className="sr-phase-head">
        <div className="sr-phase-num">{idx + 1}</div>
        <div className="sr-phase-title">{phase.title || `Phase ${idx + 1}`}</div>
        {phase.budget && <div className="sr-phase-budget">{phase.budget}</div>}
      </div>
      <div className="sr-phase-body">
        {phase.actions.length > 0 && (
          <ul className="sr-phase-actions">
            {phase.actions.filter(Boolean).map((a, i) => (
              <li key={i} className="sr-phase-action">
                <span className="sr-phase-dot">▸</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        )}
        {phase.kpi && (
          <div className="sr-phase-kpi">
            🎯 <span>{phase.kpi}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ImpactMetricCard({ m }: { m: ExecReportImpactMetric }) {
  return (
    <div className="sr-impact-metric">
      <div className="sr-impact-metric-val">{m.value}</div>
      <div className="sr-impact-metric-name">{m.metric}</div>
      {m.timeframe && <div className="sr-impact-metric-time">{m.timeframe}</div>}
    </div>
  )
}

const REPORT_TYPE_DISPLAY: Record<string, string> = {
  feasibility:   'Feasibility Study',
  campaign_roi:  'Campaign ROI Audit',
  market_entry:  'Market Entry Intel',
  lead_gen:      'Lead Generation Intel',
  full_analysis: 'Full Marketing Analysis',
}

function buildConclusion(report: ExecutiveBusinessReport): string {
  const { sections } = report
  const ts = sections.trustScore
  const fr = sections.finalRecommendation
  const ra = sections.riskAnalysis
  const ev = sections.evidence
  const actions = sections.recommendedActions

  const bandLabels: Record<string, string> = {
    VERY_HIGH: 'very high', HIGH: 'high', MEDIUM: 'moderate', LOW: 'low',
  }
  const bandLabel = bandLabels[ts.band] ?? ts.band.toLowerCase()

  const recPart = fr.option
    ? `recommends "${fr.option}" as the optimal path forward`
    : 'was unable to issue a definitive recommendation due to insufficient confidence'

  const riskPart = ra.overallRisk === 'LOW'
    ? 'The overall risk profile is low, and no critical blockers were identified.'
    : ra.overallRisk === 'MEDIUM'
    ? `There are ${ra.flags.length} risk flag(s) that should be reviewed before committing.`
    : `Caution is warranted — ${ra.flags.filter(f => f.severity === 'HIGH').length} high-severity risk(s) require immediate attention.`

  const firstAction = actions[0]?.action
  const actionPart = firstAction
    ? `The highest-priority action is: ${firstAction}`
    : 'The implementation roadmap provides a phased execution plan.'

  return `Based on ${ev.totalItems} evidence item(s) with a ${bandLabel} trust score of ${ts.score}/100, the Eunoia Decision Intelligence Platform ${recPart}. ${riskPart} ${actionPart}`
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function SignatureReport({
  executiveReport,
  narration,
  onBack,
  onRegen,
}: {
  executiveReport: ExecutiveBusinessReport
  narration: Record<string, unknown>
  onBack: () => void
  onRegen: () => void
}) {
  const { sections, reportType } = executiveReport
  const {
    executiveSummary, finalRecommendation, trustScore, decisionConfidence,
    evidence, businessAnalysis, riskAnalysis, alternativeOptions,
    recommendedActions, expectedBusinessImpact, implementationRoadmap, appendix,
  } = sections

  const tc = trustColor(trustScore.band)
  const rc = riskColor(riskAnalysis.overallRisk)
  const generatedAt = new Date(executiveSummary.generatedAt).toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  // AI narration fields for CEO Notes section
  const ceoNarrative  = typeof narration.executive_summary === 'string' ? narration.executive_summary : ''
  const ceoRec        = typeof narration.recommendation === 'string' ? narration.recommendation : ''

  const conclusion = buildConclusion(executiveReport)

  function exportPDF() {
    const style = document.createElement('style')
    style.id = '__sr_print'
    style.textContent = `@media print { body > * { visibility: hidden; } #sr-report-root, #sr-report-root * { visibility: visible; } #sr-report-root { position: fixed; top: 0; left: 0; width: 100%; } @page { margin: 15mm; } }`
    document.head.appendChild(style)
    const prev = document.title
    document.title = `${executiveSummary.recommendedOption ?? reportType} — Eunoia Decision Intelligence Report`
    window.print()
    setTimeout(() => {
      document.title = prev
      document.getElementById('__sr_print')?.remove()
    }, 1500)
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sr-wrap" id="sr-report-root">

        {/* ── Header ── */}
        <div className="sr-header">
          <div className="sr-header-inner">
            <div className="sr-header-top">
              <div>
                <div className="sr-brand-tag">EUNOIA</div>
                <div className="sr-brand-name">Decision Intelligence Platform · Executive Report</div>
              </div>
              <div className="sr-report-meta">
                <div className="sr-report-type">{REPORT_TYPE_DISPLAY[reportType] ?? reportType.replace(/_/g, ' ')}</div>
                <div className="sr-report-entity">
                  {executiveSummary.recommendedOption
                    ? `✓ ${executiveSummary.recommendedOption}`
                    : (appendix.decisionName || 'Decision Analysis')}
                </div>
                <div className="sr-report-date">{generatedAt}</div>
              </div>
            </div>

            <div className="sr-actions">
              <button className="sr-action-btn" onClick={onBack}>← New Assessment</button>
              <button className="sr-action-btn" onClick={() => { if (window.confirm('Regenerate this report? This will use AI credits and replace the current report.')) onRegen() }}>↺ Regenerate</button>
              <button className="sr-action-btn accent" onClick={exportPDF}>🖨 Print / PDF</button>
            </div>
            <div style={{ paddingBottom: 14, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              ✓ Report saved to My Reports —{' '}
              <a href="/dashboard/reports" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, textDecoration: 'underline' }}>
                View
              </a>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="sr-body">

          {/* S1: Executive Verdict */}
          <SectionCard id="SECTION 01" question="What is the bottom line?" accentColor="#4A1042">
            <div className="sr-verdict-card" style={{
              background: bandBg(trustScore.band),
              borderColor: tc,
            }}>
              <div className="sr-verdict-headline" style={{ color: tc }}>
                {executiveSummary.headline}
              </div>
              <div className="sr-verdict-summary">{executiveSummary.summary}</div>
              <div className="sr-verdict-chips">
                <span className="sr-chip" style={{ background: tc + '20', color: tc }}>
                  {executiveSummary.decisionStatus}
                </span>
                <span className="sr-chip" style={{ background: '#E8ECF1', color: '#475569' }}>
                  {executiveSummary.domain.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* S2: Strategic Recommendation */}
          <SectionCard id="SECTION 02" question="What should we do?" accentColor="#7C3AED">
            {finalRecommendation.option ? (
              <>
                <div className="sr-rec-option">→ {finalRecommendation.option}</div>
                {finalRecommendation.rationale && (
                  <div className="sr-rec-rationale">{finalRecommendation.rationale}</div>
                )}
                <div className="sr-rec-meta">
                  <div className="sr-rec-meta-item">
                    Confidence: <strong>{finalRecommendation.confidenceScore}/100</strong>
                  </div>
                  <div className="sr-rec-meta-item">
                    Band: <strong>{finalRecommendation.confidenceBand}</strong>
                  </div>
                  <div className="sr-rec-meta-item">
                    Basis:{' '}
                    <strong>
                      {finalRecommendation.isRuleDetermined ? 'Rule-determined ✓' : 'AI-assisted'}
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="sr-rec-rationale" style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                {finalRecommendation.rationale}
              </div>
            )}
          </SectionCard>

          {/* S3 + S4: Trust & Confidence (side-by-side feel via two cards) */}
          <SectionCard id="SECTION 03" question="How reliable is this analysis?" accentColor={tc}>
            <div className="sr-trust-layout">
              <div className="sr-trust-gauge">
                <div className="sr-trust-number" style={{ color: tc }}>
                  {trustScore.score}
                  <span className="sr-trust-denom">/100</span>
                </div>
                <div className="sr-trust-band" style={{ background: bandBg(trustScore.band), color: tc }}>
                  {trustScore.band.replace('_', ' ')}
                </div>
                <div className="sr-trust-bar-wrap">
                  <div className="sr-trust-bar-track">
                    <div className="sr-trust-bar-fill" style={{
                      width: `${trustScore.score}%`,
                      background: `linear-gradient(90deg, ${tc}88, ${tc})`,
                    }} />
                  </div>
                </div>
              </div>
              <div className="sr-trust-info">
                <div className="sr-trust-interp" style={{ borderLeftColor: tc }}>
                  {trustScore.interpretation}
                </div>
                <div className="sr-trust-rule">
                  <span className="sr-trust-rule-badge" style={{
                    background: finalRecommendation.isRuleDetermined ? '#D1FAE5' : '#E0F2FE',
                    color: finalRecommendation.isRuleDetermined ? '#047857' : '#0369A1',
                  }}>
                    {finalRecommendation.isRuleDetermined ? 'RULE-DETERMINED' : 'AI-ASSISTED'}
                  </span>
                  <span>
                    {finalRecommendation.isRuleDetermined
                      ? 'Recommendation derived from deterministic business rules.'
                      : 'Recommendation guided by AI analysis of available evidence.'}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard id="SECTION 04" question="What drives this confidence level?" accentColor="#0EA5E9">
            <div className="sr-conf-overall">
              <div className="sr-conf-overall-num">{decisionConfidence.overall}</div>
              <div className="sr-conf-overall-pct">/ 100</div>
              <span className="sr-conf-band" style={{ background: bandBg(decisionConfidence.band), color: trustColor(decisionConfidence.band) }}>
                {decisionConfidence.band}
              </span>
            </div>
            {decisionConfidence.dimensions.map((d, i) => (
              <ConfidenceDimensionBar key={i} dim={d} />
            ))}
            {(decisionConfidence.weakestDimension || decisionConfidence.strongestDimension) && (
              <div className="sr-conf-footer">
                {decisionConfidence.weakestDimension && (
                  <div>Weakest: <strong>{decisionConfidence.weakestDimension}</strong></div>
                )}
                {decisionConfidence.strongestDimension && (
                  <div>Strongest: <strong>{decisionConfidence.strongestDimension}</strong></div>
                )}
              </div>
            )}
          </SectionCard>

          {/* S5: Evidence */}
          <SectionCard id="SECTION 05" question="What data supports this decision?" accentColor="#8B5CF6">
            <div className="sr-evidence-stats">
              <div className="sr-ev-stat">
                <div className="sr-ev-stat-num">{evidence.totalItems}</div>
                <div className="sr-ev-stat-label">Evidence Items</div>
              </div>
              <div className="sr-ev-stat">
                <div className="sr-ev-stat-num" style={{ color: '#10B981' }}>
                  {Math.round(evidence.averageFreshness * 100)}%
                </div>
                <div className="sr-ev-stat-label">Avg Freshness</div>
              </div>
              <div className="sr-ev-stat">
                <div className="sr-ev-stat-num" style={{ color: '#0EA5E9' }}>
                  {Math.round(evidence.averageConfidence * 100)}%
                </div>
                <div className="sr-ev-stat-label">Avg Confidence</div>
              </div>
              <div className="sr-ev-stat">
                <div className="sr-ev-stat-num" style={{ color: evidence.contradictionCount > 0 ? '#F59E0B' : '#10B981' }}>
                  {evidence.contradictionCount}
                </div>
                <div className="sr-ev-stat-label">Contradictions</div>
              </div>
            </div>
            {evidence.items.length > 0 && (
              <div className="sr-ev-items">
                {evidence.items.slice(0, 5).map((item, i) => (
                  <div key={i} className="sr-ev-item">
                    <span className="sr-ev-source">{item.source}</span>
                    <span className="sr-ev-title">{item.title}</span>
                    <span className="sr-ev-meta">
                      {Math.round(item.confidence * 100)}% conf
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* S6: Business Analysis */}
          {(businessAnalysis.summary || businessAnalysis.swot || businessAnalysis.marketOverview || businessAnalysis.performanceData) && (
            <SectionCard id="SECTION 06" question="What is the market and business context?" accentColor="#10B981">
              {businessAnalysis.summary && (
                <div className="sr-biz-summary" dir="rtl">{businessAnalysis.summary}</div>
              )}
              {businessAnalysis.swot && (() => {
                const swot = businessAnalysis.swot
                const quadrants = [
                  { items: swot.strengths,     label: '💪 Strengths',     color: '#10B981', bg: '#D1FAE5', border: '#6EE7B7' },
                  { items: swot.weaknesses,    label: '⚠ Weaknesses',    color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5' },
                  { items: swot.opportunities, label: '🚀 Opportunities', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
                  { items: swot.threats,       label: '🛡 Threats',       color: '#7C3AED', bg: '#F0E8FF', border: '#C4B5FD' },
                ]
                return (
                  <div className="sr-swot">
                    {quadrants.map(q => {
                      if (!q.items.length) return null
                      return (
                        <div key={q.label} className="sr-swot-q" style={{ background: q.bg, borderColor: q.border }}>
                          <div className="sr-swot-label" style={{ color: q.color }}>{q.label}</div>
                          <ul className="sr-swot-items">
                            {q.items.slice(0, 3).map((item, i) => (
                              <li key={i} className="sr-swot-li">
                                <span className="sr-swot-dot" style={{ color: q.color }}>▸</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </SectionCard>
          )}

          {/* S7: Risk Assessment */}
          <SectionCard id="SECTION 07" question="What could go wrong?" accentColor={rc}>
            <div className="sr-risk-banner" style={{ background: riskBg(riskAnalysis.overallRisk), borderColor: rc }}>
              <div>
                <div className="sr-risk-level-num" style={{ color: rc }}>{riskAnalysis.overallRisk}</div>
                <div className="sr-risk-level-label" style={{ color: rc }}>Overall Risk</div>
                <div className="sr-risk-level-sub" style={{ color: rc + 'AA' }}>
                  Validation: {riskAnalysis.validationStatus}
                </div>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: '#475569' }}>
                {riskAnalysis.flags.length === 0
                  ? 'No risk flags identified. All validation checks passed cleanly.'
                  : `${riskAnalysis.flags.length} risk flag(s) identified across the decision analysis.`}
              </div>
            </div>
            {riskAnalysis.flags.length > 0 && (
              <div className="sr-risk-flags">
                {riskAnalysis.flags.map((flag, i) => <RiskFlagCard key={i} flag={flag} />)}
              </div>
            )}
          </SectionCard>

          {/* S8: Alternative Options */}
          {alternativeOptions.length > 0 && (
            <SectionCard id="SECTION 08" question="What else could we do?" accentColor="#64748B">
              <div className="sr-options">
                {alternativeOptions.map((opt, i) => <OptionRow key={i} opt={opt} />)}
              </div>
            </SectionCard>
          )}

          {/* S9: Expected Business Impact */}
          {(expectedBusinessImpact.summary || expectedBusinessImpact.metrics.length > 0) && (
            <SectionCard id="SECTION 09" question="What outcome can we expect?" accentColor="#F59E0B">
              {expectedBusinessImpact.summary && (
                <div className="sr-impact-summary">{expectedBusinessImpact.summary}</div>
              )}
              {expectedBusinessImpact.metrics.length > 0 && (
                <div className="sr-impact-metrics">
                  {expectedBusinessImpact.metrics.map((m, i) => <ImpactMetricCard key={i} m={m} />)}
                </div>
              )}
            </SectionCard>
          )}

          {/* S10: Executive Action Plan */}
          {recommendedActions.length > 0 && (
            <SectionCard id="SECTION 10" question="What do we do first?" accentColor="#4A1042">
              <div className="sr-actions-list">
                {recommendedActions.map((action, i) => <ActionItem key={i} action={action} idx={i} />)}
              </div>
            </SectionCard>
          )}

          {/* S11: Implementation Timeline */}
          {implementationRoadmap.phases.length > 0 && (
            <SectionCard id="SECTION 11" question="What does the execution plan look like?" accentColor="#7C3AED">
              <div className="sr-phases">
                {implementationRoadmap.phases.map((phase, i) => (
                  <RoadmapPhaseCard key={i} phase={phase} idx={i} />
                ))}
              </div>
            </SectionCard>
          )}

          {/* S12: CEO Notes — AI business narrative */}
          {(ceoNarrative || ceoRec) && (
            <SectionCard id="SECTION 12" question="What does leadership need to know?" accentColor="#F59E0B">
              {ceoNarrative && (
                <div className="sr-ceo-note" dir="rtl">{ceoNarrative}</div>
              )}
              {ceoRec && (
                <div className="sr-ceo-rec" dir="rtl">{ceoRec}</div>
              )}
            </SectionCard>
          )}

          {/* Final Business Conclusion */}
          <div className="sr-conclusion">
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '2px', color: '#7C3AED', textTransform: 'uppercase', marginBottom: 8 }}>
              FINAL BUSINESS CONCLUSION
            </div>
            {conclusion}
          </div>

          {/* Appendix (collapsed) */}
          <details className="sr-appendix-toggle">
            <summary className="sr-appendix-summary">
              <span>Appendix — Report Metadata</span>
              <span>▾</span>
            </summary>
            <div className="sr-appendix-body">
              <div className="sr-appendix-grid">
                <div className="sr-appendix-kv">
                  <div className="sr-appendix-key">Report ID</div>
                  <div className="sr-appendix-val">{appendix.reportId}</div>
                </div>
                <div className="sr-appendix-kv">
                  <div className="sr-appendix-key">Decision ID</div>
                  <div className="sr-appendix-val">{appendix.decisionId}</div>
                </div>
                <div className="sr-appendix-kv">
                  <div className="sr-appendix-key">Engine</div>
                  <div className="sr-appendix-val">{appendix.generatedBy}</div>
                </div>
                <div className="sr-appendix-kv">
                  <div className="sr-appendix-key">Schema Version</div>
                  <div className="sr-appendix-val">{appendix.schemaVersion}</div>
                </div>
                <div className="sr-appendix-kv">
                  <div className="sr-appendix-key">Domain</div>
                  <div className="sr-appendix-val">{appendix.domain}</div>
                </div>
                <div className="sr-appendix-kv">
                  <div className="sr-appendix-key">Rules Evaluated</div>
                  <div className="sr-appendix-val">{appendix.ruleEvaluationCount}</div>
                </div>
                <div className="sr-appendix-kv">
                  <div className="sr-appendix-key">Validation Stages</div>
                  <div className="sr-appendix-val">{appendix.validationStageCount}</div>
                </div>
                <div className="sr-appendix-kv">
                  <div className="sr-appendix-key">Executive Report</div>
                  <div className="sr-appendix-val">v{executiveReport.schemaVersion}</div>
                </div>
              </div>
            </div>
          </details>

        </div>
      </div>
    </>
  )
}
