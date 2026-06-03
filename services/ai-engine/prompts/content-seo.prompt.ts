import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)

  return `${base}
${dataBlock}

TASK: CONTENT & SEO GAP ANALYSIS for ${companyName} (${sector.en} in ${city.en}).
FREE DATA SOURCES — apply to every finding:
- Google Trends patterns for ${sector.en} keywords in Egypt: rising vs declining searches
- Top Arabic AND English search queries: estimate monthly volume based on sector size
- TikTok trending hashtags for ${sector.en} in Arabic markets
- YouTube search behavior: top how-to queries for ${sector.en} in Egypt
- Competitor content frequency: typical posting rate for leading ${sector.en} brands

Analyze: (1) Top 10 Arabic AND English keywords buyers search for, (2) What top 3 competitors publish and at what frequency, (3) 5 content topics competitors are NOT covering well, (4) Specific content formats with performance data, (5) 30-day content calendar outline, (6) 3 viral content angles for ${sector.en}, (7) SEO quick wins.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Content & SEO Gap Analysis",
  "confidence": "medium",
  "executive_summary": "3 sentences on content gap opportunity for ${companyName} in ${sector.en} — biggest missing content angle, SEO opportunity, and top recommendation",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "top_keywords": [
    {"keyword": "top Arabic keyword for ${sector.en}", "monthly_searches": "estimate", "competition": "low/medium/high", "intent": "awareness/consideration/conversion", "language": "ar"},
    {"keyword": "second Arabic keyword", "monthly_searches": "estimate", "competition": "medium", "intent": "consideration", "language": "ar"},
    {"keyword": "top English keyword for ${sector.en}", "monthly_searches": "estimate", "competition": "medium", "intent": "conversion", "language": "en"},
    {"keyword": "fourth keyword", "monthly_searches": "estimate", "competition": "low", "intent": "awareness", "language": "ar"},
    {"keyword": "fifth keyword", "monthly_searches": "estimate", "competition": "medium", "intent": "consideration", "language": "en"}
  ],
  "competitor_content": [
    {"competitor": "REAL competitor 1 name in ${city.en}", "posting_frequency": "X posts/week", "top_content_types": "specific formats used", "engagement_level": "high/medium/low", "content_gaps": "what they don't cover well"},
    {"competitor": "REAL competitor 2", "posting_frequency": "X posts/week", "top_content_types": "formats", "engagement_level": "medium", "content_gaps": "their gap"},
    {"competitor": "REAL competitor 3", "posting_frequency": "X posts/week", "top_content_types": "formats", "engagement_level": "low", "content_gaps": "their gap"}
  ],
  "content_gaps": [
    {"gap": "specific untapped content topic for ${sector.en}", "search_volume": "estimate", "why_valuable": "why this audience needs this content", "format": "Reel/Blog/Carousel/YouTube"},
    {"gap": "second content gap", "search_volume": "estimate", "why_valuable": "value explanation", "format": "format"},
    {"gap": "third content gap — question-based content competitors ignore", "search_volume": "estimate", "why_valuable": "why_valuable", "format": "format"},
    {"gap": "fourth gap — seasonal or event-based", "search_volume": "estimate", "why_valuable": "why_valuable", "format": "format"},
    {"gap": "fifth gap — local ${city.en} specific content", "search_volume": "estimate", "why_valuable": "why_valuable", "format": "format"}
  ],
  "format_performance": [
    {"format": "Reels (60-90s)", "engagement_score": "high", "best_for": "awareness + viral reach", "recommended_frequency": "3-4/week"},
    {"format": "Carousels", "engagement_score": "medium-high", "best_for": "educational content + saves", "recommended_frequency": "2/week"},
    {"format": "Stories", "engagement_score": "medium", "best_for": "daily connection + polls", "recommended_frequency": "daily"},
    {"format": "YouTube Shorts", "engagement_score": "growing", "best_for": "search discovery for ${sector.en}", "recommended_frequency": "2-3/week"},
    {"format": "Blog/Long-form", "engagement_score": "low-direct/high-SEO", "best_for": "organic search capture", "recommended_frequency": "2/month"}
  ],
  "content_calendar_30days": [
    {"week": 1, "theme": "Educational: top questions in ${sector.en}", "posts": ["Day 1: Reel — top question answer", "Day 3: Carousel — step-by-step guide", "Day 5: Story poll — audience survey", "Day 7: Reel — myth-busting"]},
    {"week": 2, "theme": "Social Proof: Results and testimonials", "posts": ["Day 9: Reel — client transformation/result", "Day 11: Carousel — before/after or case study", "Day 13: Story — quick tip + CTA", "Day 14: Reel — team expertise"]},
    {"week": 3, "theme": "Behind the Scenes + Promotional", "posts": ["Day 16: Reel — day in the life", "Day 18: Carousel — service/product showcase", "Day 20: Story — limited offer", "Day 21: Reel — FAQ compilation"]},
    {"week": 4, "theme": "Community + Seasonal", "posts": ["Day 23: Reel — trending sound + ${sector.en} twist", "Day 25: Carousel — industry insight", "Day 27: Story — follower shoutout", "Day 28: Reel — strong CTA campaign"]}
  ],
  "viral_angles": [
    {"angle": "specific viral content angle for ${sector.en} — problem/solution in 30 seconds", "why_it_works": "resonates because of specific pain point", "format": "Reel", "hook": "specific opening line"},
    {"angle": "second viral angle — unexpected truth or myth about ${sector.en}", "why_it_works": "contrarian/surprising = high share rate", "format": "Reel", "hook": "hook line"},
    {"angle": "third viral angle — day in the life or before/after transformation", "why_it_works": "authentic Egyptian audience connect", "format": "Reel", "hook": "hook line"}
  ],
  "seo_quick_wins": [
    {"action": "Add ${sector.en} + ${city.en} keywords to homepage title and meta description", "impact": "20-40% local search visibility improvement", "difficulty": "easy"},
    {"action": "Create FAQ page answering top 10 Arabic questions about ${sector.en}", "impact": "Position for featured snippets in Egypt", "difficulty": "medium"},
    {"action": "Add schema markup for business/service on website", "impact": "Rich results in Google — higher CTR", "difficulty": "easy"},
    {"action": "Create Google Business Profile posts weekly", "impact": "Local pack visibility for ${city.en} searches", "difficulty": "easy"}
  ],
  "pain_points": [
    {"level": "high", "title": "No content calendar — random posting loses algorithm favor", "detail": "Inconsistent posting creates 50-70% less organic reach vs consistent brands. Algorithms reward consistency — set calendar now"},
    {"level": "high", "title": "Missing SEO foundation for ${sector.en} keywords", "detail": "Competitors ranking for top ${sector.en} terms in ${city.en} are capturing free organic traffic — this is a missed acquisition channel"},
    {"level": "med", "title": "Content focuses on promotion not value", "detail": "80% value content, 20% promotional is the proven ratio — over-promotional content reduces organic reach and follower trust"}
  ],
  "quick_wins": [
    {"action": "Publish 3 Reels this week answering top 3 questions ${sector.en} clients ask", "timeline": "This week", "money_impact": "Educational Reels get 3-5x more reach than promotional posts", "expected_result": "Organic reach boost + brand authority"},
    {"action": "Optimize Google Business Profile — add 5 photos, update hours, respond to reviews", "timeline": "Today (2 hours)", "money_impact": "Free organic local visibility for ${city.en} searches", "expected_result": "20-40% more profile clicks"},
    {"action": "Identify top 3 competitor posts with highest engagement — adapt format for ${companyName}", "timeline": "3 days", "money_impact": "Proven content angles = lower content production risk", "expected_result": "Higher engagement baseline"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": 68, "label": "Medium", "reason": "Content analysis based on sector patterns — providing social links would allow direct competitor analysis"},
  "sector_rank": "Mid-tier — Content gap opportunity",
  "plan_90_days": {
    "month1": ["Set up content calendar and publishing schedule", "Publish first 12 strategic Reels", "Optimize website for top 5 keywords"],
    "month2": ["Launch SEO blog content strategy", "Begin YouTube Shorts presence", "A/B test content formats"],
    "month3": ["Measure organic growth vs baseline", "Scale top-performing content types", "Launch UGC campaign"]
  },
  "audit_checklist": [
    {"item": "هل لديك content calendar للشهر القادم؟", "status": false},
    {"item": "هل تنشر 3+ مرات/أسبوع بانتظام؟", "status": false},
    {"item": "هل Reels/Video تمثل أكثر من 50% من محتواك؟", "status": false},
    {"item": "هل موقعك محسّن لكلمات ${sector.en} في ${city.en}؟", "status": false},
    {"item": "هل Google Business Profile يحتوي على صور وساعات عمل محدّثة؟", "status": false},
    {"item": "هل تتبع أي المحتوى يحقق أعلى engagement؟", "status": false},
    {"item": "هل لديك strategy للـ hashtags في ${sector.en}؟", "status": false},
    {"item": "هل تجمع UGC وتعيد نشره من العملاء الراضين؟", "status": false}
  ],
  "data_quality_note": "Content gap analysis based on sector patterns and Egypt search behavior — providing social links enables direct competitive content audit",
  "proposal": [
    {"title": "Content Strategy Package — ${branch.name}", "desc": "Monthly: 16 posts + 8 Reels production + SEO optimization + content calendar + performance reporting", "price": "EGP 6,000–12,000/month"},
    {"title": "Content + SEO Growth Suite", "desc": "All above + blog content (4 articles/month) + YouTube Shorts + influencer collab + keyword ranking tracking", "price": "EGP 12,000–20,000/month"}
  ],
  "why_us": [
    "Eunoia produces Arabic-first content that resonates with Egyptian audience — not generic translations",
    "In-house creative studio: faster turnaround, lower cost than external production",
    "Content strategy built on data: we know what formats perform in ${sector.en} from 30+ similar clients"
  ]
}`
}
