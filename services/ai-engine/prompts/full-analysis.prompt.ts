import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'
import { getCityMultiplier } from '../../../core/data/cities.data'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, ads, social, sales } = ctx
  const bench = sector.benchmark
  const cityMultiplier = getCityMultiplier(city.key)
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasAds = Boolean(ads?.budget || ads?.cpl || ads?.roas)
  const hasSocial = Boolean(social?.igFollowers || social?.fbFollowers)
  const hasSales = Boolean(sales?.revenue || sales?.aov)
  const hasReal = hasAds || hasSocial || hasSales

  const totalFollowers =
    (parseInt(social?.igFollowers ?? '0') || 0) +
    (parseInt(social?.fbFollowers ?? '0') || 0) +
    (parseInt(social?.ttFollowers ?? '0') || 0)

  return `${base}\n${dataBlock}

TASK: Generate a COMPREHENSIVE Full Marketing Analysis — 22 sections. This is the flagship report. Every section must be deeply researched, sector-specific, and immediately actionable for ${companyName} in ${city.en}'s ${sector.en} market.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Full Marketing Analysis",
  "confidence": "${hasReal ? 'high' : 'medium'}",
  "executive_summary": {
    "headline": "One powerful sentence capturing the biggest insight for ${companyName}",
    "key_findings": ["finding 1 — specific", "finding 2", "finding 3", "finding 4"],
    "strategic_direction": "The overarching strategic recommendation",
    "urgency": "Immediate/Short-term/Long-term with rationale"
  },
  "marketing_score": 0,
  "score_dimensions": {
    "digital_presence": 0,
    "content_quality": 0,
    "paid_performance": 0,
    "brand_strength": 0,
    "competitive_position": 0
  },
  "market_overview": {
    "market_size": "${bench.market_size}",
    "growth_rate": "${bench.market_growth}",
    "trend": "Growing/Stable/Declining with Egypt 2025 context",
    "key_drivers": ["driver 1", "driver 2", "driver 3"],
    "5year_outlook": "Where ${sector.en} in ${city.en} is heading 2025-2030"
  },
  "target_audience": {
    "primary_persona": {
      "name": "Persona name (e.g., Mohamed, the ambitious professional)",
      "age": "age range",
      "job": "occupation",
      "income": "monthly income range in EGP",
      "location": "specific neighborhoods in ${city.en}",
      "goal": "their main goal related to ${sector.en}",
      "pain": "their main pain point",
      "online_behavior": "where they spend time online, when, what content",
      "decision_trigger": "what makes them take action",
      "objections": ["objection 1", "objection 2"]
    },
    "secondary_persona": {
      "name": "Second persona",
      "age": "range",
      "job": "occupation",
      "goal": "goal",
      "pain": "pain",
      "online_behavior": "behavior"
    },
    "audience_size_estimate": "Estimated addressable audience in ${city.en} for ${sector.en}",
    "decision_cycle": "${bench.decision_cycle}",
    "buying_behavior": "how ${sector.en} buyers in ${city.en} research and decide"
  },
  "competitor_analysis": {
    "competition_level": "Low/Medium/High",
    "direct_competitors": [
      {
        "name": "Real competitor in ${city.en}",
        "market_share_estimate": "X%",
        "strengths": ["strength 1", "strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "strategy": "their current strategy",
        "pricing": "pricing tier",
        "social_presence": "strong/medium/weak"
      },
      {"name": "competitor 2", "market_share_estimate": "X%", "strengths": [], "weaknesses": [], "strategy": "", "pricing": "", "social_presence": ""},
      {"name": "competitor 3", "market_share_estimate": "X%", "strengths": [], "weaknesses": [], "strategy": "", "pricing": "", "social_presence": ""}
    ],
    "market_gaps": ["specific gap 1 that ${companyName} can own", "gap 2", "gap 3"]
  },
  "swot": {
    "strengths": ["specific strength 1", "strength 2", "strength 3", "strength 4"],
    "weaknesses": ["specific weakness 1", "weakness 2", "weakness 3"],
    "opportunities": ["opportunity 1 in ${city.en} 2025", "opportunity 2", "opportunity 3"],
    "threats": ["threat 1", "threat 2", "threat 3"]
  },
  "brand_positioning": {
    "current_position": "Where ${companyName} sits today: budget/mid/premium and why",
    "target_position": "Where they should be in 12 months",
    "positioning_statement": "For [specific audience] who [specific need], ${companyName} is the [category] that [benefit] because [proof]",
    "brand_voice": "recommended tone: professional/conversational/authoritative/inspiring",
    "perception_gaps": ["gap 1 between reality and perception", "gap 2"]
  },
  "customer_journey": {
    "awareness": {
      "channels": ["Meta video ads", "TikTok", "specific channel for ${sector.en}"],
      "content_type": "specific content for ${sector.en} awareness",
      "kpi": "CPM and reach targets",
      "budget_pct": 30
    },
    "consideration": {
      "channels": ["Meta carousel", "Google Display", "Instagram Stories"],
      "content_type": "social proof + comparison content",
      "kpi": "CTR and landing page visits",
      "budget_pct": 25
    },
    "conversion": {
      "channels": ["Google Search", "Meta retargeting", "WhatsApp"],
      "friction_points": ["specific friction point 1 in ${sector.en}", "friction point 2"],
      "kpi": "CPL and conversion rate",
      "budget_pct": 35
    },
    "retention": {
      "channels": ["WhatsApp", "Email", "loyalty program"],
      "tactics": ["retention tactic 1", "retention tactic 2"],
      "kpi": "repeat purchase rate and LTV",
      "budget_pct": 10
    }
  },
  "campaign_performance": {
    "current_metrics": {
      "total_spend": "${ads?.budget ?? 'N/A'}",
      "meta_spend": "${ads?.metaSpend ?? 'N/A'}",
      "google_spend": "${ads?.googleSpend ?? 'N/A'}",
      "tiktok_spend": "${ads?.tiktokSpend ?? 'N/A'}",
      "blended_roas": "${ads?.roas ?? 'N/A'}",
      "cpl": "${ads?.cpl ?? 'N/A'}",
      "monthly_leads": "${ads?.leads ?? 'N/A'}",
      "ctr": "${ads?.ctr ?? 'N/A'}"
    },
    "vs_benchmark": {
      "cpl_gap": "Client CPL vs ${bench.cpl_meta} benchmark: analysis",
      "roas_gap": "Client ROAS vs 3-6x target: analysis",
      "lead_volume_gap": "Expected leads vs actual"
    },
    "optimization_priorities": ["priority 1", "priority 2", "priority 3"]
  },
  "content_seo": {
    "content_audit": "Assessment of current content quality for ${sector.en}",
    "top_keywords": [
      {"keyword": "primary keyword for ${sector.en} in ${city.en}", "monthly_searches": "estimate", "competition": "high/medium/low"},
      {"keyword": "secondary keyword", "monthly_searches": "estimate", "competition": "level"},
      {"keyword": "long-tail keyword", "monthly_searches": "estimate", "competition": "low"}
    ],
    "content_pillars": ["pillar 1 for ${sector.en}", "pillar 2", "pillar 3", "pillar 4"],
    "missing_content": ["topic 1 competitors cover but ${companyName} doesn't", "topic 2", "topic 3"],
    "posting_strategy": "X posts/week on Y platforms — specific format recommendations for ${sector.en}",
    "seo_quick_wins": ["specific SEO action 1", "action 2", "action 3"]
  },
  "social_media_analysis": {
    "platforms": {
      "instagram": {"followers": "${social?.igFollowers ?? 'N/A'}", "engagement": "${social?.igEng ?? 'N/A'}%", "benchmark": "${bench.engagement_benchmark}", "assessment": "above/below benchmark", "recommendations": ["rec 1", "rec 2"]},
      "facebook": {"followers": "${social?.fbFollowers ?? 'N/A'}", "assessment": "assessment", "recommendations": ["rec 1"]},
      "tiktok": {"followers": "${social?.ttFollowers ?? 'N/A'}", "assessment": "assessment", "opportunity": "specific TikTok opportunity for ${sector.en}"}
    },
    "total_reach": ${totalFollowers},
    "share_of_voice_estimate": "X% vs top 3 competitors — how to improve",
    "content_performance": "Best and worst performing content types for ${sector.en}"
  },
  "clv_retention": {
    "estimated_ltv": "${sales?.aov ? 'calculate' : bench.ltv_benchmark}",
    "ltv_benchmark": "${bench.ltv_benchmark}",
    "cac": "${sales?.cac ?? bench.cac_benchmark}",
    "cac_benchmark": "${bench.cac_benchmark}",
    "ltv_cac_ratio": "X:1 (target 3:1 minimum)",
    "retention_rate": "${sales?.returning ?? 'N/A'}%",
    "churn_causes": ["specific cause 1 for ${sector.en}", "cause 2"],
    "retention_program": "Specific retention strategy for ${sector.en} in ${city.en}"
  },
  "channels_recommended": [
    {"channel": "Meta Ads", "priority": "Primary", "score": 90, "monthly_budget": "EGP X", "cpl_target": "${bench.cpl_meta}", "reason": "primary discovery platform for ${sector.en} in Egypt", "format": "${bench.top_formats.split(',')[0]}"},
    {"channel": "Google Ads", "priority": "Primary", "score": 82, "monthly_budget": "EGP X", "cpl_target": "${bench.cpl_google}", "reason": "high-intent search capture for ${sector.en}", "format": "Search + Shopping"},
    {"channel": "TikTok", "priority": "Secondary", "score": 68, "monthly_budget": "EGP X", "cpl_target": "varies", "reason": "growing 18-34 audience for ${sector.en}", "format": "In-feed video"}
  ],
  "budget_allocation": {
    "total_recommended": "EGP X/month — justified by sector CPL × lead target",
    "breakdown": [
      {"channel": "Meta Ads", "pct": 40, "amount": "EGP X", "rationale": "highest volume channel for ${sector.en}"},
      {"channel": "Google Ads", "pct": 30, "amount": "EGP X", "rationale": "intent-based conversion"},
      {"channel": "TikTok", "pct": 15, "amount": "EGP X", "rationale": "brand building + young audience"},
      {"channel": "Retargeting", "pct": 10, "amount": "EGP X", "rationale": "${bench.decision_cycle} decision cycle — retargeting critical"},
      {"channel": "Content Production", "pct": 5, "amount": "EGP X", "rationale": "creative refresh every 3-4 weeks"}
    ]
  },
  "projections": [
    {"month": "M1 (Foundation)", "leads": 0, "cpl": "EGP X", "roas": "Xx", "milestones": ["milestone 1", "milestone 2"]},
    {"month": "M2 (Optimization)", "leads": 0, "cpl": "EGP X", "roas": "Xx", "milestones": ["milestone 1", "milestone 2"]},
    {"month": "M3 (Scale)", "leads": 0, "cpl": "EGP X", "roas": "Xx", "milestones": ["milestone 1", "milestone 2"]},
    {"month": "M4 (Growth)", "leads": 0, "cpl": "EGP X", "roas": "Xx", "milestones": ["milestone 1"]}
  ],
  "strategy": {
    "phase1": {"title": "Phase 1: Foundation (Week 1-2)", "items": ["specific action 1", "action 2", "action 3"]},
    "phase2": {"title": "Phase 2: Launch (Week 3-4)", "items": ["specific action 1", "action 2", "action 3"]},
    "phase3": {"title": "Phase 3: Scale (Month 2+)", "items": ["specific action 1", "action 2", "action 3"]}
  },
  "marketing_mix_7ps": {
    "product": "product/service quality assessment and gap recommendations for ${sector.en}",
    "price": "pricing assessment vs ${bench.avg_ticket} benchmark — specific recommendation",
    "place": "distribution and channel presence vs ${sector.en} leaders",
    "promotion": "promotion strategy vs competitors — specific gaps",
    "people": "team quality and customer service assessment",
    "process": "delivery process efficiency vs ${sector.en} expectations",
    "physical_evidence": "brand touchpoints quality: website, social, physical space"
  },
  "pain_points": [
    {"level": "high", "title": "primary pain point for ${sector.en} client like ${companyName}", "detail": "specific impact and Eunoia solution"},
    {"level": "high", "title": "second pain point", "detail": "specific context"},
    {"level": "med", "title": "third pain point", "detail": "explanation"},
    {"level": "low", "title": "lower priority pain point", "detail": "explanation"}
  ],
  "quick_wins": [
    {"action": "specific 7-day action 1", "timeline": "7 days", "money_impact": "EGP X", "expected_result": "measurable outcome"},
    {"action": "specific 7-day action 2", "timeline": "7 days", "money_impact": "EGP X", "expected_result": "outcome"},
    {"action": "specific 7-day action 3", "timeline": "7 days", "money_impact": "EGP X", "expected_result": "outcome"}
  ],
  "risk_alerts": [
    {"type": "competitive_risk", "message": "specific competitive risk for ${companyName}", "severity": "high", "fix": "specific mitigation"},
    {"type": "market_risk", "message": "Egypt 2025 inflation impact on ${sector.en} consumer spending", "severity": "medium", "fix": "value-led messaging and flexible pricing"},
    {"type": "operational_risk", "message": "specific operational risk", "severity": "medium", "fix": "specific fix"}
  ],
  "confidence_score": {"pct": ${hasReal ? 85 : 65}, "label": "${hasReal ? 'High' : 'Medium'}", "reason": "${hasReal ? 'Real client data provided across multiple dimensions' : 'Sector benchmark model — client data would push confidence to 85%+'}"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["Month 1 action 1 with expected outcome", "action 2", "action 3"],
    "month2": ["Month 2 action 1", "action 2", "action 3"],
    "month3": ["Month 3 action 1", "action 2", "action 3"]
  },
  "audit_checklist": [
    {"item": "Facebook Pixel + Server-Side API tracking active", "status": false},
    {"item": "Google Analytics 4 with conversion tracking", "status": false},
    {"item": "Google My Business complete and verified", "status": false},
    {"item": "Website mobile speed < 3 seconds", "status": false},
    {"item": "WhatsApp Business with catalog active", "status": false},
    {"item": "Monthly competitor ad library audit scheduled", "status": false},
    {"item": "Content calendar planned 4 weeks ahead", "status": false},
    {"item": "CLV tracking and retention program active", "status": false}
  ],
  "data_quality_note": "${hasReal ? 'High confidence analysis combining real data with sector benchmarks' : 'Sector benchmark model — connecting ad accounts and sharing sales data would enable precise recommendations'}",
  "proposal": [
    {"title": "Full Marketing Partnership — ${ctx.branch.name}", "desc": "Complete execution: Meta + Google + TikTok management, content production, weekly strategy calls, monthly full report, CRM setup", "price": "EGP ${sector.en.includes('Real Estate') ? '20,000-40,000' : '10,000-20,000'}/month", "best_for": "Serious growth target"},
    {"title": "Performance Growth Package", "desc": "Paid campaigns + content + monthly analysis — focused on lead generation and CLV", "price": "EGP ${sector.en.includes('Real Estate') ? '12,000-25,000' : '6,000-15,000'}/month", "best_for": "Growing business with proven offer"},
    {"title": "Strategy + Oversight", "desc": "Monthly strategy session + report + ad account audit — for businesses with in-house execution", "price": "EGP 3,000-8,000/month", "best_for": "Business with internal team needing senior guidance"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: 200+ clients in 40+ sectors — we've seen what works specifically in ${sector.en} in ${city.en}",
    "Bilingual execution: Arabic + English campaigns with native Egyptian market understanding",
    "Performance-based: UAE branch operates on no qualified leads = no management fee model",
    "Integrated team: strategist + creative + media buyer + analyst — faster decisions, no agency runaround"
  ]
}`
}
