import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)

  const competitorInstruction = `COMPETITOR INTELLIGENCE TASK — PHASE 2 ENHANCED:
STEP 1 — IDENTIFY: Name the top 5 REAL businesses competing with ${companyName} in ${sector.en} in ${city.en}. Use your training data knowledge of ${city.en} market.
STEP 2 — FACEBOOK ADS LIBRARY ANALYSIS: Based on your knowledge of the Facebook Ads Library and typical ad patterns for ${sector.en} in Egypt, estimate for each competitor:
  - Active ad count (Low: 1-5, Medium: 6-20, High: 20+)
  - Primary ad format (video/carousel/static)
  - Offer/hook type (discount/benefit/fear-based/aspiration)
  - Estimated monthly spend tier (Under 10K EGP / 10-50K EGP / 50K+ EGP)
  - Primary target audience demographic
STEP 3 — CONTENT STRATEGY ANALYSIS: For each competitor on social media:
  - Posting frequency estimate
  - Content mix (educational/promotional/UGC)
  - Engagement quality (high/medium/low)
  - Brand voice (professional/casual/aggressive)
STEP 4 — WEAKNESSES & GAPS: For each competitor, identify 2-3 specific weaknesses ${companyName} can exploit
STEP 5 — UNDERSERVED SEGMENT: Identify the #1 customer segment in ${sector.en} in ${city.en} that ALL competitors are under-serving — this is ${companyName}'s blue ocean opportunity
STEP 6 — DIFFERENTIATION MAP: Create a 2x2 positioning matrix showing where ${companyName} should position vs competitors
REAL INTELLIGENCE ONLY — every name must be a real operating business in ${city.en}`

  return `${base}\n${dataBlock}

${competitorInstruction}

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Competitor Intelligence",
  "confidence": "medium",
  "executive_summary": "3 sentences on competitive landscape for ${companyName} in ${city.en} ${sector.en} market",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "competitors": [
    {
      "rank": 1,
      "name": "Real competitor name",
      "type": "Direct/Indirect",
      "market_position": "Market leader/Challenger/Niche",
      "ad_activity": {"count": "Low/Medium/High", "primary_format": "video/carousel/static", "hook_type": "discount/benefit/aspiration", "spend_tier": "Under 10K/10-50K/50K+ EGP/month"},
      "content_strategy": {"posting_frequency": "X posts/week", "content_mix": "40% educational, 40% promotional, 20% UGC", "engagement_quality": "high/medium/low", "brand_voice": "professional/casual"},
      "strengths": ["specific strength 1", "specific strength 2"],
      "weaknesses": ["exploitable weakness 1", "exploitable weakness 2", "exploitable weakness 3"],
      "pricing_tier": "budget/mid/premium",
      "estimated_monthly_budget": "X-Y EGP",
      "audience_focus": "primary demographic description"
    }
  ],
  "competitive_gaps": [
    {"gap": "specific underserved need", "opportunity": "how ${companyName} can own this", "urgency": "immediate/3months/6months"}
  ],
  "blue_ocean_segment": "The #1 underserved customer segment ALL competitors miss in ${city.en} ${sector.en}",
  "positioning_matrix": {
    "x_axis": "Price: Budget → Premium",
    "y_axis": "Service: Basic → Full-Service",
    "competitors_positions": [{"name": "competitor", "x": 50, "y": 50, "quadrant": "description"}],
    "recommended_position_for_client": {"x": 70, "y": 75, "rationale": "specific positioning rationale"}
  },
  "differentiation_strategy": {
    "primary_usp": "The 1 thing ${companyName} should own that NO competitor does well",
    "messaging_angle": "specific headline/hook that will resonate vs competitors",
    "proof_points": ["proof 1", "proof 2", "proof 3"]
  },
  "quick_wins": [
    {"action": "specific 7-day competitive action", "timeline": "7 days", "money_impact": "EGP estimate", "expected_result": "measurable outcome"},
    {"action": "second quick win", "timeline": "7 days", "money_impact": "EGP estimate", "expected_result": "measurable outcome"},
    {"action": "third quick win", "timeline": "7 days", "money_impact": "EGP estimate", "expected_result": "measurable outcome"}
  ],
  "risk_alerts": [{"type": "competitive_threat", "message": "specific risk", "severity": "high", "fix": "specific action"}],
  "confidence_score": {"pct": 65, "label": "Medium", "reason": "Based on market knowledge — real-time data would improve accuracy"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["action 1 with expected outcome", "action 2", "action 3"],
    "month2": ["action 4", "action 5", "action 6"],
    "month3": ["action 7", "action 8", "action 9"]
  },
  "audit_checklist": [
    {"item": "Facebook Ads Library monitored weekly for competitor activity", "status": false},
    {"item": "Competitor pricing tracked monthly", "status": false},
    {"item": "Competitor content calendar audited quarterly", "status": false},
    {"item": "Blue ocean segment actively targeted", "status": false},
    {"item": "USP clearly communicated in all ads", "status": false},
    {"item": "Competitor weaknesses exploited in messaging", "status": false},
    {"item": "Differentiation map updated quarterly", "status": false},
    {"item": "Win/loss analysis tracked for every deal", "status": false}
  ],
  "data_quality_note": "Analysis based on market knowledge and sector patterns — Facebook Ads Library direct access would increase accuracy by 40%",
  "proposal": [
    {"title": "Competitor Intelligence Package", "desc": "Monthly competitor monitoring, ad library audits, positioning workshops, counter-strategy campaigns", "price": "EGP 8,000-15,000/month"},
    {"title": "Market Dominance Program", "desc": "Full competitive intelligence + campaign execution to capture competitor market share", "price": "EGP 18,000-30,000/month"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: 5+ years tracking ${sector.en} competitors in ${city.en} — we know their patterns",
    "Proprietary sector benchmarks: we run campaigns for multiple ${sector.en} clients — cross-sector intelligence",
    "Integrated team: strategist + media buyer who understands counter-positioning in real-time",
    "Transparent competitor dashboard: weekly updates, no surprises"
  ]
}`
}
