import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasAds = Boolean(ctx.ads?.budget || ctx.ads?.cpl)
  const hasSales = Boolean(ctx.sales?.revenue)
  const hasReal = hasAds || hasSales

  return `${base}
${dataBlock}

TASK: B2B Marketing Strategy for ${companyName} (${sector.en} in ${city.en}).
Build a complete B2B go-to-market strategy: ICP definition, lead generation, sales enablement, account-based marketing.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "B2B Marketing Strategy",
  "confidence": "${hasReal ? 'high' : 'medium'}",
  "executive_summary": "3 sentences: B2B opportunity assessment, recommended go-to-market approach, and expected pipeline impact for ${companyName}",
  "marketing_score": 68,
  "score_dimensions": {"digital_presence": 65, "content_quality": 60, "paid_performance": ${hasAds ? 70 : 48}, "brand_strength": 65, "competitive_position": 60},
  "quick_wins": [
    {"action": "Define ICP (Ideal Client Profile) — write 1 paragraph describing your perfect B2B client", "timeline": "This week", "money_impact": "Targeting clarity reduces wasted outreach by 40-60%", "expected_result": "Focused pipeline"},
    {"action": "Build a list of 50 target companies in ${city.en} that match your ICP", "timeline": "7 days", "money_impact": "Direct outreach to warm prospects — no ad spend needed", "expected_result": "Qualified prospect list"},
    {"action": "Create a 1-page digital credentials deck (case studies + results)", "timeline": "7-14 days", "money_impact": "Increases proposal acceptance rate by 30-50%", "expected_result": "Higher B2B conversion"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasReal ? 72 : 55}, "label": "${hasReal ? 'High' : 'Medium'}", "reason": "B2B strategy quality depends on ICP clarity and pipeline data — ${hasReal ? 'real data available' : 'using sector benchmarks'}"},
  "sector_rank": "B2B opportunity stage",
  "plan_90_days": {
    "month1": ["Define ICP and TAM", "Build target company list (100 accounts)", "Create credentials and case study content"],
    "month2": ["Launch LinkedIn/email outreach", "Start thought leadership content", "First 5 discovery calls"],
    "month3": ["Refine ICP based on feedback", "Scale outreach to 200 accounts/month", "First signed contracts"]
  },
  "audit_checklist": [
    {"item": "هل عندك ICP (Ideal Client Profile) مكتوب بوضوح؟", "status": false},
    {"item": "هل تعرف الـ decision maker في كل شركة مستهدفة؟", "status": false},
    {"item": "هل لديك credentials/case studies تثبت نتائجك؟", "status": false},
    {"item": "هل عندك LinkedIn company page نشط؟", "status": false},
    {"item": "هل لديك CRM لتتبع الـ B2B pipeline؟", "status": false},
    {"item": "هل sales cycle محدد ومتتبع؟", "status": false},
    {"item": "هل لديك pricing للـ B2B مختلف عن الـ B2C؟", "status": false},
    {"item": "هل تستهدف industry-specific events وmeetups؟", "status": false}
  ],
  "icp_definition": {
    "company_size": "SME / Mid-market / Enterprise — specific for ${sector.en}",
    "industry_verticals": ["primary vertical 1 in ${city.en}", "vertical 2", "vertical 3"],
    "decision_makers": ["primary decision maker title", "secondary influencer", "champion title"],
    "pain_points": ["B2B pain point 1 that ${companyName} solves", "pain point 2", "pain point 3"],
    "annual_contract_value": "realistic ACV range for ${sector.en} B2B in ${city.en}",
    "sales_cycle": "estimated B2B sales cycle length"
  },
  "go_to_market": {
    "primary_channel": "LinkedIn + cold email / Events / Referrals — pick best for ${sector.en}",
    "content_strategy": ["thought leadership type 1 for ${sector.en}", "case studies", "educational content"],
    "outreach_sequence": [
      "Day 1: LinkedIn connection request with personalized note",
      "Day 3: Value-add message (insight or resource)",
      "Day 7: Direct ask for 20-minute discovery call",
      "Day 14: Follow-up with case study",
      "Day 21: Final attempt with specific ROI example"
    ],
    "monthly_outreach_target": "realistic number of new contacts/month for ${companyName}"
  },
  "channel_mix": [
    {"channel": "LinkedIn Outreach", "priority": "Primary", "rationale": "Best B2B channel in Egypt/GCC for ${sector.en}", "monthly_budget": "EGP 0-2,000 (mostly time)"},
    {"channel": "Referral Program", "priority": "Secondary", "rationale": "Highest quality B2B leads — warm introduction", "monthly_budget": "EGP 0 (revenue share)"},
    {"channel": "Industry Events", "priority": "Tertiary", "rationale": "Face-to-face relationship building for ${sector.en}", "monthly_budget": "EGP 1,000-5,000/event"},
    {"channel": "Content Marketing", "priority": "Supporting", "rationale": "Build credibility and inbound", "monthly_budget": "EGP 2,000-5,000"}
  ],
  "sales_enablement": {
    "proposal_template": "structured proposal with ROI projection",
    "case_studies_needed": 3,
    "credentials_deck": "1-2 page visual showcase",
    "objection_handling": ["common B2B objection 1 for ${sector.en}", "objection 2", "objection 3"]
  },
  "kpis": {
    "monthly_outreach": "50-100 new contacts",
    "discovery_calls": "5-10 calls/month",
    "proposal_conversion": "20-30%",
    "monthly_new_contracts": "2-5",
    "target_monthly_revenue": "calculate from ACV x conversion"
  },
  "pain_points": [
    {"level": "high", "title": "No defined B2B ICP or sales process", "detail": "Without ICP, B2B outreach is shotgun approach — wastes time and damages brand"},
    {"level": "med", "title": "Missing B2B credentials and case studies", "detail": "B2B buyers need proof — without case studies, 70% of prospects will not proceed"}
  ],
  "data_quality_note": "B2B strategy based on ${hasReal ? 'provided data and' : ''} ${sector.en} sector patterns in Egypt 2025",
  "proposal": [
    {"title": "B2B Marketing Strategy & Enablement — ${branch.name}", "desc": "ICP definition، TAM analysis، outreach sequences، credentials creation، LinkedIn optimization، 3-month outreach management", "price": "EGP 8,000-15,000/month"},
    {"title": "Full B2B Growth Program — ${branch.name}", "desc": "All above + ABM campaigns، event marketing، content program، CRM setup، weekly sales coaching", "price": "EGP 15,000-25,000/month"}
  ],
  "why_us": [
    "Eunoia has built B2B pipelines for 20+ Egyptian companies — we know B2B buying behavior in Egypt and GCC",
    "End-to-end: strategy + content + outreach + CRM — not just advice",
    "Data-driven: we track every touchpoint in the B2B funnel and optimize monthly"
  ]
}`
}
