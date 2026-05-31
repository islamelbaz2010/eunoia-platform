import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'
import { getCityMultiplier } from '../../../core/data/cities.data'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, size, stage } = ctx
  const bench = sector.benchmark
  const cityMultiplier = getCityMultiplier(city.key)
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)

  return `${base}\n${dataBlock}

TASK: Generate a PRELIMINARY marketing report / Opportunity Assessment that demonstrates deep understanding of ${companyName}'s situation.
CITY INTELLIGENCE NOTE: ${city.en} has a CPL multiplier of ${cityMultiplier}x vs Cairo. All budget and CPL estimates must be adjusted accordingly.
${cityMultiplier > 1.2 ? `${city.en} is a premium area: higher CPL, higher purchasing power, premium brand positioning opportunity.` : cityMultiplier < 0.9 ? `${city.en} is a value area: lower CPL, higher competition on price, volume-first strategy recommended.` : `${city.en} CPL is close to Cairo baseline.`}
This is a first-meeting quality report — must show the client "they really understand us and our market."
Every single field must be SPECIFIC to ${sector.en} in ${city.en} — NO placeholders, NO generic text.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Opportunity Scoring",
  "report_subtype": "Preliminary Assessment",
  "confidence": "${ctx.ads || ctx.social || ctx.sales ? 'high' : 'medium'}",
  "data_sources": "${ctx.ads || ctx.social || ctx.sales ? 'Client data + Egypt market analysis 2025' : 'Egypt market benchmarks + Sector intelligence 2025'}",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "opportunity_score": {
    "total": 0,
    "grade": "A/B/C/D",
    "label": "Strong Opportunity / Moderate Opportunity / Challenging Market / Not Recommended",
    "dimensions": {
      "market_size": {"score": 0, "weight": 20, "rationale": "specific market size assessment"},
      "competition_intensity": {"score": 0, "weight": 20, "rationale": "competition level in ${city.en} ${sector.en}"},
      "digital_readiness": {"score": 0, "weight": 15, "rationale": "digital adoption in this sector/city"},
      "budget_fit": {"score": 0, "weight": 15, "rationale": "budget vs minimum required to compete"},
      "growth_trend": {"score": 0, "weight": 15, "rationale": "sector growth trajectory"},
      "differentiation_potential": {"score": 0, "weight": 15, "rationale": "ability to stand out"}
    }
  },
  "s1_overview": {
    "headline": "One powerful SPECIFIC sentence about ${companyName}'s opportunity in ${city.en}'s ${sector.en} market right now",
    "market_position": "2 sentences about where they currently stand vs competitors in ${city.en}",
    "key_observation": "The single most important insight from analyzing their digital presence and sector — must be specific and non-obvious"
  },
  "s2_market_overview": {
    "market_size": "Specific estimate for ${sector.en} market in Egypt/MENA 2025 with rationale",
    "growth_rate": "${bench.market_growth}",
    "trend": "Growing/Stable/Declining with 1-sentence explanation WHY in Egypt 2025",
    "key_drivers": ["specific driver 1 relevant to ${sector.en} in Egypt", "specific driver 2 with market context", "specific driver 3 — technology or behavior shift"],
    "5year_analysis": "2 sentences on where ${sector.en} market in ${city.en} is heading 2025-2030 and what this means for ${companyName}"
  },
  "s3_competitor_analysis": {
    "competition_level": "Low/Medium/High — explain why for ${sector.en} in ${city.en}",
    "top_competitors": ["REAL competitor 1 name in ${city.en}", "REAL competitor 2 name", "REAL competitor 3 name"],
    "competitor_strength": "2 sentences on what top competitors are doing well in ads/content/pricing",
    "market_gap": "The specific gap or underserved audience that ${companyName} can own — be very specific"
  },
  "s4_swot": {
    "strengths": ["specific strength of ${companyName} — not generic", "specific strength 2 based on their stage/sector/location", "specific strength 3"],
    "weaknesses": ["specific weakness 1 — digital gap or market challenge", "specific weakness 2", "specific weakness 3"],
    "opportunities": ["specific market opportunity in ${city.en} 2025", "specific digital channel opportunity for ${sector.en}", "specific content or audience opportunity"],
    "threats": ["specific competitive threat from named competitor", "specific market or economic threat in Egypt"]
  },
  "s5_quick_wins": [
    {"action": "specific 7-day action — setup or launch something immediately", "timeline": "7 days", "money_impact": "EGP estimate", "expected_result": "measurable outcome"},
    {"action": "second quick win with specific channel and content", "timeline": "7 days", "money_impact": "estimate", "expected_result": "outcome"},
    {"action": "third quick win — content or ad change", "timeline": "7 days", "money_impact": "estimate", "expected_result": "outcome"}
  ],
  "s6_investment_recommendation": {
    "verdict": "✅ Strong GO / ⚠️ GO with caveats / 🔴 High Risk",
    "minimum_monthly_budget": "EGP X/month minimum to be competitive in ${sector.en} in ${city.en}",
    "recommended_monthly_budget": "EGP X/month for meaningful growth",
    "expected_cpl": "${bench.cpl_meta} × ${cityMultiplier} = adjusted estimate",
    "expected_leads_at_min_budget": "X leads/month at minimum budget",
    "payback_period": "X months to positive ROI based on ${bench.ltv_benchmark} LTV",
    "key_conditions": ["condition 1 that must be true for investment to succeed", "condition 2", "condition 3"]
  },
  "pain_points": [
    {"level": "high", "title": "specific pain point for ${sector.en} clients like ${companyName}", "detail": "2 sentences explaining impact and how Eunoia solves it"},
    {"level": "high", "title": "specific second pain point", "detail": "2 sentences with solution context"},
    {"level": "med", "title": "specific third pain point", "detail": "1-2 sentences"}
  ],
  "risk_alerts": [
    {"type": "opportunity_risk", "message": "Specific risk in ${sector.en} in ${city.en} that could undermine the opportunity", "severity": "medium", "fix": "specific mitigation action"}
  ],
  "confidence_score": {"pct": ${ctx.ads || ctx.social ? 75 : 60}, "label": "${ctx.ads || ctx.social ? 'Medium-High' : 'Medium'}", "reason": "Based on sector intelligence and market data — client-specific data would improve accuracy"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["Foundation: setup digital presence, tracking, first campaign", "Establish baseline KPIs for ${sector.en} in ${city.en}", "Test 2 ad creatives with split budget"],
    "month2": ["Scale what worked in Month 1 by 2x", "Optimize targeting based on first-month data", "Launch content strategy to build organic presence"],
    "month3": ["Optimize CPL to reach benchmark ${bench.cpl_meta}", "Expand to second channel based on Month 1-2 data", "Set up retargeting and CLV improvement tactics"]
  },
  "audit_checklist": [
    {"item": "Facebook Business Manager verified and active", "status": false},
    {"item": "Google Ads account set up with correct conversion tracking", "status": false},
    {"item": "Facebook Pixel installed and firing", "status": false},
    {"item": "Website mobile-optimized and loads in <3 seconds", "status": false},
    {"item": "WhatsApp Business profile complete with catalog", "status": false},
    {"item": "Google My Business listing complete and verified", "status": false},
    {"item": "CRM or lead tracking system in place", "status": false},
    {"item": "Monthly budget pre-approved for 3 months minimum", "status": false}
  ],
  "data_quality_note": "Assessment based on sector benchmarks and market knowledge — client-specific data (ad account access, analytics) would improve score accuracy by 25-35%",
  "proposal": [
    {"title": "Quick Launch Package — ${ctx.branch.name}", "desc": "5 specific deliverables: 3 Meta campaigns targeting ${sector.en} buyers in ${city.en}, 8 content pieces/month, weekly reports, competitor monitoring, WhatsApp sales support", "price": "EGP ${sector.en === 'Real Estate' || sector.en === 'Real Estate Developer' ? '15,000-25,000' : '6,000-12,000'}/month"},
    {"title": "Growth Engine — ${ctx.branch.name}", "desc": "7 deliverables with expanded scope: full funnel (Meta + Google), video content production, monthly strategy session, CRM integration, bi-weekly optimization calls", "price": "EGP ${sector.en === 'Real Estate' || sector.en === 'Real Estate Developer' ? '25,000-40,000' : '12,000-22,000'}/month"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: proven results in ${sector.en} sector in ${city.en} with measurable ROI",
    "Bilingual campaigns (Arabic + English) with native Egyptian market understanding — competitors often use generic content",
    "Integrated team: strategist + creative + media buyer + analyst in one account — no handoff delays",
    "Transparent reporting: real-time dashboard + weekly calls, not monthly PDF surprises"
  ]
}`
}
