import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── EGYPT REAL ESTATE BENCHMARKS 2026 ──────────────────────────────
const RE_BENCHMARKS = {
  developer: {
    cpl_meta: '300-800 EGP',
    cpl_google: '500-1200 EGP',
    cpl_tiktok: '150-400 EGP',
    avg_margin: '20-35%',
    net_margin: '10-20%',
    decision_cycle: '60-365 days',
    avg_ticket: '2M-20M EGP',
    cac: '5000-20000 EGP',
    ltv: '200000-2M EGP',
    market_size: 'EGP 600B Egypt real estate 2026',
    market_growth: '18% annually',
    peak_seasons: 'Cityscape exhibitions, Jan, post-Eid Al-Fitr',
    top_formats: 'Project vision video, Site progress, 3D renders, Payment plan graphics',
    top_pain: 'Developer credibility, payment plans, delivery timeline guarantees',
    city_multipliers: {
      'القاهرة الجديدة': 1.0,
      'العاصمة الإدارية': 1.3,
      '6 أكتوبر': 0.85,
      'الشيخ زايد': 0.9,
      'المعادي': 1.1,
      'الساحل الشمالي': 1.4,
      'العين السخنة': 1.2,
    } as Record<string, number>,
  },
  broker: {
    cpl_meta: '200-600 EGP',
    cpl_google: '400-900 EGP',
    avg_commission: '2-3%',
    decision_cycle: '30-180 days',
    avg_ticket: '1M-5M EGP',
    cac: '2000-8000 EGP',
    ltv: '50000-200000 EGP commission',
    market_growth: '18% annually',
    engagement_benchmark: '1-3%',
    top_pain: 'Trust in developer, price volatility, delivery guarantees',
  },
}

// ══════════════════════════════════════════════════════════════════
// CASHFLOW ENGINE — calculates real numbers before calling AI
// Based on Egyptian real estate project structure
// ══════════════════════════════════════════════════════════════════

interface CashflowResult {
  totalBUA: number
  totalLandArea: number
  totalRevenue: number
  revenueSalesComm: number
  revenueMarketing: number
  netRevenue: number
  landCostTotal: number
  constructionCost: number
  constructionInflation: number
  totalConstructionCost: number
  engineeringFees: number
  adminOfficeCost: number
  totalOperatingCost: number
  salesAndMarketingCost: number
  totalCost: number
  grossProfit: number
  taxAmount: number
  netProfit: number
  roi: number
  roiAnnual: number
  npv: number
  paybackYears: number
  annualCashflows: number[]
  isViable: boolean
  viabilityReason: string
}

