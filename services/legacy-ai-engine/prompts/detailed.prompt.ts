import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasData = Boolean(ctx.ads?.budget || ctx.social?.igFollowers || ctx.sales?.revenue)

  return `${base}
${dataBlock}

TASK: Generate a DETAILED professional marketing report for ${companyName}.
Fill all fields with real, specific, actionable content for ${companyName} in the ${sector.en} sector in ${city.en}.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "تقرير تفصيلي",
  "report_subtype": "Detailed Analysis",
  "confidence": "${hasData ? 'high' : 'medium'}",
  "data_sources": "${hasData ? 'Client data + Market analysis' : 'Market benchmarks + Industry research'}",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "s1_executive_summary": {
    "headline": "one powerful sentence about ${companyName}'s situation and biggest opportunity",
    "key_findings": ["finding 1 — specific data point", "finding 2 — competitive insight", "finding 3 — channel performance", "finding 4 — growth opportunity"],
    "strategic_direction": "overall recommended direction for ${companyName} in ${sector.en} ${city.en}",
    "urgency": "Immediate or Short-term or Long-term"
  },
  "s2_company_deep_dive": {
    "business_model": "how ${companyName} makes money in ${sector.en}",
    "core_services": ["primary service 1", "primary service 2", "primary service 3"],
    "revenue_sources": ["main revenue source 1", "main revenue source 2"],
    "core_value": "what makes ${companyName} different from competitors",
    "team_assessment": "marketing team capability assessment based on available data"
  },
  "s3_target_audience": {
    "primary_persona": {"name": "persona name", "age": "specific age range for ${sector.en} buyer in ${city.en}", "job": "occupation description", "goal": "main goal related to ${sector.en}", "pain": "main pain point driving decision", "online_behavior": "how they discover and research ${sector.en} services online"},
    "secondary_persona": {"name": "persona name", "age": "age range", "job": "occupation", "goal": "secondary goal", "pain": "pain point"},
    "buying_behavior": "how they decide to buy ${sector.en} services in ${city.en} — decision cycle, trust factors",
    "key_motivations": ["motivation 1 specific to ${sector.en}", "motivation 2", "motivation 3"]
  },
  "s4_competitor_analysis": {
    "direct_competitors": [
      {"name": "REAL competitor 1 in ${city.en}", "strength": "their main advantage", "weakness": "exploitable weakness", "strategy": "their marketing approach", "pricing": "pricing tier vs ${companyName}"},
      {"name": "REAL competitor 2", "strength": "their strength", "weakness": "weakness to exploit", "strategy": "strategy", "pricing": "pricing tier"},
      {"name": "REAL competitor 3", "strength": "strength", "weakness": "weakness", "strategy": "strategy", "pricing": "pricing tier"}
    ],
    "competitive_advantages": ["${companyName} advantage 1 vs field", "advantage 2"],
    "market_gaps": ["specific gap 1 none of top 3 competitors address", "gap 2", "gap 3"]
  },
  "s5_swot": {
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3", "specific strength 4"],
    "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
    "opportunities": ["specific opportunity 1 in ${city.en} 2025", "opportunity 2", "opportunity 3"],
    "threats": ["specific threat 1 from named competitor", "threat 2 — market/economic"]
  },
  "s6_brand_positioning": {
    "current_position": "where ${companyName} is now — premium/mid/value",
    "target_position": "where ${companyName} should be in 12 months",
    "positioning_statement": "For [target audience] who [need], ${companyName} is the [category] that [benefit] because [reason]",
    "perception_gaps": ["gap 1 between current and desired positioning", "gap 2"]
  },
  "s7_customer_journey": {
    "awareness": {"channels": ["top awareness channel 1", "channel 2"], "kpi": "reach/impressions metric"},
    "consideration": {"channels": ["consideration channel 1", "channel 2"], "kpi": "inquiry rate / CTR"},
    "conversion": {"channels": ["closing channel"], "friction_points": ["friction 1 specific to ${sector.en}", "friction 2"], "kpi": "conversion rate %"},
    "retention": {"tactics": ["retention tactic 1 for ${sector.en}", "retention tactic 2"], "kpi": "repeat purchase / return rate"}
  },
  "s8_campaign_roi": {
    "current_performance": ${ctx.ads?.budget ? `{"total_spend":"${ctx.ads?.budget ?? 'N/A'}","meta_spend":"${ctx.ads?.metaSpend ?? 'N/A'}","google_spend":"${ctx.ads?.googleSpend ?? 'N/A'}","tiktok_spend":"${ctx.ads?.tiktokSpend ?? 'N/A'}","blended_roas":"${ctx.ads?.roas ?? 'N/A'}","cpl":"${ctx.ads?.cpl ?? 'N/A'}","monthly_leads":"${ctx.ads?.leads ?? 'N/A'}","ctr":"${ctx.ads?.ctr ?? 'N/A'}"}` : '{"status":"no real data — using sector benchmarks"}'},
    "optimization_recommendations": ["recommendation 1 — specific channel/audience fix", "recommendation 2 — creative/format change", "recommendation 3 — bid strategy or audience expansion"]
  },
  "s9_content_seo": {
    "content_audit": "assessment of current content quality, consistency, and SEO for ${sector.en}",
    "missing_topics": ["high-value topic 1 not covered", "topic 2", "topic 3"],
    "content_pillars": ["pillar 1 — educational", "pillar 2 — social proof", "pillar 3 — promotional", "pillar 4 — behind the scenes"],
    "posting_strategy": "recommended frequency and format mix for ${sector.en} in ${city.en}"
  },
  "s10_brand_awareness": ${ctx.social ? `{"instagram":{"followers":"${ctx.social?.igFollowers ?? 'N/A'}","engagement":"${ctx.social?.igEng ?? 'N/A'}","assessment":"Instagram assessment"},"facebook":{"followers":"${ctx.social?.fbFollowers ?? 'N/A'}","assessment":"Facebook assessment"},"tiktok":{"followers":"${ctx.social?.ttFollowers ?? 'N/A'}","assessment":"TikTok assessment"},"awareness_score":"Low/Medium/High","recommendations":["rec 1","rec 2","rec 3"]}` : '{"status":"no social data provided","recommendations":["audit all platforms","set up tracking","establish baseline KPIs"]}'},
  "s11_clv_retention": ${ctx.sales ? `{"revenue":"${ctx.sales?.revenue ?? 'N/A'}","conv_rate":"${ctx.sales?.convRate ?? 'N/A'}","aov":"${ctx.sales?.aov ?? 'N/A'}","cac":"${ctx.sales?.cac ?? 'N/A'}","returning_customers":"${ctx.sales?.returning ?? 'N/A'}","clv_estimate":"calculate based on AOV and purchase frequency for ${sector.en}","retention_improvement":["retention action 1","retention action 2"]}` : '{"status":"no sales data","recommendations":["set up CRM","track repeat purchases","implement loyalty program"]}'},
  "s12_channels_analysis": {
    "channel_breakdown": [
      {"channel": "Meta Ads", "spend": "${ctx.ads?.metaSpend ?? 'TBD'}", "performance": "Meta performance assessment for ${sector.en}"},
      {"channel": "Google Ads", "spend": "${ctx.ads?.googleSpend ?? 'TBD'}", "performance": "Google performance assessment"},
      {"channel": "TikTok", "spend": "${ctx.ads?.tiktokSpend ?? 'TBD'}", "performance": "TikTok assessment for ${sector.en}"}
    ],
    "strongest": "best performing channel for ${sector.en} in ${city.en}",
    "weakest": "channel with lowest ROI for this sector",
    "recommended_new_channels": ["new channel 1 with rationale", "new channel 2"]
  },
  "s13_kpis": {
    "target_cpl": "specific EGP range for ${sector.en} in ${city.en}",
    "target_roas": "realistic ROAS for ${sector.en}",
    "target_conv_rate": "specific % benchmark",
    "target_monthly_leads": "specific leads range based on budget",
    "target_ig_engagement": "specific % for ${sector.en}",
    "target_monthly_reach": "specific reach target"
  },
  "marketing_mix_7ps": {
    "product": "product/service quality assessment and improvement recommendations for ${sector.en}",
    "price": "pricing strategy assessment vs competitors in ${city.en}",
    "place": "distribution and accessibility recommendations",
    "promotion": "promotion channel recommendations with priority order",
    "people": "team and customer service assessment",
    "process": "service delivery process assessment",
    "physical_evidence": "brand touchpoints and trust signals assessment"
  },
  "pain_points": [
    {"level": "high", "title": "specific pain point for ${sector.en}", "detail": "2 sentences with impact and fix"},
    {"level": "high", "title": "second pain point", "detail": "2 sentences"},
    {"level": "med", "title": "third pain point", "detail": "2 sentences"},
    {"level": "low", "title": "fourth pain point", "detail": "1-2 sentences"}
  ],
  "channels_recommended": [
    {"name": "Meta Ads", "priority": "Primary", "score": 90, "monthly_budget": "specific EGP recommendation", "reason": "why Meta is primary for ${sector.en}"},
    {"name": "Google Ads", "priority": "Primary", "score": 82, "monthly_budget": "specific EGP recommendation", "reason": "intent targeting for ${sector.en} keywords"},
    {"name": "TikTok", "priority": "Secondary", "score": 68, "monthly_budget": "specific EGP recommendation", "reason": "audience fit for ${sector.en}"}
  ],
  "projections": [
    {"month": "M1", "leads": 30, "cpl": 0, "roas": 1.5},
    {"month": "M2", "leads": 70, "cpl": 0, "roas": 2.8},
    {"month": "M3", "leads": 120, "cpl": 0, "roas": 4.2},
    {"month": "M4", "leads": 160, "cpl": 0, "roas": 5.5}
  ],
  "budget_breakdown": [
    {"channel": "Meta Ads", "pct": 40, "amount": "specific EGP"},
    {"channel": "Google Ads", "pct": 30, "amount": "specific EGP"},
    {"channel": "TikTok", "pct": 20, "amount": "specific EGP"},
    {"channel": "Creative & Management", "pct": 10, "amount": "specific EGP"}
  ],
  "strategy": {
    "phase1": {"title": "Phase 1: Foundation (Week 1-2)", "items": ["specific setup action 1", "specific setup action 2", "specific setup action 3"]},
    "phase2": {"title": "Phase 2: Launch (Week 3-4)", "items": ["specific launch action 1", "specific launch action 2", "specific A/B test"]},
    "phase3": {"title": "Phase 3: Scale (Month 2+)", "items": ["specific scaling action", "specific retention action", "specific new channel test"]}
  },
  "quick_wins": [
    {"action": "specific quick win 1 for ${sector.en}", "timeline": "7 days", "money_impact": "EGP/% estimate", "expected_result": "measurable outcome"},
    {"action": "quick win 2", "timeline": "5 days", "money_impact": "estimate", "expected_result": "outcome"},
    {"action": "quick win 3", "timeline": "7 days", "money_impact": "estimate", "expected_result": "outcome"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasData ? 80 : 62}, "label": "${hasData ? 'High' : 'Medium'}", "reason": "${hasData ? 'Real client data used for analysis' : 'Sector benchmarks applied — add data for higher accuracy'}"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["foundation action 1", "foundation action 2", "foundation action 3"],
    "month2": ["growth action 1", "growth action 2", "growth action 3"],
    "month3": ["scale action 1", "scale action 2", "scale action 3"]
  },
  "audit_checklist": [
    {"item": "هل Meta Pixel مثبّت وتعمل conversion events؟", "status": false},
    {"item": "هل Google Analytics 4 مُفعَّل ومرتبط بالإعلانات؟", "status": false},
    {"item": "هل عندك CRM لتتبع العملاء المحتملين؟", "status": false},
    {"item": "هل تنشر محتوى منتظم 3+ مرات/أسبوع؟", "status": false},
    {"item": "هل تتابع CPL وتقارنه بالـ benchmark الشهري؟", "status": false},
    {"item": "هل لديك retargeting campaigns نشطة؟", "status": false},
    {"item": "هل تجمع بيانات Email/WhatsApp من العملاء المحتملين؟", "status": false},
    {"item": "هل تقيس LTV:CAC ratio ربع سنوي؟", "status": false}
  ],
  "data_quality_note": "Analysis based on ${hasData ? 'real client data + ' : ''}Egypt ${sector.en} market benchmarks 2025",
  "proposal": [
    {"title": "Starter Package — ${branch.name}", "desc": "4 deliverables: Meta campaigns, content, reporting, optimization", "price": "EGP 6,000–12,000/month", "best_for": "small ${sector.en} budget"},
    {"title": "Growth Package — ${branch.name}", "desc": "6 deliverables: full funnel, video, Google, monthly strategy", "price": "EGP 15,000–25,000/month", "best_for": "scaling ${sector.en} business"},
    {"title": "Enterprise Package — ${branch.name}", "desc": "8 deliverables: 360 service, advanced analytics, CRO, creative studio", "price": "EGP 30,000–50,000/month", "best_for": "${sector.en} market leader"}
  ],
  "why_us": [
    "Eunoia ${branch.name}: 7+ years in ${sector.en} sector with documented case studies in ${city.en}",
    "Bilingual Arabic/English campaigns — authentic Egyptian consumer tone",
    "Integrated team: no handoffs, one point of contact from strategy to execution",
    "Transparent reporting: real-time dashboard, not monthly PDF — see results daily"
  ]
}`
}
