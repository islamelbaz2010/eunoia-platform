'use client'
import { useState } from 'react'

type ReportType = 'feasibility' | 'campaign_roi' | 'market_entry' | 'lead_gen' | 'full_analysis'

// ── DESIGN TOKENS (matching halannews.com) ────────────────────────
const styles = `
  .ei-page { background: #FAF5EF; min-height: 100vh; font-family: 'Inter','Cairo','Segoe UI',sans-serif; }
  .ei-topbar { background: linear-gradient(135deg, #2D0A3E 0%, #4A1042 50%, #1A0520 100%); padding: 20px 24px; }
  .ei-topbar-inner { max-width: 860px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .ei-brand { color: #fff; }
  .ei-brand-tag { font-size: 10px; font-weight: 800; letter-spacing: 3px; color: rgba(255,255,255,0.35); text-transform: uppercase; margin-bottom: 4px; }
  .ei-brand-title { font-size: 22px; font-weight: 900; line-height: 1; }
  .ei-brand-sub { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 4px; }
  .ei-lang-toggle { display: flex; gap: 6px; }
  .ei-lang-btn { padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1.5px solid rgba(255,255,255,0.2); background: transparent; color: rgba(255,255,255,0.5); transition: all 0.15s; }
  .ei-lang-btn.active { background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.4); }

  .ei-body { max-width: 860px; margin: 0 auto; padding: 24px 16px; }

  .ei-section-label { font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #9A9090; text-transform: uppercase; margin-bottom: 12px; padding-right: 4px; }

  .ei-card-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .ei-report-card { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 14px; position: relative; }
  .ei-report-card:hover { border-color: #7C3AED; box-shadow: 0 2px 8px rgba(124,58,237,0.08); transform: translateY(-1px); }
  .ei-report-card.selected { border-color: #7C3AED; background: #FAF5FF; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .ei-card-icon { font-size: 26px; flex-shrink: 0; width: 44px; height: 44px; background: #F8F6F3; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .ei-card-content { flex: 1; min-width: 0; }
  .ei-card-title-ar { font-size: 14px; font-weight: 800; color: #1A1018; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ei-card-title-en { font-size: 11px; color: #9A9090; font-weight: 500; margin-top: 1px; }
  .ei-card-desc { font-size: 11px; color: #6B6560; margin-top: 4px; line-height: 1.5; }
  .ei-card-time { font-size: 10px; color: #9A9090; flex-shrink: 0; white-space: nowrap; }
  .ei-badge { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 20px; color: #fff; }

  .ei-form-panel { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
  .ei-form-header { background: linear-gradient(135deg, #FAF5FF 0%, #F8F6F3 100%); border-bottom: 1px solid #E8E2DA; padding: 14px 18px; display: flex; align-items: center; gap: 12px; }
  .ei-form-header-icon { font-size: 22px; }
  .ei-form-header-title { font-weight: 800; font-size: 15px; color: #1A1018; }
  .ei-form-header-sub { font-size: 11px; color: #9A9090; margin-top: 1px; }
  .ei-form-close { margin-right: auto; width: 28px; height: 28px; border-radius: 50%; border: none; background: #F0E8DF; cursor: pointer; color: #6B6560; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .ei-form-body { padding: 18px; }

  .ei-section-title { font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #7C3AED; text-transform: uppercase; border-bottom: 1px solid #E8E2DA; padding-bottom: 6px; margin-bottom: 12px; margin-top: 16px; }
  .ei-section-title:first-child { margin-top: 0; }

  .ei-field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ei-field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .ei-field { display: flex; flex-direction: column; gap: 4px; }
  .ei-label { font-size: 11px; font-weight: 700; color: #6B6560; }
  .ei-label-hint { font-size: 10px; color: #9A9090; font-weight: 400; }
  .ei-input { background: #FAF5EF; border: 1.5px solid #E8E2DA; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #1A1018; outline: none; transition: all 0.15s; font-family: inherit; width: 100%; box-sizing: border-box; }
  .ei-input:focus { border-color: #7C3AED; background: #fff; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .ei-input::placeholder { color: #B0A9A2; }

  .ei-optional-box { border: 1.5px dashed #D5CCBF; border-radius: 10px; padding: 14px; background: #FAF8F5; margin-top: 12px; }
  .ei-optional-label { font-size: 10px; font-weight: 800; color: #9A9090; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
  .ei-optional-label span { font-weight: 400; color: #B0A9A2; }

  .ei-submit-btn { width: 100%; padding: 13px; background: linear-gradient(135deg, #4A1042 0%, #7C3AED 100%); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.15s; margin-top: 16px; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(74,16,66,0.25); }
  .ei-submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(74,16,66,0.3); }
  .ei-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .ei-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .ei-skeleton { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 14px; padding: 20px; }
  .ei-skel-bar { background: linear-gradient(90deg, #F0E8DF 25%, #FAF5EF 50%, #F0E8DF 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .ei-error { background: #FCE8EC; border: 1.5px solid #D4183D; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #A01030; margin-top: 12px; display: flex; gap: 8px; }

  .ei-report { }
  .ei-report-actions { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .ei-action-btn { flex: 1; min-width: 80px; padding: 10px 12px; border-radius: 9px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid #E8E2DA; background: #fff; color: #6B6560; transition: all 0.15s; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .ei-action-btn:hover { border-color: #7C3AED; color: #7C3AED; background: #FAF5FF; }
  .ei-action-btn.green { background: #0D9488; color: #fff; border-color: #0D9488; }
  .ei-action-btn.green:hover { opacity: 0.9; }
  .ei-action-btn.red { background: #D4183D; color: #fff; border-color: #D4183D; }
  .ei-action-btn.red:hover { opacity: 0.9; }

  .ei-report-header { background: linear-gradient(135deg, #2D0A3E 0%, #4A1042 60%, #6B1060 100%); border-radius: 14px; padding: 20px; color: #fff; margin-bottom: 12px; }
  .ei-rh-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .ei-rh-tag { font-size: 9px; font-weight: 800; letter-spacing: 2.5px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 6px; }
  .ei-rh-title { font-size: 20px; font-weight: 900; line-height: 1.2; }
  .ei-rh-company { font-size: 13px; color: rgba(255,255,255,0.55); margin-top: 4px; }
  .ei-rh-conf { text-align: left; flex-shrink: 0; }
  .ei-rh-conf-pct { font-size: 38px; font-weight: 900; line-height: 1; }
  .ei-rh-conf-label { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .ei-rh-conf-badge { font-size: 11px; margin-top: 4px; }
  .ei-rh-reason { font-size: 11px; color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.08); border-radius: 7px; padding: 8px 10px; margin-top: 12px; }

  .ei-verdict { border-radius: 12px; padding: 14px 16px; border: 2px solid; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .ei-verdict-icon { font-size: 26px; flex-shrink: 0; }
  .ei-verdict-text { font-size: 18px; font-weight: 900; }
  .ei-verdict-reason { font-size: 13px; margin-top: 4px; line-height: 1.5; }

  .ei-section { background: #fff; border: 1.5px solid #E8E2DA; border-radius: 12px; overflow: hidden; margin-bottom: 10px; }
  .ei-section-head { background: #F8F6F3; border-bottom: 1px solid #E8E2DA; padding: 10px 16px; }
  .ei-section-head-title { font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #6B6560; text-transform: uppercase; }
  .ei-section-body { padding: 14px 16px; }

  .ei-kv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ei-kv-item { background: #FAF5EF; border-radius: 8px; padding: 10px 12px; border: 1px solid #E8E2DA; }
  .ei-kv-label { font-size: 10px; color: #9A9090; margin-bottom: 3px; }
  .ei-kv-value { font-size: 13px; font-weight: 700; color: #4A1042; line-height: 1.3; }

  .ei-scenario-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .ei-scenario-card { border-radius: 10px; padding: 12px; text-align: center; border: 1.5px solid; }
  .ei-scenario-label { font-size: 11px; font-weight: 800; margin-bottom: 6px; }
  .ei-scenario-roi { font-size: 22px; font-weight: 900; }
  .ei-scenario-sub { font-size: 10px; color: #6B6560; margin-top: 4px; }

  .ei-bar-row { margin-bottom: 14px; }
  .ei-bar-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
  .ei-bar-label { font-weight: 600; color: #1A1018; }
  .ei-bar-value { font-weight: 800; }
  .ei-bar-track { height: 8px; background: #F0E8DF; border-radius: 4px; overflow: hidden; }
  .ei-bar-fill { height: 8px; border-radius: 4px; transition: width 0.5s ease; }
  .ei-bar-sub { font-size: 10px; color: #9A9090; margin-top: 3px; }

  .ei-actions-list { display: flex; flex-direction: column; gap: 10px; }
  .ei-action-item { display: flex; gap: 12px; align-items: flex-start; }
  .ei-action-num { width: 26px; height: 26px; border-radius: 50%; background: #4A1042; color: #fff; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .ei-action-body { flex: 1; }
  .ei-action-title { font-size: 13px; font-weight: 700; color: #1A1018; }
  .ei-action-meta { font-size: 11px; color: #9A9090; margin-top: 3px; display: flex; flex-wrap: wrap; gap: 8px; }

  .ei-swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ei-swot-card { border-radius: 10px; padding: 12px; }
  .ei-swot-title { font-size: 11px; font-weight: 800; margin-bottom: 8px; }
  .ei-swot-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
  .ei-swot-item { font-size: 11px; color: #1A1018; display: flex; gap: 6px; line-height: 1.4; }
  .ei-swot-dot { flex-shrink: 0; margin-top: 3px; }

  .ei-channel-card { border: 1.5px solid #E8E2DA; border-radius: 10px; padding: 12px; margin-bottom: 8px; }
  .ei-channel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .ei-channel-name { font-size: 13px; font-weight: 800; color: #1A1018; }
  .ei-channel-status { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 12px; }
  .ei-channel-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px; }
  .ei-channel-kv { font-size: 10px; color: #9A9090; }
  .ei-channel-kv strong { display: block; color: #1A1018; font-size: 11px; font-weight: 700; margin-top: 1px; }
  .ei-channel-tip { font-size: 11px; color: #4A1042; background: #F0E8EF; border-radius: 7px; padding: 7px 10px; }

  .ei-timeline-step { border: 1.5px solid #E8E2DA; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
  .ei-timeline-header { background: #F8F6F3; padding: 10px 14px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #E8E2DA; }
  .ei-timeline-num { width: 24px; height: 24px; border-radius: 50%; background: #4A1042; color: #fff; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ei-timeline-title { font-size: 13px; font-weight: 800; color: #4A1042; }
  .ei-timeline-body { padding: 12px 14px; }
  .ei-timeline-actions { list-style: none; padding: 0; margin: 0 0 8px; display: flex; flex-direction: column; gap: 4px; }
  .ei-timeline-action { font-size: 11px; color: #1A1018; display: flex; gap: 6px; line-height: 1.4; }
  .ei-timeline-dot { color: #7C3AED; flex-shrink: 0; }
  .ei-timeline-footer { display: flex; gap: 16px; padding-top: 8px; border-top: 1px solid #E8E2DA; }
  .ei-timeline-kv { font-size: 10px; color: #9A9090; }
  .ei-timeline-kv strong { color: #1A1018; font-weight: 700; }

  .ei-wa-box { border-radius: 10px; overflow: hidden; border: 1.5px solid; margin-bottom: 8px; }
  .ei-wa-header { padding: 8px 12px; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
  .ei-wa-body { padding: 10px 12px; font-size: 12px; line-height: 1.6; }
  .ei-wa-questions { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
  .ei-wa-q { font-size: 12px; display: flex; gap: 8px; }
  .ei-wa-qnum { color: #0D9488; font-weight: 800; flex-shrink: 0; }

  .ei-json-toggle { background: #F8F6F3; border: 1.5px solid #E8E2DA; border-radius: 10px; overflow: hidden; margin-top: 8px; }
  .ei-json-summary { padding: 12px 16px; cursor: pointer; font-size: 12px; font-weight: 600; color: #6B6560; list-style: none; display: flex; align-items: center; justify-content: space-between; }
  .ei-json-summary:hover { color: #1A1018; background: #F0E8DF; }
  .ei-json-pre { padding: 12px 16px; font-size: 10px; color: #6B6560; overflow: auto; max-height: 240px; background: #fff; font-family: monospace; direction: ltr; border-top: 1px solid #E8E2DA; margin: 0; }

  .ei-reality-table { width: 100%; border-collapse: collapse; }
  .ei-reality-row { border-bottom: 1px solid #F0E8DF; }
  .ei-reality-row:last-child { border-bottom: none; }
  .ei-reality-row td { padding: 10px 0; vertical-align: middle; }
  .ei-reality-item { font-size: 12px; font-weight: 600; color: #1A1018; }
  .ei-reality-vals { font-size: 10px; color: #9A9090; margin-top: 2px; }
  .ei-reality-badge { font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 12px; color: #fff; white-space: nowrap; }

  @media print {
    .ei-topbar, .ei-card-grid, .ei-form-panel, .ei-report-actions { display: none !important; }
    .ei-report-header { background: #4A1042 !important; -webkit-print-color-adjust: exact; }
    body { background: white !important; }
  }
`

