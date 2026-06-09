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

// ══════════════════════════════════════════════════════════════════
// SMART CALCULATORS — run before AI, provide pre-calculated numbers
// ══════════════════════════════════════════════════════════════════

function calculateCampaignROI(data: Record<string, string>) {
  const adSpend = parseFloat(data.adSpend) || 0
  const cpl = parseFloat(data.cpl) || 0
  const leads = adSpend > 0 && cpl > 0 ? Math.round(adSpend / cpl) : parseFloat(data.leads) || 0
  const roas = parseFloat(data.roas) || 0
  const metaSpend = parseFloat(data.metaSpend) || 0
  const googleSpend = parseFloat(data.googleSpend) || 0
  const tiktokSpend = parseFloat(data.tiktokSpend) || 0
  const clientType = data.clientType || 'developer'

  const benchCPL = clientType === 'developer' ? 550 : 400
  const benchROAS = 3.5

  const cplGapPct = benchCPL > 0 ? ((cpl - benchCPL) / benchCPL) * 100 : 0
  const expectedLeads = benchCPL > 0 ? Math.round(adSpend / benchCPL) : 0
  const leadsGap = expectedLeads - leads
  const wastedBudget = leadsGap > 0 ? Math.round(leadsGap * cpl) : 0
  const roasGapPct = benchROAS > 0 ? ((roas - benchROAS) / benchROAS) * 100 : 0

  const targetCPL = Math.round(benchCPL * 0.9)
  const projectedLeads = adSpend > 0 && targetCPL > 0 ? Math.round(adSpend / targetCPL) : 0
  const additionalLeads = projectedLeads - leads

  const cplStatus = cplGapPct <= -10 ? 'أفضل من المعيار ✅' :
                    cplGapPct <= 15  ? 'ضمن المعيار' :
                    cplGapPct <= 40  ? 'أعلى من المعيار ⚠️' : 'أعلى بكثير من المعيار ❌'

  const roasStatus = !roas        ? 'غير محدد' :
                     roas >= 5    ? 'ممتاز ✅' :
                     roas >= 3    ? 'جيد' :
                     roas >= 1.5  ? 'ضعيف ⚠️' : 'خسارة ❌'

  return {
    adSpend, cpl, leads, roas, metaSpend, googleSpend, tiktokSpend,
    benchCPL, benchROAS,
    cplGapPct: Math.round(cplGapPct),
    expectedLeads, leadsGap, wastedBudget,
    roasGapPct: Math.round(roasGapPct),
    targetCPL, projectedLeads, additionalLeads,
    cplStatus, roasStatus,
    performanceVerdict: cplGapPct <= 10 && (!roas || roas >= 3) ? 'جيد' :
                        cplGapPct <= 30 ? 'يحتاج تحسين' : 'ضعيف',
  }
}

function calculateMarketEntry(data: Record<string, string>) {
  const budget = parseFloat(data.budget) || 0
  const clientType = data.clientType || 'developer'
  const city = data.targetCity || data.city || ''

  const cityMultipliers: Record<string, number> = {
    'القاهرة الجديدة': 1.0, 'العاصمة الإدارية الجديدة': 1.3,
    'التجمع الخامس': 1.1, 'التجمع الأول': 1.2,
    '6 أكتوبر': 0.75, 'الشيخ زايد': 0.85,
    'المعادي': 1.0, 'الساحل الشمالي': 1.4, 'العين السخنة': 1.1,
  }
  const mult = cityMultipliers[city] || 1.0

  const baseCPL = clientType === 'developer' ? 550 : 400
  const expectedCPLMeta = Math.round(baseCPL * mult)
  const expectedCPLGoogle = Math.round(expectedCPLMeta * 1.8)
  const expectedLeads100 = Math.round(100 * expectedCPLMeta)
  const testBudget = Math.round(expectedCPLMeta * 30)

  const budgetSufficiency = budget >= testBudget ? 'كافي للاختبار' :
                             budget >= testBudget * 0.5 ? 'كافٍ جزئياً — يُنصح بزيادته' :
                             'غير كافٍ للاختبار الصحيح'

  const breakEvenMonths = budget > 0 ? Math.round(testBudget / budget * 2) : 6

  return {
    budget, city, mult,
    expectedCPLMeta, expectedCPLGoogle,
    expectedLeads100, testBudget, budgetSufficiency, breakEvenMonths,
    monthlyLeadsAtBudget: budget > 0 ? Math.round(budget / expectedCPLMeta) : 0,
    marketAttractiveness: mult >= 1.2 ? 'عالية' : mult >= 0.9 ? 'متوسطة' : 'منخفضة نسبياً',
    entryDifficulty: mult >= 1.2 ? 'عالية — سوق تنافسي' : 'متوسطة',
  }
}