function calculateCashflow(data: Record<string, string>): CashflowResult {
  const units = parseFloat(data.units) || 0
  const unitArea = parseFloat(data.unitArea) || 0
  const landArea = parseFloat(data.landArea) || units * unitArea * 1.3
  const sellPriceSqm = parseFloat(data.sellPriceSqm) || 0
  const buildCostSqm = parseFloat(data.buildCostSqm) || 0
  const landCostTotal = parseFloat(data.landCost) || 0
  const buildMonths = parseFloat(data.buildMonths) || 24
  const salesMonths = parseFloat(data.salesMonths) || 18
  const downPaymentPct = (parseFloat(data.downPaymentPct) || 20) / 100
  const cashSalesPct = (parseFloat(data.cashSalesPct) || 30) / 100

  const buildYears = buildMonths / 12
  const salesYears = salesMonths / 12
  const projectYears = Math.ceil(buildYears + salesYears + 2)

  const totalBUA = units * unitArea

  // Revenue — mid-point price appreciation during sales period
  const avgSellPrice = sellPriceSqm * (1 + 0.05 * salesYears)
  const totalRevenue = totalBUA * avgSellPrice
  const revenueSalesComm = totalRevenue * 0.12
  const revenueMarketing = totalRevenue * 0.025
  const netRevenue = totalRevenue - revenueSalesComm - revenueMarketing

  // Construction
  const baseConstructionCost = totalBUA * buildCostSqm
  const inflationFactor = buildYears > 0 ? (buildYears - 1) * 0.15 * 0.5 : 0
  const constructionInflation = baseConstructionCost * inflationFactor
  const totalConstructionCost = baseConstructionCost + constructionInflation

  // Operating
  const engineeringFees = totalConstructionCost * 0.03
  const annualAdminCost = Math.max(3_000_000, totalConstructionCost * 0.003)
  const adminOfficeCost = annualAdminCost * projectYears
  const adminOverhead = (engineeringFees + adminOfficeCost) * 0.05
  const totalOperatingCost = engineeringFees + adminOfficeCost + adminOverhead

  const salesAndMarketingCost = revenueSalesComm + revenueMarketing
  const totalCost = landCostTotal + totalConstructionCost + totalOperatingCost + salesAndMarketingCost

  // P&L
  const grossProfit = totalRevenue - totalCost
  const taxAmount = Math.max(0, grossProfit) * 0.225
  const netProfit = grossProfit - taxAmount

  const roi = totalCost > 0 ? netProfit / totalCost : 0
  const roiAnnual = projectYears > 0 ? roi / projectYears : 0

  // Annual cashflows
  const annualCashflows: number[] = []
  const annualConstruction = totalConstructionCost / (buildYears || 1)
  const annualRevenue = totalRevenue / (salesYears + 2)
  const landAnnualInstallment = (landCostTotal * 0.75) / Math.min(6, projectYears)

  for (let y = 0; y <= projectYears; y++) {
    let inflow = 0
    let outflow = 0

    if (y === 0) {
      outflow += landCostTotal * 0.25
    } else if (y <= 6) {
      outflow += landAnnualInstallment
    }

    if (y < buildYears) outflow += annualConstruction
    outflow += totalOperatingCost / projectYears

    if (y >= 1) {
      const salesYear = y - 1
      if (salesYear < salesYears) {
        if (y <= buildYears) inflow += totalRevenue * cashSalesPct / (buildYears || 1)
        if (y > buildYears * 0.5) inflow += annualRevenue * 0.7
      } else if (salesYear < salesYears + 2) {
        inflow += totalRevenue * (1 - downPaymentPct) * 0.3 / 2
      }
    }

    annualCashflows.push(inflow - outflow)
  }

  // NPV at 20%
  let npv = 0
  annualCashflows.forEach((cf, year) => {
    npv += cf / Math.pow(1.20, year)
  })

  // Payback
  let cumulative = 0
  let paybackYears = projectYears
  for (let y = 0; y < annualCashflows.length; y++) {
    cumulative += annualCashflows[y]
    if (cumulative >= 0 && paybackYears === projectYears) paybackYears = y
  }

  const isViable = netProfit > 0 && npv > 0 && roiAnnual > 0.08
  let viabilityReason = ''
  if (!isViable) {
    if (netProfit <= 0) viabilityReason = 'صافي الربح سالب — التكاليف تتجاوز الإيرادات'
    else if (npv <= 0) viabilityReason = 'NPV سالب — المشروع لا يغطي تكلفة رأس المال (20%)'
    else viabilityReason = 'العائد السنوي أقل من الحد الأدنى المقبول (8%)'
  } else {
    if (roiAnnual > 0.15) viabilityReason = 'عائد ممتاز يتجاوز معيار السوق المصري (8-15% سنوي)'
    else if (roiAnnual > 0.10) viabilityReason = 'عائد جيد ضمن معيار السوق المصري'
    else viabilityReason = 'عائد مقبول — ضمن الحد الأدنى لمعيار السوق'
  }

  return {
    totalBUA, totalLandArea: landArea,
    totalRevenue, revenueSalesComm, revenueMarketing, netRevenue,
    landCostTotal, constructionCost: baseConstructionCost,
    constructionInflation, totalConstructionCost,
    engineeringFees, adminOfficeCost, totalOperatingCost,
    salesAndMarketingCost, totalCost,
    grossProfit, taxAmount, netProfit,
    roi, roiAnnual, npv, paybackYears,
    annualCashflows, isViable, viabilityReason,
  }
}

function formatEGP(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)} مليار EGP`
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} مليون EGP`
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(0)} ألف EGP`
  return `${amount.toFixed(0)} EGP`
}

function formatPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

// ══════════════════════════════════════════════════════════════════
// END CASHFLOW ENGINE
// ══════════════════════════════════════════════════════════════════

// ── PROMPTS ─────────────────────────────────────────────────────────

function buildFeasibilityPrompt(data: Record<string, string>): string {
  const cf = calculateCashflow(data)
  const bench = RE_BENCHMARKS.developer
  const cityMult = bench.city_multipliers[data.city] ?? 1.0

  const verdictValue = cf.isViable ? 'مجدي' : cf.roi > 0 ? 'مجدي مشروط' : 'غير مجدي'
  const confPct = data.realSellSqm && data.realBuildSqm && data.realSalesPace ? 85
    : (data.realSellSqm || data.realBuildSqm) ? 75 : 65
  const confReason = data.realSellSqm && data.realBuildSqm
    ? 'أرقام محسوبة رياضياً مع مقارنة بالسوق الفعلي'
    : 'أرقام محسوبة رياضياً — أضف بيانات السوق لرفع الدقة'

  const riskOverall = cf.roiAnnual < 0.05 ? 'High' : cf.roiAnnual < 0.10 ? 'Medium' : 'Low'
  const riskScore = Math.round(Math.max(20, Math.min(85, 80 - cf.roiAnnual * 200)))
  const financeRisk = Math.round(Math.min(90, (cf.landCostTotal / cf.totalCost) * 120))
  const marketRisk = Math.round(Math.min(80, Math.max(20, 50 - (cf.roi - 0.5) * 30)))
  const execRisk = Math.round(Math.min(75, 35 + (parseFloat(data.buildMonths) || 24) * 0.5))
  const liquidityRisk = Math.round(Math.min(80, Math.max(25, 60 - (parseFloat(data.downPaymentPct) || 20) * 1.5)))

  const irrLabel = cf.roiAnnual > 0.20 ? 'أعلى من 25%'
    : cf.roiAnnual > 0.15 ? '18-25%'
    : cf.roiAnnual > 0.10 ? '12-18%'
    : cf.roiAnnual > 0 ? '5-12%' : 'سالب'

  return `You are Egypt's top real estate financial analyst.
