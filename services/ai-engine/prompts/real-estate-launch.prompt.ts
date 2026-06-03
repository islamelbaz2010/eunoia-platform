import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, city, projectType, projectLocation, projectSize } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const projDesc = [projectType, projectLocation, projectSize].filter(Boolean).join(' | ') || 'Real Estate Project'

  return `${base}\n${dataBlock}

PROJECT DETAILS: ${projDesc}
TASK: Generate a comprehensive Real Estate Project Launch Strategy for ${companyName}.
Context: Egypt real estate market 2025 — 18% YoY growth, ticket sizes EGP 2M-20M, CPL EGP 300-800, primary buyers: end-users 35-55 years, investors seeking 8-12% annual yield.
This is an exhibition-quality report for the Real Estate Developer Exhibition June 2026.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Real Estate Project Launch Strategy",
  "project_overview": {
    "project_type": "${projectType || 'Residential Development'}",
    "location": "${projectLocation || city.en}",
    "size": "${projectSize || 'To be confirmed'}",
    "target_segment": "specific buyer profile with income bracket and lifestyle description",
    "unique_value_proposition": "2 sentences on what makes this project stand out in ${city.en} 2025"
  },
  "launch_readiness_score": {
    "total": 0,
    "grade": "A/B/C",
    "dimensions": {
      "product_readiness": {"score": 0, "note": "renders, model unit, pricing readiness"},
      "market_timing": {"score": 0, "note": "market cycle position for ${city.en}"},
      "brand_positioning": {"score": 0, "note": "developer brand strength for this project"},
      "sales_infrastructure": {"score": 0, "note": "CRM, call center, broker network"},
      "marketing_assets": {"score": 0, "note": "content, ads creative, landing page"}
    }
  },
  "market_timing": {
    "verdict": "Optimal / Good / Acceptable / Challenging",
    "rationale": "2 sentences specific to ${projectLocation || city.en} real estate conditions Q2-Q3 2025",
    "demand_signals": ["specific demand signal 1 for this location", "specific demand signal 2", "specific demand signal 3"],
    "risk_window": "specific time-sensitive risk — e.g. competitors launching, seasonality, interest rate change"
  },
  "target_segments": [
    {
      "segment": "Primary Buyer Persona name",
      "profile": "age range, income, job type, family status",
      "motivation": "primary purchase motivation — investment or lifestyle",
      "budget_range": "EGP X–X million",
      "preferred_channels": ["channel 1", "channel 2", "channel 3"],
      "messaging_hook": "the one sentence that converts this segment"
    },
    {
      "segment": "Secondary Buyer Persona name",
      "profile": "age range, income, job type",
      "motivation": "motivation specific to this segment",
      "budget_range": "EGP X–X million",
      "preferred_channels": ["channel 1", "channel 2"],
      "messaging_hook": "the one sentence that converts this segment"
    },
    {
      "segment": "Broker/Investor Channel",
      "profile": "real estate brokers and institutional investors",
      "motivation": "commission structure, yield, exclusive access",
      "budget_range": "bulk or portfolio purchases",
      "preferred_channels": ["WhatsApp", "broker events", "direct outreach"],
      "messaging_hook": "the one sentence that motivates brokers to prioritize this project"
    }
  ],
  "channel_strategy": {
    "meta_ads": {
      "priority": "High",
      "budget_share": "40%",
      "campaign_types": ["lead generation", "video views", "retargeting"],
      "targeting": "specific audience parameters for ${projectType || 'residential'} buyers in Egypt",
      "expected_cpl": "EGP X–X range",
      "creative_direction": "specific creative concept — emotional angle, visual style"
    },
    "google_ads": {
      "priority": "High",
      "budget_share": "25%",
      "campaign_types": ["search — project name + competitor", "display retargeting", "YouTube pre-roll"],
      "keywords": ["specific keyword 1", "specific keyword 2", "specific keyword 3"],
      "expected_cpl": "EGP X–X range",
      "creative_direction": "specific creative approach for Google"
    },
    "tiktok": {
      "priority": "Medium",
      "budget_share": "15%",
      "campaign_types": ["awareness", "tour/walkthrough content"],
      "targeting": "younger investors and future buyers 28-40",
      "expected_cpl": "EGP X–X range",
      "creative_direction": "specific TikTok creative concept — lifestyle or behind-the-scenes"
    },
    "broker_network": {
      "priority": "High",
      "budget_share": "15%",
      "activities": ["broker launch event", "WhatsApp broadcast", "commission structure"],
      "expected_contribution": "X% of total sales via broker channel"
    },
    "pr_and_influencers": {
      "priority": "Medium",
      "budget_share": "5%",
      "activities": ["real estate influencer tours", "media coverage for launch event", "lifestyle content partnerships"]
    }
  },
  "content_calendar_30days": [
    {"week": 1, "theme": "Teaser & Anticipation", "content_pieces": ["teaser video 30s — location reveal", "countdown social post series", "broker WhatsApp announcement"], "platforms": ["Meta", "TikTok", "WhatsApp"]},
    {"week": 2, "theme": "Project Reveal", "content_pieces": ["launch video 2-3 min", "renders gallery carousel", "developer credibility post"], "platforms": ["Meta", "TikTok", "YouTube"]},
    {"week": 3, "theme": "Social Proof & Investment Case", "content_pieces": ["ROI calculator post/infographic", "testimonial from past buyer", "location advantages documentary-style content"], "platforms": ["Meta", "Google Display"]},
    {"week": 4, "theme": "Urgency & Conversion", "content_pieces": ["limited units countdown", "payment plan explainer", "call center CTA campaign"], "platforms": ["Meta", "Google Search", "WhatsApp retargeting"]}
  ],
  "media_budget_recommendation": {
    "launch_phase_3months": {
      "total": "EGP X,000–X,000",
      "monthly_breakdown": {"meta": "EGP X,000", "google": "EGP X,000", "tiktok": "EGP X,000", "broker_events": "EGP X,000", "content_production": "EGP X,000"},
      "expected_leads": "X–X qualified leads",
      "expected_cpl": "EGP X–X",
      "expected_sales_conversion": "X% of leads to site visit, X% to reservation"
    },
    "scale_phase_months4_6": {
      "total": "EGP X,000–X,000/month",
      "rationale": "scale channels proving <EGP X CPL, cut underperformers"
    }
  },
  "kpis": [
    {"metric": "CPL (Cost Per Lead)", "target": "EGP X–X", "measurement": "CRM + ad platform attribution"},
    {"metric": "Lead-to-Site-Visit Rate", "target": "X%", "measurement": "sales team CRM tracking"},
    {"metric": "Site-Visit-to-Reservation Rate", "target": "X%", "measurement": "sales CRM conversion funnel"},
    {"metric": "Broker-Generated Leads %", "target": "X%", "measurement": "CRM source tagging"},
    {"metric": "Cost Per Reservation", "target": "EGP X,000–X,000", "measurement": "total spend / reservations"},
    {"metric": "Social Media Reach", "target": "X,000/month", "measurement": "platform analytics"},
    {"metric": "Website Conversion Rate", "target": "X%", "measurement": "Google Analytics events"}
  ],
  "risk_factors": [
    {"risk": "specific market risk for ${projectLocation || city.en}", "probability": "medium/high", "impact": "high", "mitigation": "specific mitigation strategy"},
    {"risk": "competitive launch by rival developer", "probability": "medium", "impact": "medium", "mitigation": "accelerate early reservations with launch incentives"},
    {"risk": "lead quality drop — high volume, low seriousness", "probability": "high", "impact": "medium", "mitigation": "lead scoring system + pre-qualification script for call center"},
    {"risk": "content production delays", "probability": "medium", "impact": "high", "mitigation": "brief creative agency 6 weeks before launch with phased delivery"}
  ],
  "quick_wins": [
    {"action": "Launch WhatsApp broadcast to broker network with teaser + floor plan PDF", "timeline": "48 hours", "expected_result": "50-100 broker inquiries"},
    {"action": "Set up Meta Lead Ads with project teaser — collect pre-launch interest", "timeline": "3 days", "expected_result": "200-500 pre-launch leads at EGP 15-30 CPL"},
    {"action": "Register on Aqarmap and Property Finder with full project listing", "timeline": "5 days", "expected_result": "organic leads from property portals immediately"},
    {"action": "Secure 3-5 real estate influencer partnerships for launch week", "timeline": "1 week", "expected_result": "500K-1M reach for launch reveal"}
  ],
  "agency_proposal": [
    {
      "title": "Launch Sprint — 3 Month Package",
      "desc": "Complete project launch execution: campaign setup across Meta + Google + TikTok, 30-day content calendar production, broker network activation, weekly reporting, CRM integration, and real-time optimization",
      "price": "EGP 35,000–55,000/month",
      "best_for": "Developers launching within 60 days needing full-service execution"
    },
    {
      "title": "Strategic Launch — 6 Month Partnership",
      "desc": "Full launch + scale: everything in Sprint plus video production, influencer management, PR coordination, monthly strategy review, competitive intelligence updates, and lead nurturing automation",
      "price": "EGP 55,000–85,000/month",
      "best_for": "Large projects EGP 500M+ needing sustained pre-sales velocity"
    },
    {
      "title": "Advisory & Setup",
      "desc": "Strategy document, channel setup, campaign templates, content brief, team training — delivered in 2 weeks. Client executes internally.",
      "price": "EGP 25,000 one-time",
      "best_for": "Developers with in-house marketing teams needing expert strategy direction"
    }
  ]
}`
}
