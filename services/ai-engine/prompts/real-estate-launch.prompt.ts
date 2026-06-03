import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, city, projectType, projectLocation, projectSize } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const projDesc = [projectType, projectLocation, projectSize].filter(Boolean).join(' | ') || 'Real Estate Project'
  const hasProjectData = Boolean(projectType || projectLocation || projectSize)

  return `${base}\n${dataBlock}

PROJECT DETAILS: ${projDesc}
TASK: Generate a comprehensive Real Estate Project Launch Strategy for ${companyName}.

EGYPT RE LAUNCH BENCHMARKS 2025:
• Pre-sales month 1 target: 30% of total units = strong launch signal
• Marketing spend: 2–4% of GDV (Gross Development Value)
• Launch CPL range: EGP 300–500 for mid-range, EGP 500–1,200 for luxury
• Broker activation: assign 15–25 exclusive brokers before soft launch
• WhatsApp response SLA: < 5 minutes from lead submission = 3x conversion rate
• Content must-haves: project vision video (90s), 360 walkthrough, payment plan one-pager, aerial footage
• Cityscape June 2026: major exhibition — align launch timeline if applicable
• Location premium: New Cairo +25% CPL, New Capital +20%, 6th Oct -10% vs Cairo benchmark

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Real Estate Project Launch Strategy",
  "data_disclaimer": "AI-generated analysis using Egypt RE market benchmarks Q2 2025. Financial projections are estimates — validate with actual project financials.",
  "project_overview": {
    "project_type": "${projectType || 'Residential Development'}",
    "location": "${projectLocation || city.en}",
    "size": "${projectSize || 'To be confirmed'}",
    "target_segment": "specific buyer profile — income bracket, age, lifestyle, motivation (investor vs end-user)",
    "unique_value_proposition": "2 sentences — what makes this project win in ${projectLocation || city.en} against current competition",
    "location_premium_applied": "state which CPL multiplier used for this location and why"
  },
  "launch_readiness_score": {
    "total": 0,
    "grade": "A/B/C",
    "dimensions": {
      "product_readiness": {"score": 0, "note": "renders, model unit, pricing table ready?"},
      "market_timing": {"score": 0, "note": "market cycle assessment for ${projectLocation || city.en} Q2-Q3 2025"},
      "brand_positioning": {"score": 0, "note": "developer brand recognition in this location"},
      "sales_infrastructure": {"score": 0, "note": "CRM, call center, broker network activated?"},
      "marketing_assets": {"score": 0, "note": "content production, ads creative, landing page ready?"}
    }
  },
  "market_timing": {
    "verdict": "Optimal / Good / Acceptable / Challenging",
    "rationale": "2 specific sentences on ${projectLocation || city.en} market conditions Q2 2025",
    "demand_signals": ["signal 1 — specific to this location", "signal 2", "signal 3"],
    "risk_window": "specific time risk — competitor launches, seasonality, rate environment",
    "cityscape_opportunity": "Should this project exhibit at Cityscape June 2026? Yes/No with rationale"
  },
  "target_segments": [
    {
      "segment": "Primary Buyer — name this persona",
      "profile": "age range, income bracket EGP/month, job type, family status",
      "motivation": "investment yield OR lifestyle OR future appreciation — be specific",
      "budget_range": "EGP X–X million",
      "preferred_channels": ["channel 1", "channel 2", "channel 3"],
      "messaging_hook": "the one sentence that converts this exact segment",
      "estimated_segment_size": "% of total buyers in ${projectLocation || city.en}"
    },
    {
      "segment": "Secondary Buyer — name this persona",
      "profile": "demographics",
      "motivation": "specific motivation",
      "budget_range": "EGP X–X million",
      "preferred_channels": ["channel 1", "channel 2"],
      "messaging_hook": "conversion sentence"
    },
    {
      "segment": "Broker / Investor Channel",
      "profile": "real estate brokers and institutional investors",
      "motivation": "commission 2–3% + exclusive access + developer reputation",
      "budget_range": "bulk or portfolio purchases",
      "preferred_channels": ["WhatsApp broker groups", "broker events", "direct outreach"],
      "messaging_hook": "the sentence that motivates brokers to prioritize this project over competitors"
    }
  ],
  "channel_strategy": {
    "pre_launch_phase": {
      "duration": "4–6 weeks before launch day",
      "objective": "Build awareness and broker network — no direct sales",
      "channels": ["broker WhatsApp activation", "teaser video on Meta/YouTube", "landing page with early registration"],
      "budget_allocation": "20% of launch budget",
      "kpi": "X broker registrations + Y email leads before launch day",
      "reasoning": "Why this timeline and channel mix for ${projectLocation || city.en}"
    },
    "soft_launch_phase": {
      "duration": "Week 1–2 of launch",
      "objective": "Hit 30% pre-sales target with qualified buyers",
      "channels": ["Meta Lead Ads (primary)", "Google Search (branded + location)", "WhatsApp broadcast to pre-registered leads", "broker activation events"],
      "budget_allocation": "50% of launch budget",
      "expected_cpl": "EGP X–X (benchmark for ${projectLocation || city.en} ${projectType || 'residential'})",
      "cpl_reasoning": "benchmark CPL × location premium × project tier = calculated range"
    },
    "full_launch_phase": {
      "duration": "Month 2–3",
      "objective": "Scale to 50–70% absorption",
      "channels": ["Meta + Google at scale", "TikTok retargeting", "PR + influencer compound visit", "Cityscape if applicable"],
      "budget_allocation": "30% of launch budget",
      "optimization_focus": "retargeting the 97% who visited but didn't convert"
    }
  },
  "media_budget": {
    "total_recommended": "EGP X million (X% of estimated GDV)",
    "reasoning": "GDV estimate × 3% marketing benchmark = total launch budget justification",
    "breakdown": {
      "meta_ads_pct": 40,
      "google_ads_pct": 25,
      "broker_activation_pct": 15,
      "content_production_pct": 10,
      "events_pr_pct": 10
    },
    "monthly_phasing": "Month 1: 40%, Month 2: 35%, Month 3: 25%"
  },
  "content_requirements": {
    "must_have": ["Project vision film 90s (aerial + walkthrough + lifestyle)", "Payment plan one-pager PDF", "360° virtual tour", "WhatsApp sales kit for brokers"],
    "high_impact": ["Influencer compound visit video", "Investor ROI calculator (interactive)", "Time-lapse construction updates"],
    "ad_creative_priority": "first 3 ad creatives to test — format + hook + CTA for each"
  },
  "kpis": {
    "launch_month_target": "30% units pre-sold = X units = EGP X million",
    "cpl_target": "EGP X–X per qualified lead",
    "site_visit_rate": "X% of leads book site visit (benchmark: 15%)",
    "lead_to_reservation": "X% funnel conversion (benchmark: 3%)",
    "broker_activation": "X brokers activated with exclusive inventory",
    "whatsapp_response_sla": "< 5 minutes — critical for conversion"
  },
  "risk_factors": [
    {"risk": "specific risk 1 for this location/project type", "likelihood": "High/Medium/Low", "impact": "EGP X million revenue at risk", "mitigation": "specific action"},
    {"risk": "competitor project launching in same area", "likelihood": "Medium", "impact": "15–25% slower absorption", "mitigation": "pre-launch exclusivity offers and broker lock-in"},
    {"risk": "payment plan competitiveness — if < 8 years", "likelihood": "High if short plan", "impact": "lose 40% of potential buyers", "mitigation": "extend to 8–10 years minimum"}
  ],
  "quick_wins": [
    {"action": "specific 7-day action", "timeline": "7 days", "money_impact": "EGP estimate", "expected_result": "measurable outcome", "reasoning": "why this action first"},
    {"action": "action 2", "timeline": "7 days", "money_impact": "EGP estimate", "expected_result": "outcome", "reasoning": "rationale"},
    {"action": "action 3", "timeline": "14 days", "money_impact": "EGP estimate", "expected_result": "outcome", "reasoning": "rationale"}
  ],
  "confidence_score": {"pct": ${hasProjectData ? 72 : 62}, "label": "${hasProjectData ? 'Medium-High' : 'Medium'}", "reason": "${hasProjectData ? 'Project details provided + Egypt RE benchmarks 2025' : 'Egypt RE benchmarks only — project financials and location details would increase confidence to 80%+'}"},
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "sector_rank": "Assessment based on project details and market position",
  "plan_90_days": {
    "month1": ["Week 1–2: broker activation (target X brokers) — specific action", "Week 3–4: soft launch with Meta Lead Ads — specific targeting", "End of month: 30% pre-sales target review"],
    "month2": ["Scale winning ad sets — specific optimization", "Launch TikTok retargeting", "PR + influencer visit execution"],
    "month3": ["Push to 60% absorption — specific channel adjustments", "Referral program activation", "Cityscape preparation if applicable"]
  },
  "audit_checklist": [
    {"item": "Landing page live with lead capture form + Facebook Pixel", "status": false},
    {"item": "WhatsApp Business API connected with < 5 min auto-response", "status": false},
    {"item": "CRM configured for lead source attribution", "status": false},
    {"item": "15+ brokers activated with WhatsApp kit", "status": false},
    {"item": "Project vision video produced (90s minimum)", "status": false},
    {"item": "Payment plan one-pager designed and ready for WhatsApp", "status": false},
    {"item": "Google Analytics 4 + conversion tracking live", "status": false},
    {"item": "Competitor price monitoring system in place", "status": false}
  ],
  "data_quality_note": "${hasProjectData ? 'Medium-high confidence — project details provided. Adding GDV, unit mix, and actual payment plan would enable precise financial projections.' : 'Medium confidence — sector benchmarks applied. Share project financials, GDV, and unit mix for precise recommendations.'}",
  "proposal": [
    {"title": "Full Project Launch Management", "desc": "End-to-end launch: strategy, content production, Meta + Google + broker activation, weekly reporting, WhatsApp CRM setup", "price": "EGP 25,000–45,000/month + % of sales milestone bonus", "best_for": "Developer wanting turnkey launch execution", "reasoning": "Covers 3 specialists (strategist + media buyer + content) + production budget"},
    {"title": "Launch Strategy + Media Only", "desc": "Paid campaigns (Meta + Google) + monthly strategy — developer handles content and broker activation", "price": "EGP 15,000–25,000/month", "best_for": "Developer with internal sales team and content capacity"},
    {"title": "Launch Intelligence Report (One-time)", "desc": "Full launch strategy document + channel plan + content brief — for developer to execute internally", "price": "EGP 8,000–15,000 one-time", "best_for": "Developer wanting strategy without ongoing retainer"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: launched 20+ real estate projects in Egypt and Gulf — we know pre-sales conversion patterns",
    "Egypt RE specialists: our media buyers run active campaigns for developers — real CPL data, not benchmarks",
    "Broker network: active relationships with top real estate brokers in ${projectLocation || city.en}",
    "WhatsApp CRM setup: we configure the full lead-to-close funnel including automated follow-up sequences"
  ]
}`
}