The cashflow has already been CALCULATED. Your job is to INTERPRET and EXPLAIN — do NOT recalculate numbers.

PROJECT: ${data.projectName} | City: ${data.city} (price multiplier: ${cityMult}x)
Type: ${data.projectType} | Units: ${data.units} × ${data.unitArea}m² = ${cf.totalBUA.toFixed(0)}m² BUA
Land: ${data.landArea || 'estimated'}m² | Finish: ${data.finishLevel}

CALCULATED FINANCIALS (use these exact numbers):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REVENUE:
  Total Revenue:          ${formatEGP(cf.totalRevenue)}
  Sales Commission 12%:   ${formatEGP(cf.revenueSalesComm)}
  Marketing 2.5%:         ${formatEGP(cf.revenueMarketing)}
  Net Revenue:            ${formatEGP(cf.netRevenue)}

COSTS:
  Land Cost:              ${formatEGP(cf.landCostTotal)}
  Construction (base):    ${formatEGP(cf.constructionCost)}
  Construction Inflation: ${formatEGP(cf.constructionInflation)}
  Total Construction:     ${formatEGP(cf.totalConstructionCost)}
  Engineering Fees 3%:    ${formatEGP(cf.engineeringFees)}
  Admin & Office:         ${formatEGP(cf.adminOfficeCost)}
  Sales & Marketing:      ${formatEGP(cf.salesAndMarketingCost)}
  TOTAL COST:             ${formatEGP(cf.totalCost)}

P&L:
  Gross Profit:           ${formatEGP(cf.grossProfit)}
  Tax 22.5%:              ${formatEGP(cf.taxAmount)}
  NET PROFIT:             ${formatEGP(cf.netProfit)}

RETURNS:
  ROI (total):            ${formatPct(cf.roi)}
  ROI (annual):           ${formatPct(cf.roiAnnual)}
  NPV at 20%:             ${formatEGP(cf.npv)} (${cf.npv > 0 ? 'POSITIVE ✅' : 'NEGATIVE ❌'})
  Payback:                ${cf.paybackYears} years
  Viability:              ${cf.isViable ? 'VIABLE' : 'NOT VIABLE'}
  Reason:                 ${cf.viabilityReason}

ANNUAL CASHFLOWS: ${cf.annualCashflows.map((v, i) => `Year ${i}: ${formatEGP(v)}`).join(' | ')}

EGYPT BENCHMARKS 2026:
  Annual ROI benchmark: 8-15% (this project: ${formatPct(cf.roiAnnual)})
  Build cost benchmark: 18,000–25,000 EGP/m² (2026)
  Construction inflation: 15-20% annual
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MARKET COMPARISON:
  User sell price: ${data.sellPriceSqm} EGP/m² | Market: ${data.realSellSqm || 'not provided'}
  User build cost: ${data.buildCostSqm} EGP/m² | Market: ${data.realBuildSqm || 'not provided'}
  Sales pace: ${data.realSalesPace || 'not provided'} units/month

