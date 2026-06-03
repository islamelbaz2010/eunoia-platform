import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, city, sector, projectType, projectLocation, projectSize } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const projDesc = [projectType, projectLocation, projectSize].filter(Boolean).join(' | ') || 'Real Estate Project'
  const loc = projectLocation || city.en

  return `${base}\n${dataBlock}

PROJECT: ${projDesc}
COMPANY: ${companyName}
SECTOR: ${sector.en}

TASK: Generate a REAL ESTATE INVESTMENT FEASIBILITY STUDY for ${companyName} in ${loc}.

EGYPT 2025 MACRO BENCHMARKS (use these exact figures in calculations):
- CBE interest rate: 27.25%
- Inflation rate: 25% annually
- USD/EGP: ~49.5
- WACC minimum: 32% (CBE 27.25% + 5% risk premium) — use this for NPV discounting
- Construction cost per sqm: Basic 4,500–6,000 EGP | Medium 7,000–9,500 EGP | Premium 11,000–16,000 EGP
- New Cairo sale prices: 45,000–65,000 EGP/sqm
- 6th October City: 18,000–30,000 EGP/sqm
- Sheikh Zayed: 22,000–38,000 EGP/sqm
- North Coast (Sahel): 15,000–35,000 EGP/sqm (seasonal)
- Broker commission: 2–3% of sales value
- Developer net margin benchmark: 20–35%
- Residential yield: 7–10% annually | Luxury: 8–12% | Commercial: 10–14%
- Price appreciation: 15–25% YoY in prime locations
- Mortgage penetration: 8% (most buyers pay cash or developer installments)
- Marketing budget benchmark: 2–4% of Gross Development Value

CALCULATION RULES (follow strictly):
1. Revenue Y1 = 60% of target (ramp-up period)
2. Revenue Y2 = 85% of target
3. Revenue Y3 = 100% of target
4. Apply 25% inflation to ALL costs every year (Y2 costs = Y1 × 1.25, Y3 = Y1 × 1.5625)
5. WACC = 32% minimum
6. NPV = Σ(net_cash_flow_n / (1 + 0.32)^n) − initial_investment  where n = year (1, 2, 3)
7. Payback period = month when cumulative net cash flow first turns positive
8. ROI = (total net profit over 3 years / total investment) × 100
9. IRR = rate at which NPV = 0 (estimate numerically)
10. Break-even monthly revenue = fixed monthly costs / (1 − variable cost ratio)

Return ONLY valid JSON (no markdown, no backticks, no prose — start directly with {):
{
  "report_type": "دراسة الجدوى الاستثمارية العقارية",
  "executive_summary": "3 sentences in Arabic covering: project type and location, financial verdict, key risk",
  "verdict": "go|caution|nogo",
  "verdict_title": "Arabic title matching verdict (e.g. مشروع واعد | يتطلب تعديلات | غير مجدٍ)",
  "verdict_desc": "1 Arabic sentence explaining verdict",
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
  "marketing_score": 0,
  "score_dimensions": {
    "digital_presence": 0,
    "content_quality": 0,
    "paid_performance": 0,
    "brand_strength": 0,
    "competitive_position": 0
  },
  "scenarios": {
    "pessimist": {
      "label": "سيناريو متشائم",
      "assumption": "Arabic — e.g. occupancy/absorption 40% below target",
      "monthly_revenue": 0,
      "monthly_profit": 0,
      "roi_pct": 0,
      "payback_months": 0
    },
    "base": {
      "label": "السيناريو المتوازن",
      "assumption": "Arabic — base case assumptions",
      "monthly_revenue": 0,
      "monthly_profit": 0,
      "roi_pct": 0,
      "payback_months": 0
    },
    "optimist": {
      "label": "سيناريو متفائل",
      "assumption": "Arabic — e.g. 20% above target absorption",
      "monthly_revenue": 0,
      "monthly_profit": 0,
      "roi_pct": 0,
      "payback_months": 0
    }
  },
  "income_statement": [
    { "item": "الإيرادات الإجمالية", "year1": 0, "year2": 0, "year3": 0, "pct": "100%" },
    { "item": "تكاليف البناء والتشغيل", "year1": 0, "year2": 0, "year3": 0, "pct": "X%" },
    { "item": "تكاليف التسويق والمبيعات", "year1": 0, "year2": 0, "year3": 0, "pct": "X%" },
    { "item": "المصاريف الإدارية", "year1": 0, "year2": 0, "year3": 0, "pct": "X%" },
    { "item": "EBITDA", "year1": 0, "year2": 0, "year3": 0, "pct": "X%" },
    { "item": "صافي الربح", "year1": 0, "year2": 0, "year3": 0, "pct": "X%" }
  ],
  "cash_flow": [
    { "year": "السنة 1", "revenue": 0, "opex": 0, "net_profit": 0, "cumulative": 0 },
    { "year": "السنة 2", "revenue": 0, "opex": 0, "net_profit": 0, "cumulative": 0 },
    { "year": "السنة 3", "revenue": 0, "opex": 0, "net_profit": 0, "cumulative": 0 }
  ],
  "investment_breakdown": [
    { "item": "تكلفة الأرض", "amount": 0, "pct": "X%" },
    { "item": "تكلفة البناء", "amount": 0, "pct": "X%" },
    { "item": "تراخيص وقانونية", "amount": 0, "pct": "X%" },
    { "item": "تسويق ومبيعات", "amount": 0, "pct": "X%" },
    { "item": "احتياطي طوارئ (15%)", "amount": 0, "pct": "15%" }
  ],
  "swot": {
    "strengths": ["Arabic strength 1", "Arabic strength 2", "Arabic strength 3"],
    "weaknesses": ["Arabic weakness 1", "Arabic weakness 2"],
    "opportunities": ["Arabic opportunity 1", "Arabic opportunity 2", "Arabic opportunity 3"],
    "threats": ["Arabic threat 1", "Arabic threat 2"]
  },
  "reality_check": [
    {
      "input": "سعر البيع المستهدف",
      "client_assumption": "EGP X per sqm",
      "market_benchmark": "EGP ${loc} benchmark range",
      "gap_pct": 0,
      "assessment": "realistic|optimistic|unrealistic",
      "comment": "brief Arabic comment"
    },
    {
      "input": "معدل الامتصاص الشهري",
      "client_assumption": "X units/month",
      "market_benchmark": "market average for ${loc}",
      "gap_pct": 0,
      "assessment": "realistic|optimistic|unrealistic",
      "comment": "brief Arabic comment"
    },
    {
      "input": "تكلفة البناء",
      "client_assumption": "EGP X/sqm",
      "market_benchmark": "EGP 4,500–16,000/sqm per finish",
      "gap_pct": 0,
      "assessment": "realistic|optimistic|unrealistic",
      "comment": "brief Arabic comment"
    },
    {
      "input": "هامش الربح المتوقع",
      "client_assumption": "X%",
      "market_benchmark": "20–35% developer benchmark",
      "gap_pct": 0,
      "assessment": "realistic|optimistic|unrealistic",
      "comment": "brief Arabic comment"
    }
  ],
  "sensitivity": [
    { "input": "سعر البيع", "base_roi": 0, "roi_minus20": 0, "roi_plus20": 0, "impact": "high|medium|low" },
    { "input": "معدل الامتصاص", "base_roi": 0, "roi_minus20": 0, "roi_plus20": 0, "impact": "high|medium|low" },
    { "input": "تكلفة البناء", "base_roi": 0, "roi_minus20": 0, "roi_plus20": 0, "impact": "high|medium|low" },
    { "input": "سعر الفائدة / WACC", "base_roi": 0, "roi_minus20": 0, "roi_plus20": 0, "impact": "high|medium|low" }
  ],
  "pain_points": [
    { "level": "high|med|low", "title": "Arabic title", "detail": "Arabic detail" }
  ],
  "risk_alerts": [
    { "severity": "high|medium|low", "risk": "Arabic risk", "fix": "Arabic mitigation" }
  ],
  "quick_wins": [
    { "action": "Arabic action", "timeline": "Arabic timeline", "money_impact": "EGP X" }
  ],
  "audit_checklist": [
    { "item": "دراسة السوق والمنافسين", "status": false },
    { "item": "دراسة الجدوى المالية الكاملة", "status": false },
    { "item": "الحصول على الموافقات والتراخيص", "status": false },
    { "item": "تحديد مصادر التمويل", "status": false },
    { "item": "وضع خطة التسويق قبل الإطلاق", "status": false },
    { "item": "بناء شبكة الوسطاء العقاريين", "status": false },
    { "item": "تحديد المقاول الرئيسي وعقد البناء", "status": false },
    { "item": "إطلاق حملة البيع المسبق (VIP List)", "status": false }
  ],
  "confidence_score": {
    "pct": 0,
    "label": "High|Medium|Low",
    "reason": "Arabic explanation of confidence level based on available data"
  },
  "data_quality_note": "Arabic note on data quality and assumptions used",
  "proposal": [
    {
      "title": "باقة الجدوى والإطلاق المتكاملة",
      "desc": "من هذه الدراسة إلى أول حجوزات — خطة تسويقية شاملة، استراتيجية الدخول للسوق، إدارة حملات رقمية على كل القنوات، تدريب فريق المبيعات، وتقارير أداء شهرية",
      "price": "EGP 45,000–70,000/شهر"
    },
    {
      "title": "سبرينت البيع المسبق — 90 يوم",
      "desc": "90 يوم مكثفة لتحقيق أهداف البيع المسبق: إطلاق VIP، شبكة وسطاء، حملة رقمية متكاملة، تحسين أسبوعي، وتنظيم حفل الحجوزات",
      "price": "EGP 55,000–90,000/شهر"
    },
    {
      "title": "الاستشارة الاستراتيجية",
      "desc": "جلسة عمل مكثفة لمراجعة الجدوى، تحديد السعر المثالي، وضع استراتيجية الدخول للسوق وتحديد خطة العمل للـ 12 شهر القادمة",
      "price": "EGP 15,000 جلسة واحدة"
    }
  ],
  "why_us": [
    "خبرة 7+ سنوات في تسويق المشاريع العقارية في مصر",
    "قاعدة بيانات 50,000+ مستثمر ومشتري نشط",
    "شبكة وسطاء 500+ وسيط معتمد في القاهرة الكبرى",
    "متوسط وقت البيع من الإطلاق للحجز: 21 يوم",
    "أدوات ذكاء اصطناعي لتحليل السوق وتتبع المنافسين"
  ],
  "monte_carlo_inputs": {
    "base_monthly_revenue": 0,
    "base_monthly_opex": 0,
    "revenue_volatility_pct": 25,
    "cost_volatility_pct": 20,
    "total_investment": 0
  }
}`
}
