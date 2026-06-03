import type { PromptContext } from './types'
import { buildBasePrompt } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, city, sector } = ctx
  const base = buildBasePrompt(ctx)
  const crisisDesc = ctx.extra ?? 'Crisis situation requiring immediate response'

  return `${base}

TASK: Crisis Management Report for ${companyName} (${sector.en}, ${city.en}).
CRISIS CONTEXT: ${crisisDesc}

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Crisis Management",
  "confidence": "high",
  "crisis_level": "medium",
  "crisis_stage": "active",
  "executive_summary": "3-sentence crisis assessment for ${companyName}: situation severity, immediate priority action, expected resolution timeline",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "situation_analysis": {
    "what_happened": "specific description of crisis situation based on context",
    "potential_impact": "business and brand impact assessment — severity and scope",
    "urgency": "Immediate/High/Medium based on crisis nature"
  },
  "immediate_actions": [
    {"timeframe": "First 2 hours", "actions": ["Acknowledge publicly — specific platform and message", "Pause all scheduled promotional content", "Brief leadership team and assign crisis lead"]},
    {"timeframe": "First 24 hours", "actions": ["Publish official statement — specific tone and channels", "Respond to all direct messages and comments", "Contact top affected customers personally via WhatsApp"]},
    {"timeframe": "First week", "actions": ["Implement root cause fix — specific action", "Publish follow-up transparency update", "Begin positive content strategy to rebuild narrative"]}
  ],
  "communication_plan": {
    "internal_message": "specific message for team and staff about the situation and response",
    "public_statement": "specific draft statement: acknowledge, apologize/explain if needed, action taken, commitment — authentic Arabic tone",
    "what_NOT_to_say": ["defensive language — never say 'you misunderstood'", "delete negative comments — this escalates", "go silent — silence = guilt in social media"]
  },
  "channel_strategy": [
    {"channel": "Facebook/Instagram", "action": "Post official statement + respond to every comment within 2h", "message": "Empathetic, specific, solution-focused"},
    {"channel": "WhatsApp", "action": "Direct outreach to affected customers with personal apology + compensation offer", "message": "Personal and immediate"},
    {"channel": "Google Reviews", "action": "Respond professionally to all negative reviews", "message": "Professional acknowledgment + offline resolution offer"}
  ],
  "pain_points": [
    {"level": "high", "title": "Viral spread risk in Egyptian social media", "detail": "Egyptian Facebook/WhatsApp ecosystem amplifies negative stories fast — first 6 hours are critical. Response speed is the #1 factor in crisis outcome"},
    {"level": "high", "title": "Trust erosion in ${sector.en} sector", "detail": "In ${sector.en}, trust is the primary purchase driver — reputation damage directly impacts revenue. Transparency + concrete action is the only fix"},
    {"level": "med", "title": "Competitor opportunism", "detail": "Competitors will run comparison ads during the crisis window — have counter-messaging ready"}
  ],
  "recovery_plan": {
    "short_term": "2 weeks: stabilize narrative, fix root cause, activate satisfied customer advocates",
    "medium_term": "3 months: rebuild trust with transparency campaign, increase positive review volume, measure NPS",
    "long_term": "6 months: reposition brand narrative, CSR initiative if relevant, track sentiment recovery to pre-crisis levels"
  },
  "quick_wins": [
    {"action": "Publish transparent statement in next 2 hours on all platforms", "timeline": "Today", "money_impact": "Prevents 80% of viral escalation", "expected_result": "Narrative control before mass sharing"},
    {"action": "Activate happy customer advocates to share positive experiences", "timeline": "24 hours", "money_impact": "Organic positive counter-narrative at zero cost", "expected_result": "Balance negative with authentic positive voices"},
    {"action": "Offer direct compensation/fix to vocal complainants", "timeline": "24-48 hours", "money_impact": "Turn critics into advocates — LTV value preserved", "expected_result": "Convert detractors to neutral/positive"}
  ],
  "risk_alerts": [
    {"type": "reputational", "message": "Crisis window is 6-24 hours in Egyptian social media — delayed response amplifies damage exponentially", "severity": "critical", "fix": "Publish statement immediately — any response is better than silence"},
    {"type": "competitive", "message": "Competitors may capitalize on negative press with comparison campaigns", "severity": "high", "fix": "Prepare counter-messaging focusing on resolution and commitment"}
  ],
  "confidence_score": {"pct": 82, "label": "High", "reason": "Crisis management best practices applied to ${sector.en} Egypt context"},
  "sector_rank": "Crisis response capability assessment",
  "plan_90_days": {
    "month1": ["Execute immediate response plan", "Root cause resolution", "Begin positive narrative rebuild"],
    "month2": ["Transparency campaign — 'what we fixed'", "Review generation from satisfied customers", "Media monitoring for ongoing mentions"],
    "month3": ["NPS measurement vs pre-crisis baseline", "Brand health check", "Crisis prevention system setup"]
  },
  "audit_checklist": [
    {"item": "هل نشرت بيان رسمي واضح في أول 24 ساعة؟", "status": false},
    {"item": "هل ردّيت على كل التعليقات السلبية بشكل شخصي؟", "status": false},
    {"item": "هل وقفت كل الإعلانات الترويجية أثناء الأزمة؟", "status": false},
    {"item": "هل تواصلت مباشرة مع أكثر المتضررين؟", "status": false},
    {"item": "هل حددت السبب الجذري وأخبرت الجمهور بما تم إصلاحه؟", "status": false},
    {"item": "هل لديك crisis communication plan مكتوب للمستقبل؟", "status": false},
    {"item": "هل تراقب ذكر البراند على كل المنصات الآن؟", "status": false},
    {"item": "هل بدأت في جمع شهادات إيجابية من عملاء راضين؟", "status": false}
  ],
  "kpis": [
    {"label": "Sentiment Recovery", "value": "Target: positive > 70%", "sub": "within 30 days"},
    {"label": "Response Rate", "value": "100%", "sub": "all public mentions"},
    {"label": "Resolution Rate", "value": "> 90%", "sub": "of complaints"},
    {"label": "NPS Recovery", "value": "Back to pre-crisis baseline", "sub": "90-day target"}
  ],
  "data_quality_note": "Crisis assessment based on sector patterns and best practices — specifics refined from provided crisis context",
  "proposal": [
    {"title": "Crisis Response Package", "desc": "Immediate: statement drafting, platform monitoring, response management, daily situation reports for 2 weeks", "price": "EGP 15,000–25,000 flat"},
    {"title": "Recovery & Rebuild Package", "desc": "3-month brand rehabilitation: positive PR strategy, review generation, trust campaign, monthly progress reports", "price": "EGP 8,000–15,000/month"}
  ],
  "why_us": [
    "Eunoia has managed 10+ brand crises in Egypt — we know the Egyptian consumer response patterns",
    "24/7 availability during crisis — not a 9-5 agency when it matters most",
    "Arabic crisis communication expertise — authentic tone that defuses rather than escalates"
  ],
  "data_sources": "Crisis management best practices + Egypt social media behavior patterns 2025"
}`
}