INSTRUCTIONS:
1. Use the EXACT calculated numbers above — do NOT change them
2. Verdict must be "${verdictValue}"
3. Write executive_summary in Arabic — explain WHY based on the numbers
4. For reality_check assessments write: منطقي OR متفائل OR متحفظ
5. For risk dimension details: write specific risks for THIS project

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "دراسة الجدوى العقارية",
  "project_name": "${data.projectName}",
  "city": "${data.city}",
  "executive_summary": "3 sentences in Arabic: verdict with specific numbers, key strength, key risk",
  "verdict": "${verdictValue}",
  "verdict_reason": "${cf.viabilityReason}",
  "financials": {
    "total_revenue": "${formatEGP(cf.totalRevenue)}",
    "total_cost": "${formatEGP(cf.totalCost)}",
    "gross_profit": "${formatEGP(cf.grossProfit)}",
    "net_profit": "${formatEGP(cf.netProfit)}",
    "gross_margin_pct": "${formatPct(cf.grossProfit / cf.totalRevenue)}",
    "net_margin_pct": "${formatPct(cf.netProfit / cf.totalRevenue)}",
    "total_investment": "${formatEGP(cf.totalCost)}",
    "roi_pct": "${formatPct(cf.roi)} (${formatPct(cf.roiAnnual)} سنوياً)",
    "payback_months": "${(cf.paybackYears * 12).toFixed(0)} شهر (${cf.paybackYears.toFixed(1)} سنة)",
    "npv_assessment": "${formatEGP(cf.npv)} — ${cf.npv > 0 ? 'موجب، المشروع يغطي تكلفة رأس المال' : 'سالب، المشروع لا يغطي تكلفة رأس المال'}",
    "irr_estimate": "${irrLabel}"
  },
  "cost_breakdown": {
    "land": "${formatEGP(cf.landCostTotal)} (${formatPct(cf.landCostTotal / cf.totalCost)} من التكلفة)",
    "construction": "${formatEGP(cf.totalConstructionCost)} (${formatPct(cf.totalConstructionCost / cf.totalCost)} من التكلفة)",
    "operating": "${formatEGP(cf.totalOperatingCost)} (${formatPct(cf.totalOperatingCost / cf.totalCost)} من التكلفة)",
    "sales_marketing": "${formatEGP(cf.salesAndMarketingCost)} (${formatPct(cf.salesAndMarketingCost / cf.totalCost)} من التكلفة)"
  },
  "scenarios": {
    "pessimistic": {
      "assumption": "انخفاض سعر البيع 15%، زيادة التكاليف 10%",
      "net_profit": "${formatEGP(cf.netProfit * 0.55)}",
      "roi_pct": "${formatPct(cf.roi * 0.55)}",
      "roi_annual_pct": "${formatPct(cf.roiAnnual * 0.55)}",
      "payback_months": "${((cf.paybackYears * 1.4) * 12).toFixed(0)} شهر",
      "verdict": "${cf.roi * 0.55 > 0.3 ? 'مجدي' : cf.roi * 0.55 > 0 ? 'مجدي مشروط' : 'غير مجدي'}"
    },
    "base": {
      "assumption": "الافتراضات المُدخلة",
      "net_profit": "${formatEGP(cf.netProfit)}",
      "roi_pct": "${formatPct(cf.roi)}",
      "roi_annual_pct": "${formatPct(cf.roiAnnual)}",
      "payback_months": "${(cf.paybackYears * 12).toFixed(0)} شهر",
      "verdict": "${verdictValue}"
    },
    "optimistic": {
      "assumption": "ارتفاع سعر البيع 15%، توفير 5% في التكاليف",
      "net_profit": "${formatEGP(cf.netProfit * 1.45)}",
      "roi_pct": "${formatPct(cf.roi * 1.45)}",
      "roi_annual_pct": "${formatPct(cf.roiAnnual * 1.45)}",
      "payback_months": "${((cf.paybackYears * 0.75) * 12).toFixed(0)} شهر",
      "verdict": "مجدي"
    }
  },
  "reality_check": [
    {
      "item": "سعر البيع/م²",
      "your_value": "${data.sellPriceSqm} EGP",
      "market_benchmark": "${data.realSellSqm ? data.realSellSqm + ' EGP' : 'غير محدد'}",
      "assessment": "write: منطقي OR متفائل OR متحفظ based on comparison"
    },
    {
      "item": "تكلفة البناء/م²",
      "your_value": "${data.buildCostSqm} EGP",
      "market_benchmark": "${data.realBuildSqm ? data.realBuildSqm + ' EGP' : 'غير محدد'}",
      "assessment": "write: منطقي OR متفائل OR متحفظ"
    },
    {
      "item": "هامش الربح الإجمالي",
      "your_value": "${formatPct(cf.grossProfit / cf.totalRevenue)}",
      "market_benchmark": "30-50% للمطورين المصريين",
      "assessment": "write: منطقي OR متفائل OR متحفظ"
    }
  ],
  "sensitivity_analysis": [
    {
      "variable": "سعر البيع/م²",
      "impact_10pct_up": "${formatEGP(cf.totalRevenue * 0.1 * 0.775)} إضافية للربح",
      "impact_10pct_down": "${formatEGP(cf.totalRevenue * 0.1 * 0.775)} خسارة من الربح",
      "sensitivity": "${cf.totalRevenue > cf.totalCost * 1.5 ? 'متوسطة' : 'عالية'}"
    },
    {
      "variable": "تكلفة البناء/م²",
      "impact_10pct_up": "${formatEGP(cf.constructionCost * 0.1)} زيادة في التكاليف",
      "impact_10pct_down": "${formatEGP(cf.constructionCost * 0.1)} توفير في التكاليف",
      "sensitivity": "${cf.constructionCost / cf.totalCost > 0.45 ? 'عالية' : 'متوسطة'}"
    },
    {
      "variable": "مدة البيع",
      "impact_3months_more": "زيادة تكاليف التشغيل ${formatEGP(cf.totalOperatingCost * 0.08)}",
      "impact_3months_less": "توفير ${formatEGP(cf.totalOperatingCost * 0.08)} وتحسن cashflow",
      "sensitivity": "متوسطة"
    }
  ],
  "risk_scorecard": {
    "overall_risk": "${riskOverall}",
    "overall_score": ${riskScore},
    "dimensions": [
      {"name": "مخاطر التمويل", "score": ${financeRisk}, "detail": "write specific financing risk for this project"},
      {"name": "مخاطر السوق والتسعير", "score": ${marketRisk}, "detail": "write specific market/pricing risk"},
      {"name": "مخاطر التنفيذ والتأخير", "score": ${execRisk}, "detail": "write specific execution risk"},
      {"name": "مخاطر السيولة", "score": ${liquidityRisk}, "detail": "write specific liquidity risk based on payment structure"}
    ]
  },
  "immediate_actions": [
    {"action": "specific action 1 based on calculated numbers", "timeline": "خلال 7 أيام", "impact": "specific financial impact"},
    {"action": "specific action 2", "timeline": "خلال 30 يوم", "impact": "specific impact"},
    {"action": "specific action 3", "timeline": "خلال 60 يوم", "impact": "specific impact"}
  ],
  "confidence_score": {
    "pct": ${confPct},
    "label": "${confPct >= 80 ? 'High' : 'Medium'}",
    "reason": "${confReason}"
  }
}`
}

function buildCampaignROIPrompt(data: Record<string, string>): string {
  const { companyName, city, clientType, adSpend, cpl, leads, roas,
    metaSpend, googleSpend, tiktokSpend } = data
  const bench = clientType === 'developer' ? RE_BENCHMARKS.developer : RE_BENCHMARKS.broker

  return `You are Egypt's top real estate marketing analyst. Generate a Campaign ROI Audit.

