import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasAds = Boolean(ctx.ads?.budget || ctx.ads?.cpl)
  const hasSales = Boolean(ctx.sales?.revenue)
  const hasSocial = Boolean(ctx.social?.igFollowers || ctx.social?.fbFollowers)
  const hasReal = hasAds || hasSales || hasSocial

  return `${base}
${dataBlock}

TASK: Customer Journey Map for ${companyName} (${sector.en} in ${city.en}).
Map the FULL journey from awareness to loyal advocate — every touchpoint, emotion, friction point.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Customer Journey Map",
  "confidence": "${hasReal ? 'high' : 'medium'}",
  "executive_summary": "3 specific sentences on journey quality and biggest gap for ${companyName}",
  "marketing_score": 68,
  "score_dimensions": {"digital_presence": 65, "content_quality": 62, "paid_performance": 60, "brand_strength": 65, "competitive_position": 58},
  "quick_wins": [
    {"action": "Fix the biggest friction point in the ${sector.en} purchase journey in ${city.en}", "timeline": "This week", "money_impact": "Reduce drop-off 20-30% at that stage", "expected_result": "Measurable conversion improvement"},
    {"action": "Add social proof specifically at the consideration stage", "timeline": "7 days", "money_impact": "Increase conversion 10-15%", "expected_result": "Higher trust score"},
    {"action": "Implement post-purchase follow-up WhatsApp/email sequence", "timeline": "7 days", "money_impact": "Increase return rate 15-25%", "expected_result": "Higher LTV"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasReal ? 72 : 55}, "label": "${hasReal ? 'High' : 'Medium'}", "reason": "Journey patterns for ${sector.en} in ${city.en} combined with ${hasReal ? 'real client data' : 'sector benchmarks'}"},
  "sector_rank": "Mid-tier — Journey optimization opportunity",
  "plan_90_days": {
    "month1": ["Fix top friction point", "Add social proof content", "Set up post-purchase automation"],
    "month2": ["Build awareness content calendar", "Optimize consideration touchpoints", "Test loyalty trigger"],
    "month3": ["A/B test journey variations", "Measure full funnel conversion", "Build referral program"]
  },
  "audit_checklist": [
    {"item": "هل تعرف من أين يسمع عملاؤك عنك لأول مرة؟", "status": false},
    {"item": "هل لديك محتوى لكل مرحلة من مراحل الـ journey؟", "status": false},
    {"item": "هل تتابع أين يتوقف العملاء عن المتابعة؟", "status": false},
    {"item": "هل يوجد نظام follow-up بعد الشراء؟", "status": false},
    {"item": "هل لديك loyalty أو referral program؟", "status": false},
    {"item": "هل وقت الاستجابة على الاستفسارات أقل من ساعة؟", "status": false},
    {"item": "هل تقيس رضا العميل (NPS/review)?", "status": false},
    {"item": "هل عندك re-engagement strategy للخاملين؟", "status": false}
  ],
  "journey_stages": [
    {"stage": "Awareness", "arabic": "الوعي", "channels": ["Meta Ads", "TikTok", "Google Search", "Word of mouth — specific for ${sector.en}"], "touchpoints": ["Ad first impression", "Search result appearance", "Referral mention", "Social content discovery"], "customer_emotion": "Curious but skeptical — comparing options", "pain_points": ["Too many options in ${sector.en}", "Unable to gauge credibility quickly", "No clear differentiator visible"], "kpi": "CPL, Reach, Brand search volume", "optimization": "Specific improvement for ${companyName} awareness stage"},
    {"stage": "Consideration", "arabic": "التفكير", "channels": ["Website", "Instagram/Facebook page", "WhatsApp inquiry", "Google reviews"], "touchpoints": ["Website visit", "Social scroll", "Review reading", "Competitor comparison", "Price inquiry"], "customer_emotion": "Evaluating and comparing — needs reassurance", "pain_points": ["Trust gap", "Price uncertainty", "Unclear differentiator vs competitors"], "kpi": "Inquiry rate, time-on-site, lead form conversion", "optimization": "Add specific trust signal missing from ${companyName} consideration stage"},
    {"stage": "Decision", "arabic": "القرار", "channels": ["WhatsApp", "Phone call", "In-person visit"], "touchpoints": ["Sales conversation", "Price negotiation", "Objection handling", "Final CTA"], "customer_emotion": "Final hesitation — needs confidence push", "pain_points": ["Price anxiety", "Commitment fear", "Last-minute alternatives search"], "kpi": "Conversion rate, sales cycle length in days", "optimization": "Specific closing tactic for ${sector.en} buyers in ${city.en}"},
    {"stage": "Purchase", "arabic": "الشراء", "channels": ["Payment processing", "Onboarding"], "touchpoints": ["Payment experience", "Welcome message", "Onboarding process", "First service delivery"], "customer_emotion": "Excitement mixed with new buyer anxiety", "pain_points": ["Onboarding confusion", "Expectations gap", "Post-purchase doubt"], "kpi": "First satisfaction score, completion rate", "optimization": "Streamline first 24-hour experience for ${sector.en}"},
    {"stage": "Retention", "arabic": "الاحتفاظ", "channels": ["WhatsApp", "Email", "CRM", "Social remarketing"], "touchpoints": ["Follow-up call/message", "Review request", "Loyalty offer", "Upsell moment", "Progress update"], "customer_emotion": "Satisfaction or disappointment — critical window", "pain_points": ["Churn triggers specific to ${sector.en}", "Competitor offers", "Price-comparison habit"], "kpi": "Retention rate, repeat purchase, NPS", "optimization": "Specific retention action for ${companyName}"},
    {"stage": "Advocacy", "arabic": "المناصرة", "channels": ["Referral program", "Google/Facebook review", "UGC", "Word of mouth"], "touchpoints": ["Review ask", "Referral invite", "VIP status offer", "Success story sharing"], "customer_emotion": "Pride and community sense", "pain_points": ["No incentive to refer", "Friction to leave review", "Forget to refer"], "kpi": "NPS score, referral rate, review count", "optimization": "Design referral mechanic specific to ${sector.en}"}
  ],
  "emotion_map": {
    "lowest_point": "Stage where ${sector.en} customer emotion is most negative in ${city.en} — name it and fix it",
    "highest_point": "Peak satisfaction moment — identify and amplify with UGC request",
    "drop_off_stage": "Where most ${sector.en} customers leave without converting — priority fix"
  },
  "friction_audit": [
    {"friction": "Specific friction 1 for ${sector.en} buyers in ${city.en}", "stage": "stage name", "severity": "high", "fix": "specific solution", "impact": "expected % improvement"},
    {"friction": "Friction 2", "stage": "stage", "severity": "medium", "fix": "fix", "impact": "impact"},
    {"friction": "Friction 3", "stage": "stage", "severity": "medium", "fix": "fix", "impact": "impact"}
  ],
  "content_gaps": [
    {"stage": "Awareness", "missing": "specific content type needed for ${sector.en}", "solution": "specific content to create", "format": "Reel/Carousel/Blog/WhatsApp"},
    {"stage": "Consideration", "missing": "missing trust content", "solution": "solution", "format": "format"},
    {"stage": "Retention", "missing": "missing retention content", "solution": "solution", "format": "format"}
  ],
  "pain_points": [
    {"level": "high", "title": "Biggest journey friction for ${companyName}", "detail": "specific detail for ${sector.en} in ${city.en}"},
    {"level": "med", "title": "Second pain point", "detail": "detail"}
  ],
  "data_quality_note": "Customer journey analysis based on ${hasReal ? 'provided data and' : ''} ${sector.en} sector patterns in Egypt 2025",
  "proposal": [
    {"title": "Journey Optimization Sprint — ${branch.name}", "desc": "Friction audit، touchpoint content creation، CRM/WhatsApp automation setup، 60-day measurement", "price": "EGP 5,000–10,000/month"},
    {"title": "Full Journey Automation — ${branch.name}", "desc": "All above + loyalty program + referral engine + NPS tracking + monthly journey analysis", "price": "EGP 12,000–20,000/month"}
  ],
  "why_us": [
    "Eunoia has mapped customer journeys for 50+ ${sector.en} clients — we know the drop-off points",
    "We build content AND automation — not just a diagram",
    "Arabic-first journey design — Egyptian consumer psychology expertise"
  ]
}`
}
