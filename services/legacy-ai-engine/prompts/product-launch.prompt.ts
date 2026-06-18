import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasAds = Boolean(ctx.ads?.budget || ctx.ads?.cpl)

  return `${base}
${dataBlock}

TASK: Product Launch Plan for ${companyName} (${sector.en} in ${city.en}).
Build a complete go-to-market plan for a new product/service launch — from pre-launch to post-launch optimization.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Product Launch Plan",
  "confidence": "medium",
  "executive_summary": "3 sentences: launch strategy recommendation, expected launch timeline, and key success factors for ${companyName} in ${sector.en}",
  "marketing_score": 70,
  "score_dimensions": {"digital_presence": 65, "content_quality": 65, "paid_performance": ${hasAds ? 68 : 50}, "brand_strength": 65, "competitive_position": 62},
  "quick_wins": [
    {"action": "Build a waitlist landing page NOW — even before launch date is confirmed", "timeline": "This week", "money_impact": "Pre-launch waitlist of 500+ people = guaranteed sales day 1", "expected_result": "Warm audience ready at launch"},
    {"action": "Identify 3 micro-influencers in ${sector.en} niche in ${city.en} for early product seeding", "timeline": "7-14 days", "money_impact": "Influencer UGC at launch = 3-5x organic reach vs paid ads alone", "expected_result": "Authentic launch content"},
    {"action": "Create a launch countdown — 30-day social media teaser campaign", "timeline": "30 days before launch", "money_impact": "Builds anticipation — warm audience converts 2-3x better than cold", "expected_result": "Higher day-1 conversion"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": 65, "label": "Medium", "reason": "Launch plan quality improves with specific product details and target segment clarity"},
  "sector_rank": "Pre-launch stage",
  "plan_90_days": {
    "month1": ["Pre-launch: waitlist build، influencer seeding، content creation", "Soft launch to warm audience", "Collect first feedback"],
    "month2": ["Full public launch", "Paid amplification", "PR push and reviews"],
    "month3": ["Optimization based on launch data", "Scale winning channels", "Loyalty and referral activation"]
  },
  "audit_checklist": [
    {"item": "هل المنتج/الخدمة جاهزة تماماً للإطلاق؟", "status": false},
    {"item": "هل حددت الـ target segment بدقة؟", "status": false},
    {"item": "هل عندك landing page أو صفحة بيع جاهزة؟", "status": false},
    {"item": "هل عندك waitlist أو pre-orders قبل الإطلاق؟", "status": false},
    {"item": "هل حضّرت محتوى للإطلاق (photos/videos/posts)?", "status": false},
    {"item": "هل تواصلت مع influencers أو media للتغطية؟", "status": false},
    {"item": "هل عندك خطة لجمع reviews وfeedback بعد الإطلاق؟", "status": false},
    {"item": "هل عندك budget تسويق مخصص للإطلاق (منفصل عن الشهري)?", "status": false}
  ],
  "launch_strategy": {
    "launch_type": "Big Bang (single date) / Rolling (soft then full) / Phased (segment by segment)",
    "recommended_type": "specific recommendation for ${sector.en} in ${city.en}",
    "timeline_weeks": 8,
    "target_segment": "primary launch segment for ${companyName} product",
    "launch_budget_recommendation": "specific EGP range for launch",
    "success_metrics": {
      "week1": ["metric 1", "metric 2"],
      "month1": ["metric 1", "metric 2"],
      "month3": ["metric 1", "metric 2"]
    }
  },
  "pre_launch_plan": {
    "weeks_8_to_4": ["Finalize product", "Waitlist landing page", "Influencer outreach", "Content creation"],
    "weeks_4_to_2": ["Teaser campaign on social", "Influencer seeding", "Email/WhatsApp waitlist warming", "Press kit preparation"],
    "weeks_2_to_launch": ["Countdown content", "Influencer posts go live", "Paid ads warm-up", "Final logistics check"]
  },
  "launch_week_plan": {
    "day_1": ["Launch announcement across all channels", "Influencer posts live", "Paid ads at full budget", "PR outreach"],
    "day_2_to_7": ["Monitor and respond to all comments", "Daily stories updates", "Retargeting engaged audience", "Collect first reviews"]
  },
  "post_launch": {
    "week_2_to_4": ["Amplify positive reviews", "Scale winning ad sets", "Optimize underperforming channels", "Launch referral incentive"],
    "month_2_to_3": ["Loyalty program", "Upsell/cross-sell", "Case study creation", "Plan V2 based on feedback"]
  },
  "channel_strategy": [
    {"channel": "Instagram Reels", "role": "Primary awareness", "budget_pct": "30%", "content": "product reveal, tutorial, testimonial"},
    {"channel": "TikTok", "role": "Viral reach", "budget_pct": "15%", "content": "trending format + product demo"},
    {"channel": "Facebook Ads", "role": "Conversion", "budget_pct": "35%", "content": "direct response with offer"},
    {"channel": "Influencers", "role": "Trust building", "budget_pct": "15%", "content": "authentic review and demo"},
    {"channel": "Email/WhatsApp", "role": "Waitlist conversion", "budget_pct": "5%", "content": "exclusive early access offer"}
  ],
  "pain_points": [
    {"level": "high", "title": "Launching without pre-built audience", "detail": "Launching to zero audience means paying 3-5x more per conversion — build waitlist first"},
    {"level": "med", "title": "No feedback loop in first 30 days", "detail": "Without structured feedback collection, product issues go undetected and damage brand"}
  ],
  "data_quality_note": "Product launch plan based on ${sector.en} sector launch patterns in Egypt 2025",
  "proposal": [
    {"title": "Product Launch Management — ${branch.name}", "desc": "Launch strategy، pre-launch content creation، influencer coordination، paid ads management، launch PR، post-launch optimization (8 weeks)", "price": "EGP 12,000-20,000 one-time"},
    {"title": "Full Launch + Growth Package — ${branch.name}", "desc": "All above + 3 months post-launch management، loyalty setup، referral program، monthly reporting", "price": "EGP 8,000-15,000/month"}
  ],
  "why_us": [
    "Eunoia has managed 10+ product launches in Egypt — we know what drives day-1 sales in Egyptian market",
    "Full execution: strategy + content + ads + influencers + PR in one integrated team",
    "Pre-launch waitlist methodology: we routinely build 500-2,000 person waitlists before launch day"
  ]
}`
}