// ── ARABIC / ENGLISH LABELS ──────────────────────────────────────
const LABELS: Record<string, { ar: string; en: string }> = {
  total_revenue:               { ar: 'إجمالي الإيرادات',           en: 'Total Revenue' },
  total_cost:                  { ar: 'إجمالي التكاليف',             en: 'Total Costs' },
  gross_profit:                { ar: 'إجمالي الربح',               en: 'Gross Profit' },
  net_profit:                  { ar: 'صافي الربح',                 en: 'Net Profit' },
  gross_margin_pct:            { ar: 'هامش الربح الإجمالي',        en: 'Gross Margin' },
  net_margin_pct:              { ar: 'هامش الربح الصافي',          en: 'Net Margin' },
  total_investment:            { ar: 'إجمالي الاستثمار',            en: 'Total Investment' },
  roi_pct:                     { ar: 'عائد الاستثمار ROI',          en: 'Return on Investment' },
  payback_months:              { ar: 'فترة الاسترداد',              en: 'Payback Period' },
  npv_assessment:              { ar: 'تقييم NPV',                   en: 'NPV Assessment' },
  irr_estimate:                { ar: 'معدل العائد الداخلي IRR',     en: 'IRR Estimate' },
  current_cpl:                 { ar: 'تكلفة العميل الحالية',        en: 'Current CPL' },
  benchmark_cpl:               { ar: 'المعيار CPL',                 en: 'Benchmark CPL' },
  cpl_gap_pct:                 { ar: 'الفجوة عن المعيار',           en: 'CPL Gap vs Benchmark' },
  cpl_status:                  { ar: 'تقييم CPL',                   en: 'CPL Status' },
  monthly_leads:               { ar: 'العملاء الشهريون',            en: 'Monthly Leads' },
  expected_leads_at_benchmark: { ar: 'العملاء عند المعيار',         en: 'Expected at Benchmark' },
  leads_gap:                   { ar: 'فجوة العملاء',                en: 'Leads Gap' },
  wasted_budget_estimate:      { ar: 'الميزانية المهدرة',           en: 'Wasted Budget Est.' },
  roas:                        { ar: 'معدل العائد ROAS',            en: 'ROAS' },
  roas_benchmark:              { ar: 'معيار ROAS',                  en: 'ROAS Benchmark' },
  roas_status:                 { ar: 'تقييم ROAS',                  en: 'ROAS Status' },
  meta_cpl_expected:           { ar: 'CPL المتوقع Meta',            en: 'Expected Meta CPL' },
  google_cpl_expected:         { ar: 'CPL المتوقع Google',          en: 'Expected Google CPL' },
  budget_required_100leads:    { ar: 'ميزانية 100 عميل',           en: 'Budget for 100 Leads' },
  recommended_test_budget:     { ar: 'ميزانية الاختبار',            en: 'Recommended Test Budget' },
  budget_sufficiency:          { ar: 'كفاية الميزانية',             en: 'Budget Sufficiency' },
  monthly_leads_at_budget:     { ar: 'عملاء/شهر بالميزانية',       en: 'Monthly Leads at Budget' },
  qualified_leads:             { ar: 'العملاء المؤهلون',            en: 'Qualified Leads' },
  qualification_rate:          { ar: 'معدل التأهيل',               en: 'Qualification Rate' },
  qualification_benchmark:     { ar: 'معيار التأهيل',              en: 'Qualification Benchmark' },
  qualification_verdict:       { ar: 'تقييم التأهيل',              en: 'Qualification Verdict' },
  estimated_monthly_deals:     { ar: 'صفقات شهرية متوقعة',         en: 'Est. Monthly Deals' },
  estimated_monthly_revenue:   { ar: 'إيرادات شهرية متوقعة',       en: 'Est. Monthly Revenue' },
  cac_current:                 { ar: 'تكلفة اكتساب العميل CAC',    en: 'Current CAC' },
  cac_benchmark:               { ar: 'معيار CAC',                   en: 'CAC Benchmark' },
  ltv_cac_ratio:               { ar: 'نسبة LTV/CAC',               en: 'LTV/CAC Ratio' },
}

