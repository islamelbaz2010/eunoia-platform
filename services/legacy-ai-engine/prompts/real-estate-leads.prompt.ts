import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, city, projectType, projectLocation, projectSize } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const projDesc = [projectType, projectLocation, projectSize].filter(Boolean).join(' | ') || 'Real Estate Project'

  return `${base}\n${dataBlock}

PROJECT DETAILS: ${projDesc}
TASK: Generate a comprehensive Real Estate Lead Generation Intelligence Report for ${companyName}.
Context: Egypt real estate 2025 — benchmark CPL EGP 300-800 for residential, EGP 150-400 for commercial. Average funnel: 100 leads → 15 site visits → 3 reservations. WhatsApp follow-up within 5 minutes increases conversion 3x.
This is an exhibition-quality deep-dive into lead generation performance and optimization.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Lead Generation Intelligence",
  "lead_quality_score": {
    "total": 0,
    "grade": "A/B/C/D",
    "dimensions": {
      "lead_volume": {"score": 0, "benchmark": "X leads/month for ${projectType || 'residential'} in ${city.en}"},
      "lead_quality": {"score": 0, "benchmark": "X% qualified rate industry average"},
      "speed_to_contact": {"score": 0, "benchmark": "<5 min ideal, industry avg 2 hours"},
      "channel_diversity": {"score": 0, "benchmark": "minimum 3 active channels"},
      "nurturing_system": {"score": 0, "benchmark": "automated follow-up sequence in place"},
      "data_hygiene": {"score": 0, "benchmark": "CRM tagging, source attribution, dedup"}
    }
  },
  "cpl_benchmark": {
    "your_estimated_cpl": "EGP X–X (estimated from sector data)",
    "market_benchmark_residential": "EGP 300–500 per qualified lead",
    "market_benchmark_luxury": "EGP 500–1,200 per qualified lead",
    "market_benchmark_commercial": "EGP 200–400 per lead",
    "best_channel_for_cpl": "Meta Lead Ads — historically lowest CPL for Egyptian real estate",
    "cpl_optimization_potential": "X% reduction achievable with recommended changes",
    "analysis": "2 sentences comparing estimated performance vs market benchmark with specific diagnosis"
  },
  "funnel_analysis": {
    "awareness": {
      "reach_estimate": "X,000 people/month (estimated)",
      "channels_active": ["list active or likely active channels"],
      "gap": "specific awareness gap — e.g. Google Search not captured, TikTok untapped"
    },
    "consideration": {
      "lead_volume": "X–X leads/month (estimated or actual)",
      "website_visits": "X,000/month (estimated)",
      "conversion_to_lead": "X% website visitor → lead form submitted",
      "gap": "specific consideration gap — e.g. no retargeting, weak landing page"
    },
    "decision": {
      "site_visit_rate": "X% of leads book site visit",
      "lead_to_reservation": "X% overall funnel conversion",
      "avg_decision_time": "X weeks from first contact to reservation",
      "gap": "specific decision gap — e.g. no WhatsApp follow-up sequence, sales team response delay"
    },
    "biggest_funnel_leak": "The single point in the funnel losing the most leads — specific description with estimated EGP impact"
  },
  "channel_performance": [
    {
      "channel": "Meta Ads (Facebook/Instagram)",
      "status": "Active/Inactive/Unknown",
      "estimated_cpl": "EGP X–X",
      "lead_quality": "High/Medium/Low — specific reason",
      "share_of_wallet": "X% of budget",
      "recommendation": "Scale/Optimize/Pause — specific action with expected outcome"
    },
    {
      "channel": "Google Search Ads",
      "status": "Active/Inactive/Unknown",
      "estimated_cpl": "EGP X–X",
      "lead_quality": "High — intent-based leads",
      "share_of_wallet": "X%",
      "recommendation": "specific action"
    },
    {
      "channel": "Property Portals (Aqarmap, Property Finder)",
      "status": "Active/Inactive/Unknown",
      "estimated_cpl": "EGP X–X",
      "lead_quality": "High — already searching",
      "share_of_wallet": "subscription cost",
      "recommendation": "specific optimization — photos, virtual tours, response speed"
    },
    {
      "channel": "Broker Network",
      "status": "Active/Inactive/Unknown",
      "estimated_cpl": "commission only — no upfront CPL",
      "lead_quality": "Medium — pre-qualified by broker",
      "share_of_wallet": "X% commission on sales",
      "recommendation": "specific broker engagement strategy"
    },
    {
      "channel": "WhatsApp / Organic",
      "status": "Active/Inactive",
      "estimated_cpl": "EGP 0 (organic)",
      "lead_quality": "High — direct intent",
      "share_of_wallet": "0 — opportunity",
      "recommendation": "activate WhatsApp Business broadcast and referral program"
    }
  ],
  "audience_segments": [
    {
      "segment": "Primary Buyer — End User",
      "size_estimate": "X,000 people in ${city.en} matching profile",
      "profile": "35-55, married, HHI EGP 25,000+/month, looking for family home",
      "best_channels": ["Meta", "Google Search"],
      "creative_hook": "Lifestyle-forward: family living, community, school proximity",
      "cpl_estimate": "EGP 350-600"
    },
    {
      "segment": "Investor Buyer",
      "size_estimate": "X,000 in Egypt with investable capital",
      "profile": "40-65, high income, seeking 8-12% annual yield or capital appreciation",
      "best_channels": ["LinkedIn", "Property portals", "WhatsApp broker network"],
      "creative_hook": "ROI calculator, yield comparison vs bank deposits, capital appreciation data",
      "cpl_estimate": "EGP 500-900"
    },
    {
      "segment": "First-Time Buyer — Young Professional",
      "size_estimate": "X,000 eligible in ${city.en}",
      "profile": "28-38, professional, first home purchase, flexible payment plan critical",
      "best_channels": ["TikTok", "Instagram", "Google"],
      "creative_hook": "Payment plan affordability, milestone of first home ownership",
      "cpl_estimate": "EGP 200-400"
    }
  ],
  "creative_recommendations": [
    {
      "format": "Video — 30-60 seconds",
      "concept": "Specific concept: lifestyle morning routine in the development, emotional family moment",
      "platform": "Meta, TikTok",
      "hook_line": "The exact first 3 seconds that stop the scroll",
      "cta": "احجز معادك — Book Your Tour Today",
      "estimated_impact": "20-35% lower CPL vs static image ads"
    },
    {
      "format": "Carousel — Floor Plans + Pricing",
      "concept": "Unit types with sizes, prices, and payment plan breakdown per slide",
      "platform": "Meta, Instagram",
      "hook_line": "Swipe to find your perfect unit",
      "cta": "Get Price List — مش هتندم",
      "estimated_impact": "High-intent leads — people who engage are serious buyers"
    },
    {
      "format": "Google Responsive Search Ad",
      "concept": "Intent capture for people searching 'شقق للبيع في ${projectLocation || city.en}'",
      "platform": "Google Search",
      "hook_line": "Exact headline matching search query for Quality Score 8+",
      "cta": "احجز زيارة — مواعيد محدودة",
      "estimated_impact": "3x higher intent vs social — converts at 2-3x the rate"
    },
    {
      "format": "WhatsApp Lead Nurture Sequence",
      "concept": "5-message sequence over 14 days: welcome → project story → ROI breakdown → testimonial → limited unit CTA",
      "platform": "WhatsApp Business API",
      "hook_line": "First message within 5 minutes of lead submission",
      "cta": "Each message has single clear action",
      "estimated_impact": "3x higher reservation rate for leads nurtured vs called-only"
    }
  ],
  "budget_reallocation": {
    "current_allocation": "Estimated current distribution based on typical developer spend",
    "recommended_allocation": {
      "meta_ads": "40%",
      "google_ads": "25%",
      "property_portals": "15%",
      "content_production": "10%",
      "broker_activation": "10%"
    },
    "rationale": "Meta highest volume at acceptable CPL; Google highest quality intent; portals provide ready buyers; content compounds over time; brokers = commission only upside",
    "expected_improvement": "X% reduction in blended CPL, X% increase in qualified lead rate"
  },
  "qualification_system": {
    "lead_scoring_criteria": [
      {"criterion": "Budget confirmed ≥ EGP X million", "points": 30, "how_to_capture": "qualification call question"},
      {"criterion": "Timeline: buying within 3 months", "points": 25, "how_to_capture": "CRM field"},
      {"criterion": "Has visited site or requested meeting", "points": 20, "how_to_capture": "CRM activity"},
      {"criterion": "Responded to WhatsApp within 24 hours", "points": 15, "how_to_capture": "WhatsApp Business read receipt"},
      {"criterion": "Referred by broker", "points": 10, "how_to_capture": "UTM source tagging"}
    ],
    "threshold": "Score ≥ 50: hot lead → immediate call. 30-49: warm → 2-day nurture. <30: cold → automated sequence",
    "estimated_impact": "Focus top 20% of leads that generate 80% of reservations"
  },
  "30_day_action_plan": [
    {"day": "1-3", "action": "Audit all active ad accounts: pause underperforming campaigns with CPL >EGP X", "owner": "Media Buyer", "kpi": "Identify quick savings"},
    {"day": "1-5", "action": "Set up WhatsApp Business API with 5-message nurture sequence", "owner": "Marketing Team", "kpi": "Sequence live and triggered"},
    {"day": "3-7", "action": "Launch Google Search campaign targeting high-intent keywords for ${projectLocation || city.en}", "owner": "Media Buyer", "kpi": "Campaign live, baseline CPL tracked"},
    {"day": "5-10", "action": "Brief creative team on new video concepts — lifestyle + ROI angles", "owner": "Creative Director", "kpi": "2 video briefs approved"},
    {"day": "7-14", "action": "Update Aqarmap and Property Finder listings with new renders and virtual tour", "owner": "Marketing Manager", "kpi": "Portal leads increase 20%"},
    {"day": "10-20", "action": "Launch new Meta campaigns with optimized creatives and tighter audience", "owner": "Media Buyer", "kpi": "CPL target EGP X–X"},
    {"day": "15-30", "action": "Broker re-activation: event or briefing with updated floor plans and commission structure", "owner": "Sales Director", "kpi": "50+ active brokers"},
    {"day": "25-30", "action": "First performance review: compare CPL, lead quality score, funnel conversion vs baseline", "owner": "Account Manager", "kpi": "Report shared, next month strategy set"}
  ],
  "agency_proposal": [
    {
      "title": "Lead Gen Audit & Optimization",
      "desc": "Complete audit of all lead sources, creative performance analysis, new campaign setup, WhatsApp nurture sequence, and 30-day optimization roadmap with weekly check-ins",
      "price": "EGP 18,000–28,000/month",
      "best_for": "Developers with existing campaigns that are underperforming — immediate CPL reduction"
    },
    {
      "title": "Full Lead Gen Engine",
      "desc": "Everything in Audit package plus creative production (4 videos + 8 static), Google + Meta + TikTok management, property portal optimization, broker network activation, and lead scoring CRM integration",
      "price": "EGP 35,000–55,000/month",
      "best_for": "Developers targeting 100+ qualified leads/month with full-funnel coverage"
    },
    {
      "title": "Performance-Based Add-On",
      "desc": "After month 3 of partnership — shift a portion to CPL-based pricing at EGP X per qualified lead (meeting pre-defined qualification criteria). Aligns incentives completely.",
      "price": "EGP X per qualified lead + EGP 8,000 base/month",
      "best_for": "Long-term partnerships where both sides are confident in performance"
    }
  ]
}`
}
