import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'
import { getCityMultiplier } from '../../../core/data/cities.data'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, ads } = ctx
  const bench = sector.benchmark
  const cityMultiplier = getCityMultiplier(city.key)
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasAds = Boolean(ads?.budget || ads?.metaSpend || ads?.googleSpend)

  return `${base}\n${dataBlock}

MEDIA MIX OPTIMIZATION for ${companyName} (${sector.en}, ${city.en}).
BENCHMARKS: Meta CPL ${bench.cpl_meta} (${city.en} x${cityMultiplier}), Google CPL ${bench.cpl_google}, best formats: ${bench.top_formats}
ANALYZE: Current channel allocation efficiency, optimal media mix for ${sector.en} in ${city.en}, audience concentration risk, channel synergies and sequencing.
${hasAds ? `CURRENT SPEND: Meta ${ads?.metaSpend ?? 'N/A'} | Google ${ads?.googleSpend ?? 'N/A'} | TikTok ${ads?.tiktokSpend ?? 'N/A'} | Total ${ads?.budget ?? 'N/A'}` : 'No current spend data — recommend optimal mix based on sector benchmarks.'}
Calculate: (1) Attribution model recommendation, (2) Optimal channel mix %, (3) Audience overlap analysis, (4) Funnel stage per channel, (5) Cross-channel sequencing strategy, (6) Incrementality testing plan, (7) Budget reallocation with projected impact.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Media Mix Optimization",
  "confidence": "${hasAds ? 'high' : 'medium'}",
  "executive_summary": "3 sentences on current media mix efficiency for ${companyName} and optimization opportunity",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "current_mix_analysis": {
    "total_budget": "${ads?.budget ?? 'not provided'}",
    "channel_breakdown": [
      {"channel": "Meta Ads", "current_spend": "${ads?.metaSpend ?? 'N/A'}", "current_pct": 0, "efficiency_score": 0, "cpl_actual": "${ads?.cpl ?? 'N/A'}", "cpl_benchmark": "${bench.cpl_meta}", "assessment": "specific assessment"},
      {"channel": "Google Ads", "current_spend": "${ads?.googleSpend ?? 'N/A'}", "current_pct": 0, "efficiency_score": 0, "cpl_actual": "N/A", "cpl_benchmark": "${bench.cpl_google}", "assessment": "assessment"},
      {"channel": "TikTok", "current_spend": "${ads?.tiktokSpend ?? 'N/A'}", "current_pct": 0, "efficiency_score": 0, "cpl_actual": "N/A", "cpl_benchmark": "N/A for ${sector.en}", "assessment": "assessment"}
    ],
    "concentration_risk": "Over-reliance on Meta/Google — diversity score: X/10",
    "missing_channels": ["channels not being used that competitors in ${sector.en} use effectively"],
    "attribution_model": "Last-click is default but multi-touch recommended — specific recommendation for ${sector.en}"
  },
  "optimal_mix_recommendation": {
    "rationale": "Why this specific mix for ${sector.en} in ${city.en} in 2025",
    "channels": [
      {"channel": "Meta Ads", "recommended_pct": 0, "recommended_budget": "EGP X", "rationale": "why this % for ${sector.en}", "funnel_stage": "awareness/consideration/conversion", "best_format": "${bench.top_formats.split(',')[0]}"},
      {"channel": "Google Ads", "recommended_pct": 0, "recommended_budget": "EGP X", "rationale": "search intent capture for ${sector.en}", "funnel_stage": "conversion", "best_format": "Search + Display"},
      {"channel": "TikTok", "recommended_pct": 0, "recommended_budget": "EGP X", "rationale": "audience age profile fit", "funnel_stage": "awareness", "best_format": "Spark Ads, In-feed video"},
      {"channel": "Retargeting", "recommended_pct": 0, "recommended_budget": "EGP X", "rationale": "decision cycle ${bench.decision_cycle} — retargeting critical", "funnel_stage": "conversion", "best_format": "Dynamic ads, reminder messages"},
      {"channel": "WhatsApp/CRM", "recommended_pct": 0, "recommended_budget": "EGP X", "rationale": "84% WhatsApp penetration Egypt — high conversion for ${sector.en}", "funnel_stage": "nurture/close", "best_format": "Automated sequences"}
    ]
  },
  "channel_synergies": [
    {"channels": ["Meta", "Google"], "synergy": "Meta awareness drives branded Google search — measure lift", "implementation": "specific tracking recommendation"},
    {"channels": ["TikTok", "Meta"], "synergy": "TikTok drives trend awareness, Meta converts — sequenced messaging", "implementation": "cross-platform retargeting setup"},
    {"channels": ["Paid", "WhatsApp"], "synergy": "Paid ad drives to WhatsApp for high-touch close — optimal for ${sector.en}", "implementation": "Click-to-WhatsApp campaign setup"}
  ],
  "customer_journey_by_channel": {
    "awareness": {"channels": ["Meta video", "TikTok", "YouTube"], "content_type": "specific content for ${sector.en}", "budget_pct": 30},
    "consideration": {"channels": ["Meta carousel", "Google Display", "Instagram Stories"], "content_type": "social proof + education", "budget_pct": 25},
    "conversion": {"channels": ["Google Search", "Meta retargeting", "WhatsApp"], "content_type": "offer + urgency + testimonial", "budget_pct": 35},
    "retention": {"channels": ["WhatsApp", "Email", "Meta custom audience"], "content_type": "loyalty + upsell", "budget_pct": 10}
  },
  "incrementality_testing": [
    {"test": "Meta holdout test", "hypothesis": "What % of conversions would happen without Meta ads", "duration": "4 weeks", "budget_impact": "hold 20% audience unexposed"},
    {"test": "Google vs Meta attribution", "hypothesis": "Which channel drives final conversion for ${sector.en}", "duration": "6 weeks", "budget_impact": "split test with UTM tracking"}
  ],
  "seasonality_budget_shifts": [
    {"period": "${bench.peak_seasons.split(',')[0] ?? 'Ramadan'}", "recommended_budget_increase": "X% — peak demand season", "channel_focus": "specific channel for this period", "content_strategy": "specific approach"},
    {"period": "Off-peak", "recommended_budget_adjustment": "reduce by X%, shift to retargeting + retention", "channel_focus": "retention channels", "content_strategy": "loyalty + re-engagement"}
  ],
  "projections": {
    "current_estimated_cpl": "${ads?.cpl ?? 'benchmark: ' + bench.cpl_meta}",
    "optimized_cpl": "X EGP (Y% improvement with recommended mix)",
    "current_estimated_roas": "${ads?.roas ?? 'not tracked'}",
    "optimized_roas": "Xx (improvement rationale)",
    "timeline_to_see_results": "4-8 weeks to see CPL improvement, 3 months for full optimization"
  },
  "quick_wins": [
    {"action": "Launch Click-to-WhatsApp campaign on Meta — proven 40% higher conversion for ${sector.en}", "timeline": "3 days", "money_impact": "Lower cost per qualified lead", "expected_result": "X% CPL reduction"},
    {"action": "Set up retargeting audiences for website visitors + video viewers (30% watched)", "timeline": "5 days", "money_impact": "5-8x lower CPL on retargeting vs cold", "expected_result": "Immediate cost efficiency on warm audiences"},
    {"action": "Consolidate Meta campaign structure: 1 CBO per funnel stage instead of many ABOs", "timeline": "7 days", "money_impact": "10-20% budget efficiency improvement", "expected_result": "Better algorithm learning, lower CPL"}
  ],
  "risk_alerts": [
    {"type": "channel_concentration", "message": "${hasAds ? 'High concentration in single channel creates vulnerability' : 'Unknown mix — channel concentration risk unassessed'}", "severity": "medium", "fix": "Diversify to at least 3 channels with different audience pools"}
  ],
  "confidence_score": {"pct": ${hasAds ? 80 : 60}, "label": "${hasAds ? 'High' : 'Medium'}", "reason": "${hasAds ? 'Real spend data provided — mix analysis based on actual allocation' : 'Sector benchmark model — actual spend data would enable precise analysis'}"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["Set up proper UTM tracking across all channels", "Launch Click-to-WhatsApp campaign", "Build retargeting audiences for all funnel stages"],
    "month2": ["Implement recommended budget reallocation", "Start incrementality test on primary channel", "Add TikTok if not present — low CPM, growing ${sector.en} audience"],
    "month3": ["Analyze incrementality results", "Optimize seasonal budget allocation based on performance data", "Scale best-performing channel mix for ${sector.en} in ${city.en}"]
  },
  "audit_checklist": [
    {"item": "UTM tracking on all paid channels", "status": false},
    {"item": "Cross-channel attribution model defined", "status": false},
    {"item": "Retargeting audiences set up for all funnel stages", "status": false},
    {"item": "Click-to-WhatsApp campaign active", "status": false},
    {"item": "Audience overlap between platforms analyzed", "status": false},
    {"item": "Budget shifted seasonally per ${sector.en} calendar", "status": false},
    {"item": "At minimum 3 channels active with distinct audiences", "status": false},
    {"item": "Channel synergy tracking in place", "status": false}
  ],
  "data_quality_note": "${hasAds ? 'Good confidence — real spend data analyzed; channel-level CPL data would improve analysis further' : 'Medium confidence — sector benchmark model; connect ad accounts for channel-specific optimization'}",
  "proposal": [
    {"title": "Media Mix Audit", "desc": "2-week analysis: attribution setup, channel efficiency report, optimal mix recommendation, implementation roadmap", "price": "EGP 8,000-15,000 flat"},
    {"title": "Full Media Management", "desc": "Monthly management of all paid channels: Meta + Google + TikTok + WhatsApp, weekly optimization, monthly reporting", "price": "EGP 10,000-25,000/month"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: we manage multi-channel budgets for ${sector.en} businesses — we know what works together",
    "Egypt-specific media mix: we understand local platform behavior, not global averages",
    "Attribution expertise: proper tracking setup that gives you real data, not guesses",
    "Performance guarantee: for UAE branch, if qualified leads don't come, you don't pay management fees"
  ]
}`
}
