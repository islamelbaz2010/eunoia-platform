import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const bench = sector.benchmark
  const hasAds = Boolean(ctx.ads?.budget || ctx.ads?.cpl)
  const hasSales = Boolean(ctx.sales?.revenue)
  const hasReal = hasAds || hasSales

  return `${base}
${dataBlock}

TASK: Annual Marketing Budget Planner for ${companyName} (${sector.en} in ${city.en}).
12-month budget allocation with seasonal adjustments, channel splits, and expected ROI.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Annual Marketing Budget Planner",
  "confidence": "${hasReal ? 'high' : 'medium'}",
  "executive_summary": "3 sentences on recommended annual budget, allocation strategy, and expected annual ROI for ${companyName} in ${sector.en}",
  "marketing_score": 70,
  "score_dimensions": {"digital_presence": 68, "content_quality": 65, "paid_performance": ${hasAds ? 75 : 52}, "brand_strength": 68, "competitive_position": 62},
  "quick_wins": [
    {"action": "Lock Q1 budget NOW — pre-allocate by channel before Ramadan pricing rises", "timeline": "This week", "money_impact": "Early booking saves 20-30% vs last-minute", "expected_result": "Lower CPL in peak season"},
    {"action": "Allocate Ramadan budget 6 weeks ahead — CPL rises 40% if you start late", "timeline": "6 weeks before Ramadan", "money_impact": "Save 40% on CPL vs reactive approach", "expected_result": "More leads at lower cost"},
    {"action": "Set monthly dashboard to track budget pacing vs results", "timeline": "This week", "money_impact": "Prevent overspend + catch underperformers early", "expected_result": "10-15% better budget efficiency"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasReal ? 75 : 58}, "label": "${hasReal ? 'High' : 'Medium'}", "reason": "${hasReal ? 'Current spend data used as baseline projection' : 'Sector benchmarks applied — add actual spend data for better precision'}"},
  "sector_rank": "Budget planning opportunity",
  "plan_90_days": {
    "month1": ["Lock annual budget allocation by channel", "Set up tracking dashboard", "Brief team on Q1 plan"],
    "month2": ["Execute Q1 campaigns", "Mid-quarter review and reallocation", "Prepare Q2 plan with learnings"],
    "month3": ["Q1 performance analysis", "Reallocate budget to top performers", "Finalize Q2-Q3 roadmap"]
  },
  "audit_checklist": [
    {"item": "هل لديك ميزانية تسويق سنوية محددة مسبقاً؟", "status": false},
    {"item": "هل مقسمة على channels بنسب واضحة؟", "status": false},
    {"item": "هل تزيد الميزانية في مواسم الذروة؟", "status": false},
    {"item": "هل تتبع ROI لكل channel منفصلاً؟", "status": false},
    {"item": "هل عندك budget content production منفصل عن الـ Ads؟", "status": false},
    {"item": "هل عندك contingency budget (10%) للفرص المفاجئة؟", "status": false},
    {"item": "هل تراجع وتعدل شهرياً؟", "status": false},
    {"item": "هل ميزانية التسويق 10-20% من الإيراد المستهدف؟", "status": false}
  ],
  "annual_summary": {
    "total_recommended_budget": "Specific EGP amount based on business size and sector benchmarks for ${sector.en} in ${city.en}",
    "percentage_of_revenue_target": "10-20% of target revenue — specific % recommendation for ${sector.en} growth stage",
    "primary_allocation": "Meta 45-50% | Google 25-30% | Content 12% | TikTok 8% | Contingency 5%",
    "expected_annual_leads": "Calculate: annual budget ÷ CPL benchmark ${bench.cpl_meta}",
    "expected_annual_roas": "Realistic projection for ${sector.en} in ${city.en}"
  },
  "monthly_plan": [
    {"month": "يناير / January", "theme": "New Year Push", "budget_multiplier": 1.3, "peak_reason": "New year resolutions relevant to ${sector.en}", "recommended_channels": ["Meta Ads", "Google"], "campaign_focus": "Acquisition", "seasonal_note": "${bench.peak_seasons}"},
    {"month": "فبراير / February", "theme": "Steady Growth", "budget_multiplier": 1.0, "peak_reason": "Standard month", "recommended_channels": ["Meta Ads"], "campaign_focus": "Acquisition + Retention"},
    {"month": "مارس / March", "theme": "Pre-Ramadan Acquisition Rush", "budget_multiplier": 1.25, "peak_reason": "Capture leads before Ramadan CPL spike", "recommended_channels": ["Meta Ads", "Google"], "campaign_focus": "Aggressive acquisition — fill pipeline"},
    {"month": "أبريل / April", "theme": "Ramadan Season", "budget_multiplier": 1.6, "peak_reason": "Highest consumer intent — ${bench.peak_seasons}", "recommended_channels": ["Meta", "TikTok", "WhatsApp"], "campaign_focus": "Conversion + Ramadan-specific offers"},
    {"month": "مايو / May", "theme": "Eid Al-Fitr Peak", "budget_multiplier": 1.5, "peak_reason": "Eid purchasing spike", "recommended_channels": ["Meta", "Google"], "campaign_focus": "Promotions + Gifts + Special offers"},
    {"month": "يونيو / June", "theme": "Summer Start", "budget_multiplier": 1.1, "peak_reason": "Summer relevance for ${sector.en}", "recommended_channels": ["Instagram", "TikTok"], "campaign_focus": "Seasonal campaigns"},
    {"month": "يوليو / July", "theme": "Summer Peak", "budget_multiplier": 1.0, "peak_reason": "Mid-summer retention", "recommended_channels": ["Social", "WhatsApp"], "campaign_focus": "Retention + Summer packages"},
    {"month": "أغسطس / August", "theme": "Back-to-School Prep", "budget_multiplier": 1.15, "peak_reason": "Back-to-school relevant for ${sector.en}", "recommended_channels": ["Meta", "Google"], "campaign_focus": "Acquisition"},
    {"month": "سبتمبر / September", "theme": "Q4 Launch + Eid Al-Adha", "budget_multiplier": 1.3, "peak_reason": "Strong fall buying intent", "recommended_channels": ["Meta", "Google", "TikTok"], "campaign_focus": "Full funnel"},
    {"month": "أكتوبر / October", "theme": "Peak Season", "budget_multiplier": 1.4, "peak_reason": "${bench.peak_seasons} — historically highest month", "recommended_channels": ["All channels"], "campaign_focus": "Maximum acquisition push"},
    {"month": "نوفمبر / November", "theme": "Black Friday + Pre-Xmas", "budget_multiplier": 1.3, "peak_reason": "High consumer purchase intent", "recommended_channels": ["Meta", "Google"], "campaign_focus": "Conversion + offers"},
    {"month": "ديسمبر / December", "theme": "Year-end + NYE", "budget_multiplier": 1.2, "peak_reason": "Year-end momentum", "recommended_channels": ["Social", "Remarketing"], "campaign_focus": "Retention + referral activation"}
  ],
  "channel_annual_allocation": [
    {"channel": "Meta Ads (Facebook + Instagram)", "annual_pct": 48, "rationale": "Primary acquisition for ${sector.en} in Egypt — widest reach"},
    {"channel": "Google Search + Display", "annual_pct": 25, "rationale": "Intent-based leads — highest quality for ${sector.en}"},
    {"channel": "TikTok Ads", "annual_pct": 10, "rationale": "Growing 18-34 demographic — lower CPM, rising ROI"},
    {"channel": "Content Production", "annual_pct": 10, "rationale": "Feeds all channels + builds organic reach"},
    {"channel": "Influencer/Partnerships", "annual_pct": 5, "rationale": "Trust acceleration for ${sector.en}"},
    {"channel": "Contingency + Testing", "annual_pct": 2, "rationale": "Seasonal opportunities and new channel testing"}
  ],
  "pain_points": [
    {"level": "high", "title": "Reactive monthly budget planning", "detail": "Month-by-month budgeting means missing Ramadan and peak windows at optimal CPL — annual plan saves 20-30% on average"},
    {"level": "med", "title": "No channel-level attribution", "detail": "Without tracking by channel, you can't know which EGP generates the best leads — budget stays inefficient"}
  ],
  "data_quality_note": "Annual budget plan based on ${hasReal ? 'provided spend data and' : ''} ${sector.en} sector benchmarks in Egypt 2025",
  "proposal": [
    {"title": "Budget Planning & Management — ${branch.name}", "desc": "Annual budget plan، monthly optimization، channel allocation dashboard، quarterly reviews and reforecast", "price": "EGP 4,000–8,000/month"},
    {"title": "Full Annual Marketing Management — ${branch.name}", "desc": "All above + full campaign execution، creative production، weekly reporting، strategy sessions، seasonal planning", "price": "EGP 12,000–25,000/month"}
  ],
  "why_us": [
    "Eunoia has managed EGP 2M+ monthly budgets across Egypt and UAE — we know seasonal CPL patterns by sector",
    "Data-first: every budget decision backed by real campaign CPL and ROAS benchmarks",
    "Annual planning mindset — not reactive monthly scrambling that wastes budget"
  ]
}`
}