function calculateLeadGen(data: Record<string, string>) {
  const currentLeads = parseFloat(data.currentLeads) || 0
  const qualifiedPct = parseFloat(data.qualifiedPct) || 0
  const adSpend = parseFloat(data.adSpend) || 0
  const cpl = parseFloat(data.cpl) || 0
  const avgDealValue = parseFloat(data.avgDealValue) || 0
  const salesCycle = parseFloat(data.salesCycle) || 90
  const clientType = data.clientType || 'developer'

  const qualifiedLeads = Math.round(currentLeads * qualifiedPct / 100)
  const benchQualPct = 20
  const qualGap = benchQualPct - qualifiedPct

  const cacCurrent = qualifiedLeads > 0 && adSpend > 0 ? Math.round(adSpend / qualifiedLeads) : 0
  const benchCAC = clientType === 'developer' ? 12500 : 5000

  const closeRateEst = 0.15
  const estimatedDeals = Math.round(qualifiedLeads * closeRateEst)
  const estimatedRevenue = estimatedDeals * avgDealValue

  const improvedQualPct = Math.min(qualifiedPct + 8, 35)
  const improvedLeads = Math.round(currentLeads * improvedQualPct / 100)
  const additionalDeals = Math.round((improvedLeads - qualifiedLeads) * closeRateEst)
  const additionalRevenue = additionalDeals * avgDealValue

  const ltv = avgDealValue > 0 ? avgDealValue * 0.025 : 0
  const ltvCacRatio = cacCurrent > 0 && ltv > 0 ? (ltv / cacCurrent).toFixed(1) : 'غير محدد'

  return {
    currentLeads, qualifiedPct, qualifiedLeads,
    benchQualPct, qualGap,
    cacCurrent, benchCAC,
    estimatedDeals, estimatedRevenue,
    improvedQualPct, improvedLeads, additionalDeals, additionalRevenue,
    ltvCacRatio, salesCycle,
    qualVerdictLabel: qualifiedPct >= 25 ? 'ممتاز ✅' :
                      qualifiedPct >= 15 ? 'جيد' :
                      qualifiedPct >= 8  ? 'يحتاج تحسين ⚠️' : 'ضعيف ❌',
    cacVerdictLabel: !cacCurrent ? 'غير محدد' :
                     cacCurrent <= benchCAC * 0.8 ? 'أفضل من المعيار ✅' :
                     cacCurrent <= benchCAC * 1.2 ? 'ضمن المعيار' : 'أعلى من المعيار ⚠️',
  }
}

function calculateFullAnalysis(data: Record<string, string>) {
  const adSpend = parseFloat(data.adSpend) || 0
  const cpl = parseFloat(data.cpl) || 0
  const roas = parseFloat(data.roas) || 0
  const clientType = data.clientType || 'developer'

  const benchCPL = clientType === 'developer' ? 550 : 400
  const cplGap = cpl > 0 ? Math.round(((cpl - benchCPL) / benchCPL) * 100) : 0
  const wastedBudget = cpl > benchCPL && adSpend > 0 ? Math.round((cpl - benchCPL) / cpl * adSpend) : 0
  const expectedLeads = adSpend > 0 && benchCPL > 0 ? Math.round(adSpend / benchCPL) : 0

  let digitalScore = 30
  if (data.website) digitalScore += 15
  if (data.fbPage)  digitalScore += 10
  if (data.igPage)  digitalScore += 10
  if (data.ttPage)  digitalScore += 8
  if (adSpend > 0)  digitalScore += 15
  if (cpl > 0)      digitalScore += 7
  if (roas > 0)     digitalScore += 5
  digitalScore = Math.min(digitalScore, 95)

  const marketingScore = Math.round(
    (cplGap <= 10 ? 80 : cplGap <= 30 ? 60 : 40) * 0.4 +
    digitalScore * 0.3 +
    (roas >= 3 ? 80 : roas >= 1.5 ? 60 : roas > 0 ? 40 : 50) * 0.3
  )

  return {
    adSpend, cpl, roas, benchCPL, cplGap, wastedBudget, expectedLeads,
    digitalScore, marketingScore,
    hasDigitalPresence: !!(data.website || data.fbPage || data.igPage),
    hasCampaignData: adSpend > 0,
    performanceTier: marketingScore >= 70 ? 'متقدم' : marketingScore >= 50 ? 'متوسط' : 'مبتدئ',
  }
}

