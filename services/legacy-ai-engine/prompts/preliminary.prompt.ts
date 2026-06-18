import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'
import { SIZE_LABELS } from './types'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch, size } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const sizeLabel = SIZE_LABELS[size]
  const hasData = Boolean(ctx.ads?.budget || ctx.social?.igFollowers || ctx.sales?.revenue)

  return `${base}
${dataBlock}

TASK: Generate a PRELIMINARY marketing report that demonstrates deep understanding of ${companyName}'s situation.
This is a first-meeting quality report — must show the client "they really understand us and our market."
Every single field must be SPECIFIC to ${sector.en} in ${city.en} — NO placeholders, NO generic text.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "تقرير مبدئي",
  "report_subtype": "Preliminary Assessment",
  "confidence": "${hasData ? 'high' : 'medium'}",
  "data_sources": "${hasData ? 'Client data + Egypt market analysis 2025' : 'Egypt market benchmarks + Sector intelligence 2025'}",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "s1_overview": {
    "headline": "One powerful SPECIFIC sentence about ${companyName}'s opportunity in ${city.en}'s ${sector.en} market right now",
    "market_position": "2 sentences about where they currently stand vs competitors in ${city.en}",
    "key_observation": "The single most important insight from analyzing their digital presence and sector — specific and non-obvious"
  },
  "s2_market_overview": {
    "market_size": "Specific estimate for ${sector.en} market in Egypt 2025 with reasoning",
    "growth_rate": "Realistic % based on sector trends — not generic",
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
  "s4_brand_awareness": {
    "current_level": "Low/Medium/High based on follower counts and presence",
    "social_presence": "2 sentences assessing overall digital footprint quality",
    "tone_of_voice": "Current TOV assessment — professional/casual/inconsistent/missing",
    "reach_score": "estimate based on available data",
    "followers_total": "combined social followers estimate"
  },
  "s5_brand_positioning": {
    "current_position": "Where ${companyName} sits in the ${sector.en} market — premium/mid/value and why",
    "clarity": "Clear/Unclear/Mixed with 1-sentence explanation",
    "vs_competitors": "How ${companyName} compares to the 3 named competitors above",
    "usp_strength": "Strong/Weak/Missing — what IS or SHOULD BE the unique value proposition"
  },
  "s6_content_seo": {
    "content_activity": "Active/Moderate/Weak based on links or sector assessment",
    "website_presence": "2-sentence assessment of website quality, SEO readiness, mobile UX",
    "seo_visibility": "Assessment of likely keyword ranking for ${sector.en} terms in ${city.en}",
    "content_gaps": ["specific content type missing that competitors do well", "specific topic cluster underserved in ${sector.en}", "specific platform format not being used"]
  },
  "s7_marketing_channels": {
    "active_channels": ["determine from digital presence or recommend top 3 for sector"],
    "strongest_channel": "name the channel that would or does perform best for this sector",
    "weakest_channel": "channel with lowest ROI potential for ${sector.en}",
    "kpis_last_3months": "${hasData ? 'Based on provided data — see data block above' : 'Baseline not yet established — set these targets in Month 1'}"
  },
  "s8_swot": {
    "strengths": ["specific strength of ${companyName} — not generic", "specific strength 2 based on their stage/sector/location", "specific strength 3"],
    "weaknesses": ["specific weakness 1 — digital gap or market challenge", "specific weakness 2 — operational or brand gap", "specific weakness 3"],
    "opportunities": ["specific market opportunity in ${city.en} 2025", "specific digital channel opportunity for ${sector.en}", "specific content or audience opportunity"],
    "threats": ["specific competitive threat from named competitor", "specific market or economic threat in Egypt"]
  },
  "s9_key_observations": [
    "Specific observation 1 about ${companyName}'s digital presence — non-obvious insight",
    "Specific observation 2 about the ${sector.en} market opportunity they are missing",
    "Specific observation 3 about their competitive positioning"
  ],
  "s10_opportunities": [
    "Opportunity 1: specific channel or audience to target with expected impact",
    "Opportunity 2: specific content angle that competitors aren't using in ${sector.en}",
    "Opportunity 3: specific seasonal or geographic opportunity in ${city.en}",
    "Opportunity 4: specific partnership or platform opportunity for ${sector.en} in 2025"
  ],
  "s11_strategic_recommendations": [
    {"area": "Digital Advertising", "recommendation": "Specific recommendation with channel, budget allocation, and expected CPL for ${sector.en}", "priority": "High", "impact": "Specific expected outcome in 60 days"},
    {"area": "Content Strategy", "recommendation": "Specific content type, frequency, and platform recommendation with rationale", "priority": "High", "impact": "Expected engagement and reach improvement"},
    {"area": "Brand Positioning", "recommendation": "Specific positioning recommendation vs named competitors", "priority": "Med", "impact": "Expected differentiation outcome"}
  ],
  "s12_action_plan": {
    "immediate": ["Days 1-7: specific setup action — pixel, accounts, creative brief", "Days 3-7: specific content action — what to produce and where to publish", "Days 7-14: specific campaign launch action with budget and objective"],
    "short_term": ["Week 2-4: specific optimization action", "Month 1: specific milestone to achieve — leads, followers, or revenue target"],
    "notes": "Key dependencies or risks specific to ${companyName}'s situation"
  },
  "s13_high_level_recommendations": [
    "Rec 1: most important strategic shift for ${companyName} in ${sector.en} — specific and bold",
    "Rec 2: second priority — channel or audience focus",
    "Rec 3: content or brand recommendation",
    "Rec 4: measurement and tracking recommendation"
  ],
  "pain_points": [
    {"level": "high", "title": "specific pain point for ${sector.en} clients like ${companyName}", "detail": "2 sentences explaining impact and how Eunoia solves it"},
    {"level": "high", "title": "specific second pain point", "detail": "2 sentences with solution context"},
    {"level": "med", "title": "specific third pain point", "detail": "1-2 sentences"}
  ],
  "quick_wins": [
    {"action": "specific 7-day action tailored to ${sector.en}", "timeline": "7 days", "money_impact": "EGP/% estimate", "expected_result": "measurable outcome"},
    {"action": "second quick win", "timeline": "5 days", "money_impact": "estimate", "expected_result": "outcome"},
    {"action": "third quick win", "timeline": "7 days", "money_impact": "estimate", "expected_result": "outcome"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasData ? 72 : 58}, "label": "${hasData ? 'High' : 'Medium'}", "reason": "${hasData ? 'Real client data provided' : 'Sector benchmarks applied — add data for higher accuracy'}"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["Foundation: pixel, tracking, digital audit", "Launch first campaign for ${sector.en}", "Establish content calendar"],
    "month2": ["Optimize campaigns based on data", "Scale winning channels", "Build brand awareness content"],
    "month3": ["Hit CPL target for ${sector.en}", "Expand to secondary channels", "First quarterly review"]
  },
  "audit_checklist": [
    {"item": "هل لديك Meta Business Manager محضّر بالكامل؟", "status": false},
    {"item": "هل Pixel مُثبّت على الموقع ويعمل بشكل صحيح؟", "status": false},
    {"item": "هل محتوى السوشيال محدّث خلال آخر أسبوع؟", "status": false},
    {"item": "هل تتابع بيانات الحملات أسبوعياً؟", "status": false},
    {"item": "هل Google Business Profile محدّث بالكامل؟", "status": false},
    {"item": "هل لديك landing page محسّنة للتحويل؟", "status": false},
    {"item": "هل تنشر بانتظام 3+ مرات/أسبوع؟", "status": false},
    {"item": "هل لديك استراتيجية محتوى مكتوبة للشهر القادم؟", "status": false}
  ],
  "data_quality_note": "Report based on ${hasData ? 'client-provided data cross-referenced with' : ''} Egypt ${sector.en} market benchmarks 2025",
  "proposal": [
    {"title": "Quick Launch — ${branch.name}", "desc": "3 Meta campaigns, 8 content pieces/month, weekly optimization reports, competitor monitoring, WhatsApp lead qualification", "price": "EGP 6,000–12,000/month"},
    {"title": "Growth Engine — ${branch.name}", "desc": "Full funnel: ads + video content + Google Ads + SEO + monthly strategy session + real-time dashboard", "price": "EGP 15,000–25,000/month"}
  ],
  "why_us": [
    "Eunoia ${branch.name}: proven results in ${sector.en} sector in ${city.en} with measurable ROI",
    "Bilingual campaigns (Arabic + English) with native Egyptian market understanding",
    "Integrated team: strategist + creative + media buyer + analyst in one account",
    "Transparent reporting: real-time dashboard + weekly calls, not monthly PDF surprises"
  ]
}`
}