CLIENT DATA:
- Company: ${companyName}
- City: ${city}
- Type: ${clientType === 'developer' ? 'مطور عقاري' : 'وسيط/بروكر عقاري'}
- Total ad spend/month: EGP ${adSpend}
- Meta spend: EGP ${metaSpend || 'not specified'}
- Google spend: EGP ${googleSpend || 'not specified'}
- TikTok spend: EGP ${tiktokSpend || 'not specified'}
- Current CPL: EGP ${cpl}
- Monthly leads: ${leads}
- ROAS: ${roas || 'not tracked'}

EGYPT REAL ESTATE BENCHMARKS 2026:
- Developer Meta CPL: ${RE_BENCHMARKS.developer.cpl_meta}
- Developer Google CPL: ${RE_BENCHMARKS.developer.cpl_google}
- Broker Meta CPL: ${RE_BENCHMARKS.broker.cpl_meta}
- Decision cycle: ${bench.decision_cycle}
- Peak seasons: ${'peak_seasons' in bench ? bench.peak_seasons : 'N/A'}

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "تدقيق أداء الحملات الإعلانية",
  "company": "${companyName}",
  "executive_summary": "2 sentences: overall performance assessment and biggest opportunity",
  "performance_verdict": "ممتاز/جيد/يحتاج تحسين/ضعيف",
  "kpi_scorecard": {
    "current_cpl": "EGP ${cpl}",
    "benchmark_cpl": "${bench.cpl_meta}",
    "cpl_gap_pct": "% above or below benchmark",
    "cpl_status": "أفضل من المعيار/ضمن المعيار/أعلى من المعيار/أعلى بكثير",
    "monthly_leads": "${leads}",
    "expected_leads_at_benchmark": "calculate: ${adSpend} / benchmark_cpl_midpoint",
    "leads_gap": "difference in leads being lost monthly",
    "roas": "${roas || 'غير محدد'}",
    "roas_benchmark": "3-6x for real estate",
    "roas_status": "ممتاز/جيد/ضعيف/غير محدد",
    "wasted_budget_estimate": "EGP amount wasted vs benchmark performance"
  },
  "channel_breakdown": [
    {"channel": "Meta Ads", "spend": "EGP ${metaSpend || 'not specified'}", "benchmark_cpl": "${RE_BENCHMARKS.developer.cpl_meta}", "estimated_leads": "calculate if spend provided", "performance": "أفضل من المعيار/ضمن/أعلى", "recommendation": "specific action"},
    {"channel": "Google Ads", "spend": "EGP ${googleSpend || 'not specified'}", "benchmark_cpl": "${RE_BENCHMARKS.developer.cpl_google}", "estimated_leads": "calculate if spend provided", "performance": "أفضل من المعيار/ضمن/أعلى", "recommendation": "specific action"},
    {"channel": "TikTok Ads", "spend": "EGP ${tiktokSpend || 'not specified'}", "benchmark_cpl": "${RE_BENCHMARKS.developer.cpl_tiktok}", "estimated_leads": "calculate if spend provided", "performance": "أفضل من المعيار/ضمن/أعلى/غير مستخدم", "recommendation": "specific action"}
  ],
  "optimizations": [
    {"rank": 1, "action": "most impactful specific optimization", "expected_cpl_reduction": "% or EGP reduction", "timeline": "3-7 days to implement", "effort": "منخفض/متوسط/عالي"},
    {"rank": 2, "action": "second optimization", "expected_cpl_reduction": "% or EGP", "timeline": "timeline", "effort": "effort"},
    {"rank": 3, "action": "third optimization", "expected_cpl_reduction": "% or EGP", "timeline": "timeline", "effort": "effort"}
  ],
  "projection_optimized": {
    "target_cpl": "EGP achievable within 60 days",
    "projected_leads_month1": "leads at target CPL with same budget",
    "projected_leads_month2": "leads after full optimization",
    "additional_leads_monthly": "extra leads vs current",
    "roi_improvement": "% improvement in marketing ROI"
  },
  "confidence_score": {"pct": 0, "label": "High/Medium/Low", "reason": "based on data quality"}
}`
}

function buildMarketEntryPrompt(data: Record<string, string>): string {
  const { companyName, targetCity, clientType, budget, timeline } = data
  const bench = RE_BENCHMARKS.developer
  const cityMult = bench.city_multipliers[targetCity] ?? 1.0
  const metaLow = Math.round(parseInt(bench.cpl_meta.split('-')[0]) * cityMult)
  const metaHigh = Math.round(parseInt(bench.cpl_meta.split('-')[1]) * cityMult)
  const gLow = Math.round(parseInt(bench.cpl_google.split('-')[0]) * cityMult)
  const gHigh = Math.round(parseInt(bench.cpl_google.split('-')[1]) * cityMult)

  return `You are Egypt's top real estate market intelligence analyst. Generate a Market Entry report.