// ══════════════════════════════════════════════════════════════════
// END SMART CALCULATORS
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
  const c = calculateCampaignROI(data)
  const confPct = data.metaSpend && data.googleSpend ? 80 : data.roas ? 72 : 65
  const metaLeads = c.metaSpend > 0 ? Math.round(c.metaSpend / c.benchCPL) : 0
  const googleLeads = c.googleSpend > 0 ? Math.round(c.googleSpend / Math.round(c.benchCPL * 1.8)) : 0
  const tiktokLeads = c.tiktokSpend > 0 ? Math.round(c.tiktokSpend / Math.round(c.benchCPL * 0.5)) : 0
  const roiImprovePct = c.leads > 0 ? Math.round((c.additionalLeads / c.leads) * 100) : 0
  const cplSign = c.cplGapPct > 0 ? '+' : ''
  const confReason = confPct >= 80 ? 'بيانات كاملة لجميع القنوات'
    : confPct >= 72 ? 'ROAS متاح — أضف توزيع القنوات لرفع الدقة'
    : 'بيانات أساسية — أضف القنوات وROAS'

  return `You are Egypt's top real estate marketing analyst.
Numbers are PRE-CALCULATED — interpret and write in Arabic, do NOT recalculate.

CLIENT: ${data.companyName} | ${data.city} | ${data.clientType === 'developer' ? 'مطور عقاري' : 'وسيط عقاري'}
MONTHLY AD SPEND: EGP ${c.adSpend.toLocaleString()}
Meta: EGP ${c.metaSpend > 0 ? c.metaSpend.toLocaleString() : 'N/A'} | Google: EGP ${c.googleSpend > 0 ? c.googleSpend.toLocaleString() : 'N/A'} | TikTok: EGP ${c.tiktokSpend > 0 ? c.tiktokSpend.toLocaleString() : 'N/A'}

PRE-CALCULATED CAMPAIGN ANALYSIS (numbers are FINAL — do not change):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current CPL:            EGP ${c.cpl}
Benchmark CPL:          EGP ${c.benchCPL} (${data.clientType === 'developer' ? 'مطور' : 'بروكر'} midpoint 2026)
CPL Gap:                ${cplSign}${c.cplGapPct}% → ${c.cplStatus}
Current Leads/month:    ${c.leads}
Expected at Benchmark:  ${c.expectedLeads} leads
Leads Lost Monthly:     ${c.leadsGap} leads
Wasted Budget/month:    EGP ${c.wastedBudget.toLocaleString()}
ROAS:                   ${c.roas > 0 ? c.roas : 'not tracked'} → ${c.roasStatus}
Target CPL (90% bench): EGP ${c.targetCPL}
Projected Leads:        ${c.projectedLeads}/month
Additional Leads:       +${c.additionalLeads}/month
Performance Verdict:    ${c.performanceVerdict}
Meta estimated leads:   ${metaLeads > 0 ? metaLeads : 'N/A'}
Google estimated leads: ${googleLeads > 0 ? googleLeads : 'N/A'}
TikTok estimated leads: ${tiktokLeads > 0 ? tiktokLeads : 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "تدقيق أداء الحملات الإعلانية",
  "company": "${data.companyName}",
  "executive_summary": "2 Arabic sentences: CPL is ${cplSign}${c.cplGapPct}% ${c.cplGapPct > 0 ? 'أعلى من المعيار' : 'أقل من المعيار'} مما يهدر EGP ${c.wastedBudget.toLocaleString()} شهرياً ويخسر ${c.leadsGap} عميل. Biggest improvement opportunity.",
  "performance_verdict": "${c.performanceVerdict}",
  "kpi_scorecard": {
    "current_cpl": "EGP ${c.cpl}",
    "benchmark_cpl": "EGP ${c.benchCPL}",
    "cpl_gap_pct": "${cplSign}${c.cplGapPct}%",
    "cpl_status": "${c.cplStatus}",
    "monthly_leads": "${c.leads}",
    "expected_leads_at_benchmark": "${c.expectedLeads} عميل",
    "leads_gap": "${c.leadsGap} عميل شهرياً",
    "roas": "${c.roas > 0 ? c.roas : 'غير محدد'}",
    "roas_benchmark": "3-6x للعقارات",
    "roas_status": "${c.roasStatus}",
    "wasted_budget_estimate": "EGP ${c.wastedBudget.toLocaleString()}"
  },
  "channel_breakdown": [
    {"channel": "Meta Ads", "spend": "EGP ${c.metaSpend > 0 ? c.metaSpend.toLocaleString() : 'N/A'}", "benchmark_cpl": "${RE_BENCHMARKS.developer.cpl_meta}", "estimated_leads": "${metaLeads > 0 ? metaLeads + ' عميل' : 'N/A'}", "performance": "write: أفضل من المعيار OR ضمن المعيار OR أعلى من المعيار", "recommendation": "specific Arabic action for Meta"},
    {"channel": "Google Ads", "spend": "EGP ${c.googleSpend > 0 ? c.googleSpend.toLocaleString() : 'N/A'}", "benchmark_cpl": "${RE_BENCHMARKS.developer.cpl_google}", "estimated_leads": "${googleLeads > 0 ? googleLeads + ' عميل' : 'N/A'}", "performance": "write: أفضل من المعيار OR ضمن المعيار OR أعلى من المعيار", "recommendation": "specific Arabic action for Google"},
    {"channel": "TikTok Ads", "spend": "EGP ${c.tiktokSpend > 0 ? c.tiktokSpend.toLocaleString() : 'N/A'}", "benchmark_cpl": "${RE_BENCHMARKS.developer.cpl_tiktok}", "estimated_leads": "${tiktokLeads > 0 ? tiktokLeads + ' عميل' : 'N/A'}", "performance": "write: أفضل OR ضمن OR أعلى OR غير مستخدم", "recommendation": "specific Arabic action for TikTok"}
  ],
  "optimizations": [
    {"rank": 1, "action": "Arabic action to reduce CPL from EGP ${c.cpl} toward EGP ${c.targetCPL}", "expected_cpl_reduction": "EGP ${Math.abs(c.cpl - c.targetCPL)} تخفيض في CPL", "timeline": "3-7 أيام", "effort": "منخفض/متوسط/عالي"},
    {"rank": 2, "action": "second specific Arabic optimization", "expected_cpl_reduction": "% or EGP reduction", "timeline": "timeline", "effort": "منخفض/متوسط/عالي"},
    {"rank": 3, "action": "third specific Arabic optimization", "expected_cpl_reduction": "% or EGP reduction", "timeline": "timeline", "effort": "منخفض/متوسط/عالي"}
  ],
  "projection_optimized": {
    "target_cpl": "EGP ${c.targetCPL}",
    "projected_leads_month1": "${c.projectedLeads} عميل",
    "projected_leads_month2": "${Math.round(c.projectedLeads * 1.15)} عميل",
    "additional_leads_monthly": "+${c.additionalLeads} عميل",
    "roi_improvement": "${roiImprovePct}% تحسن"
  },
  "confidence_score": {"pct": ${confPct}, "label": "${confPct >= 75 ? 'High' : 'Medium'}", "reason": "${confReason}"}
}`
}

