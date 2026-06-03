import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasAds = Boolean(ctx.ads?.budget || ctx.ads?.cpl)
  const hasSocial = Boolean(ctx.social?.igFollowers || ctx.social?.fbFollowers)
  const hasReal = hasAds || hasSocial

  return `${base}
${dataBlock}

TASK: Digital Readiness Score for ${companyName} (${sector.en} in ${city.en}).
Comprehensive audit of digital maturity across 6 dimensions — score 0-100, identify gaps, and build roadmap.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Digital Readiness Score",
  "confidence": "${hasReal ? 'high' : 'medium'}",
  "executive_summary": "3 sentences: overall digital maturity score, biggest gap area, and most impactful next step for ${companyName}",
  "marketing_score": 60,
  "score_dimensions": {"digital_presence": ${ctx.websiteUrl ? 65 : 40}, "content_quality": ${hasSocial ? 65 : 45}, "paid_performance": ${hasAds ? 70 : 40}, "brand_strength": 60, "competitive_position": 55},
  "quick_wins": [
    {"action": "Set up Google Analytics 4 + Meta Pixel today if not done", "timeline": "Today (1-2 hours)", "money_impact": "Free tools that tell you exactly where your budget is going and where customers drop off", "expected_result": "Full campaign tracking"},
    {"action": "Claim and optimize Google My Business profile", "timeline": "This week", "money_impact": "Free local SEO that drives 20-40% of local discovery in Egypt", "expected_result": "Organic local traffic"},
    {"action": "Set up WhatsApp Business with auto-reply and catalog", "timeline": "3 days", "money_impact": "WhatsApp is primary conversion tool in Egypt — 70%+ of Egyptian consumers prefer WhatsApp inquiry", "expected_result": "Higher lead conversion"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasReal ? 72 : 58}, "label": "${hasReal ? 'High' : 'Medium'}", "reason": "Digital readiness improves with more linked assets — ${hasReal ? 'good data available' : 'add website and social links for complete audit'}"},
  "sector_rank": "Digital maturity assessment",
  "plan_90_days": {
    "month1": ["Install all tracking tools (GA4, Pixel, Clarity)", "Claim all business profiles (Google, Facebook, Instagram)", "Set up WhatsApp Business"],
    "month2": ["Launch consistent content calendar", "Run first paid campaign with proper tracking", "Optimize website speed"],
    "month3": ["Review analytics and refine strategy", "A/B test ad creatives", "Build email/WhatsApp list"]
  },
  "audit_checklist": [
    {"item": "هل لديك موقع إلكتروني سريع (<3 ثوانٍ)?", "status": false},
    {"item": "هل Google Analytics 4 مثبت على موقعك؟", "status": false},
    {"item": "هل Meta Pixel مثبت وشغال؟", "status": false},
    {"item": "هل Google My Business profile مكتمل وموثق؟", "status": false},
    {"item": "هل WhatsApp Business مفعّل مع auto-reply؟", "status": false},
    {"item": "هل تنشر محتوى بانتظام (3+ مرات/أسبوع)?", "status": false},
    {"item": "هل لديك email أو WhatsApp list من العملاء؟", "status": false},
    {"item": "هل تشغّل إعلانات مدفوعة بميزانية ثابتة؟", "status": false}
  ],
  "readiness_dimensions": [
    {"dimension": "Website & SEO", "score": ${ctx.websiteUrl ? 58 : 25}, "benchmark": 70, "status": "${ctx.websiteUrl ? 'Partial — website exists, SEO needs work' : 'Critical gap — no website provided'}", "quick_wins": ["Google My Business optimization", "Website speed improvement", "Local SEO keywords"], "detailed_gaps": ["specific gap 1 for ${companyName}", "gap 2"]},
    {"dimension": "Social Media Presence", "score": ${hasSocial ? 65 : 35}, "benchmark": 72, "status": "${hasSocial ? 'Active — data available for analysis' : 'Limited — no social data provided'}", "quick_wins": ["Consistent posting schedule", "Content mix optimization", "Engagement strategy"], "detailed_gaps": ["gap 1", "gap 2"]},
    {"dimension": "Paid Advertising", "score": ${hasAds ? 68 : 30}, "benchmark": 65, "status": "${hasAds ? 'Active campaigns — benchmark comparison available' : 'No paid ads — major growth lever untapped'}", "quick_wins": ["Start with EGP 3,000-5,000 test budget", "Meta Ads with clear CTA", "Retargeting setup"], "detailed_gaps": ["gap 1", "gap 2"]},
    {"dimension": "CRM & Data", "score": 25, "benchmark": 55, "status": "Typically underdeveloped for ${sector.en} SMEs in ${city.en}", "quick_wins": ["Google Sheets CRM as starting point", "WhatsApp broadcast list", "Monthly customer follow-up"], "detailed_gaps": ["No customer database", "No follow-up system"]},
    {"dimension": "Content & Brand", "score": ${hasSocial ? 60 : 40}, "benchmark": 68, "status": "Needs improvement for ${sector.en} competitive landscape", "quick_wins": ["Brand guidelines document", "Content calendar", "Video content"], "detailed_gaps": ["Inconsistent visual identity", "No content strategy"]},
    {"dimension": "Analytics & Measurement", "score": ${hasAds ? 55 : 20}, "benchmark": 60, "status": "${hasAds ? 'Basic tracking exists — needs attribution model' : 'No tracking setup — operating blind'}", "quick_wins": ["GA4 setup", "Pixel installation", "Weekly metrics review"], "detailed_gaps": ["No attribution model", "Not tracking ROI by channel"]}
  ],
  "overall_digital_score": ${hasReal ? 55 : 42},
  "digital_maturity_level": "${hasReal ? 'Developing (Stage 2/5) — Active digital presence but lacks optimization and measurement' : 'Early Stage (Stage 1/5) — Basic presence, needs fundamental digital infrastructure'}",
  "roadmap": [
    {"phase": "Foundation (Month 1)", "priority": "Critical", "actions": ["Install GA4 + Meta Pixel", "Claim Google My Business", "Set up WhatsApp Business with catalog"], "cost": "EGP 0-2,000", "impact": "Enables measurement — nothing can be optimized without data"},
    {"phase": "Activation (Month 2-3)", "priority": "High", "actions": ["Launch consistent social content", "Start Meta Ads test campaign", "Build email/WhatsApp subscriber list"], "cost": "EGP 5,000-15,000/month", "impact": "Generate first measurable digital revenue"},
    {"phase": "Optimization (Month 4-6)", "priority": "Medium", "actions": ["A/B test ad creatives", "SEO content strategy", "CRM implementation"], "cost": "EGP 10,000-25,000/month", "impact": "Lower CPL and higher conversion rate"},
    {"phase": "Scale (Month 7+)", "priority": "Strategic", "actions": ["Multi-channel expansion", "Marketing automation", "Advanced analytics"], "cost": "Varies", "impact": "Sustainable digital growth engine"}
  ],
  "pain_points": [
    {"level": "high", "title": "No measurement infrastructure", "detail": "Operating without GA4 + Pixel is like driving blindfolded — every EGP spent on ads is untrackable"},
    {"level": "med", "title": "Inconsistent digital presence", "detail": "Sporadic posting + no clear brand voice = low algorithmic reach + low trust"}
  ],
  "data_quality_note": "Digital readiness assessment based on ${hasReal ? 'provided data and' : ''} ${sector.en} sector benchmarks in Egypt 2025",
  "proposal": [
    {"title": "Digital Foundation Setup — ${branch.name}", "desc": "GA4 + Pixel installation، GMB optimization، WhatsApp Business setup، social profile optimization، tracking audit", "price": "EGP 3,000-6,000 one-time"},
    {"title": "Digital Growth Management — ${branch.name}", "desc": "Monthly management: content، ads، analytics، optimization، monthly performance report", "price": "EGP 5,000-12,000/month"}
  ],
  "why_us": [
    "Eunoia digital audit has helped 30+ Egyptian companies discover they were wasting 40-60% of their marketing budget on untracked channels",
    "We start with free tools (GA4, GMB, WhatsApp Business) before recommending paid solutions",
    "Clear ROI from month 1: every recommendation ties back to measurable business outcome"
  ]
}`
}