COMPANY: ${companyName}
TARGET MARKET: ${targetCity}
TYPE: ${clientType === 'developer' ? 'مطور عقاري' : 'وسيط/بروكر عقاري'}
ENTRY BUDGET: EGP ${budget}/month
TIMELINE: ${timeline}

MARKET DATA:
- ${targetCity} CPL multiplier vs Cairo: ${cityMult}x
- Expected Meta CPL in ${targetCity}: EGP ${metaLow}-${metaHigh}
- Market growth: ${bench.market_growth}
- Key seasons: ${bench.peak_seasons}

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "تقرير دخول السوق العقاري",
  "target_market": "${targetCity}",
  "executive_summary": "2 sentences: market opportunity and recommended entry approach",
  "market_scores": {
    "attractiveness": {"score": 0, "max": 10, "label": "جاذبية السوق", "reasoning": "2 sentences"},
    "competition": {"score": 0, "max": 10, "label": "مستوى المنافسة (أعلى = أشد)", "reasoning": "2 sentences"},
    "entry_difficulty": {"score": 0, "max": 10, "label": "صعوبة الدخول (أعلى = أصعب)", "reasoning": "2 sentences"},
    "opportunity_size": {"score": 0, "max": 10, "label": "حجم الفرصة", "reasoning": "2 sentences"}
  },
  "market_overview": {
    "size_estimate": "EGP value of ${targetCity} real estate market",
    "growth_rate": "${bench.market_growth}",
    "demand_supply": "Oversupply/Balanced/Undersupply with explanation",
    "buyer_profile": "primary buyer profile in ${targetCity}",
    "avg_price_sqm": "EGP range for residential in ${targetCity}",
    "key_developers": ["developer 1 active in ${targetCity}", "developer 2", "developer 3"]
  },
  "swot": {
    "strengths": ["strength 1 for ${companyName} entering ${targetCity}", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "opportunities": ["opportunity 1 specific to ${targetCity}", "opportunity 2", "opportunity 3"],
    "threats": ["threat 1", "threat 2"]
  },
  "cpl_intelligence": {
    "meta_cpl_expected": "EGP ${metaLow}-${metaHigh}",
    "google_cpl_expected": "EGP ${gLow}-${gHigh}",
    "budget_required_100leads": "EGP amount for 100 qualified leads/month",
    "recommended_test_budget": "EGP amount for market validation phase",
    "payback_timeline": "months to first profitable campaign"
  },
  "entry_strategy_90days": {
    "month1": {"title": "التأسيس الرقمي", "actions": ["action 1", "action 2", "action 3"], "budget": "EGP", "kpi": "measurable target"},
    "month2": {"title": "اختبار السوق", "actions": ["action 1", "action 2", "action 3"], "budget": "EGP", "kpi": "measurable target"},
    "month3": {"title": "التوسع والتحسين", "actions": ["action 1", "action 2", "action 3"], "budget": "EGP", "kpi": "measurable target"}
  },
  "recommendation": "final 2-sentence recommendation: should they enter, how, and when",
  "confidence_score": {"pct": 0, "label": "High/Medium/Low", "reason": "based on available market data"}
}`
}

function buildLeadGenPrompt(data: Record<string, string>): string {
  const { companyName, city, clientType, currentLeads, qualifiedPct,
    adSpend, cpl, avgDealValue, salesCycle } = data
  const bench = clientType === 'developer' ? RE_BENCHMARKS.developer : RE_BENCHMARKS.broker

  return `You are Egypt's top real estate lead generation strategist. Generate a Lead Generation Intelligence report.

DATA:
- Company: ${companyName}
- City: ${city}
- Type: ${clientType === 'developer' ? 'مطور عقاري' : 'وسيط/بروكر عقاري'}
- Monthly leads: ${currentLeads}
- Qualified leads %: ${qualifiedPct}%
- Monthly ad spend: EGP ${adSpend}
- Current CPL: EGP ${cpl}
- Average deal value: EGP ${avgDealValue}
- Sales cycle: ${salesCycle} days