const CITIES = [
  'القاهرة الجديدة','العاصمة الإدارية الجديدة','التجمع الخامس','التجمع الأول',
  '6 أكتوبر','الشيخ زايد','المعادي','مدينة نصر','الساحل الشمالي',
  'العين السخنة','الإسكندرية','الجيزة','أخرى',
]

const REPORT_CARDS = [
  { id:'feasibility'   as ReportType, icon:'📐', ar:'دراسة الجدوى العقارية',   en:'Feasibility Study',       desc:'NPV · IRR · 3 سيناريوهات · تحليل حساسية · risk scorecard',                     time:'2 min', badge:'الأعلى دقة',   badgeColor:'#0D9488' },
  { id:'campaign_roi'  as ReportType, icon:'📊', ar:'تدقيق أداء الحملات',      en:'Campaign ROI Audit',      desc:'CPL vs Egypt benchmarks 2026 · channel analysis · 3 optimizations',              time:'1 min', badge:'الأكثر طلباً', badgeColor:'#F0A020' },
  { id:'market_entry'  as ReportType, icon:'🗺️', ar:'استخبارات دخول السوق',    en:'Market Entry Intel',      desc:'Market attractiveness · competition · expected CPL · 90-day plan',               time:'2 min', badge:null,           badgeColor:null },
  { id:'lead_gen'      as ReportType, icon:'🎯', ar:'استخبارات توليد العملاء',  en:'Lead Generation Intel',   desc:'Lead quality · qualification rate · WhatsApp script · channel diagnosis',         time:'1 min', badge:null,           badgeColor:null },
  { id:'full_analysis' as ReportType, icon:'🏆', ar:'التحليل التسويقي الشامل',  en:'Full Marketing Analysis', desc:'SWOT · campaign performance · digital presence · complete 90-day plan',           time:'3 min', badge:'Premium',       badgeColor:'#4A1042' },
]

// ── SHARED FIELD COMPONENTS ──────────────────────────────────────

function F({ label: lbl, labelEn, value, onChange, placeholder, type='text', required=false, hint }:{
  label:string; labelEn?:string; value:string; onChange:(v:string)=>void
  placeholder?:string; type?:string; required?:boolean; hint?:string
}) {
  return (
    <div className="ei-field">
      <label className="ei-label">
        {lbl}
        {labelEn && <span style={{color:'#B0A9A2',fontWeight:400}}> / {labelEn}</span>}
        {required && <span style={{color:'#D4183D',marginRight:3}}>*</span>}
        {hint && <span className="ei-label-hint"> — {hint}</span>}
      </label>
      <input type={type} value={value} required={required} placeholder={placeholder}
        onChange={e=>onChange(e.target.value)} className="ei-input" />
    </div>
  )
}

function Sel({ label: lbl, labelEn, value, onChange, options, required=false }:{
  label:string; labelEn?:string; value:string; onChange:(v:string)=>void
  options:{value:string;label:string}[]; required?:boolean
}) {
  return (
    <div className="ei-field">
      <label className="ei-label">
        {lbl}
        {labelEn && <span style={{color:'#B0A9A2',fontWeight:400}}> / {labelEn}</span>}
        {required && <span style={{color:'#D4183D',marginRight:3}}>*</span>}
      </label>
      <select value={value} required={required} onChange={e=>onChange(e.target.value)}
        className="ei-input" style={{appearance:'none'}}>
        <option value="">اختر / Select...</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SecTitle({ ar, en }:{ar:string; en:string}) {
  return <div className="ei-section-title">{ar} <span style={{fontWeight:500,color:'#B0A9A2',textTransform:'none',letterSpacing:0}}>/ {en}</span></div>
}

function OptBox({ ar, en, children }:{ar:string; en:string; children:React.ReactNode}) {
  return (
    <div className="ei-optional-box">
      <div className="ei-optional-label">{ar} <span>/ {en} — Optional</span></div>
      <div className="ei-field-grid-2">{children}</div>
    </div>
  )
}

function SubmitBtn({ loading, ar, en }:{loading:boolean; ar:string; en:string}) {
  return (
    <button type="submit" disabled={loading} className="ei-submit-btn">
      {loading ? <><div className="ei-spin"/>{ar}... / {en}...</> : <>&#x26A1; {ar} / {en}</>}
    </button>
  )
}

// ── FORMS ────────────────────────────────────────────────────────

function FeasibilityForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    projectName:'', city:'', projectType:'وحدات سكنية',
    units:'', unitArea:'', landArea:'', sellPriceSqm:'', buildCostSqm:'', landCost:'',
    buildMonths:'48', salesMonths:'24', adminPct:'8',
    downPaymentPct:'20', finishLevel:'تشطيب متوسط (7,000–9,500 EGP/م²)', cashSalesPct:'30',
    realSellSqm:'', realBuildSqm:'', realSalesPace:''
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}}>
      <SecTitle ar="معلومات المشروع" en="Project Info" />
      <div className="ei-field-grid-2" style={{marginBottom:10}}>
        <F label="اسم المشروع" labelEn="Project Name" value={d.projectName} onChange={v=>f('projectName',v)} placeholder="مثال: كمبوند النيل" required />
        <Sel label="المدينة" labelEn="City" value={d.city} onChange={v=>f('city',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
        <Sel label="نوع المشروع" labelEn="Type" value={d.projectType} onChange={v=>f('projectType',v)} options={[
          {value:'وحدات سكنية',label:'🏠 وحدات سكنية / Residential'},
          {value:'فيلات',label:'🏡 فيلات / Villas'},
          {value:'تاون هاوس',label:'🏘️ تاون هاوس / Townhouses'},
          {value:'عقار تجاري',label:'🏢 عقار تجاري / Commercial'},
          {value:'مشروع مختلط',label:'🏙️ مشروع مختلط / Mixed-Use'},
          {value:'مخازن لوجستية',label:'🏭 مخازن / Logistics'},
          {value:'فندق / سياحي',label:'🏨 فندق / Hotel'},
        ]} />
        <F label="عدد الوحدات" labelEn="Units" type="number" value={d.units} onChange={v=>f('units',v)} placeholder="200" required />
      </div>
      <SecTitle ar="المساحات" en="Areas" />
      <div className="ei-field-grid-3" style={{marginBottom:10}}>
        <F label="مساحة الأرض (م²)" labelEn="Land Area" type="number" value={d.landArea} onChange={v=>f('landArea',v)} placeholder="25000" required hint="إجمالي القطعة" />
        <F label="مساحة الوحدة (م²)" labelEn="Unit Area" type="number" value={d.unitArea} onChange={v=>f('unitArea',v)} placeholder="120" required />
        <F label="سعر البيع/م² (EGP)" labelEn="Sell Price/m²" type="number" value={d.sellPriceSqm} onChange={v=>f('sellPriceSqm',v)} placeholder="50000" required />
      </div>
      <SecTitle ar="التكاليف" en="Costs" />
      <div className="ei-field-grid-2" style={{marginBottom:10}}>
        <F label="تكلفة الأرض الإجمالية (EGP)" labelEn="Total Land Cost" type="number" value={d.landCost} onChange={v=>f('landCost',v)} placeholder="50,000,000" required />
        <F label="تكلفة البناء/م² (EGP)" labelEn="Build Cost/m²" type="number" value={d.buildCostSqm} onChange={v=>f('buildCostSqm',v)} placeholder="22000" required hint="بدون تشطيب" />
        <Sel label="مستوى التشطيب" labelEn="Finish Level" value={d.finishLevel} onChange={v=>f('finishLevel',v)} options={[
          {value:'بدون تشطيب (Core & Shell)',label:'Core & Shell'},
          {value:'تشطيب عادي (4,500–6,000 EGP/م²)',label:'Standard Finish — 4,500–6,000 EGP/m²'},
          {value:'تشطيب متوسط (7,000–9,500 EGP/م²)',label:'Semi-Luxury — 7,000–9,500 EGP/m²'},
          {value:'تشطيب فاخر (11,000–16,000 EGP/م²)',label:'Luxury Finish — 11,000–16,000 EGP/m²'},
        ]} />
      </div>
      <SecTitle ar="الجدول الزمني" en="Timeline & Structure" />
      <div className="ei-field-grid-3" style={{marginBottom:10}}>
        <F label="مدة التنفيذ (شهور)" labelEn="Build (months)" type="number" value={d.buildMonths} onChange={v=>f('buildMonths',v)} placeholder="48" />
        <F label="مدة البيع (شهور)" labelEn="Sales (months)" type="number" value={d.salesMonths} onChange={v=>f('salesMonths',v)} placeholder="24" />
        <F label="مصروفات إدارية %" labelEn="Admin & Mktg %" type="number" value={d.adminPct} onChange={v=>f('adminPct',v)} placeholder="8" />
        <F label="نسبة المقدم %" labelEn="Down Payment %" type="number" value={d.downPaymentPct} onChange={v=>f('downPaymentPct',v)} placeholder="20" />
        <F label="نسبة الكاش %" labelEn="Cash Sales %" type="number" value={d.cashSalesPct} onChange={v=>f('cashSalesPct',v)} placeholder="30" />
      </div>
      <OptBox ar="مقارنة بالسوق" en="Market Comparison">
        <F label="سعر بيع السوق/م² (EGP)" labelEn="Market Sell Price" type="number" value={d.realSellSqm} onChange={v=>f('realSellSqm',v)} placeholder="48000" />
        <F label="تكلفة بناء السوق/م² (EGP)" labelEn="Market Build Cost" type="number" value={d.realBuildSqm} onChange={v=>f('realBuildSqm',v)} placeholder="21000" />
        <F label="معدل بيع مشاريع مشابهة (وحدة/شهر)" labelEn="Market Sales Pace" type="number" value={d.realSalesPace} onChange={v=>f('realSalesPace',v)} placeholder="5" />
      </OptBox>
      <SubmitBtn loading={loading} ar="توليد دراسة الجدوى" en="Generate Feasibility Report" />
    </form>
  )
}

function CampaignROIForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    companyName:'', city:'', clientType:'developer', adSpend:'', cpl:'', leads:'', roas:'',
    metaSpend:'', googleSpend:'', tiktokSpend:''
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}}>
      <SecTitle ar="بيانات الشركة" en="Company Info" />
      <div className="ei-field-grid-2" style={{marginBottom:10}}>
        <F label="اسم الشركة" labelEn="Company Name" value={d.companyName} onChange={v=>f('companyName',v)} placeholder="Radix Development" required />
        <Sel label="المدينة" labelEn="City" value={d.city} onChange={v=>f('city',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
        <Sel label="نوع العميل" labelEn="Client Type" value={d.clientType} onChange={v=>f('clientType',v)} required options={[{value:'developer',label:'🏗️ مطور عقاري / Developer'},{value:'broker',label:'🤝 وسيط / Broker'}]} />
        <F label="الإنفاق الإعلاني/شهر (EGP)" labelEn="Monthly Ad Spend" type="number" value={d.adSpend} onChange={v=>f('adSpend',v)} placeholder="150,000" required />
      </div>
      <SecTitle ar="مؤشرات الأداء" en="Performance KPIs" />
      <div className="ei-field-grid-3" style={{marginBottom:10}}>
        <F label="CPL الحالي (EGP)" labelEn="Current CPL" type="number" value={d.cpl} onChange={v=>f('cpl',v)} placeholder="950" required />
        <F label="عدد العملاء/شهر" labelEn="Monthly Leads" type="number" value={d.leads} onChange={v=>f('leads',v)} placeholder="158" />
        <F label="معدل العائد ROAS" labelEn="ROAS" type="number" value={d.roas} onChange={v=>f('roas',v)} placeholder="2.1" />
      </div>
      <OptBox ar="توزيع الإنفاق" en="Channel Spend Breakdown">
        <F label="إنفاق Meta (EGP)" labelEn="Meta Spend" type="number" value={d.metaSpend} onChange={v=>f('metaSpend',v)} placeholder="90,000" />
        <F label="إنفاق Google (EGP)" labelEn="Google Spend" type="number" value={d.googleSpend} onChange={v=>f('googleSpend',v)} placeholder="45,000" />
        <F label="إنفاق TikTok (EGP)" labelEn="TikTok Spend" type="number" value={d.tiktokSpend} onChange={v=>f('tiktokSpend',v)} placeholder="15,000" />
      </OptBox>
      <SubmitBtn loading={loading} ar="توليد تقرير الأداء" en="Generate ROI Audit" />
    </form>
  )
}

function MarketEntryForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({ companyName:'', targetCity:'', clientType:'developer', budget:'', timeline:'6 أشهر' })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}}>
      <SecTitle ar="بيانات الشركة" en="Company Info" />
      <div className="ei-field-grid-2" style={{marginBottom:10}}>
        <F label="اسم الشركة" labelEn="Company Name" value={d.companyName} onChange={v=>f('companyName',v)} placeholder="XYZ Properties" required />
        <Sel label="السوق المستهدف" labelEn="Target Market" value={d.targetCity} onChange={v=>f('targetCity',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
        <Sel label="نوع الشركة" labelEn="Company Type" value={d.clientType} onChange={v=>f('clientType',v)} required options={[{value:'developer',label:'🏗️ مطور عقاري / Developer'},{value:'broker',label:'🤝 وسيط / Broker'}]} />
        <F label="الميزانية الشهرية (EGP)" labelEn="Monthly Budget" type="number" value={d.budget} onChange={v=>f('budget',v)} placeholder="80,000" required />
      </div>
      <Sel label="الإطار الزمني / Timeline" value={d.timeline} onChange={v=>f('timeline',v)} options={[
        {value:'3 أشهر',label:'⚡ 3 أشهر / 3 Months — Fast Entry'},
        {value:'6 أشهر',label:'📈 6 أشهر / 6 Months — Balanced'},
        {value:'12 شهر',label:'🎯 12 شهر / 12 Months — Strategic'},
        {value:'18+ شهر',label:'🏗️ 18+ شهر / 18+ Months — Long-Term'},
      ]} />
      <SubmitBtn loading={loading} ar="توليد تقرير دخول السوق" en="Generate Market Entry Report" />
    </form>
  )
}

function LeadGenForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    companyName:'', city:'', clientType:'developer', currentLeads:'', qualifiedPct:'',
    adSpend:'', cpl:'', avgDealValue:'', salesCycle:'90'
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}}>
      <SecTitle ar="بيانات الشركة" en="Company Info" />
      <div className="ei-field-grid-2" style={{marginBottom:10}}>
        <F label="اسم الشركة" labelEn="Company Name" value={d.companyName} onChange={v=>f('companyName',v)} placeholder="ABC Brokers" required />
        <Sel label="المدينة" labelEn="City" value={d.city} onChange={v=>f('city',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
        <Sel label="نوع العميل" labelEn="Client Type" value={d.clientType} onChange={v=>f('clientType',v)} required options={[{value:'developer',label:'🏗️ مطور عقاري / Developer'},{value:'broker',label:'🤝 وسيط / Broker'}]} />
        <F label="عدد العملاء المحتملين/شهر" labelEn="Monthly Leads" type="number" value={d.currentLeads} onChange={v=>f('currentLeads',v)} placeholder="200" required />
      </div>
      <SecTitle ar="جودة العملاء الحالية" en="Current Lead Quality" />
      <div className="ei-field-grid-3" style={{marginBottom:10}}>
        <F label="نسبة العملاء المؤهلين %" labelEn="Qualified Rate %" type="number" value={d.qualifiedPct} onChange={v=>f('qualifiedPct',v)} placeholder="15" required />
        <F label="دورة المبيعات (أيام)" labelEn="Sales Cycle (days)" type="number" value={d.salesCycle} onChange={v=>f('salesCycle',v)} placeholder="90" />
        <F label="متوسط قيمة الصفقة (EGP)" labelEn="Avg Deal Value" type="number" value={d.avgDealValue} onChange={v=>f('avgDealValue',v)} placeholder="3,000,000" />
      </div>
      <OptBox ar="بيانات الإنفاق الإعلاني" en="Ad Spend Data">
        <F label="الإنفاق الإعلاني/شهر (EGP)" labelEn="Monthly Ad Spend" type="number" value={d.adSpend} onChange={v=>f('adSpend',v)} placeholder="120,000" />
        <F label="CPL الحالي (EGP)" labelEn="Current CPL" type="number" value={d.cpl} onChange={v=>f('cpl',v)} placeholder="600" />
      </OptBox>
      <SubmitBtn loading={loading} ar="توليد تقرير العملاء" en="Generate Lead Gen Report" />
    </form>
  )
}

