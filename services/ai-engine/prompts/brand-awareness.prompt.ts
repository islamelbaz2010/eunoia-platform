import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const bench = sector.benchmark
  const hasSocial = Boolean(ctx.social?.igFollowers || ctx.social?.fbFollowers)

  return `${base}
${dataBlock}

TASK: BRAND AWARENESS ANALYSIS for ${companyName} in ${sector.en} sector in ${city.en}.
ENGAGEMENT BENCHMARKS FOR ${sector.en}: Target ${bench.engagement_benchmark}, peak seasons ${bench.peak_seasons}, best formats ${bench.top_formats}.
Analyze: (1) Digital share of voice vs top 3 competitors, (2) Brand recall potential, (3) Content quality and consistency, (4) Audience sentiment signals, (5) Platform-specific performance, (6) Strategy to increase share of voice by 30% in 90 days.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Brand Awareness Analysis",
  "confidence": "${hasSocial ? 'high' : 'medium'}",
  "executive_summary": "3 sentences on ${companyName} brand awareness position in ${sector.en} ${city.en} — current standing, biggest gap vs top competitor, and 90-day opportunity",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "brand_assessment": {
    "awareness_level": "Low/Medium/High with 1-sentence justification",
    "share_of_voice": "estimated % vs top 3 competitors in ${sector.en} ${city.en}",
    "brand_recognition": "assessment of how easily ${companyName} is recognized in ${city.en} market",
    "consistency_score": "brand consistency across platforms — Consistent/Inconsistent/Missing",
    "tone_of_voice": "current TOV assessment for ${sector.en} audience"
  },
  "platform_analysis": {
    "instagram": {
      "followers": "${ctx.social?.igFollowers ?? 'not provided'}",
      "engagement_rate": "${ctx.social?.igEng ?? 'not measured'}",
      "benchmark": "${bench.engagement_benchmark}",
      "gap": "${hasSocial ? 'calculate vs benchmark' : 'add IG data for gap analysis'}",
      "assessment": "Instagram brand presence assessment for ${sector.en}",
      "top_opportunity": "specific content angle to boost IG awareness"
    },
    "facebook": {
      "followers": "${ctx.social?.fbFollowers ?? 'not provided'}",
      "assessment": "Facebook is primary discovery platform for ${sector.en} in Egypt",
      "top_opportunity": "specific Facebook strategy for ${companyName}"
    },
    "tiktok": {
      "followers": "${ctx.social?.ttFollowers ?? 'not provided'}",
      "opportunity": "TikTok growing 35% YoY — ${sector.en} 18-35 audience underserved",
      "top_content_format": "${bench.top_formats}"
    }
  },
  "competitor_share_of_voice": [
    {"competitor": "REAL competitor 1 in ${city.en} ${sector.en}", "estimated_sov_pct": 35, "strengths": "why they dominate awareness", "weakness": "exploitable gap for ${companyName}"},
    {"competitor": "REAL competitor 2", "estimated_sov_pct": 25, "strengths": "their awareness strength", "weakness": "their gap"},
    {"competitor": "REAL competitor 3", "estimated_sov_pct": 15, "strengths": "their strength", "weakness": "their gap"},
    {"competitor": "${companyName}", "estimated_sov_pct": 10, "strengths": "current strength", "weakness": "main gap to close"}
  ],
  "brand_gap_analysis": {
    "vs_leader": "specific gap between ${companyName} and top competitor — what to close",
    "positioning_opportunity": "the specific brand position no competitor owns in ${sector.en} ${city.en}",
    "audience_connection": "how well ${companyName} resonates emotionally with ${sector.en} audience"
  },
  "growth_strategy": {
    "target": "30% increase in share of voice in 90 days",
    "channels": ["primary channel with specific tactic", "secondary channel", "supporting channel"],
    "content_angles": [
      "viral content angle 1 specific to ${sector.en} that builds brand recall",
      "content angle 2 — educational/expert positioning",
      "content angle 3 — community building approach"
    ],
    "posting_cadence": "specific recommendation: X Reels/week + Y carousels + daily Stories"
  },
  "pain_points": [
    {"level": "high", "title": "Low brand recall vs competitors in ${city.en}", "detail": "${sector.en} buyers default to brands they see most — if competitors post 3x more than ${companyName}, they win the top-of-mind battle"},
    {"level": "high", "title": "Inconsistent visual identity across platforms", "detail": "Inconsistent branding reduces recognition by 50% — audiences need 7+ exposures before recall"},
    {"level": "med", "title": "Missing brand story — no emotional connection", "detail": "Functional content tells, emotional content sells — ${sector.en} buyers choose brands they feel connected to"}
  ],
  "quick_wins": [
    {"action": "Launch 'top 3 questions in ${sector.en}' Reel series — 3 videos this week", "timeline": "This week", "money_impact": "Educational Reels reach 3-5x more non-followers = fastest awareness builder", "expected_result": "20-40% reach increase on non-followers"},
    {"action": "Standardize profile pictures and bio across all platforms today", "timeline": "Today (1 hour)", "money_impact": "Free brand consistency improvement — builds recall instantly", "expected_result": "Professional unified brand perception"},
    {"action": "Activate Instagram collaboration feature with 1 complementary business in ${city.en}", "timeline": "This week", "money_impact": "Reach their audience at zero ad cost — typical collaboration = +500-2000 profile visits", "expected_result": "New audience exposure"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasSocial ? 74 : 55}, "label": "${hasSocial ? 'High' : 'Medium'}", "reason": "${hasSocial ? 'Real social data provided for benchmarking' : 'Estimated from sector patterns — add social data for accurate gap analysis'}"},
  "sector_rank": "Brand awareness position in ${sector.en} ${city.en}",
  "plan_90_days": {
    "month1": ["Establish content calendar with 3 Reels/week", "Standardize brand identity across all platforms", "Launch awareness campaign: educational content + social proof"],
    "month2": ["Collaboration with 2-3 complementary businesses", "Launch UGC campaign — client testimonials", "Track share of voice improvement"],
    "month3": ["Scale top-performing content formats", "Launch influencer micro-campaign for ${sector.en}", "Measure brand recall via comments/DMs analysis"]
  },
  "audit_checklist": [
    {"item": "هل visual identity موحدة عبر كل المنصات؟", "status": false},
    {"item": "هل تنشر 3+ مرات/أسبوع باستمرار؟", "status": false},
    {"item": "هل engagement rate أعلى من ${bench.engagement_benchmark}؟", "status": false},
    {"item": "هل لديك brand story واضحة ومعروفة في محتواك؟", "status": false},
    {"item": "هل تستخدم hashtags خاصة بـ ${sector.en} في ${city.en}؟", "status": false},
    {"item": "هل تتعاون مع businesses تكميلية في ${city.en}؟", "status": false},
    {"item": "هل تتابع brand mentions وترد عليها؟", "status": false},
    {"item": "هل تجمع وتنشر UGC من عملائك؟", "status": false}
  ],
  "data_quality_note": "Brand awareness analysis based on ${hasSocial ? 'provided social data and' : ''} sector patterns in Egypt 2025",
  "proposal": [
    {"title": "Brand Awareness Package", "desc": "Monthly: 12 awareness-focused posts + 4 Reels, brand identity audit, competitor monitoring, monthly SOV report", "price": "EGP 5,000–10,000/month"},
    {"title": "Brand Dominance Program", "desc": "All above + influencer strategy + PR content + collaboration campaigns + brand health tracking dashboard", "price": "EGP 12,000–22,000/month"}
  ],
  "why_us": [
    "Eunoia builds brands that Egyptian audiences remember — not just content calendars",
    "Share of Voice tracking: we measure awareness improvement monthly, not just vanity metrics",
    "Arabic-first brand voice: authentic content that resonates with ${city.en} ${sector.en} buyers"
  ]
}`
}