function buildMarketEntryPrompt(data: Record<string, string>): string {
  const m = calculateMarketEntry(data)
  const budget1 = Math.round(m.budget * 0.6)
  const budget2 = Math.round(m.budget * 0.9)
  const confReason = 'تحليل مبني على معاملات أسعار ' + data.targetCity + ' 2026 والميزانية المُدخلة'

  return `You are Egypt's top real estate market intelligence analyst.
Numbers are PRE-CALCULATED — interpret and write in Arabic, do NOT recalculate.

COMPANY: ${data.companyName} | ${data.targetCity} | ${data.clientType === 'developer' ? 'مطور عقاري' : 'وسيط عقاري'}
ENTRY BUDGET: EGP ${m.budget.toLocaleString()}/month | TIMELINE: ${data.timeline}

PRE-CALCULATED MARKET ANALYSIS (numbers are FINAL — do not change):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
City Price Multiplier:    ${m.mult}x vs Cairo baseline
Expected Meta CPL:        EGP ${m.expectedCPLMeta}
Expected Google CPL:      EGP ${m.expectedCPLGoogle}
Budget for 100 Leads/mo:  EGP ${m.expectedLeads100.toLocaleString()}
Recommended Test Budget:  EGP ${m.testBudget.toLocaleString()}
Budget Sufficiency:       ${m.budgetSufficiency}
Monthly Leads at Budget:  ${m.monthlyLeadsAtBudget} leads/month
Break-even Estimate:      ${m.breakEvenMonths} months
Market Attractiveness:    ${m.marketAttractiveness}
Entry Difficulty:         ${m.entryDifficulty}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "تقرير دخول السوق العقاري",
  "target_market": "${data.targetCity}",
  "executive_summary": "2 Arabic sentences: CPL expected EGP ${m.expectedCPLMeta} in ${data.targetCity} (${m.mult}x multiplier), ${m.budgetSufficiency} with ${m.monthlyLeadsAtBudget} leads/month expected. Entry recommendation based on ${m.marketAttractiveness} attractiveness.",
  "market_scores": {
    "attractiveness": {"score": 0, "max": 10, "label": "جاذبية السوق", "reasoning": "based on ${m.marketAttractiveness} rating and ${m.mult}x price multiplier in ${data.targetCity}"},
    "competition": {"score": 0, "max": 10, "label": "مستوى المنافسة (أعلى = أشد)", "reasoning": "specific competition level in ${data.targetCity} 2026"},
    "entry_difficulty": {"score": 0, "max": 10, "label": "صعوبة الدخول (أعلى = أصعب)", "reasoning": "based on ${m.entryDifficulty} and budget ${m.budgetSufficiency}"},
    "opportunity_size": {"score": 0, "max": 10, "label": "حجم الفرصة", "reasoning": "specific opportunity size for ${data.targetCity}"}
  },
  "market_overview": {
    "size_estimate": "EGP value of ${data.targetCity} real estate market 2026",
    "growth_rate": "${RE_BENCHMARKS.developer.market_growth}",
    "demand_supply": "specific assessment for ${data.targetCity} 2026",
    "buyer_profile": "primary buyer profile in ${data.targetCity}",
    "avg_price_sqm": "EGP range for residential in ${data.targetCity}",
    "key_developers": ["top developer in ${data.targetCity}", "second developer", "third developer"]
  },
  "swot": {
    "strengths": ["strength 1 for ${data.companyName} entering ${data.targetCity}", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "opportunities": ["opportunity 1 specific to ${data.targetCity} 2026", "opportunity 2", "opportunity 3"],
    "threats": ["threat 1 specific to ${data.targetCity}", "threat 2"]
  },
  "cpl_intelligence": {
    "meta_cpl_expected": "EGP ${m.expectedCPLMeta}",
    "google_cpl_expected": "EGP ${m.expectedCPLGoogle}",
    "budget_required_100leads": "EGP ${m.expectedLeads100.toLocaleString()} شهرياً",
    "recommended_test_budget": "EGP ${m.testBudget.toLocaleString()} (30 عميل اختباري)",
    "payback_timeline": "${m.breakEvenMonths} أشهر للوصول لأول حملة مربحة"
  },
  "entry_strategy_90days": {
    "month1": {"title": "التأسيس الرقمي", "actions": ["action 1 for ${data.targetCity}", "action 2", "action 3"], "budget": "EGP ${budget1.toLocaleString()}", "kpi": "specific measurable target"},
    "month2": {"title": "اختبار السوق", "actions": ["action 1", "action 2", "action 3"], "budget": "EGP ${budget2.toLocaleString()}", "kpi": "specific measurable target"},
    "month3": {"title": "التوسع والتحسين", "actions": ["action 1", "action 2", "action 3"], "budget": "EGP ${m.budget.toLocaleString()}", "kpi": "${m.monthlyLeadsAtBudget} عميل/شهر بـ EGP ${m.expectedCPLMeta} CPL"}
  },
  "recommendation": "2 Arabic sentences: ${m.budgetSufficiency === 'كافي للاختبار' ? 'الميزانية كافية للبدء' : 'يُنصح بزيادة الميزانية'}، specific next step with timeline.",
  "confidence_score": {"pct": 72, "label": "Medium", "reason": "${confReason}"}
}`
}