function FullAnalysisForm({ onSubmit, loading }:{ onSubmit:(d:Record<string,string>)=>void; loading:boolean }) {
  const [d, setD] = useState<Record<string,string>>({
    companyName:'', city:'', clientType:'developer', website:'', fbPage:'', igPage:'', ttPage:'',
    adSpend:'', cpl:'', roas:'', leads:'', revenue:'', competitors:''
  })
  const f=(k:string,v:string)=>setD(p=>({...p,[k]:v}))
  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(d)}}>
      <SecTitle ar="بيانات الشركة" en="Company Info" />
      <div className="ei-field-grid-2" style={{marginBottom:10}}>
        <F label="اسم الشركة" labelEn="Company Name" value={d.companyName} onChange={v=>f('companyName',v)} placeholder="Palm Hills Developments" required />
        <Sel label="المدينة" labelEn="City" value={d.city} onChange={v=>f('city',v)} required options={CITIES.map(c=>({value:c,label:c}))} />
        <Sel label="نوع الشركة" labelEn="Company Type" value={d.clientType} onChange={v=>f('clientType',v)} required options={[{value:'developer',label:'🏗️ مطور عقاري / Developer'},{value:'broker',label:'🤝 وسيط / Broker'}]} />
        <F label="المنافسون الرئيسيون" labelEn="Competitors" value={d.competitors} onChange={v=>f('competitors',v)} placeholder="SODIC، Emaar، Ora" />
      </div>
      <OptBox ar="روابط الحضور الرقمي" en="Digital Presence Links">
        <F label="الموقع الإلكتروني" labelEn="Website" value={d.website} onChange={v=>f('website',v)} placeholder="https://company.com" />
        <F label="Facebook Page" value={d.fbPage} onChange={v=>f('fbPage',v)} placeholder="facebook.com/page" />
        <F label="Instagram" value={d.igPage} onChange={v=>f('igPage',v)} placeholder="instagram.com/account" />
        <F label="TikTok" value={d.ttPage} onChange={v=>f('ttPage',v)} placeholder="tiktok.com/@account" />
      </OptBox>
      <OptBox ar="بيانات الحملات الإعلانية" en="Campaign Performance Data">
        <F label="إنفاق إعلاني/شهر (EGP)" labelEn="Monthly Ad Spend" type="number" value={d.adSpend} onChange={v=>f('adSpend',v)} placeholder="200,000" />
        <F label="CPL الحالي (EGP)" labelEn="Current CPL" type="number" value={d.cpl} onChange={v=>f('cpl',v)} placeholder="800" />
        <F label="معدل العائد ROAS" labelEn="ROAS" type="number" value={d.roas} onChange={v=>f('roas',v)} placeholder="2.5" />
        <F label="عدد العملاء/شهر" labelEn="Monthly Leads" type="number" value={d.leads} onChange={v=>f('leads',v)} placeholder="250" />
        <F label="الإيرادات الشهرية (EGP)" labelEn="Monthly Revenue" type="number" value={d.revenue} onChange={v=>f('revenue',v)} placeholder="5,000,000" />
      </OptBox>
      <SubmitBtn loading={loading} ar="توليد التحليل الشامل" en="Generate Full Analysis" />
    </form>
  )
}

// ── LABEL HELPER ─────────────────────────────────────────────────
function lbl(key: string, lang: 'ar'|'en'): string {
  return LABELS[key]?.[lang] || key.replace(/_/g,' ')
}

// ── EXPORT ───────────────────────────────────────────────────────
function exportPDF(title: string) {
  const style = document.createElement('style')
  style.id = '__ei_print'
  style.textContent = `
    @media print {
      body > * { visibility: hidden; }
      #ei-report-output, #ei-report-output * { visibility: visible; }
      #ei-report-output { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; }
      .ei-report-actions { display: none !important; }
      .ei-report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 15mm; size: A4 portrait; }
    }
  `
  document.head.appendChild(style)
  const prev = document.title
  document.title = title
  window.print()
  setTimeout(() => {
    document.title = prev
    const s = document.getElementById('__ei_print')
    if (s) s.remove()
  }, 1500)
}

function exportCSV(report: Record<string,unknown>, title: string, lang: 'ar'|'en') {
  const rows: string[][] = [
    ['Eunoia Zones Intelligence Platform'],
    [title],
    ['Date / التاريخ', new Date().toLocaleDateString('en-EG')],
    [],
  ]
  function flatten(obj: Record<string,unknown>, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const l = prefix ? `${prefix} > ${lbl(k,'ar')} / ${lbl(k,'en')}` : `${lbl(k,'ar')} / ${lbl(k,'en')}`
      if (v === null || v === undefined) continue
      if (typeof v === 'object' && !Array.isArray(v)) {
        flatten(v as Record<string,unknown>, l)
      } else if (Array.isArray(v)) {
        rows.push([l])
        v.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) flatten(item as Record<string,unknown>, `${l} ${i+1}`)
          else rows.push([`  ${i+1}`, String(item)])
        })
      } else {
        rows.push([l, String(v)])
      }
    }
  }
  flatten(report)
  const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8;'})),
    download: `${title}-${new Date().toISOString().split('T')[0]}.csv`
  })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  void lang
}

// ── REPORT RENDERER ──────────────────────────────────────────────

function KV({ data, lang }: { data: Record<string,string>; lang:'ar'|'en' }) {
  const entries = Object.entries(data).filter(([,v]) => v && v !== 'undefined')
  if (!entries.length) return null
  return (
    <div className="ei-kv-grid">
      {entries.map(([k, v]) => (
        <div key={k} className="ei-kv-item">
          <div className="ei-kv-label">{lbl(k, lang)}</div>
          <div className="ei-kv-value">{v}</div>
        </div>
      ))}
    </div>
  )
}

function Sec({ titleAr, titleEn, children }: { titleAr:string; titleEn:string; children:React.ReactNode }) {
  return (
    <div className="ei-section">
      <div className="ei-section-head">
        <div className="ei-section-head-title">{titleAr} <span style={{fontWeight:400,color:'#B0A9A2',textTransform:'none',letterSpacing:0}}>/ {titleEn}</span></div>
      </div>
      <div className="ei-section-body">{children}</div>
    </div>
  )
}

