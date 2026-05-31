import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'
import { getCityMultiplier } from '../../../core/data/cities.data'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, ads, sales } = ctx
  const bench = sector.benchmark
  const cityMultiplier = getCityMultiplier(city.key)
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasReal = Boolean(ads?.budget || ads?.cpl || sales?.revenue || sales?.aov)

  return `${base}\n${dataBlock}

TASK: Pricing Strategy Audit for ${companyName} (${sector.en}, ${city.en}). Compare pricing vs competitors and benchmarks. Recommend optimal price points.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Pricing Strategy Audit",
  "confidence": "${hasReal ? 'high' : 'medium'}",
  "executive_summary": "3 sentences on pricing position and opportunity for ${companyName} in ${sector.en}",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "current_pricing_assessment": {
    "position": "budget/value/mid/premium/luxury",
    "clarity": "Clear/Unclear/Hidden",
    "vs_market": "Below market/At market/Above market by X%",
    "perception_gap": "What customers think vs what you charge",
    "price_sensitivity": "High/Medium/Low for ${sector.en} in ${city.en}",
    "avg_ticket_actual": "${sales?.aov ?? 'not provided'}",
    "avg_ticket_benchmark": "${bench.avg_ticket}",
    "gap_analysis": "specific analysis of pricing vs benchmark"
  },
  "competitor_pricing_map": [
    {"competitor": "Real competitor 1 in ${city.en}", "price_tier": "budget/mid/premium", "price_range": "EGP X-Y", "value_prop": "what justifies their price", "weakness": "where their pricing loses customers"},
    {"competitor": "Real competitor 2", "price_tier": "tier", "price_range": "EGP X-Y", "value_prop": "their positioning", "weakness": "exploitable gap"},
    {"competitor": "Real competitor 3", "price_tier": "tier", "price_range": "EGP X-Y", "value_prop": "their positioning", "weakness": "exploitable gap"}
  ],
  "price_optimization": {
    "current_price_problem": "specific issue with current pricing",
    "optimal_price_range": "EGP X-Y for ${sector.en} in ${city.en} with ${city.en} premium context",
    "price_increase_potential": "X% increase achievable without losing customers — here is why",
    "psychology_tactics": ["specific pricing psychology tactic 1 for ${sector.en}", "tactic 2", "tactic 3"],
    "package_structure": [
      {"tier": "Basic", "price": "EGP X/month", "includes": ["service 1", "service 2"], "target": "who this is for"},
      {"tier": "Professional", "price": "EGP X/month", "includes": ["service 1", "service 2", "service 3"], "target": "who this is for"},
      {"tier": "Enterprise", "price": "EGP X/month or custom", "includes": ["everything + extras"], "target": "who this is for"}
    ]
  },
  "value_anchoring": {
    "anchor_product": "The high-price anchor that makes standard pricing look reasonable",
    "value_ladder": ["entry point offer", "main offer", "premium upsell"],
    "roi_messaging": "How to present price as investment not cost for ${sector.en} buyers in ${city.en}",
    "social_proof_needed": ["proof type 1 to justify pricing", "proof type 2", "proof type 3"]
  },
  "pricing_by_segment": [
    {"segment": "specific customer segment in ${sector.en}", "willingness_to_pay": "EGP X-Y", "key_decision_factor": "price/quality/trust/speed", "recommended_price": "EGP X"},
    {"segment": "second segment", "willingness_to_pay": "EGP X-Y", "key_decision_factor": "factor", "recommended_price": "EGP X"}
  ],
  "revenue_impact": {
    "current_revenue_estimate": "${sales?.revenue ?? 'not provided'}",
    "optimized_price_revenue_estimate": "X% increase if price optimization implemented",
    "ltv_improvement": "How pricing strategy changes LTV from ${bench.ltv_benchmark} to X",
    "cac_justification": "How price increase enables higher CAC budget of up to ${bench.cac_benchmark}"
  },
  "seasonal_pricing": [
    {"period": "${bench.peak_seasons.split(',')[0] ?? 'Ramadan'}", "recommended_strategy": "specific pricing strategy", "rationale": "why this works for ${sector.en}"},
    {"period": "Off-peak period", "recommended_strategy": "specific retention pricing", "rationale": "protect margin while retaining customers"}
  ],
  "quick_wins": [
    {"action": "Audit pricing page/menu and remove confusion — one clear pricing ladder", "timeline": "3 days", "money_impact": "5-15% conversion improvement", "expected_result": "Clearer buyer journey, fewer price objections"},
    {"action": "Add social proof elements next to each price tier", "timeline": "5 days", "money_impact": "10-20% price perception improvement", "expected_result": "Higher willingness to pay premium tier"},
    {"action": "Test 10-15% price increase with new value framing", "timeline": "7 days", "money_impact": "10-15% revenue increase if successful", "expected_result": "Identify price ceiling for ${sector.en} in ${city.en}"}
  ],
  "risk_alerts": [
    {"type": "price_sensitivity", "message": "25% inflation in Egypt 2025 has increased consumer price sensitivity — value messaging critical", "severity": "high", "fix": "Lead with ROI and savings, not features"}
  ],
  "confidence_score": {"pct": ${hasReal ? 80 : 60}, "label": "${hasReal ? 'High' : 'Medium'}", "reason": "Based on ${hasReal ? 'real client data + sector benchmarks' : 'sector benchmarks — actual pricing data would improve accuracy'}"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["Conduct competitor pricing audit — record all price points publicly available", "Repackage services into 3 clear tiers with value statements", "Add ROI calculators or case studies to pricing page"],
    "month2": ["Test price increase on new leads — maintain existing client pricing", "Collect testimonials specifically about value vs price", "Launch value-based pricing messaging in ads"],
    "month3": ["Analyze A/B test results — implement winning pricing structure", "Create annual contract incentives for ${sector.en} clients", "Develop premium upsell pathway for existing customers"]
  },
  "audit_checklist": [
    {"item": "Pricing is clearly displayed on website/social", "status": false},
    {"item": "3-tier package structure exists (basic/pro/enterprise)", "status": false},
    {"item": "Competitor pricing monitored quarterly", "status": false},
    {"item": "Price anchoring used on pricing page", "status": false},
    {"item": "ROI/value framing used in all ads mentioning price", "status": false},
    {"item": "Seasonal pricing strategy documented", "status": false},
    {"item": "Price sensitivity tested with A/B tests", "status": false},
    {"item": "LTV:CAC ratio tracked and above 3:1", "status": false}
  ],
  "data_quality_note": "${hasReal ? 'Good confidence — real pricing and revenue data provided' : 'Medium confidence — add actual price list and competitor prices for precise recommendations'}",
  "proposal": [
    {"title": "Pricing Strategy Workshop", "desc": "1-day intensive: competitor pricing audit, package restructure, value messaging framework, implementation roadmap", "price": "EGP 5,000-10,000 flat"},
    {"title": "Revenue Optimization Program", "desc": "3-month program: pricing test implementation, A/B testing, conversion optimization, monthly reporting", "price": "EGP 8,000-15,000/month"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: we've set pricing for 30+ ${sector.en} businesses in ${city.en} — we know the market ceiling",
    "Data-backed pricing: our sector benchmarks come from real campaigns, not guesses",
    "EGP inflation expertise: we understand 2025 consumer psychology in Egypt specifically",
    "Revenue focus: our incentive is to increase your revenue, not just manage your ads"
  ]
}`
}
