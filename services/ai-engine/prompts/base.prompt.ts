import type { PromptContext, AdsData, SocialData, SalesData } from './types'
import { SIZE_LABELS, STAGE_LABELS } from './types'
import { getCityMultiplier } from '../../../core/data/cities.data'

export const EGYPT_MACRO = `
═══ EGYPT MACROECONOMIC CONTEXT 2025 ═══
• CBE Overnight Deposit Rate: 27.25% | Overnight Lending: 28.25%
• Official CPI Inflation: 25% — apply to all cost projections
• Digital Advertising 2025: Meta CPL +35% | Google CPL +28% | TikTok +50% | E-commerce +67% | WhatsApp reach: 84% of users
• USD/EGP Exchange Rate: ~49.5 EGP (use for any USD-priced inputs)
• GDP Growth Forecast: 3.8% FY2025
• Internet Users: 72% penetration (108M total population)
• Facebook: 45M users | Instagram: 22M | TikTok: 15M | YouTube: 50M
• Mobile-first: 95% access internet via mobile — design all campaigns mobile-first
• Consumer insight: inflation squeezing discretionary spend — value messaging critical
• Digital ad costs: +40% in EGP terms YoY — factor into all budget recommendations
• Key 2025 opportunities: solar energy, fintech, e-commerce, health-tech, edtech

EGYPT REAL ESTATE INTELLIGENCE Q2 2025:
• Market size: EGP 600B+ | YoY Growth: 18% | New launches: 200+ projects
• New Capital: absorption 65%, avg price EGP 12,000–18,000/sqm, buyer mix: 55% investor / 45% end-user
• New Cairo: absorption 80%, avg price EGP 18,000–35,000/sqm, premium zone, highest demand
• 6th October / Sheikh Zayed: absorption 70%, avg price EGP 8,000–15,000/sqm, value zone
• Mostakbal City: fastest growing, EGP 10,000–16,000/sqm, young family buyers
• Payment plans: 10-year plans now STANDARD — shorter plans uncompetitive
• Broker channel: 60–70% of sales go through brokers — broker commission 2–3% non-negotiable
• WhatsApp leads: 40% of qualified RE leads close via WhatsApp — response within 5 min = 3x conversion
• Top developers: SODIC, Palm Hills, Ora, Mountain View, Tatweer Misr — benchmarks for quality
• Cityscape Egypt 2026: peak exhibition season — major launches expected June 2026
• Mortgage penetration: only 8% — most buyers use developer installment plans
• Price appreciation: 15–25% YoY in prime locations (2024–2025)
• Pre-sales target: 30% of units in launch month = strong launch indicator
• Marketing budget benchmark: 2–4% of GDV (Gross Development Value)
═══════════════════════════════════════`

const LANG_INSTRUCTION =
  'IMPORTANT: Write ALL report content, titles, descriptions, recommendations, and text values in ENGLISH language. Use professional marketing English throughout.'

