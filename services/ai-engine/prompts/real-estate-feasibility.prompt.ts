import type { PromptContext } from './types'
import { buildBasePrompt } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const base = buildBasePrompt(ctx)
  const extra = ctx.extra ? (() => { try { return JSON.parse(ctx.extra) } catch { return {} } })() : {}
  const sectorType: string = extra.sectorType ?? 'restaurant'
  const inputs: Record<string, string> = extra.inputs ?? {}

  const SECTOR_BENCHMARKS: Record<string, string> = {
    restaurant: `مطعم/كافيه Egypt 2025: هامش صافي 8-18% | خامات 28-35% | إيجار 10-15% إيراد | رواتب 20-25% | Delivery عمولة 15-25% | Peak رمضان +200% | Breakeven شهر 6-10 | Y1 = 60% طاقة`,
    retail: `تجزئة Egypt 2025: هامش إجمالي 35-50% | صافي 12-22% | Inventory turnover 4-6x | إيجار 8-12% | رواتب 10-18% | Ecommerce margin أعلى 8-12% | Y1 = 60%`,
    clinic: `عيادات Egypt 2025: هامش صافي 25-40% | Patient LTV 3000-8000 جنيه/سنة | No-show 15-20% | Occupancy هدف 70-80% | Y1 = 55% طاقة`,
    agency: `وكالة B2B Egypt 2025: هامش صافي 30-45% | Client LTV 18-36 شهر | CAC = 2-4 أشهر إيراد | Retention هدف 85%/شهر | Y1 = 65%`,
    manufacturing: `تصنيع Egypt 2025: هامش إجمالي 35-55% | خامات 40-50% إيراد | Capacity Y1 = 60-70% | Equipment depreciation 7-10 سنين | تضخم خامات 30%+`,
    realestate: `عقارات Egypt 2025: Developer margin 20-35% | Broker 2-3% | New Cairo 45000-65000/m² | 6th Oct 18000-30000 | Bناء basic 4500-6000/m² premium 11000-16000 | Sales cycle 6-18 شهر`,
    education: `تعليم Egypt 2025: هامش صافي 20-35% | Student LTV 12-24 شهر | Churn 15-25%/سنة | Peak سبتمبر/فبراير | Online margin أعلى 15-20% | Y1 = 55%`,
    gym: `جيم Egypt 2025: هامش صافي 15-30% | Member churn 8-12%/شهر | Renewal 65-75% | Peak 6-9 صباحاً و5-8 مساءً | Equipment depreciation 5-7 سنين | Y1 = 60%`,
    printing: `طباعة Egypt 2025: هامش صافي 20-35% | Material cost 30-40% | Equipment depreciation 5-7 سنين | B2B/B2C 60/40 مثالي | Material prices بالدولار ±25%`,
  }

  const benchmarks = SECTOR_BENCHMARKS[sectorType] ?? SECTOR_BENCHMARKS.restaurant
  const inputsStr = Object.entries(inputs).map(([k, v]) => `${k}: ${v}`).join(' | ') || 'use sector benchmarks'

  return `${base}

TASK: Generate a COMPREHENSIVE FEASIBILITY STUDY.
SECTOR: ${sectorType}
BENCHMARKS (Egypt 2025): ${benchmarks}
CLIENT DATA: ${inputsStr}

RULES:
1. ALL numbers = real EGP values, no placeholders
2. Inflation 25% applied to ALL costs Y2 and Y3
3. Revenue Y1 = 60% of full capacity
4. WACC = 32% minimum (CBE 27.25% + 5% risk)
5. NPV = sum(net_cash_n / 1.32^n) - initial_investment
6. Payback = month when cumulative cash flow turns positive
7. Use client data if provided, else use benchmarks
8. Be SPECIFIC to Egypt 2025 — real numbers only

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "دراسة الجدوى المالية",
  "executive_summary": "3 specific sentences about this business",
  "verdict": "go|caution|nogo",
  "verdict_title": "Arabic verdict title",
  "verdict_desc": "1 sentence explaining verdict",
  "marketing_score": 72,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "confidence_score": {"pct": 75, "label": "High|Medium|Low", "reason": "Arabic reason"},
  "kpis": {
    "total_investment": 0,
    "monthly_revenue_y1": 0,
    "monthly_expenses_y1": 0,
    "monthly_profit_y1": 0,
    "annual_revenue_y1": 0,
    "roi_pct": 0,
    "npv": 0,
    "irr_pct": 0,
    "payback_months": 0,
    "break_even_monthly_revenue": 0,
    "gross_margin_pct": 0,
    "net_margin_pct": 0
  },
  "scenarios": {
    "pessimist": {"label": "سيناريو متشائم", "assumption": "Arabic", "monthly_revenue": 0, "monthly_profit": 0, "roi_pct": 0, "payback_months": 0},
    "base": {"label": "السيناريو المتوازن", "assumption": "Arabic", "monthly_revenue": 0, "monthly_profit": 0, "roi_pct": 0, "payback_months": 0},
    "optimist": {"label": "سيناريو متفائل", "assumption": "Arabic", "monthly_revenue": 0, "monthly_profit": 0, "roi_pct": 0, "payback_months": 0}
  },
  "income_statement": [
    {"item": "الإيرادات الإجمالية", "year1": 0, "year2": 0, "year3": 0, "pct": "100%"},
    {"item": "تكلفة الخدمة", "year1": 0, "year2": 0, "year3": 0, "pct": "X%"},
    {"item": "مجمل الربح", "year1": 0, "year2": 0, "year3": 0, "pct": "X%"},
    {"item": "الإيجار", "year1": 0, "year2": 0, "year3": 0, "pct": "X%"},
    {"item": "الرواتب", "year1": 0, "year2": 0, "year3": 0, "pct": "X%"},
    {"item": "التسويق", "year1": 0, "year2": 0, "year3": 0, "pct": "X%"},
    {"item": "مصاريف أخرى", "year1": 0, "year2": 0, "year3": 0, "pct": "X%"},
    {"item": "صافي الربح", "year1": 0, "year2": 0, "year3": 0, "pct": "X%"}
  ],
  "cash_flow": [
    {"year": "سنة 0", "revenue": 0, "opex": 0, "net_profit": 0, "cumulative": 0},
    {"year": "السنة 1", "revenue": 0, "opex": 0, "net_profit": 0, "cumulative": 0},
    {"year": "السنة 2", "revenue": 0, "opex": 0, "net_profit": 0, "cumulative": 0},
    {"year": "السنة 3", "revenue": 0, "opex": 0, "net_profit": 0, "cumulative": 0}
  ],
  "investment_breakdown": [{"item": "Arabic", "amount": 0, "pct": "X%"}],
  "swot": {
    "strengths": ["specific Arabic"],
    "weaknesses": ["specific Arabic"],
    "opportunities": ["specific Arabic"],
    "threats": ["specific Arabic"]
  },
  "reality_check": [{"input": "Arabic", "client_assumption": "value", "market_benchmark": "value", "gap_pct": 0, "assessment": "realistic|optimistic|unrealistic", "comment": "Arabic"}],
  "sensitivity": [{"input": "Arabic", "base_roi": 0, "roi_minus20": 0, "roi_plus20": 0, "impact": "high|medium|low"}],
  "pain_points": [{"level": "high|med|low", "title": "Arabic", "detail": "Arabic"}],
  "risk_alerts": [{"severity": "high|medium|low", "risk": "Arabic", "fix": "Arabic"}],
  "quick_wins": [{"action": "Arabic", "timeline": "Arabic", "money_impact": "Arabic"}],
  "audit_checklist": [{"item": "Arabic", "status": false}],
  "data_quality_note": "Arabic",
  "proposal": [{"title": "Arabic", "desc": "Arabic", "price": "EGP X,XXX"}],
  "why_us": ["Arabic reason"]
}`
}