function buildLeadGenPrompt(data: Record<string, string>): string {
  const lg = calculateLeadGen(data)
  const confPct = data.avgDealValue && data.adSpend ? 78 : data.avgDealValue ? 70 : 63
  const confReason = confPct >= 78 ? 'بيانات كاملة: عملاء + إنفاق + قيمة صفقة'
    : confPct >= 70 ? 'قيمة الصفقة متاحة — أضف الإنفاق لرفع الدقة'
    : 'بيانات أساسية — أضف قيمة الصفقة والإنفاق الإعلاني'

  return `You are Egypt's top real estate lead generation strategist.
Numbers are PRE-CALCULATED — interpret and write in Arabic, do NOT recalculate.

COMPANY: ${data.companyName} | ${data.city} | ${data.clientType === 'developer' ? 'مطور عقاري' : 'وسيط عقاري'}

PRE-CALCULATED LEAD ANALYSIS (numbers are FINAL — do not change):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Monthly Leads:            ${lg.currentLeads}
Qualification Rate:       ${lg.qualifiedPct}% (benchmark: ${lg.benchQualPct}%)
Qualified Leads:          ${lg.qualifiedLeads}/month
Qual Gap from Benchmark:  ${lg.qualGap > 0 ? '+' : ''}${lg.qualGap}% ${lg.qualGap > 0 ? '(below benchmark)' : '(above benchmark ✅)'}
Qualification Verdict:    ${lg.qualVerdictLabel}
Estimated Deals:          ${lg.estimatedDeals}/month (15% close rate)
Estimated Revenue:        EGP ${lg.estimatedRevenue.toLocaleString()}
Current CAC:              ${lg.cacCurrent > 0 ? 'EGP ' + lg.cacCurrent.toLocaleString() : 'N/A'}
CAC Benchmark:            EGP ${lg.benchCAC.toLocaleString()}
CAC Verdict:              ${lg.cacVerdictLabel}
LTV/CAC Ratio:            ${lg.ltvCacRatio}
Scenario → qual to ${lg.improvedQualPct}%:
  Additional Deals:       +${lg.additionalDeals}/month
  Additional Revenue:     EGP ${lg.additionalRevenue.toLocaleString()}
Sales Cycle:              ${lg.salesCycle} days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "تقرير استخبارات توليد العملاء",
  "company": "${data.companyName}",
  "executive_summary": "2 Arabic sentences: qualification rate ${lg.qualifiedPct}% vs ${lg.benchQualPct}% benchmark (${lg.qualVerdictLabel}), ${lg.estimatedDeals} estimated deals/month EGP ${lg.estimatedRevenue.toLocaleString()}. Raising to ${lg.improvedQualPct}% adds +${lg.additionalDeals} deals EGP ${lg.additionalRevenue.toLocaleString()}.",
  "pipeline_health": {
    "monthly_leads": ${lg.currentLeads},
    "qualified_leads": "${lg.qualifiedLeads} عميل مؤهل",
    "qualification_rate": "${lg.qualifiedPct}%",
    "qualification_benchmark": "${lg.benchQualPct}% للعقارات المصرية",
    "qualification_verdict": "${lg.qualVerdictLabel}",
    "estimated_monthly_deals": "${lg.estimatedDeals} صفقة (بمعدل إغلاق 15%)",
    "estimated_monthly_revenue": "EGP ${lg.estimatedRevenue.toLocaleString()}",
    "cac_current": "${lg.cacCurrent > 0 ? 'EGP ' + lg.cacCurrent.toLocaleString() : 'غير محدد'}",
    "cac_benchmark": "EGP ${lg.benchCAC.toLocaleString()}",
    "ltv_cac_ratio": "${lg.ltvCacRatio}"
  },
  "lead_quality_diagnosis": [
    {"issue": "specific quality issue 1 for ${data.clientType} in ${data.city}", "severity": "عالية/متوسطة/منخفضة", "impact": "% leads lost", "fix": "specific Arabic action"},
    {"issue": "specific quality issue 2", "severity": "عالية/متوسطة/منخفضة", "impact": "% leads lost", "fix": "specific Arabic action"},
    {"issue": "specific quality issue 3", "severity": "عالية/متوسطة/منخفضة", "impact": "% leads lost", "fix": "specific Arabic action"}
  ],
  "qualification_framework": {
    "scoring_criteria": [
      {"criterion": "الميزانية", "weight": "30%", "qualifier": "specific budget range for ${data.clientType} in ${data.city}"},
      {"criterion": "الجدية والنية", "weight": "25%", "qualifier": "signs of serious buyer intent"},
      {"criterion": "الجدول الزمني", "weight": "20%", "qualifier": "timeline indicators for ${data.salesCycle || 90}-day cycle"},
      {"criterion": "صلاحية اتخاذ القرار", "weight": "15%", "qualifier": "decision maker identification"},
      {"criterion": "الموقع الجغرافي", "weight": "10%", "qualifier": "location match for ${data.city}"}
    ],
    "disqualifiers": ["disqualifier 1 for ${data.clientType}", "disqualifier 2", "disqualifier 3"],
    "nurture_vs_close": "specific criteria for ${data.city} market and ${lg.salesCycle}-day cycle"
  },
  "channel_lead_quality": [
    {"channel": "Meta Ads", "lead_quality": "High/Medium/Low", "typical_qualification_rate": "%", "recommendation": "specific Arabic action"},
    {"channel": "Google Search", "lead_quality": "High/Medium/Low", "typical_qualification_rate": "%", "recommendation": "specific Arabic action"},
    {"channel": "WhatsApp Organic", "lead_quality": "High/Medium/Low", "typical_qualification_rate": "%", "recommendation": "specific Arabic action"},
    {"channel": "Referrals", "lead_quality": "High/Medium/Low", "typical_qualification_rate": "%", "recommendation": "specific Arabic action"}
  ],
  "improvements": [
    {"action": "Arabic action to raise qualification from ${lg.qualifiedPct}% to ${lg.improvedQualPct}% (+${lg.additionalDeals} deals, EGP ${lg.additionalRevenue.toLocaleString()} revenue)", "expected_impact": "+${lg.additionalDeals} صفقة/شهر", "timeline": "14-30 يوم", "effort": "منخفض/متوسط/عالي"},
    {"action": "second Arabic improvement", "expected_impact": "% impact", "timeline": "days", "effort": "منخفض/متوسط/عالي"},
    {"action": "third Arabic improvement", "expected_impact": "% impact", "timeline": "days", "effort": "منخفض/متوسط/عالي"}
  ],
  "whatsapp_script": {
    "opening": "specific Arabic opening for ${data.clientType} leads in ${data.city}",
    "qualification_questions": ["question 1 to qualify budget for ${data.clientType}", "question 2 to qualify timeline (${lg.salesCycle} days avg)", "question 3 to qualify seriousness"],
    "closing": "specific Arabic call to action for ${data.clientType}"
  },
  "confidence_score": {"pct": ${confPct}, "label": "${confPct >= 75 ? 'High' : 'Medium'}", "reason": "${confReason}"}
}`
}

