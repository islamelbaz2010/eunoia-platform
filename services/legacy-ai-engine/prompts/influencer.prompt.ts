import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasSocial = Boolean(ctx.social?.igFollowers || ctx.social?.fbFollowers)

  return `${base}
${dataBlock}

TASK: Influencer Strategy Report for ${companyName} (${sector.en} in ${city.en}).
Build a complete influencer marketing strategy: tier selection, budget allocation, campaign types, measurement.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Influencer Strategy Report",
  "confidence": "medium",
  "executive_summary": "3 sentences: influencer opportunity for ${sector.en} in ${city.en}, recommended tier and budget, and expected reach/ROI",
  "marketing_score": 68,
  "score_dimensions": {"digital_presence": 65, "content_quality": 65, "paid_performance": 55, "brand_strength": 62, "competitive_position": 58},
  "quick_wins": [
    {"action": "Identify 10 micro-influencers (10K-100K) in ${sector.en} niche in ${city.en} on Instagram and TikTok", "timeline": "This week", "money_impact": "Micro-influencers deliver 60% higher engagement than macro at 5-10x lower cost", "expected_result": "Qualified influencer shortlist"},
    {"action": "Reach out to 3 nano-influencers (1K-10K) for product gifting — zero cash cost", "timeline": "7 days", "money_impact": "Nano-influencer UGC = authentic content you can repurpose in ads at zero cost", "expected_result": "Authentic UGC content"},
    {"action": "Search TikTok and Instagram for top ${sector.en} creators in ${city.en}", "timeline": "2 hours", "money_impact": "Free competitor intelligence on which influencer formats work in your sector", "expected_result": "Proven content formats to adapt"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": 65, "label": "Medium", "reason": "Influencer strategy accuracy improves with social data and historical campaign data"},
  "sector_rank": "Influencer opportunity",
  "plan_90_days": {
    "month1": ["Identify and vet 20 target influencers", "Gifting campaign with 5 nano-influencers", "Set up UTM tracking for influencer links"],
    "month2": ["Paid campaign with 2-3 micro-influencers", "Analyze performance data", "Identify top performer for ongoing partnership"],
    "month3": ["Scale with proven influencer(s)", "Launch ambassador program", "Develop long-term influencer relationships"]
  },
  "audit_checklist": [
    {"item": "هل تتبع performance كل influencer campaign بـ UTM links؟", "status": false},
    {"item": "هل لديك influencer brief واضح مع objectives وmessaging؟", "status": false},
    {"item": "هل تعمل مع influencers بناءً على engagement rate مش followers فقط؟", "status": false},
    {"item": "هل تستخدم micro-influencers (10K-100K) في استراتيجيتك؟", "status": false},
    {"item": "هل لديك خطة محتوى محددة مع كل influencer؟", "status": false},
    {"item": "هل تعيد استخدام influencer content في الـ paid ads؟", "status": false},
    {"item": "هل تقيس cost-per-engagement وcost-per-conversion؟", "status": false},
    {"item": "هل لديك عقد أو اتفاقية واضحة مع كل influencer؟", "status": false}
  ],
  "influencer_tiers": [
    {"tier": "Nano (1K-10K followers)", "cost_egypt": "Free (gifting) to EGP 500-2,000/post", "engagement_rate": "8-15%", "best_for": "Product seeding, authentic UGC, niche audiences", "recommended_count": "5-10 per campaign", "roi_potential": "High — low cost, authentic content"},
    {"tier": "Micro (10K-100K)", "cost_egypt": "EGP 1,000-8,000/post", "engagement_rate": "4-8%", "best_for": "Targeted reach, strong community, sector expertise", "recommended_count": "2-5 per campaign", "roi_potential": "Highest — best engagement:cost ratio"},
    {"tier": "Mid-tier (100K-500K)", "cost_egypt": "EGP 5,000-25,000/post", "engagement_rate": "2-4%", "best_for": "Mass awareness, brand credibility", "recommended_count": "1-2 for major campaigns", "roi_potential": "Medium — good reach, declining engagement"},
    {"tier": "Macro (500K+)", "cost_egypt": "EGP 20,000-100,000+/post", "engagement_rate": "1-2%", "best_for": "Brand launch, major product release", "recommended_count": "Rare — only for major moments", "roi_potential": "Low-Medium — awareness only, rarely conversion"}
  ],
  "recommended_strategy": {
    "primary_tier": "Micro-influencers (10K-100K) — best ROI for budget in ${sector.en}",
    "monthly_budget": "EGP specific recommendation based on business size",
    "mix": "60% micro + 30% nano (gifting) + 10% mid-tier (quarterly big push)",
    "campaign_types": [
      "Product review/demo — most effective for ${sector.en}",
      "Day-in-life featuring ${companyName}",
      "Before/after or transformation (if applicable)",
      "Tutorial or how-to content",
      "Event/launch coverage"
    ]
  },
  "content_strategy": {
    "briefing_essentials": [
      "Key message (1 sentence)",
      "3 talking points",
      "Mandatory brand mention format",
      "Hashtags to include",
      "Call-to-action (link in bio / DM / WhatsApp)"
    ],
    "content_freedom": "Give influencer creative freedom — over-scripted content feels fake and hurts engagement",
    "repurposing": "Every influencer post should be repurposed as paid ad (whitelisting/dark posting)"
  },
  "measurement_framework": {
    "awareness_kpis": ["Reach", "Impressions", "Story views"],
    "engagement_kpis": ["Engagement rate (target: >3%)", "Comments quality", "Saves"],
    "conversion_kpis": ["Link clicks (UTM tracked)", "DM inquiries", "Sales with promo code"],
    "success_benchmark": "Cost-per-engagement < EGP 1-3 for micro | Cost-per-click < EGP 5-10"
  },
  "sector_influencers": {
    "top_niches": ["niche 1 in ${city.en} — type of creator for ${sector.en}", "niche 2", "niche 3"],
    "platforms_by_priority": ["Instagram (primary for most ${sector.en})", "TikTok (growing rapidly — especially 18-35)", "YouTube (long-form credibility)"],
    "avoid": ["Influencers with fake followers (check with HypeAuditor free)", "No clear niche alignment with ${sector.en}", "Inconsistent posting (< 2x/week)"]
  },
  "pain_points": [
    {"level": "high", "title": "Working with wrong influencer tier", "detail": "Paying macro-influencer rates for small budget is wasteful — micro delivers 3-5x better ROI for same spend"},
    {"level": "med", "title": "No performance tracking", "detail": "Without UTM links and promo codes, you cannot measure influencer ROI — it becomes pure brand spend"}
  ],
  "data_quality_note": "Influencer strategy based on ${sector.en} sector patterns in Egypt 2025",
  "proposal": [
    {"title": "Influencer Strategy & Management — ${branch.name}", "desc": "Influencer identification، vetting، outreach، briefing، campaign management، performance tracking — 20 influencers/month", "price": "EGP 5,000-10,000/month"},
    {"title": "Full Influencer Growth Program — ${branch.name}", "desc": "All above + content repurposing for paid ads، ambassador program setup، quarterly mega-campaign coordination", "price": "EGP 10,000-18,000/month"}
  ],
  "why_us": [
    "Eunoia has a database of 500+ vetted Egyptian influencers by sector and engagement rate",
    "We handle everything: identification, negotiation, briefing, tracking — not just introductions",
    "Influencer + paid ads combo: we repurpose influencer content as dark ads for 2-3x better ROAS"
  ]
}`
}