BENCHMARKS:
- Decision cycle: ${bench.decision_cycle}
- CAC benchmark: ${bench.cac}
- LTV benchmark: ${bench.ltv}

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "تقرير استخبارات توليد العملاء",
  "company": "${companyName}",
  "executive_summary": "2 sentences: lead quality assessment and biggest improvement opportunity",
  "pipeline_health": {
    "monthly_leads": ${currentLeads || 0},
    "qualified_leads": "calculate: ${currentLeads} × ${qualifiedPct}%",
    "qualification_rate": "${qualifiedPct}%",
    "qualification_benchmark": "15-25% for real estate",
    "qualification_verdict": "ممتاز/جيد/يحتاج تحسين",
    "estimated_monthly_deals": "calculate: qualified × close rate estimate",
    "estimated_monthly_revenue": "EGP based on ${avgDealValue}",
    "cac_current": "EGP ${adSpend} / qualified leads",
    "cac_benchmark": "${bench.cac}",
    "ltv_cac_ratio": "calculate and assess"
  },
  "lead_quality_diagnosis": [
    {"issue": "specific quality issue 1 for real estate in ${city}", "severity": "عالية/متوسطة/منخفضة", "impact": "% leads lost", "fix": "specific action"},
    {"issue": "specific quality issue 2", "severity": "عالية/متوسطة/منخفضة", "impact": "% leads lost", "fix": "specific action"},
    {"issue": "specific quality issue 3", "severity": "عالية/متوسطة/منخفضة", "impact": "% leads lost", "fix": "specific action"}
  ],
  "qualification_framework": {
    "scoring_criteria": [
      {"criterion": "الميزانية", "weight": "30%", "qualifier": "specific budget range for ${clientType}"},
      {"criterion": "الجدية والنية", "weight": "25%", "qualifier": "signs of serious buyer intent"},
      {"criterion": "الجدول الزمني", "weight": "20%", "qualifier": "timeline indicators"},
      {"criterion": "صلاحية اتخاذ القرار", "weight": "15%", "qualifier": "decision maker identification"},
      {"criterion": "الموقع الجغرافي", "weight": "10%", "qualifier": "location match criteria"}
    ],
    "disqualifiers": ["disqualifier 1 specific to ${clientType}", "disqualifier 2", "disqualifier 3"],
    "nurture_vs_close": "criteria for when to nurture vs push to close"
  },
  "channel_lead_quality": [
    {"channel": "Meta Ads", "lead_quality": "High/Medium/Low", "typical_qualification_rate": "%", "recommendation": "specific action"},
    {"channel": "Google Search", "lead_quality": "High/Medium/Low", "typical_qualification_rate": "%", "recommendation": "specific action"},
    {"channel": "WhatsApp Organic", "lead_quality": "High/Medium/Low", "typical_qualification_rate": "%", "recommendation": "specific action"},
    {"channel": "Referrals", "lead_quality": "High/Medium/Low", "typical_qualification_rate": "%", "recommendation": "specific action"}
  ],
  "improvements": [
    {"action": "specific improvement 1", "expected_impact": "% increase in qualified leads", "timeline": "days", "effort": "منخفض/متوسط/عالي"},
    {"action": "specific improvement 2", "expected_impact": "% impact", "timeline": "days", "effort": "effort"},
    {"action": "specific improvement 3", "expected_impact": "% impact", "timeline": "days", "effort": "effort"}
  ],
  "whatsapp_script": {
    "opening": "specific opening message for ${clientType} leads in ${city}",
    "qualification_questions": ["question 1 to qualify budget", "question 2 to qualify timeline", "question 3 to qualify seriousness"],
    "closing": "specific call to action"
  },
  "confidence_score": {"pct": 0, "label": "High/Medium/Low", "reason": "based on data provided"}
}`
}

function buildFullAnalysisPrompt(data: Record<string, string>): string {
  const { companyName, city, clientType, website, fbPage, igPage, ttPage,
    adSpend, cpl, roas, leads, revenue, competitors } = data
  const bench = clientType === 'developer' ? RE_BENCHMARKS.developer : RE_BENCHMARKS.broker
  const devBench = RE_BENCHMARKS.developer

  return `You are Egypt's top real estate marketing intelligence analyst. Generate a comprehensive Full Marketing Analysis.
This is a premium report — every section must be specific, data-driven, and actionable for a ${clientType === 'developer' ? 'real estate developer' : 'real estate broker'} in ${city}.

CLIENT DATA:
- Company: ${companyName}
- City: ${city}
- Type: ${clientType === 'developer' ? 'مطور عقاري' : 'وسيط/بروكر عقاري'}
- Website: ${website || 'not provided'}
- Facebook: ${fbPage || 'not provided'}
- Instagram: ${igPage || 'not provided'}
- TikTok: ${ttPage || 'not provided'}
- Monthly ad spend: EGP ${adSpend || 'not provided'}
- Current CPL: EGP ${cpl || 'not provided'}
- ROAS: ${roas || 'not provided'}
- Monthly leads: ${leads || 'not provided'}
- Monthly revenue: EGP ${revenue || 'not provided'}
- Known competitors: ${competitors || 'not provided'}

