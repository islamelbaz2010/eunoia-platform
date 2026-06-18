import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)

  return `${base}\n${dataBlock}

Trend Research Task for ${companyName} | Sector: ${sector.en} | Location: ${city.en} | Date: 2025-2026

PHASE 2 ENHANCEMENT — Use all available trend intelligence:
1. Google Trends Analysis: Based on your knowledge of Google Trends patterns in Egypt and ${city.en} for ${sector.en} keywords — what search terms are rising, peaking, or declining?
2. TikTok Trend Intelligence: What content formats, sounds, challenges, and hashtags are trending for ${sector.en} in Arabic-speaking markets?
3. Meta Platform Trends: What ad formats and content types are showing highest engagement for ${sector.en} in Egypt in 2025?
4. Consumer Behavior Shifts: Based on Egypt's economic situation (EGP recovery, rising middle class digital adoption, delivery economy growth), what behavioral changes are relevant to ${sector.en}?
5. Competitor Content Trends: What content angles are emerging competitors in ${sector.en} using that established players are missing?
6. Seasonal Trend Calendar: Specific trend cycles for ${sector.en} — including Ramadan digital behavior (screen time +40%, video +60%), summer shifts, back-to-school impact
7. Micro-trend Opportunities: 2-3 emerging trends in ${sector.en} that are growing but not yet mainstream — first-mover advantage for ${companyName}

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Trend Research",
  "confidence": "medium",
  "executive_summary": "2-3 sentences on the key trend landscape for ${sector.en} in ${city.en} in 2025-2026",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "market_context": "Specific context on how Egypt's 2025 economic situation affects ${sector.en} consumer behavior",
  "trends": [
    {
      "name": "Trend name",
      "heat": "hot",
      "heat_label": "🔥 Rising Fast",
      "description": "Specific description of this trend in ${sector.en} context",
      "opportunity": "How ${companyName} can capitalize on this trend specifically",
      "timeline": "when this trend peaks / action window",
      "platform": "primary platform for this trend",
      "content_angle": "specific content angle to use",
      "estimated_impact": "X% engagement lift or audience reach"
    },
    {
      "name": "Second trend",
      "heat": "rising",
      "heat_label": "📈 Growing",
      "description": "description",
      "opportunity": "opportunity for ${companyName}",
      "timeline": "timeline",
      "platform": "platform",
      "content_angle": "angle",
      "estimated_impact": "impact estimate"
    },
    {
      "name": "Third trend",
      "heat": "stable",
      "heat_label": "➡️ Established",
      "description": "description",
      "opportunity": "opportunity",
      "timeline": "ongoing",
      "platform": "platform",
      "content_angle": "angle",
      "estimated_impact": "impact"
    },
    {
      "name": "Micro-trend opportunity",
      "heat": "emerging",
      "heat_label": "🌱 Early Mover",
      "description": "Emerging trend not yet mainstream in ${sector.en}",
      "opportunity": "First-mover advantage for ${companyName}",
      "timeline": "6-12 months to peak",
      "platform": "platform",
      "content_angle": "angle",
      "estimated_impact": "impact"
    }
  ],
  "consumer_behavior_shifts": [
    "Specific shift in how ${sector.en} buyers in ${city.en} make decisions in 2025",
    "Second shift — digital behavior change relevant to ${sector.en}",
    "Third shift — price sensitivity and value-seeking behavior"
  ],
  "platform_trends": [
    {"platform": "Meta (Facebook/Instagram)", "trend": "specific ad format or content trend for ${sector.en}", "recommendation": "how ${companyName} should use this"},
    {"platform": "TikTok", "trend": "specific trend for ${sector.en} Arabic content", "recommendation": "specific action for ${companyName}"},
    {"platform": "Google", "trend": "specific search trend for ${sector.en} in Egypt", "recommendation": "SEO/SEM opportunity"},
    {"platform": "YouTube", "trend": "video content trend for ${sector.en}", "recommendation": "content recommendation"},
    {"platform": "WhatsApp", "trend": "WhatsApp Business trends in Egypt for ${sector.en}", "recommendation": "automation opportunity"}
  ],
  "recommended_content_angles": [
    "Angle 1: Specific content angle that is trending for ${sector.en} in Egypt — with example",
    "Angle 2: Second angle that competitors are underusing",
    "Angle 3: Viral potential angle for ${sector.en} Arabic-language content",
    "Angle 4: Educational/authority content angle specific to ${sector.en}"
  ],
  "seasonal_trend_calendar": [
    {"month": "Jan-Feb", "trend": "specific trend for ${sector.en}", "action": "specific campaign action"},
    {"month": "Mar-Apr (Ramadan)", "trend": "Ramadan behavior: screen time +40%, video +60%", "action": "specific Ramadan strategy for ${sector.en}"},
    {"month": "May-Jun", "trend": "trend", "action": "action"},
    {"month": "Jul-Aug (Summer)", "trend": "summer behavior for ${sector.en}", "action": "action"},
    {"month": "Sep-Oct", "trend": "back-to-normal + planning season", "action": "action"},
    {"month": "Nov-Dec (Q4 + Eid)", "trend": "peak season for ${sector.en}", "action": "action"}
  ],
  "declining_trends": [
    {"trend": "trend that is dying in ${sector.en}", "why": "why it's declining", "migrate_to": "what to do instead"},
    {"trend": "second declining trend", "why": "reason", "migrate_to": "alternative"}
  ],
  "quick_wins": [
    {"action": "Create 3 pieces of content around the #1 trending topic for ${sector.en} this week", "timeline": "7 days", "money_impact": "0-500 EGP production cost", "expected_result": "2-5x organic reach increase"},
    {"action": "Launch TikTok trend-jacking campaign on the hottest audio/format for ${sector.en}", "timeline": "7 days", "money_impact": "Low production cost, high organic potential", "expected_result": "Viral potential, new audience reach"},
    {"action": "Write 2 Google search-optimized blog posts on rising ${sector.en} search terms", "timeline": "7 days", "money_impact": "Free organic traffic building", "expected_result": "SEO ranking improvement in 30-60 days"}
  ],
  "risk_alerts": [
    {"type": "trend_timing", "message": "Missing the Ramadan trend window costs 60-70% of peak season opportunity for ${sector.en}", "severity": "high", "fix": "Start Ramadan content production 6 weeks before start — approx late Jan 2026"}
  ],
  "confidence_score": {"pct": 70, "label": "Medium", "reason": "Based on market knowledge of Egypt ${sector.en} sector trends — real-time social listening tools would increase accuracy to 90%+"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["Launch trend-based content series on top 2 platforms", "Set up Google Trends monitoring for ${sector.en} keywords", "Audit and stop using 2 declining trends in current content"],
    "month2": ["Scale trending content that performed in Month 1", "Plan Ramadan/seasonal campaign 6 weeks in advance", "Test emerging micro-trend with 3 content pieces"],
    "month3": ["Establish content calendar based on trend data", "Build audience on primary trend platform", "Measure trend-based content vs standard content performance"]
  },
  "audit_checklist": [
    {"item": "Google Trends monitored weekly for ${sector.en} keywords", "status": false},
    {"item": "Competitor content audited monthly for trend adoption", "status": false},
    {"item": "TikTok trending sounds used in content within 48h of trending", "status": false},
    {"item": "Ramadan strategy prepared 6 weeks in advance", "status": false},
    {"item": "Seasonal content calendar documented for full year", "status": false},
    {"item": "Platform-specific content formats used (not cross-posting)", "status": false},
    {"item": "Declining trends removed from content strategy", "status": false},
    {"item": "Micro-trends tested quarterly", "status": false}
  ],
  "data_quality_note": "Medium confidence — trend analysis based on market knowledge; social listening tools and real-time data would improve precision",
  "proposal": [
    {"title": "Trend Intelligence Package", "desc": "Monthly trend report + content calendar + 3 trend-optimized campaigns, competitor content monitoring", "price": "EGP 5,000-10,000/month"},
    {"title": "Content Trend Domination", "desc": "Full content + campaign execution built around trending topics: 15 posts/month + paid amplification", "price": "EGP 12,000-20,000/month"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: we track trends across 200+ clients in ${sector.en} — cross-industry pattern recognition",
    "Arabic content expertise: we understand what trends work in Egyptian Arabic culture, not just English-language trends",
    "Speed advantage: our creative team can produce trend-based content in 48-72 hours",
    "Integrated amplification: trend-based content + paid boosting = maximum viral potential"
  ],
  "data_sources": "Market knowledge of Egypt and GCC ${sector.en} trends 2025 | Platform pattern analysis | Sector benchmarks"
}`
}