function ReportView({ report, lang, onBack, onRegen }:{
  report:Record<string,unknown>; lang:'ar'|'en'; onBack:()=>void; onRegen:()=>void
}) {
  const conf = report.confidence_score as {pct?:number;label?:string;reason?:string}|undefined
  const pct = conf?.pct ?? 0
  const pctColor = pct >= 80 ? '#10B981' : pct >= 65 ? '#F0A020' : '#9A9090'
  const confBadge = pct >= 80
    ? (lang==='ar' ? '🎯 دقة عالية' : '🎯 High Accuracy')
    : pct >= 65
    ? (lang==='ar' ? '📊 دقة جيدة' : '📊 Good Accuracy')
    : (lang==='ar' ? '⚠️ بيانات محدودة' : '⚠️ Limited Data')
  const verdict = report.verdict as string|undefined
  const verdictColor = verdict?.includes('مجدي') && !verdict?.includes('مشروط') ? '#0D9488'
    : verdict?.includes('مشروط') ? '#F0A020'
    : verdict ? '#D4183D'
    : '#7C3AED'
  const title = `${report.report_type as string} — ${(report.company||report.project_name||report.target_market||'') as string}`

  return (
    <div className="ei-report" id="ei-report-output">
      {/* Action buttons */}
      <div className="ei-report-actions">
        <button onClick={onBack} className="ei-action-btn">&#8592; {lang==='ar'?'تقرير جديد':'New Report'}</button>
        <button onClick={onRegen} className="ei-action-btn">&#x1F504; {lang==='ar'?'إعادة التوليد':'Regenerate'}</button>
        <button onClick={()=>exportCSV(report, title, lang)} className="ei-action-btn green">&#x1F4CA; Excel</button>
        <button onClick={()=>exportPDF(title)} className="ei-action-btn red">&#x1F5A8;&#xFE0F; {lang==='ar'?'طباعة / PDF':'Print / PDF'}</button>
      </div>

      {/* Report header */}
      <div className="ei-report-header">
        <div className="ei-rh-top">
          <div>
            <div className="ei-rh-tag">EUNOIA ZONES · INTELLIGENCE PLATFORM</div>
            <div className="ei-rh-title">{report.report_type as string}</div>
            <div className="ei-rh-company">
              {(report.company||report.project_name||report.target_market||'') as string}
              {(report.city as string) && <span style={{color:'rgba(255,255,255,0.3)',margin:'0 6px'}}>·</span>}
              {report.city as string}
            </div>
          </div>
          <div className="ei-rh-conf">
            <div className="ei-rh-conf-pct" style={{color:pctColor}}>{pct}%</div>
            <div className="ei-rh-conf-label">{lang==='ar'?'دقة التقرير':'Accuracy'}</div>
            <div className="ei-rh-conf-badge">{confBadge}</div>
          </div>
        </div>
        {conf?.reason && <div className="ei-rh-reason">{conf.reason}</div>}
      </div>

      {/* Verdict */}
      {verdict && (
        <div className="ei-verdict" style={{borderColor:verdictColor, background:verdictColor+'14'}}>
          <div className="ei-verdict-icon">
            {verdict.includes('مجدي') && !verdict.includes('مشروط') ? '✅' : verdict.includes('مشروط') ? '⚠️' : '❌'}
          </div>
          <div>
            <div className="ei-verdict-text" style={{color:verdictColor}}>{verdict}</div>
            {!!(report.verdict_reason) && <div className="ei-verdict-reason" style={{color:'#6B6560'}}>{report.verdict_reason as string}</div>}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {!!(report.executive_summary) && (
        <Sec titleAr="الملخص التنفيذي" titleEn="Executive Summary">
          <p style={{fontSize:13,color:'#1A1018',lineHeight:1.7,margin:0}}>{report.executive_summary as string}</p>
        </Sec>
      )}

      {/* Financials */}
      {!!(report.financials) && (
        <Sec titleAr="المؤشرات المالية" titleEn="Financial KPIs">
          <KV data={report.financials as Record<string,string>} lang={lang} />
        </Sec>
      )}

      {/* Cost Breakdown */}
      {!!(report.cost_breakdown) && (
        <Sec titleAr="تفصيل التكاليف" titleEn="Cost Breakdown">
          <KV data={report.cost_breakdown as Record<string,string>} lang={lang} />
        </Sec>
      )}

      {/* Scenarios */}
      {!!(report.scenarios) && (() => {
        const sc = report.scenarios as Record<string,Record<string,string>>
        const scenarios = [
          {key:'optimistic', ar:'متفائل', en:'Optimistic', color:'#0D9488', bg:'#E6FDF9'},
          {key:'base',       ar:'قاعدي',  en:'Base Case',  color:'#F0A020', bg:'#FEF8EA'},
          {key:'pessimistic',ar:'متشائم', en:'Pessimistic',color:'#D4183D', bg:'#FCE8EC'},
        ]
        return (
          <Sec titleAr="السيناريوهات الثلاثة" titleEn="Three Scenarios">
            <div className="ei-scenario-grid">
              {scenarios.map(s => (
                <div key={s.key} className="ei-scenario-card" style={{background:s.bg,borderColor:s.color+'50'}}>
                  <div className="ei-scenario-label" style={{color:s.color}}>{s.ar} / {s.en}</div>
                  <div className="ei-scenario-roi" style={{color:s.color}}>{sc[s.key]?.roi_pct ?? '—'}</div>
                  <div style={{fontSize:9,color:'#9A9090',marginTop:2}}>ROI</div>
                  {sc[s.key]?.roi_annual_pct && <div style={{fontSize:10,color:s.color,fontWeight:700}}>{sc[s.key].roi_annual_pct} / yr</div>}
                  <div className="ei-scenario-sub">&#x23F1; {sc[s.key]?.payback_months ?? '—'}</div>
                  {sc[s.key]?.net_profit && <div style={{fontSize:10,color:'#6B6560',marginTop:2}}>{sc[s.key].net_profit}</div>}
                </div>
              ))}
            </div>
          </Sec>
        )
      })()}

      {/* Reality Check */}
      {!!(report.reality_check) && (() => {
        const rc = report.reality_check as Array<Record<string,string>>
        return (
          <Sec titleAr="مقارنة بالسوق" titleEn="Market Reality Check">
            <table className="ei-reality-table">
              <tbody>
                {rc.map((row, i) => {
                  const ac = row.assessment === 'منطقي' ? '#0D9488' : row.assessment === 'متفائل' ? '#F0A020' : '#D4183D'
                  return (
                    <tr key={i} className="ei-reality-row">
                      <td style={{width:'40%'}}>
                        <div className="ei-reality-item">{row.item}</div>
                        <div className="ei-reality-vals">{lang==='ar'?'افتراضك':'Yours'}: {row.your_value} · {lang==='ar'?'السوق':'Market'}: {row.market_benchmark}</div>
                      </td>
                      <td style={{textAlign:'left'}}>
                        <span className="ei-reality-badge" style={{background:ac}}>{row.assessment}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Sec>
        )
      })()}

      {/* KPI Scorecard */}
      {!!(report.kpi_scorecard) && (
        <Sec titleAr="مؤشرات الأداء التسويقي" titleEn="Marketing Performance KPIs">
          <KV data={report.kpi_scorecard as Record<string,string>} lang={lang} />
        </Sec>
      )}

      {/* Market Scores */}
      {!!(report.market_scores) && (() => {
        const ms = report.market_scores as Record<string,{score:number;max:number;label:string;reasoning:string}>
        return (
          <Sec titleAr="تقييم السوق" titleEn="Market Assessment">
            {Object.values(ms).map((item, i) => (
              <div key={i} className="ei-bar-row">
                <div className="ei-bar-header">
                  <span className="ei-bar-label">{item.label}</span>
                  <span className="ei-bar-value" style={{color:'#4A1042'}}>{item.score}<span style={{color:'#9A9090',fontWeight:400}}>/{item.max}</span></span>
                </div>
                <div className="ei-bar-track">
                  <div className="ei-bar-fill" style={{width:`${(item.score/item.max)*100}%`,background:'linear-gradient(90deg,#4A1042,#7C3AED)'}} />
                </div>
                {item.reasoning && <div className="ei-bar-sub">{item.reasoning}</div>}
              </div>
            ))}
          </Sec>
        )
      })()}

      {/* Score Breakdown */}
      {!!(report.score_breakdown) && (() => {
        const sb = report.score_breakdown as Record<string,{score:number;max:number;assessment:string}>
        return (
          <Sec titleAr="تقييم الأداء التسويقي الشامل" titleEn="Marketing Score Breakdown">
            {!!(report.marketing_score) && (
              <div style={{textAlign:'center',padding:'12px 0 16px',borderBottom:'1px solid #E8E2DA',marginBottom:12}}>
                <div style={{fontSize:48,fontWeight:900,color:'#4A1042',lineHeight:1}}>{report.marketing_score as number}</div>
                <div style={{fontSize:11,color:'#9A9090',marginTop:4}}>{lang==='ar'?'نقاط التسويق الكلية / 100':'Overall Marketing Score / 100'}</div>
              </div>
            )}
            {Object.entries(sb).map(([k, v], i) => (
              <div key={i} className="ei-bar-row">
                <div className="ei-bar-header">
                  <span className="ei-bar-label">{lbl(k, lang)}</span>
                  <span className="ei-bar-value" style={{color:'#4A1042'}}>{v.score}<span style={{color:'#9A9090',fontWeight:400}}>/{v.max}</span></span>
                </div>
                <div className="ei-bar-track">
                  <div className="ei-bar-fill" style={{width:`${(v.score/v.max)*100}%`,background:'linear-gradient(90deg,#4A1042,#7C3AED)'}} />
                </div>
                {v.assessment && <div className="ei-bar-sub">{v.assessment}</div>}
              </div>
            ))}
          </Sec>
        )
      })()}

      {/* Risk Scorecard */}
      {!!(report.risk_scorecard) && (() => {
        const rs = report.risk_scorecard as {overall_risk:string;overall_score:number;dimensions:Array<{name:string;score:number;detail:string}>}
        const rc2 = rs.overall_score > 60 ? '#D4183D' : rs.overall_score > 35 ? '#F0A020' : '#0D9488'
        const rlabel = rs.overall_risk === 'Low'
          ? (lang==='ar'?'مخاطر منخفضة ✅':'Low Risk ✅')
          : rs.overall_risk === 'Medium'
          ? (lang==='ar'?'مخاطر متوسطة ⚠️':'Medium Risk ⚠️')
          : (lang==='ar'?'مخاطر عالية ❌':'High Risk ❌')
        return (
          <Sec titleAr="مؤشر المخاطر" titleEn="Risk Scorecard">
            <div style={{display:'flex',alignItems:'center',gap:14,padding:'10px 0 16px',borderBottom:'1px solid #E8E2DA',marginBottom:12}}>
              <div style={{fontSize:42,fontWeight:900,color:rc2,lineHeight:1}}>{rs.overall_score}</div>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:rc2}}>{rlabel}</div>
                <div style={{fontSize:11,color:'#9A9090',marginTop:2}}>{lang==='ar'?'من 100 — كلما ارتفع زاد الخطر':'Out of 100 — higher = more risk'}</div>
              </div>
            </div>
            {(rs.dimensions||[]).map((dim, i) => {
              const dc = dim.score > 60 ? '#D4183D' : dim.score > 35 ? '#F0A020' : '#0D9488'
              return (
                <div key={i} className="ei-bar-row">
                  <div className="ei-bar-header">
                    <span className="ei-bar-label">{dim.name}</span>
                    <span className="ei-bar-value" style={{color:dc}}>{dim.score}/100</span>
                  </div>
                  <div className="ei-bar-track">
                    <div className="ei-bar-fill" style={{width:`${dim.score}%`,background:dc}} />
                  </div>
                  {dim.detail && <div className="ei-bar-sub">{dim.detail}</div>}
                </div>
              )
            })}
          </Sec>
        )
      })()}

      {/* Sensitivity Analysis */}
      {!!(report.sensitivity_analysis) && (() => {
        const sa = report.sensitivity_analysis as Array<Record<string,string>>
        return (
          <Sec titleAr="تحليل الحساسية" titleEn="Sensitivity Analysis">
            {sa.map((row, i) => (
              <div key={i} style={{borderBottom:'1px solid #F0E8DF',paddingBottom:10,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:700,color:'#1A1018'}}>{row.variable}</span>
                  <span className="ei-reality-badge" style={{background:row.sensitivity==='عالية'?'#D4183D':row.sensitivity==='متوسطة'?'#F0A020':'#0D9488'}}>
                    {row.sensitivity}
                  </span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {row.impact_10pct_up    && <div style={{fontSize:11,color:'#0D9488'}}>&#8593; 10%: {row.impact_10pct_up}</div>}
                  {row.impact_10pct_down  && <div style={{fontSize:11,color:'#D4183D'}}>&#8595; 10%: {row.impact_10pct_down}</div>}
                  {row.impact_3months_more && <div style={{fontSize:11,color:'#D4183D'}}>+3 {lang==='ar'?'شهور':'months'}: {row.impact_3months_more}</div>}
                  {row.impact_3months_less && <div style={{fontSize:11,color:'#0D9488'}}>-3 {lang==='ar'?'شهور':'months'}: {row.impact_3months_less}</div>}
                </div>
              </div>
            ))}
          </Sec>
        )
      })()}

      {/* Channel Breakdown */}
      {!!(report.channel_breakdown) && (() => {
        const ch = report.channel_breakdown as Array<Record<string,string>>
        return (
          <Sec titleAr="تحليل القنوات الإعلانية" titleEn="Channel Performance">
            {ch.map((c2, i) => (
              <div key={i} className="ei-channel-card">
                <div className="ei-channel-header">
                  <div className="ei-channel-name">{c2.channel}</div>
                  <div className="ei-channel-status" style={{
                    background: c2.performance?.includes('أفضل')||c2.performance?.includes('Better') ? '#E6FDF9' : c2.performance?.includes('ضمن')||c2.performance?.includes('Within') ? '#EBF4FF' : '#FCE8EC',
                    color: c2.performance?.includes('أفضل')||c2.performance?.includes('Better') ? '#0D9488' : c2.performance?.includes('ضمن')||c2.performance?.includes('Within') ? '#1D4ED8' : '#D4183D',
                  }}>{c2.performance}</div>
                </div>
                <div className="ei-channel-meta">
                  {c2.spend           && <div className="ei-channel-kv">{lang==='ar'?'الإنفاق':'Spend'}<strong>{c2.spend}</strong></div>}
                  {c2.benchmark_cpl   && <div className="ei-channel-kv">{lang==='ar'?'معيار CPL':'Benchmark CPL'}<strong>{c2.benchmark_cpl}</strong></div>}
                  {c2.estimated_leads && <div className="ei-channel-kv">{lang==='ar'?'عملاء متوقعون':'Est. Leads'}<strong>{c2.estimated_leads}</strong></div>}
                </div>
                {c2.recommendation && <div className="ei-channel-tip">&#x1F4A1; {c2.recommendation}</div>}
              </div>
            ))}
          </Sec>
        )
      })()}

      {/* Quick Wins / Optimizations / Improvements / Immediate Actions */}
      {!!(report.quick_wins||report.optimizations||report.improvements||report.immediate_actions) && (() => {
        const items = (report.quick_wins||report.optimizations||report.improvements||report.immediate_actions) as Array<Record<string,string>>
        return (
          <Sec titleAr="&#x26A1; الإجراءات الفورية" titleEn="Immediate Actions">
            <div className="ei-actions-list">
              {items.slice(0,3).map((item, i) => (
                <div key={i} className="ei-action-item">
                  <div className="ei-action-num">{i+1}</div>
                  <div className="ei-action-body">
                    <div className="ei-action-title">{item.action}</div>
                    <div className="ei-action-meta">
                      {item.timeline                && <span>&#x23F1; {item.timeline}</span>}
                      {item.impact                  && <span>&#x1F4C8; {item.impact}</span>}
                      {item.expected_cpl_reduction  && <span>&#x1F4C9; {item.expected_cpl_reduction}</span>}
                      {item.effort                  && <span style={{padding:'1px 6px',background:'#F0E8DF',borderRadius:4,fontSize:10}}>{item.effort}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Sec>
        )
      })()}

      {/* SWOT */}
      {!!(report.swot) && (() => {
        const sw = report.swot as Record<string,string[]>
        const quads = [
          {key:'strengths',     ar:'&#x1F4AA; نقاط القوة',  en:'Strengths',     color:'#0D9488', bg:'#E6FDF9'},
          {key:'weaknesses',    ar:'&#x26A0;&#xFE0F; نقاط الضعف', en:'Weaknesses', color:'#D4183D', bg:'#FCE8EC'},
          {key:'opportunities', ar:'&#x1F680; الفرص',        en:'Opportunities', color:'#F0A020', bg:'#FEF8EA'},
          {key:'threats',       ar:'&#x1F6E1;&#xFE0F; التهديدات', en:'Threats',  color:'#7C3AED', bg:'#F0E8FF'},
        ]
        return (
          <Sec titleAr="تحليل SWOT" titleEn="SWOT Analysis">
            <div className="ei-swot-grid">
              {quads.map(q => (
                <div key={q.key} className="ei-swot-card" style={{background:q.bg}}>
                  <div className="ei-swot-title" style={{color:q.color}} dangerouslySetInnerHTML={{__html:`${q.ar} / ${q.en}`}} />
                  <ul className="ei-swot-list">
                    {(sw[q.key]||[]).slice(0,3).map((item:string, i:number) => (
                      <li key={i} className="ei-swot-item">
                        <span className="ei-swot-dot" style={{color:q.color}}>&#x25B8;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Sec>
        )
      })()}

      {/* 90-Day Plan */}
      {!!(report.entry_strategy_90days||report.strategy_90days) && (() => {
        const plan = (report.entry_strategy_90days||report.strategy_90days) as Record<string,{title?:string;focus?:string;actions:string[];budget:string;kpi:string}>
        return (
          <Sec titleAr="خطة 90 يوم" titleEn="90-Day Strategy">
            {(['month1','month2','month3'] as const).map((m, i) => {
              const month = plan[m]; if (!month) return null
              return (
                <div key={m} className="ei-timeline-step">
                  <div className="ei-timeline-header">
                    <div className="ei-timeline-num">{i+1}</div>
                    <div className="ei-timeline-title">{month.title||month.focus||`${lang==='ar'?'الشهر':'Month'} ${i+1}`}</div>
                  </div>
                  <div className="ei-timeline-body">
                    <ul className="ei-timeline-actions">
                      {(month.actions||[]).map((a:string, j:number) => (
                        <li key={j} className="ei-timeline-action">
                          <span className="ei-timeline-dot">&#x25B8;</span><span>{a}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="ei-timeline-footer">
                      {month.budget && <div className="ei-timeline-kv">&#x1F4B0; <strong>{month.budget}</strong></div>}
                      {month.kpi    && <div className="ei-timeline-kv">&#x1F3AF; <strong>{month.kpi}</strong></div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </Sec>
        )
      })()}

      {/* CPL Intelligence */}
      {!!(report.cpl_intelligence) && (
        <Sec titleAr="ذكاء تكلفة العميل CPL" titleEn="CPL Intelligence">
          <KV data={report.cpl_intelligence as Record<string,string>} lang={lang} />
        </Sec>
      )}

      {/* WhatsApp Script */}
      {!!(report.whatsapp_script) && (() => {
        const ws = report.whatsapp_script as {opening:string;qualification_questions:string[];closing:string}
        return (
          <Sec titleAr="&#x1F4AC; سكريبت واتساب للتأهيل" titleEn="WhatsApp Qualification Script">
            <div className="ei-wa-box" style={{borderColor:'#0D9488',marginBottom:8}}>
              <div className="ei-wa-header" style={{background:'#E6FDF9',color:'#0D9488'}}>{lang==='ar'?'رسالة الافتتاح':'Opening Message'}</div>
              <div className="ei-wa-body">{ws.opening}</div>
            </div>
            <div className="ei-wa-box" style={{borderColor:'#7C3AED',marginBottom:8}}>
              <div className="ei-wa-header" style={{background:'#F0E8FF',color:'#7C3AED'}}>{lang==='ar'?'أسئلة التأهيل':'Qualification Questions'}</div>
              <div className="ei-wa-body">
                <ul className="ei-wa-questions">
                  {(ws.qualification_questions||[]).map((q:string, i:number) => (
                    <li key={i} className="ei-wa-q"><span className="ei-wa-qnum">{i+1}.</span><span>{q}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="ei-wa-box" style={{borderColor:'#4A1042'}}>
              <div className="ei-wa-header" style={{background:'#F0E8EF',color:'#4A1042'}}>{lang==='ar'?'إغلاق الحوار':'Closing'}</div>
              <div className="ei-wa-body">{ws.closing}</div>
            </div>
          </Sec>
        )
      })()}

      {/* Recommendation */}
      {!!(report.recommendation) && (
        <Sec titleAr="التوصية النهائية" titleEn="Final Recommendation">
          <p style={{fontSize:13,fontWeight:600,color:'#1A1018',lineHeight:1.7,margin:0}}>{report.recommendation as string}</p>
        </Sec>
      )}

      {/* JSON toggle */}
      <details className="ei-json-toggle">
        <summary className="ei-json-summary">{lang==='ar'?'عرض البيانات الكاملة':'Show Full JSON Data'} &#x25BE;</summary>
        <pre className="ei-json-pre">{JSON.stringify(report, null, 2)}</pre>
      </details>
    </div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────────

export default function RealEstateIntelligencePage() {
  const [lang, setLang]         = useState<'ar'|'en'>('ar')
  const [selected, setSelected] = useState<ReportType|null>(null)
  const [loading, setLoading]   = useState(false)
  const [report, setReport]     = useState<Record<string,unknown>|null>(null)
  const [error, setError]       = useState<string|null>(null)
  const [lastForm, setLastForm] = useState<Record<string,string>|null>(null)

  async function handleSubmit(formData: Record<string,string>) {
    setLoading(true); setError(null); setReport(null); setLastForm(formData)
    try {
      const res = await fetch('/api/intelligence', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({reportType:selected, formData})
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data as {error?:string}).error || `HTTP ${res.status}`)
      setReport((data as {report:Record<string,unknown>}).report)
    } catch(e) {
      setError(e instanceof Error ? e.message : (lang==='ar'?'حدث خطأ غير متوقع':'Unexpected error'))
    } finally { setLoading(false) }
  }

  const card = REPORT_CARDS.find(c=>c.id===selected)

  return (
    <>
      <style>{styles}</style>
      <div className="ei-page" dir={lang==='ar'?'rtl':'ltr'}>

        {/* Top bar */}
        <div className="ei-topbar">
          <div className="ei-topbar-inner">
            <div className="ei-brand">
              <div className="ei-brand-tag">EUNOIA ZONES</div>
              <div className="ei-brand-title">{lang==='ar'?'محرك الاستخبارات العقارية':'Real Estate Intelligence Engine'}</div>
              <div className="ei-brand-sub">{lang==='ar'?'5 تقارير متخصصة · معايير السوق المصري 2026 · حسابات مالية دقيقة':'5 Specialized Reports · Egypt Market Benchmarks 2026 · Precise Financial Calculations'}</div>
            </div>
            <div className="ei-lang-toggle">
              <button className={`ei-lang-btn${lang==='ar'?' active':''}`} onClick={()=>setLang('ar')}>عربي</button>
              <button className={`ei-lang-btn${lang==='en'?' active':''}`} onClick={()=>setLang('en')}>EN</button>
            </div>
          </div>
        </div>

        <div className="ei-body">

          {/* Report type selector */}
          {!report && (
            <>
              <div className="ei-section-label">{lang==='ar'?'اختر نوع التقرير':'Select Report Type'}</div>
              <div className="ei-card-grid">
                {REPORT_CARDS.map(c => (
                  <div key={c.id} className={`ei-report-card${selected===c.id?' selected':''}`}
                    onClick={()=>{setSelected(c.id);setError(null)}}>
                    <div className="ei-card-icon">{c.icon}</div>
                    <div className="ei-card-content">
                      <div className="ei-card-title-ar">
                        {lang==='ar'?c.ar:c.en}
                        {c.badge && <span className="ei-badge" style={{background:c.badgeColor!}}>{c.badge}</span>}
                      </div>
                      <div className="ei-card-title-en">{lang==='ar'?c.en:c.ar}</div>
                      <div className="ei-card-desc">{c.desc}</div>
                    </div>
                    <div className="ei-card-time">&#x23F1; {c.time}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Form */}
          {selected && !report && (
            <div className="ei-form-panel">
              <div className="ei-form-header">
                <div className="ei-form-header-icon">{card?.icon}</div>
                <div>
                  <div className="ei-form-header-title">{lang==='ar'?card?.ar:card?.en}</div>
                  <div className="ei-form-header-sub">{lang==='ar'?card?.en:card?.ar}</div>
                </div>
                <button className="ei-form-close" onClick={()=>{setSelected(null);setReport(null);setError(null)}}>&#x00D7;</button>
              </div>
              <div className="ei-form-body">
                {loading ? (
                  <div className="ei-skeleton">
                    <div className="ei-skel-bar" style={{height:20,width:'60%',marginBottom:12}} />
                    <div className="ei-skel-bar" style={{height:14,width:'80%',marginBottom:8}} />
                    <div className="ei-skel-bar" style={{height:14,width:'70%',marginBottom:16}} />
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                      {[1,2,3,4].map(i=><div key={i} className="ei-skel-bar" style={{height:52}} />)}
                    </div>
                    <div style={{textAlign:'center',fontSize:12,color:'#9A9090',padding:'8px 0'}}>
                      &#x231B; {lang==='ar'?'جاري تحليل بيانات السوق المصري...':'Analyzing Egyptian market data...'}
                    </div>
                  </div>
                ) : (
                  <>
                    {selected==='feasibility'   && <FeasibilityForm   onSubmit={handleSubmit} loading={loading} />}
                    {selected==='campaign_roi'  && <CampaignROIForm   onSubmit={handleSubmit} loading={loading} />}
                    {selected==='market_entry'  && <MarketEntryForm   onSubmit={handleSubmit} loading={loading} />}
                    {selected==='lead_gen'      && <LeadGenForm       onSubmit={handleSubmit} loading={loading} />}
                    {selected==='full_analysis' && <FullAnalysisForm  onSubmit={handleSubmit} loading={loading} />}
                    {error && <div className="ei-error">&#x274C; {error}</div>}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Report output */}
          {report && (
            <ReportView
              report={report} lang={lang}
              onBack={()=>{setReport(null);setSelected(null);setError(null)}}
              onRegen={()=>{if(lastForm) handleSubmit(lastForm)}}
            />
          )}

        </div>
      </div>
    </>
  )
}
