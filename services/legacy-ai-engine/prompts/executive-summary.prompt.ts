import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'
import { getCityMultiplier } from '../../../core/data/cities.data'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const cityMultiplier = getCityMultiplier(city.key)
  const bench = sector.benchmark

  return `${base}
${dataBlock}

TASK: EXECUTIVE SUMMARY for ${companyName} (${sector.en}, ${city.en}).
Write a C-suite quality briefing. Structure (follow exactly):
1. Market Position vs top 3 real competitors in ${city.en}
2. Biggest Growth Opportunity with specific revenue/leads projection
3. Most Urgent Risk — next 30 days + mitigation
4. Immediate Action + ROI timeline
5. 6-Month Target State: specific numbers for followers/CPL/revenue
6. Budget by channel with expected ROAS using ${city.en} benchmarks (CPL x${cityMultiplier})

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Executive Summary",
  "confidence": "medium",
  "executive_summary": "3 sentences: market position assessment, biggest opportunity with projected revenue impact, most urgent action for ${companyName}",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "market_position": {
    "current_standing": "Where ${companyName} stands now vs top 3 competitors in ${sector.en} ${city.en}",
    "top_competitors": [
      {"name": "REAL competitor 1 in ${city.en}", "position": "market leader/challenger", "advantage_over_client": "what they do better"},
      {"name": "REAL competitor 2", "position": "niche player", "advantage_over_client": "their edge"},
      {"name": "REAL competitor 3", "position": "emerging", "advantage_over_client": "their edge"}
    ],
    "market_share_estimate": "estimated % for ${companyName} in ${sector.en} ${city.en}",
    "competitive_moat": "what ${companyName} has that competitors cannot easily copy"
  },
  "biggest_opportunity": {
    "description": "The single biggest growth opportunity for ${companyName} in ${sector.en} ${city.en} — specific and actionable",
    "revenue_projection": "specific EGP projection if opportunity is captured in 6 months",
    "leads_projection": "specific monthly leads target achievable",
    "timeline": "how long to realize this opportunity",
    "required_investment": "EGP range needed to capture this opportunity"
  },
  "urgent_risks": [
    {"risk": "most urgent risk in next 30 days", "severity": "critical/high", "impact": "specific business impact if not addressed", "mitigation": "specific 7-day action to mitigate"},
    {"risk": "second urgent risk", "severity": "high", "impact": "impact description", "mitigation": "mitigation action"}
  ],
  "immediate_action": {
    "action": "The single most important action ${companyName} should take this week",
    "expected_roi": "specific ROI timeline: X leads in Y days at Z CPL",
    "investment": "EGP cost of this action",
    "risk_of_inaction": "what happens if this action is not taken"
  },
  "6month_targets": {
    "social_followers": "specific target: from X to Y followers",
    "cpl_target": "specific CPL target: from benchmark ${bench.cpl_meta} to X EGP (${city.en} adjusted: x${cityMultiplier})",
    "monthly_leads": "specific monthly lead volume target",
    "revenue_growth": "specific revenue growth % or EGP target",
    "brand_awareness": "specific awareness metric target"
  },
  "budget_by_channel": [
    {"channel": "Meta Ads", "monthly_budget": "specific EGP", "expected_cpl": "${bench.cpl_meta} (${city.en} x${cityMultiplier})", "expected_roas": "sector-specific ROAS", "priority": 1},
    {"channel": "Google Search", "monthly_budget": "specific EGP", "expected_cpl": "${bench.cpl_google}", "expected_roas": "expected ROAS", "priority": 2},
    {"channel": "Content & SEO", "monthly_budget": "specific EGP", "expected_cpl": "lower CAC via organic", "expected_roas": "long-term organic ROI", "priority": 3}
  ],
  "pain_points": [
    {"level": "high", "title": "most critical business pain for ${companyName}", "detail": "2 sentences on impact and solution"},
    {"level": "high", "title": "second critical pain", "detail": "2 sentences"},
    {"level": "med", "title": "third pain — operational or competitive", "detail": "2 sentences"}
  ],
  "quick_wins": [
    {"action": "highest-impact 7-day action for ${companyName}", "timeline": "7 days", "money_impact": "EGP/% estimate", "expected_result": "measurable outcome"},
    {"action": "second quick win", "timeline": "5 days", "money_impact": "estimate", "expected_result": "outcome"},
    {"action": "third quick win", "timeline": "7 days", "money_impact": "estimate", "expected_result": "outcome"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": 68, "label": "Medium", "reason": "Executive summary based on sector benchmarks and market analysis — adding real performance data would increase to 85%+"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["immediate priority action 1", "establish tracking and baseline", "launch first campaign"],
    "month2": ["optimize based on month 1 data", "scale winning channel", "build brand awareness"],
    "month3": ["review 90-day vs targets", "lock next 6-month plan", "expand successful approaches"]
  },
  "audit_checklist": [
    {"item": "هل لديك KPIs واضحة للأشهر الستة القادمة؟", "status": false},
    {"item": "هل عندك dashboard لمتابعة النتائج يومياً؟", "status": false},
    {"item": "هل الميزانية التسويقية محددة ومعتمدة للربع القادم؟", "status": false},
    {"item": "هل تتابع CPL وتقارنه بـ ${bench.cpl_meta} benchmark شهرياً؟", "status": false},
    {"item": "هل لديك خطة للربع القادم مكتوبة ومعتمدة؟", "status": false},
    {"item": "هل تتابع المنافسين في Facebook Ads Library أسبوعياً؟", "status": false},
    {"item": "هل LTV:CAC ratio لديك أعلى من 3:1؟", "status": false},
    {"item": "هل عندك plan B إذا ارتفع CPL بـ 30% في موسم الذروة؟", "status": false}
  ],
  "data_quality_note": "Executive briefing based on sector intelligence and Egypt 2025 market data — real performance data would sharpen projections significantly",
  "proposal": [
    {"title": "Strategy Consulting Session — ${branch.name}", "desc": "3-hour workshop: market position review, 6-month roadmap, budget allocation, KPI setting, competitive response plan", "price": "EGP 8,000–15,000 per session"},
    {"title": "Retained Marketing Partner — ${branch.name}", "desc": "Monthly: execution of agreed strategy, performance tracking, monthly board-ready report, quarterly strategic review", "price": "EGP 15,000–35,000/month"}
  ],
  "why_us": [
    "Eunoia delivers C-suite grade strategy with execution capability — not just a deck",
    "Egypt & GCC specialist: ${sector.en} sector intelligence from 200+ client cases",
    "Transparent ROI tracking: every EGP spent is accountable with measurable outcomes"
  ]
}`
}