EGYPT REAL ESTATE BENCHMARKS 2026:
- Market size: ${devBench.market_size}
- Growth: ${devBench.market_growth}
- Meta CPL: ${bench.cpl_meta}
- Google CPL: ${bench.cpl_google}
- Decision cycle: ${bench.decision_cycle}
- Peak seasons: ${'peak_seasons' in bench ? bench.peak_seasons : 'N/A'}
- Top pain points: ${bench.top_pain}

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "التحليل التسويقي الشامل",
  "company": "${companyName}",
  "marketing_score": 0,
  "score_breakdown": {
    "digital_presence": {"score": 0, "max": 100, "assessment": "2 sentences"},
    "paid_performance": {"score": 0, "max": 100, "assessment": "2 sentences"},
    "content_quality": {"score": 0, "max": 100, "assessment": "2 sentences"},
    "brand_strength": {"score": 0, "max": 100, "assessment": "2 sentences"},
    "competitive_position": {"score": 0, "max": 100, "assessment": "2 sentences"}
  },
  "executive_summary": "3 powerful sentences: market position, biggest strength, most urgent opportunity",
  "market_overview": {
    "size": "${devBench.market_size}",
    "growth": "${devBench.market_growth}",
    "city_specific": "2 sentences on ${city} real estate market conditions 2026",
    "key_trends": ["trend 1 specific to ${city}", "trend 2", "trend 3"]
  },
  "digital_presence_audit": {
    "website": {"status": "موجود/غير موجود", "assessment": "2 sentences", "score": 0},
    "facebook": {"activity": "نشط/غير نشط", "assessment": "1 sentence"},
    "instagram": {"activity": "نشط/غير نشط", "assessment": "1 sentence"},
    "tiktok": {"activity": "نشط/غير نشط", "assessment": "1 sentence"},
    "google_business": {"status": "موجود/غير موجود", "assessment": "1 sentence"},
    "overall_digital_maturity": "متقدم/متوسط/مبتدئ"
  },
  "campaign_performance": {
    "cpl_analysis": {"current": "EGP ${cpl || 'غير محدد'}", "benchmark": "${bench.cpl_meta}", "verdict": "أفضل/ضمن/أعلى من المعيار"},
    "roas_analysis": {"current": "${roas || 'غير محدد'}", "benchmark": "3-6x for real estate", "verdict": "ممتاز/جيد/ضعيف/غير محدد"},
    "wasted_budget": "EGP estimate if data available",
    "top_3_optimizations": ["optimization 1", "optimization 2", "optimization 3"]
  },
  "competitive_landscape": {
    "competition_level": "منخفض/متوسط/عالي/عالي جداً",
    "competitive_gaps": ["gap 1 that ${companyName} can exploit", "gap 2", "gap 3"],
    "differentiation_opportunity": "2 sentences on the clearest differentiation opportunity"
  },
  "swot": {
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "weaknesses": ["specific weakness 1", "specific weakness 2"],
    "opportunities": ["specific opportunity in ${city}", "opportunity 2", "opportunity 3"],
    "threats": ["specific threat 1", "specific threat 2"]
  },
  "strategy_90days": {
    "month1": {"focus": "title", "actions": ["action 1", "action 2", "action 3"], "kpi": "measurable target", "budget": "EGP"},
    "month2": {"focus": "title", "actions": ["action 1", "action 2", "action 3"], "kpi": "measurable target", "budget": "EGP"},
    "month3": {"focus": "title", "actions": ["action 1", "action 2", "action 3"], "kpi": "measurable target", "budget": "EGP"}
  },
  "quick_wins": [
    {"action": "most impactful quick win", "timeline": "7 days", "impact": "specific EGP or % impact", "effort": "منخفض"},
    {"action": "second quick win", "timeline": "14 days", "impact": "impact", "effort": "منخفض"},
    {"action": "third quick win", "timeline": "21 days", "impact": "impact", "effort": "متوسط"}
  ],
  "pain_points": [
    {"level": "high", "title": "main pain", "detail": "2 sentences with solution"},
    {"level": "high", "title": "second pain", "detail": "2 sentences"},
    {"level": "med", "title": "third pain", "detail": "1 sentence"}
  ],
  "confidence_score": {"pct": 0, "label": "High/Medium/Low", "reason": "based on data completeness"}
}`
}

// ── MAIN ROUTE ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, formData } = body as { reportType: string; formData: Record<string, string> }

    if (!reportType || !formData) {
      return NextResponse.json({ error: 'Missing reportType or formData' }, { status: 400 })
    }

    let prompt: string
    switch (reportType) {
      case 'feasibility':
        prompt = buildFeasibilityPrompt(formData)
        break
      case 'campaign_roi':
        prompt = buildCampaignROIPrompt(formData)
        break
      case 'market_entry':
        prompt = buildMarketEntryPrompt(formData)
        break
      case 'lead_gen':
        prompt = buildLeadGenPrompt(formData)
        break
      case 'full_analysis':
        prompt = buildFullAnalysisPrompt(formData)
        break
      default:
        return NextResponse.json({ error: `Unknown report type: ${reportType}` }, { status: 400 })
    }

    // Call OpenAI
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate marketing analyst specializing in the Egyptian market. Always respond with ONLY valid JSON. Never use markdown code blocks. Start directly with { and end with }.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    let reportData: Record<string, unknown>

    try {
      const cleaned = rawText
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/```\s*$/, '')
        .trim()
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      reportData = JSON.parse(start !== -1 ? cleaned.substring(start, end + 1) : cleaned) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: rawText.slice(0, 500) }, { status: 500 })
    }

    // Save to Supabase (reports table may not be in generated types yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase as any).from('reports').insert({
      user_id: user.id,
      report_type: reportType,
      company_name: formData.companyName ?? formData.projectName ?? 'Unknown',
      city: formData.city ?? formData.targetCity ?? '',
      report_data: reportData,
      created_at: new Date().toISOString(),
    })

    if (dbError) console.error('[intelligence] DB error:', dbError.message)

    return NextResponse.json({ success: true, report: reportData })
  } catch (err) {
    console.error('[intelligence] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
