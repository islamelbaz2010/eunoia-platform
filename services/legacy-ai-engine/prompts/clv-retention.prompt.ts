import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, sales } = ctx
  const bench = sector.benchmark
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasSales = Boolean(sales?.revenue || sales?.aov || sales?.convRate)

  const salesContext = hasSales
    ? `Real data: Revenue ${sales?.revenue ?? 'N/A'}, Conversion rate ${sales?.convRate ?? 'N/A'}%, AOV ${sales?.aov ?? 'N/A'} EGP, CAC ${sales?.cac ?? 'N/A'} EGP, Returning customers ${sales?.returning ?? 'N/A'}%.`
    : `Use sector benchmarks for ${sector.en} in ${city.en}.`

  return `${base}\n${dataBlock}

CLV & RETENTION ANALYSIS for ${companyName} (${sector.en} sector).
BENCHMARKS: LTV ${bench.ltv_benchmark}, CAC ${bench.cac_benchmark}, target LTV:CAC = 3:1 minimum.
CALCULATE: Estimated LTV = AOV x (1/churn_rate) x avg_purchase_frequency. Flag if LTV:CAC < 2:1.
CLV & RETENTION ANALYSIS: ${salesContext}
Calculate: (1) Current estimated CLV with formula (AOV x Frequency x Lifespan), (2) Churn rate estimate and root causes specific to ${sector.en}, (3) Top 3 retention tactics proven in ${sector.en} in Egypt, (4) Upsell/cross-sell opportunities specific to their service offering, (5) Loyalty program design recommendation with ROI projection, (6) WhatsApp/CRM automation sequences for ${sector.en} customer journey, (7) Month-by-month plan to increase returning customer rate from current to target.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "CLV & Retention Analysis",
  "confidence": "${hasSales ? 'high' : 'medium'}",
  "executive_summary": "3 sentences on customer lifetime value and retention opportunity for ${companyName}",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "clv_analysis": {
    "aov_actual": "${sales?.aov ?? 'not provided'}",
    "aov_benchmark": "${bench.avg_ticket}",
    "returning_rate_actual": "${sales?.returning ?? 'not provided'}%",
    "returning_rate_benchmark": "sector average for ${sector.en} in ${city.en}",
    "estimated_clv": "EGP X (calculate: AOV x purchase_frequency x avg_lifespan_months)",
    "clv_benchmark": "${bench.ltv_benchmark}",
    "clv_gap": "X% above/below benchmark — explanation",
    "cac_actual": "${sales?.cac ?? 'not provided'}",
    "cac_benchmark": "${bench.cac_benchmark}",
    "ltv_cac_ratio": "X:1 (target 3:1 minimum, 5:1 excellent)",
    "clv_grade": "A/B/C/D/F with rationale",
    "churn_rate_estimate": "X% monthly/annually for ${sector.en}",
    "churn_root_causes": ["specific reason 1 why ${sector.en} clients in ${city.en} churn", "reason 2", "reason 3"]
  },
  "retention_tactics": [
    {"tactic": "specific retention tactic proven in ${sector.en}", "implementation": "how to implement", "expected_impact": "X% improvement in retention", "timeline": "implementation time", "cost": "EGP X/month"},
    {"tactic": "second tactic", "implementation": "how to implement", "expected_impact": "X%", "timeline": "timeline", "cost": "EGP X"},
    {"tactic": "third tactic", "implementation": "how to implement", "expected_impact": "X%", "timeline": "timeline", "cost": "EGP X"}
  ],
  "upsell_opportunities": [
    {"service": "specific upsell for ${sector.en}", "target_segment": "who to upsell", "timing": "when in customer journey", "revenue_per_customer": "EGP X", "conversion_rate_estimate": "X%"},
    {"service": "cross-sell opportunity", "target_segment": "who", "timing": "when", "revenue_per_customer": "EGP X", "conversion_rate_estimate": "X%"}
  ],
  "loyalty_program": {
    "recommended_model": "Points/Cashback/Tier/Subscription — specific recommendation for ${sector.en}",
    "structure": "how the program works",
    "incentives": ["incentive 1 specific to ${sector.en}", "incentive 2", "incentive 3"],
    "roi_projection": "EGP X additional revenue per customer per year",
    "implementation_cost": "EGP X to build and run monthly",
    "payback_period": "X months to break even"
  },
  "crm_automation": {
    "recommended_tool": "WhatsApp Business API / CRM tool recommendation for ${sector.en} scale",
    "sequences": [
      {"name": "Welcome Sequence", "trigger": "first purchase/visit", "messages": ["Day 1: specific message", "Day 3: specific message", "Day 7: specific message"], "goal": "activation"},
      {"name": "Re-engagement", "trigger": "${bench.decision_cycle} since last interaction", "messages": ["specific re-engagement message for ${sector.en}"], "goal": "churn prevention"},
      {"name": "Upsell Sequence", "trigger": "after X visits/purchases", "messages": ["specific upsell timing and message"], "goal": "revenue expansion"}
    ]
  },
  "revenue_impact": {
    "current_monthly_revenue": "${sales?.revenue ?? 'not provided'}",
    "revenue_from_retention_improvement": "EGP X if returning rate increases from ${sales?.returning ?? 'baseline'}% to target%",
    "revenue_from_upsell": "EGP X if X% of customers take upsell",
    "total_improvement_potential": "EGP X additional monthly revenue achievable in 6 months"
  },
  "quick_wins": [
    {"action": "Implement post-service follow-up WhatsApp message within 24h", "timeline": "3 days", "money_impact": "5-10% return visit increase", "expected_result": "Higher retention, word-of-mouth referrals"},
    {"action": "Create referral program: give client X EGP off for each referred client", "timeline": "7 days", "money_impact": "20-30% new clients from existing base", "expected_result": "Lower CAC, higher LTV"},
    {"action": "Set up automated birthday/anniversary offers for ${sector.en} clients", "timeline": "7 days", "money_impact": "EGP X additional revenue per occasion", "expected_result": "Higher emotional connection, reduced churn"}
  ],
  "risk_alerts": [
    {"type": "ltv_cac_risk", "message": "LTV:CAC ratio requires monitoring — ${bench.cac_benchmark} CAC vs ${bench.ltv_benchmark} LTV benchmark", "severity": "medium", "fix": "Prioritize retention over acquisition until ratio exceeds 3:1"}
  ],
  "confidence_score": {"pct": ${hasSales ? 82 : 58}, "label": "${hasSales ? 'High' : 'Medium'}", "reason": "${hasSales ? 'Real sales data provided — CLV calculation is based on actual numbers' : 'Sector benchmark model — actual sales data would enable precise CLV calculation'}"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["Set up CRM/WhatsApp automation for post-service follow-up", "Launch referral program with clear incentive", "Audit which clients haven't returned and send re-engagement campaign"],
    "month2": ["Implement loyalty program or subscription model", "Create upsell pathway for top 20% of clients by revenue", "A/B test retention messaging — emotional vs rational"],
    "month3": ["Analyze CLV changes — measure retention improvement from Month 1 actions", "Scale what works, cut what doesn't", "Target top clients for annual contract / premium tier enrollment"]
  },
  "audit_checklist": [
    {"item": "CLV calculated and tracked monthly", "status": false},
    {"item": "Churn rate defined and measured", "status": false},
    {"item": "Post-service follow-up automated", "status": false},
    {"item": "Referral program active", "status": false},
    {"item": "Upsell pathway defined and scripted", "status": false},
    {"item": "Loyalty program or subscription option exists", "status": false},
    {"item": "Re-engagement campaign for dormant clients running", "status": false},
    {"item": "LTV:CAC ratio tracked monthly", "status": false}
  ],
  "data_quality_note": "${hasSales ? 'High confidence — real sales data used for CLV calculations' : 'Medium confidence — actual revenue and retention data needed for precise CLV model'}",
  "proposal": [
    {"title": "Retention Foundation Package", "desc": "CRM setup, WhatsApp automation sequences, referral program design, monthly retention reporting", "price": "EGP 6,000-12,000/month"},
    {"title": "CLV Maximization Program", "desc": "Full retention stack: loyalty program, upsell campaigns, personalized sequences, quarterly CLV review", "price": "EGP 10,000-20,000/month"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: retention-focused campaigns for ${sector.en} with documented LTV improvements",
    "WhatsApp automation expertise: we've built sequences for 40+ ${sector.en} businesses — we know what converts",
    "EGP ROI focus: every retention tactic measured against revenue impact, not vanity metrics",
    "Integrated team: CRM setup + content + campaigns — no fragmented execution"
  ]
}`
}