function buildFullAnalysisPrompt(data: Record<string, string>): string {
  const fa = calculateFullAnalysis(data)
  const confPct = fa.hasCampaignData && fa.hasDigitalPresence ? 75
    : fa.hasCampaignData ? 65 : fa.hasDigitalPresence ? 60 : 55
  const confReason = confPct >= 75 ? 'بيانات حملات ورقمية كاملة'
    : confPct >= 65 ? 'بيانات حملات متاحة — أضف الحضور الرقمي'
    : confPct >= 60 ? 'حضور رقمي متاح — أضف بيانات الحملات'
    : 'بيانات محدودة — أضف الحملات والحضور الرقمي'
  const digitalScoreScaled = Math.round(fa.digitalScore * 100 / 95)
  const paidScore = fa.cplGap <= 10 ? 80 : fa.cplGap <= 30 ? 60 : 35
  const cplSign = fa.cplGap > 0 ? '+' : ''
  const cplVerdict = fa.cplGap <= 0 ? 'أفضل من المعيار' : fa.cplGap <= 20 ? 'ضمن المعيار' : 'أعلى من المعيار'
  const roasVerdict = !data.roas ? 'غير محدد'
    : parseFloat(data.roas) >= 5 ? 'ممتاز' : parseFloat(data.roas) >= 3 ? 'جيد' : 'ضعيف'
  const digitalMaturity = fa.digitalScore >= 70 ? 'متقدم' : fa.digitalScore >= 50 ? 'متوسط' : 'مبتدئ'
  const budget1 = fa.adSpend > 0 ? Math.round(fa.adSpend * 0.8).toLocaleString() : 'حسب الميزانية'
  const budget2 = fa.adSpend > 0 ? fa.adSpend.toLocaleString() : 'حسب الميزانية'
  const budget3 = fa.adSpend > 0 ? Math.round(fa.adSpend * 1.2).toLocaleString() : 'حسب الميزانية'

  return `You are Egypt's top real estate marketing intelligence analyst.
Numbers are PRE-CALCULATED — interpret and write in Arabic, do NOT recalculate.

COMPANY: ${data.companyName} | ${data.city} | ${data.clientType === 'developer' ? 'مطور عقاري' : 'وسيط عقاري'}
Website: ${data.website || 'None'} | FB: ${data.fbPage || 'None'} | IG: ${data.igPage || 'None'} | TT: ${data.ttPage || 'None'}
Competitors: ${data.competitors || 'Not provided'}
Monthly Revenue: EGP ${data.revenue || 'N/A'}

PRE-CALCULATED MARKETING SCORES (numbers are FINAL — do not change):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Marketing Score:      ${fa.marketingScore}/100
Digital Score:        ${fa.digitalScore}/95 → ${digitalScoreScaled}/100 scaled
Performance Tier:     ${fa.performanceTier}
Digital Presence:     ${fa.hasDigitalPresence ? 'Yes' : 'No'}
Campaign Data:        ${fa.hasCampaignData ? 'Yes' : 'No'}
CPL:                  ${fa.cpl > 0 ? 'EGP ' + fa.cpl : 'N/A'} (benchmark EGP ${fa.benchCPL})
CPL Gap:              ${cplSign}${fa.cplGap}% → ${cplVerdict}
Wasted Budget:        EGP ${fa.wastedBudget.toLocaleString()}/month
Expected Leads:       ${fa.expectedLeads} (at benchmark CPL)
ROAS:                 ${data.roas || 'N/A'} → ${roasVerdict}
Current Leads:        ${data.leads || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUCTIONS:
- marketing_score MUST be ${fa.marketingScore}
- digital_presence score MUST be ${digitalScoreScaled}
- paid_performance score MUST be ${paidScore}
- Write executive_summary in Arabic using exact scores above

Return ONLY valid JSON (no markdown, start with {):
{
  "report_type": "التحليل التسويقي الشامل",
  "company": "${data.companyName}",
  "marketing_score": ${fa.marketingScore},
  "score_breakdown": {
    "digital_presence": {"score": ${digitalScoreScaled}, "max": 100, "assessment": "2 Arabic sentences on ${fa.hasDigitalPresence ? 'existing' : 'absent'} digital presence and what to improve"},
    "paid_performance": {"score": ${paidScore}, "max": 100, "assessment": "2 Arabic sentences: CPL ${cplSign}${fa.cplGap}% vs benchmark, wasted EGP ${fa.wastedBudget.toLocaleString()}/mo"},
    "content_quality": {"score": 0, "max": 100, "assessment": "2 Arabic sentences based on available channels"},
    "brand_strength": {"score": 0, "max": 100, "assessment": "2 Arabic sentences for ${data.companyName} in ${data.city}"},
    "competitive_position": {"score": 0, "max": 100, "assessment": "2 Arabic sentences vs ${data.competitors || 'السوق'}"}
  },
  "executive_summary": "3 Arabic sentences: performance tier ${fa.performanceTier} with score ${fa.marketingScore}/100, ${fa.cplGap > 0 ? 'CPL ' + cplSign + fa.cplGap + '% أعلى من المعيار يهدر EGP ' + fa.wastedBudget.toLocaleString() + '/شهر' : 'CPL ضمن المعيار'}, biggest opportunity for ${data.companyName}.",
  "market_overview": {
    "size": "${RE_BENCHMARKS.developer.market_size}",
    "growth": "${RE_BENCHMARKS.developer.market_growth}",
    "city_specific": "2 Arabic sentences on ${data.city} real estate 2026",
    "key_trends": ["trend 1 for ${data.city} 2026", "trend 2", "trend 3"]
  },
  "digital_presence_audit": {
    "website": {"status": "${data.website ? 'موجود' : 'غير موجود'}", "assessment": "2 Arabic sentences", "score": ${data.website ? 70 : 0}},
    "facebook": {"activity": "${data.fbPage ? 'نشط' : 'غير نشط'}", "assessment": "1 Arabic sentence"},
    "instagram": {"activity": "${data.igPage ? 'نشط' : 'غير نشط'}", "assessment": "1 Arabic sentence"},
    "tiktok": {"activity": "${data.ttPage ? 'نشط' : 'غير نشط'}", "assessment": "1 Arabic sentence"},
    "google_business": {"status": "غير محدد", "assessment": "يُنصح بإنشاء حساب Google Business للحضور المحلي في ${data.city}"},
    "overall_digital_maturity": "${digitalMaturity}"
  },
  "campaign_performance": {
    "cpl_analysis": {"current": "${fa.cpl > 0 ? 'EGP ' + fa.cpl : 'غير محدد'}", "benchmark": "EGP ${fa.benchCPL}", "verdict": "${cplVerdict}"},
    "roas_analysis": {"current": "${data.roas || 'غير محدد'}", "benchmark": "3-6x للعقارات", "verdict": "${roasVerdict}"},
    "wasted_budget": "EGP ${fa.wastedBudget.toLocaleString()}/month",
    "top_3_optimizations": ["optimization 1 in Arabic", "optimization 2 in Arabic", "optimization 3 in Arabic"]
  },
  "competitive_landscape": {
    "competition_level": "specific level for ${data.city} 2026",
    "competitive_gaps": ["gap 1 for ${data.companyName} to exploit", "gap 2", "gap 3"],
    "differentiation_opportunity": "2 Arabic sentences on clearest differentiation for ${data.city}"
  },
  "swot": {
    "strengths": ["specific strength 1 for ${data.companyName}", "strength 2", "strength 3"],
    "weaknesses": ["specific weakness 1", "specific weakness 2"],
    "opportunities": ["specific opportunity in ${data.city} 2026", "opportunity 2", "opportunity 3"],
    "threats": ["specific threat 1", "specific threat 2"]
  },
  "strategy_90days": {
    "month1": {"focus": "title", "actions": ["action 1", "action 2", "action 3"], "kpi": "measurable target", "budget": "EGP ${budget1}"},
    "month2": {"focus": "title", "actions": ["action 1", "action 2", "action 3"], "kpi": "measurable target", "budget": "EGP ${budget2}"},
    "month3": {"focus": "title", "actions": ["action 1", "action 2", "action 3"], "kpi": "measurable target", "budget": "EGP ${budget3}"}
  },
  "quick_wins": [
    {"action": "most impactful quick win in Arabic", "timeline": "7 أيام", "impact": "specific EGP or % impact", "effort": "منخفض"},
    {"action": "second quick win in Arabic", "timeline": "14 يوم", "impact": "impact", "effort": "منخفض"},
    {"action": "third quick win in Arabic", "timeline": "21 يوم", "impact": "impact", "effort": "متوسط"}
  ],
  "pain_points": [
    {"level": "high", "title": "main pain in Arabic", "detail": "2 Arabic sentences with solution"},
    {"level": "high", "title": "second pain in Arabic", "detail": "2 Arabic sentences"},
    {"level": "med", "title": "third pain in Arabic", "detail": "1 Arabic sentence"}
  ],
  "confidence_score": {"pct": ${confPct}, "label": "${confPct >= 70 ? 'Medium' : 'Low'}", "reason": "${confReason}"}
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
