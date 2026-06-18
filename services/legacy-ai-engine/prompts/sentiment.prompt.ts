import type { PromptContext } from './types'
import { buildBasePrompt } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, city } = ctx
  const base = buildBasePrompt(ctx)
  const hasSocialLinks = Boolean(ctx.social?.fbLink || ctx.social?.igLink)

  return `${base}

TASK: Sentiment Analysis Report for ${companyName} in ${city.en}.
${hasSocialLinks ? 'Use provided social links to search for reviews and mentions.' : `Search web for reviews of "${companyName}" in ${city.en}.`}

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Sentiment Analysis",
  "confidence": "${hasSocialLinks ? 'high' : 'medium'}",
  "executive_summary": "2-3 sentences on brand sentiment for ${companyName} — overall tone, key drivers, and priority action",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "sentiment_scores": {"positive": 65, "neutral": 20, "negative": 15},
  "top_positive_keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "top_negative_keywords": ["keyword 1", "keyword 2", "keyword 3"],
  "top_neutral_keywords": ["keyword 1", "keyword 2"],
  "key_findings": [
    {"type": "positive", "title": "specific positive finding", "detail": "2 sentences on what customers praise about ${companyName}"},
    {"type": "positive", "title": "second positive finding", "detail": "2 sentences"},
    {"type": "negative", "title": "specific negative finding", "detail": "2 sentences on main complaint and recommended fix"},
    {"type": "negative", "title": "second negative finding", "detail": "2 sentences with actionable response strategy"}
  ],
  "pain_points": [
    {"level": "high", "title": "specific sentiment pain point", "detail": "2 sentences on impact and resolution strategy"},
    {"level": "med", "title": "second sentiment issue", "detail": "1-2 sentences"}
  ],
  "recommendations": [
    {"priority": "immediate", "action": "specific 7-day action to address top negative sentiment", "impact": "expected sentiment improvement"},
    {"priority": "short_term", "action": "30-day brand reputation action for ${companyName}", "impact": "expected impact"},
    {"priority": "long_term", "action": "90-day brand health strategy", "impact": "expected long-term outcome"}
  ],
  "quick_wins": [
    {"action": "specific action to improve sentiment this week", "timeline": "7 days", "money_impact": "EGP/% estimate", "expected_result": "measurable sentiment improvement"},
    {"action": "second quick win for brand sentiment", "timeline": "5 days", "money_impact": "estimate", "expected_result": "outcome"},
    {"action": "third quick win", "timeline": "7 days", "money_impact": "estimate", "expected_result": "outcome"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasSocialLinks ? 72 : 55}, "label": "${hasSocialLinks ? 'High' : 'Medium'}", "reason": "${hasSocialLinks ? 'Social links provided for analysis' : 'Estimated from market knowledge — add reviews for accuracy'}"},
  "sector_rank": "Sentiment position vs sector average",
  "plan_90_days": {
    "month1": ["Respond to all negative reviews within 24h", "Create positive content highlighting strengths", "Set up social listening alerts"],
    "month2": ["Launch review generation campaign", "Address root causes of top complaints", "Publish case studies and testimonials"],
    "month3": ["Measure NPS improvement", "Launch brand ambassador program", "Quarterly sentiment audit"]
  },
  "audit_checklist": [
    {"item": "هل ترد على كل التعليقات السلبية خلال 24 ساعة؟", "status": false},
    {"item": "هل طلبت مراجعات من عملاء راضين هذا الشهر؟", "status": false},
    {"item": "هل لديك social listening tool لمتابعة ذكر البراند؟", "status": false},
    {"item": "هل صفحة Google Business محدّثة بالكامل؟", "status": false},
    {"item": "هل محتواك الإيجابي أكثر من المحتوى الترويجي بنسبة 4:1؟", "status": false},
    {"item": "هل لديك crisis communication plan للمراجعات السلبية المفاجئة؟", "status": false},
    {"item": "هل تشجع العملاء الراضين على مشاركة تجربتهم؟", "status": false},
    {"item": "هل تتابع mention اسم الشركة على TikTok؟", "status": false}
  ],
  "data_quality_note": "Sentiment analysis based on ${hasSocialLinks ? 'provided social links and available reviews' : 'sector patterns and market knowledge — add real reviews for precise analysis'}",
  "proposal": [
    {"title": "Reputation Management Package", "desc": "Monthly: review monitoring, response management, positive content strategy, sentiment reporting", "price": "EGP 3,000–6,000/month"},
    {"title": "Brand Reputation Rebuild", "desc": "90-day intensive: crisis response, positive PR, review generation, social proof campaign, NPS tracking", "price": "EGP 8,000–15,000/month"}
  ],
  "why_us": [
    "Eunoia monitors brand sentiment for 50+ clients — we catch issues before they escalate",
    "Arabic-first response strategy — authentic tone that resonates with Egyptian customers",
    "Integrated approach: sentiment data feeds directly into ad creative and content strategy"
  ],
  "data_sources": "${hasSocialLinks ? 'Social links analysis + review platforms' : 'Market knowledge + sector pattern analysis 2025'}"
}`
}