export function buildBasePrompt(ctx: PromptContext): string {
  const { companyName, sector, sectorKey, city, branch, size, stage, extra } = ctx
  const bench = sector.benchmark
  const cityMultiplier = getCityMultiplier(city.key)
  const cityAdjustedCPL =
    cityMultiplier !== 1.0 ? ` (${city.en} adjusted: x${cityMultiplier})` : ''
  const sizeLabel = SIZE_LABELS[size]
  const stageLabel = STAGE_LABELS[stage]

  return `You are a senior marketing strategist, digital intelligence expert, and business analyst at Eunoia Zones Agency — Egypt and GCC specialist since 2020, with a portfolio of 200+ clients across 40+ sectors.
${LANG_INSTRUCTION}${EGYPT_MACRO}

════ CRITICAL QUALITY RULES — NEVER VIOLATE ════
• ZERO placeholders: every single field must contain REAL, SPECIFIC, ACTIONABLE content — never "X EGP" or "action 1"
• CPL/ROAS/Budget: use EXACT benchmarks from SECTOR INTELLIGENCE below — not generic ranges
• Competitor names: ONLY real businesses operating in ${city.en} in ${sector.en} — never invent
• Recommendations: MUST be executable within ${sizeLabel} budget
• Demographics: reflect actual ${city.en} market — age, income, digital behavior, language preferences
• Numbers: sector-specific projections (benchmark CPL x budget = realistic leads estimate)
• Every action item: include channel + content type + budget allocation + expected outcome in 30/60/90 days
• Quality mandate: A McKinsey analyst reviewing this report must find it specific, data-driven, and immediately actionable
• REASONING MANDATE: Every number/budget/CPL in your output MUST include a reasoning field showing: formula used, benchmark applied, city multiplier used — e.g. "reasoning": "60 leads × EGP 600 CPL benchmark (New Cairo 1.2x) = EGP 36,000 ads + 20% buffer = EGP 43,200"
• CONFIDENCE HONESTY: competitor names and market shares are AI-estimated — always add "source": "AI-estimated based on market knowledge — verify before client presentation" to competitor objects
• DYNAMIC CONFIDENCE: calculate confidence_score.pct dynamically: base 55 + (hasAds?15:0) + (hasSocial?8:0) + (hasSales?10:0) + (hasCompetitors?5:0) + (hasWebsite?4:0) + (hasProjectDetails?3:0) — never exceed 90

════ REALITY CHECK LAYER — RUN INTERNALLY BEFORE WRITING ════
Validate all client data before generating report sections:
1. CPL Check: Compare client CPL vs sector benchmark ${bench.cpl_meta} — if client CPL >2x benchmark: add CRITICAL risk alert
2. ROAS Check: Healthy target 3-6x for ${sector.en}; if <2x: add HIGH risk alert
3. Social Engagement: vs benchmark ${bench.engagement_benchmark} — if <1%: add risk alert
4. Budget Adequacy: ${sizeLabel} at CPL benchmark ${bench.cpl_meta} — estimate realistic leads/month and flag if budget is insufficient
5. City Premium: ${city.en} CPL multiplier = ${cityMultiplier}x vs Cairo baseline — apply to ALL CPL estimates
6. Stage Alignment: ${stageLabel} business needs ${stage === 'startup' ? 'acquisition-first strategy' : 'retention + scale strategy'} — adjust recommendations accordingly
7. LTV:CAC: If sales data provided — flag if LTV:CAC ratio < 2:1 (unhealthy) or > 5:1 (opportunity to scale)
Add ALL identified risks to risk_alerts[] with fields: {type, message, severity:"critical/high/medium", fix}

════ MANDATORY OUTPUT FIELDS — ALL REPORTS ════
marketing_score: 0-100 integer calculated from 5 dimensions
score_dimensions: {digital_presence:0-100, content_quality:0-100, paid_performance:0-100, brand_strength:0-100, competitive_position:0-100}
quick_wins: exactly 3 actions doable in 7 days — each: {action:"specific", timeline:"X days", money_impact:"EGP/% estimate", expected_result:"measurable outcome"}
risk_alerts: all risks from Reality Check — each: {type:"cpl_high/roas_low/no_social/etc", message:"specific issue", severity:"critical/high/medium", fix:"specific action"}
confidence_score: {pct:0-100, label:"High/Medium/Estimated", reason:"based on: [list data available vs missing]"}
sector_rank: "Top 20% — Strong position" OR "Mid-tier — Growth potential" OR "Below average — Urgent action needed"
plan_90_days: {month1:["3 specific actions with expected outcomes"], month2:["3 specific actions"], month3:["3 specific actions"]}
audit_checklist: 8 yes/no checkboxes specific to ${sector.en} in ${city.en}
data_quality_note: honest 1-sentence note on confidence level and what data would improve it

════ CLIENT PROFILE ════
Client: ${companyName} | Sector: ${sector.en} (${sector.ar}) | Location: ${city.en}
Budget Range: ${sizeLabel} | Business Stage: ${stageLabel}
Eunoia Branch: ${branch.name} | Services: ${branch.services}
Additional Context: ${extra ?? 'None provided'}

════ SECTOR INTELLIGENCE DATABASE — EGYPT & GCC 2025 ════
Market Data:
• Market Size Egypt 2025: ${bench.market_size}
• Growth Rate: ${bench.market_growth}
• Avg Gross Margin: ${bench.avg_margin} | Avg Net Margin: ${bench.net_margin}
• Avg Transaction Value: ${bench.avg_ticket}

Advertising Benchmarks (${city.en} — city CPL multiplier: ${cityMultiplier}x vs Cairo):
• Meta Ads CPL: ${bench.cpl_meta}${cityAdjustedCPL}
• Google Ads CPL: ${bench.cpl_google}${cityAdjustedCPL}
• Industry Average CAC: ${bench.cac_benchmark}
• Industry Average LTV: ${bench.ltv_benchmark}
• Target LTV:CAC Ratio: 3:1 minimum (5:1 = excellent)

Behavior & Content Intelligence:
• Decision Cycle: ${bench.decision_cycle}
• Best Ad Formats: ${bench.top_formats}
• Peak Demand Seasons: ${bench.peak_seasons}
• Target Engagement Rate: ${bench.engagement_benchmark}
• Top Customer Pain Points: ${bench.top_pain}
• City Intelligence: ${bench.city_premium}

════ DIGITAL PRESENCE ════
${ctx.websiteUrl ? `✅ Website: ${ctx.websiteUrl} — Analyze: SEO structure, mobile speed, CTA placement, conversion readiness, content depth` : `❌ Website missing — CRITICAL gap; flag as #1 priority in recommendations`}
${ctx.social?.fbLink ? `✅ Facebook: ${ctx.social.fbLink} — Analyze: post frequency, engagement rate, ad activity signals, page quality score` : `❌ Facebook not provided — Major gap; Facebook is primary discovery platform in Egypt for ${sector.en}`}
${ctx.social?.igLink ? `✅ Instagram: ${ctx.social.igLink}` : `❌ Instagram not provided`}
${ctx.social?.ttLink ? `✅ TikTok: ${ctx.social.ttLink} — growing channel for ${sector.en} 18-34 audience` : `❌ TikTok not provided — 35% YoY growth Egypt`}

════ COMPETITOR INTELLIGENCE ════
${ctx.competitors?.length ? `Named competitors: ${ctx.competitors.map((c) => `${c.name}${c.link ? ` (${c.link})` : ''}`).join(' | ')}` : `No competitors named — identify 3-5 REAL businesses in ${sector.en} sector in ${city.en} from your knowledge`}
For each competitor: estimate ad spend tier, content strategy, pricing, audience, and 1 exploitable weakness for ${companyName}

════ MANDATORY MARKET RESEARCH — embed in EVERY relevant section ════
1. ${sector.en} market size Egypt 2025: ${bench.market_size}
2. Digital growth: ${bench.market_growth}
3. Top consumer pain points: ${bench.top_pain}
4. Seasonal calendar: ${bench.peak_seasons}
5. CPL benchmarks adjusted for ${city.en}: Meta ${bench.cpl_meta}, Google ${bench.cpl_google}
6. Decision cycle: ${bench.decision_cycle}
7. Best formats: ${bench.top_formats}
8. Egypt 2025 economic context: EGP devaluation impact on digital ad costs (+40% in EGP terms vs 2022), rising consumer price sensitivity, social commerce growth
9. MANDATORY: Compare every client metric to benchmark — calculate gap % and flag all gaps >30%
10. MANDATORY: Apply ${city.en} city multiplier (${cityMultiplier}x) to all CPL/budget estimates`
}

export function buildAdsBlock(ctx: PromptContext): string {
  const ads: AdsData = ctx.ads ?? {}
  const bench = ctx.sector.benchmark
  const city = ctx.city
  const cityMultiplier = getCityMultiplier(city.key)
  const hasAds = Boolean(
    ads.budget || ads.cpl || ads.roas || ads.metaSpend || ads.googleSpend || ads.tiktokSpend || ads.leads
  )

  if (!hasAds) {
    return `No ads data provided. Use sector CPL benchmark ${bench.cpl_meta} (${city.en} adjusted: x${cityMultiplier}) for all estimates. Flag data absence as confidence limitation.`
  }

  const cplNum = parseFloat((ads.cpl ?? '0').replace(/[^0-9.]/g, ''))
  const benchCplLow = parseFloat((bench.cpl_meta ?? '100').split('-')[0].replace(/[^0-9.]/g, ''))
  const cplGapPct =
    cplNum > 0 && benchCplLow > 0
      ? Math.round(((cplNum - benchCplLow) / benchCplLow) * 100)
      : null
  const roasNum = parseFloat((ads.roas ?? '0').replace(/[^0-9.]/g, ''))
  const estLeadsFromBudget =
    ads.budget && benchCplLow > 0
      ? Math.round(parseFloat((ads.budget ?? '0').replace(/[^0-9.]/g, '')) / benchCplLow)
      : null

  const roasAssessment =
    roasNum > 0
      ? roasNum >= 4
        ? `✅ Healthy ROAS (${roasNum}x > 4x benchmark)`
        : roasNum >= 2.5
        ? `⚠️ Below target ROAS (${roasNum}x, target 4x+)`
        : `🚨 Critical ROAS (${roasNum}x — below break-even for most sectors)`
      : 'ROAS not provided'

  const cplCheck =
    cplGapPct !== null
      ? cplGapPct > 0
        ? `⚠️ Client CPL is ${cplGapPct}% ABOVE benchmark — investigate targeting or creative`
        : `✅ Client CPL is ${Math.abs(cplGapPct)}% below benchmark — strong performance`
      : 'CPL comparison pending'

  const leadsCheck =
    ads.leads && estLeadsFromBudget
      ? parseFloat(ads.leads) < estLeadsFromBudget * 0.7
        ? '⚠️ Lead volume is below expected — audience or funnel issue'
        : '✅ Lead volume within expected range'
      : ''

  return `ADS DATA (Real — use for analysis and gap calculations):
- Total Monthly Ad Spend: ${ads.budget ?? 'N/A'} | CPL: ${ads.cpl ?? 'N/A'} | ROAS: ${ads.roas ?? 'N/A'}x | Blended CTR: ${ads.ctr ?? 'N/A'}
- Channel Breakdown: Meta ${ads.metaSpend ?? 'N/A'} | Google ${ads.googleSpend ?? 'N/A'} | TikTok ${ads.tiktokSpend ?? 'N/A'}
- Monthly Leads: ${ads.leads ?? 'N/A'} | Problems Reported: None stated
${ads.prevCampaigns ? `- Previous Campaigns: ${ads.prevCampaigns}` : ''}
- REALITY CHECK: CPL benchmark for ${ctx.sector.en} in ${city.en} = ${bench.cpl_meta} | ${cplCheck}
- REALITY CHECK: Budget ${ads.budget ?? 'N/A'} at benchmark CPL should yield ~${estLeadsFromBudget ?? 'N/A'} leads/month | Actual: ${ads.leads ?? 'N/A'} leads | ${leadsCheck}
- ROAS Assessment: ${roasAssessment}`
}

export function buildSocialBlock(ctx: PromptContext): string {
  const social: SocialData = ctx.social ?? {}
  const bench = ctx.sector.benchmark
  const hasSocial = Boolean(
    social.igFollowers || social.fbFollowers || social.ttFollowers || social.reach
  )

  if (!hasSocial) {
    return `No social media data provided. Use scraped Facebook page data if link provided. Benchmark for ${ctx.sector.en}: ${bench.engagement_benchmark} engagement, flag data absence.`
  }

  const igEngNum = parseFloat((social.igEng ?? '0').replace(/[^0-9.]/g, ''))
  const benchEngLow = parseFloat((bench.engagement_benchmark ?? '3%').split('-')[0].replace(/[^0-9.]/g, ''))
  const igEngGap =
    igEngNum > 0 && benchEngLow > 0
      ? igEngNum >= benchEngLow
        ? `✅ Above benchmark ${benchEngLow}%`
        : `⚠️ Below benchmark ${benchEngLow}% (${igEngNum}% actual)`
      : ''

  const totalFollowers =
    (parseInt(social.igFollowers ?? '0') || 0) +
    (parseInt(social.fbFollowers ?? '0') || 0) +
    (parseInt(social.ttFollowers ?? '0') || 0)

  return `SOCIAL MEDIA DATA (Real — include gap analysis):
- Instagram: ${social.igFollowers ?? 'N/A'} followers | Engagement: ${social.igEng ?? 'N/A'} ${igEngGap}
- Facebook: ${social.fbFollowers ?? 'N/A'} followers | TikTok: ${social.ttFollowers ?? 'N/A'} followers
- Total Social Reach: ${totalFollowers.toLocaleString()} combined followers
- Monthly Reach: ${social.reach ?? 'N/A'} | Impressions: ${social.impressions ?? 'N/A'}
- Posting Rate: ${social.postingRate ?? 'not specified'}
${social.postLinks ? `- Post Links for Analysis: ${social.postLinks}` : ''}
- BENCHMARK: ${ctx.sector.en} in ${ctx.city.en} average engagement = ${bench.engagement_benchmark} | ${igEngGap || 'add IG engagement rate for gap analysis'}`
}

export function buildSalesBlock(ctx: PromptContext): string {
  const sales = ctx.sales ?? {}
  const bench = ctx.sector.benchmark
  const hasSales = Boolean(sales.revenue || sales.convRate || sales.aov || sales.sessions)

  if (!hasSales) {
    return `No sales data. Use sector benchmarks — LTV: ${bench.ltv_benchmark}, CAC: ${bench.cac_benchmark}. Flag for confidence score.`
  }

  const aovNum = parseFloat((sales.aov ?? '0').replace(/[^0-9.]/g, ''))
  const returningNum = parseFloat((sales.returning ?? '0').replace(/[^0-9.]/g, ''))
  const cacNum = parseFloat((sales.cac ?? '0').replace(/[^0-9.]/g, ''))
  const estimatedLTV =
    aovNum > 0
      ? Math.round(aovNum * (1 / (1 - Math.min(returningNum / 100, 0.9) || 0.5)) * 1.2)
      : null
  const ltvCacRatio =
    estimatedLTV && cacNum > 0 ? (estimatedLTV / cacNum).toFixed(1) : null
  const benchLTVLow = parseFloat(
    (bench.ltv_benchmark ?? '2000').split('-')[0].replace(/[^0-9.]/g, '')
  )
  const benchCACLow = parseFloat(
    (bench.cac_benchmark ?? '500').split('-')[0].replace(/[^0-9.]/g, '')
  )

  const ltvVsBench =
    estimatedLTV && benchLTVLow
      ? estimatedLTV >= benchLTVLow
        ? `✅ LTV above sector benchmark EGP ${benchLTVLow.toLocaleString()}`
        : `⚠️ LTV below benchmark — retention improvement needed`
      : `compare to sector benchmark LTV ${bench.ltv_benchmark}`

  const cacVsBench =
    cacNum > 0 && benchCACLow > 0
      ? cacNum <= benchCACLow * 1.5
        ? `✅ CAC within acceptable range`
        : `⚠️ High CAC — optimize acquisition channels`
      : `sector CAC benchmark: ${bench.cac_benchmark}`

  return `SALES & REVENUE DATA (Real — include LTV/CAC analysis):
- Monthly Revenue: ${sales.revenue ?? 'N/A'} | Conversion Rate: ${sales.convRate ?? 'N/A'} | AOV: ${sales.aov ?? 'N/A'}
- Returning Customers: ${sales.returning ?? 'N/A'}% | Monthly Sessions: ${sales.sessions ?? 'N/A'} | CAC: ${sales.cac ?? 'N/A'}
- Estimated LTV: ${estimatedLTV ? `EGP ${estimatedLTV.toLocaleString()}` : 'calculate from AOV × purchase frequency'}
- LTV:CAC Ratio: ${ltvCacRatio ?? 'calculate'} (target: 3:1 minimum)
- LTV vs Benchmark: ${ltvVsBench}
- CAC vs Benchmark: ${cacVsBench}`
}

export function buildDataBlock(ctx: PromptContext): string {
  return [buildAdsBlock(ctx), buildSocialBlock(ctx), buildSalesBlock(ctx)].join('\n')
}
