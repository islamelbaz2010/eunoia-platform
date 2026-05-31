import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'
import { getCityMultiplier } from '../../../core/data/cities.data'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, ads } = ctx
  const bench = sector.benchmark
  const cityMultiplier = getCityMultiplier(city.key)
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasAds = Boolean(ads?.budget || ads?.cpl || ads?.roas)

  const adsContext = hasAds
    ? `REAL DATA: Total spend ${ads?.budget} EGP, CPL: ${ads?.cpl} EGP vs sector benchmark ${bench.cpl_meta}, ROAS: ${ads?.roas}x, Meta spend: ${ads?.metaSpend ?? 'N/A'}, Google spend: ${ads?.googleSpend ?? 'N/A'}, TikTok spend: ${ads?.tiktokSpend ?? 'N/A'}, Monthly leads: ${ads?.leads ?? 'N/A'}.`
    : `No data provided — use sector benchmarks for ${sector.en} in ${city.en} to build a model.`

  return `${base}\n${dataBlock}

CAMPAIGN ROI AUDIT for ${companyName} (${sector.en}, ${city.en}).
BENCHMARKS: Meta CPL ${bench.cpl_meta} (${city.en} x${cityMultiplier}), Google CPL ${bench.cpl_google}, healthy ROAS 3-6x, CAC benchmark ${bench.cac_benchmark}.
REALITY CHECK REQUIRED: Compare every client metric to benchmark and flag gaps >30% as critical.
CAMPAIGN ROI AUDIT: ${adsContext}
Analyze: (1) CPL vs sector benchmark — is it above/below by how much %, (2) Budget allocation efficiency — is the right % going to right channels, (3) Specific waste areas: likely audience targeting issues, creative fatigue, or bid strategy problems, (4) Top 3 optimization opportunities with expected % improvement, (5) A/B test recommendations: 3 specific tests with hypothesis and success metric, (6) New audiences to test that competitors overlook in ${sector.en}, (7) Revised budget allocation with projected CPL improvement timeline.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Campaign ROI Audit",
  "confidence": "${hasAds ? 'high' : 'medium'}",
  "executive_summary": "3 sentences assessing campaign performance for ${companyName}",
  "marketing_score": 0,
  "score_dimensions": {"digital_presence": 0, "content_quality": 0, "paid_performance": 0, "brand_strength": 0, "competitive_position": 0},
  "current_performance": {
    "total_spend": "${ads?.budget ?? 'N/A'}",
    "meta_spend": "${ads?.metaSpend ?? 'N/A'}",
    "google_spend": "${ads?.googleSpend ?? 'N/A'}",
    "tiktok_spend": "${ads?.tiktokSpend ?? 'N/A'}",
    "blended_roas": "${ads?.roas ?? 'N/A'}",
    "cpl_actual": "${ads?.cpl ?? 'N/A'}",
    "cpl_benchmark": "${bench.cpl_meta}",
    "cpl_gap_pct": "calculate: (actual - benchmark) / benchmark * 100",
    "monthly_leads": "${ads?.leads ?? 'N/A'}",
    "ctr": "${ads?.ctr ?? 'N/A'}",
    "performance_grade": "A/B/C/D/F with rationale"
  },
  "channel_analysis": [
    {
      "channel": "Meta Ads",
      "spend": "${ads?.metaSpend ?? 'N/A'}",
      "performance": "Specific assessment vs sector benchmark",
      "efficiency_score": 0,
      "recommended_budget_pct": 0,
      "key_issue": "specific issue or strength",
      "optimization": "specific action"
    },
    {
      "channel": "Google Ads",
      "spend": "${ads?.googleSpend ?? 'N/A'}",
      "performance": "assessment",
      "efficiency_score": 0,
      "recommended_budget_pct": 0,
      "key_issue": "specific issue",
      "optimization": "specific action"
    },
    {
      "channel": "TikTok",
      "spend": "${ads?.tiktokSpend ?? 'N/A'}",
      "performance": "assessment",
      "efficiency_score": 0,
      "recommended_budget_pct": 0,
      "key_issue": "specific issue",
      "optimization": "specific action"
    }
  ],
  "waste_analysis": [
    {"area": "Audience Targeting", "issue": "specific waste description", "estimated_waste_pct": 0, "fix": "specific targeting fix"},
    {"area": "Creative Fatigue", "issue": "specific creative issue", "estimated_waste_pct": 0, "fix": "specific creative fix"},
    {"area": "Bid Strategy", "issue": "specific bid issue", "estimated_waste_pct": 0, "fix": "specific bid fix"}
  ],
  "optimization_opportunities": [
    {"opportunity": "specific optimization 1", "expected_cpl_improvement": "X%", "timeline": "2 weeks", "effort": "low/medium/high"},
    {"opportunity": "specific optimization 2", "expected_cpl_improvement": "X%", "timeline": "1 month", "effort": "medium"},
    {"opportunity": "specific optimization 3", "expected_cpl_improvement": "X%", "timeline": "6 weeks", "effort": "high"}
  ],
  "ab_tests": [
    {"test_name": "Headline Test", "hypothesis": "Benefit-led headlines will outperform feature-led by 20%", "variant_a": "current approach", "variant_b": "test approach", "success_metric": "CPL reduction %", "duration": "2 weeks"},
    {"test_name": "Audience Test", "hypothesis": "specific hypothesis", "variant_a": "current audience", "variant_b": "new audience segment", "success_metric": "conversion rate", "duration": "2 weeks"},
    {"test_name": "Creative Format Test", "hypothesis": "specific hypothesis", "variant_a": "current format", "variant_b": "new format", "success_metric": "CTR and CPL", "duration": "2 weeks"}
  ],
  "new_audiences": [
    {"audience": "specific untapped segment", "rationale": "why competitors miss this", "expected_cpl": "X-Y EGP", "platform": "Meta/Google/TikTok"},
    {"audience": "second audience opportunity", "rationale": "market insight", "expected_cpl": "X-Y EGP", "platform": "platform"}
  ],
  "revised_budget_allocation": [
    {"channel": "Meta Ads", "current_pct": 0, "recommended_pct": 0, "rationale": "why this allocation"},
    {"channel": "Google Ads", "current_pct": 0, "recommended_pct": 0, "rationale": "why this allocation"},
    {"channel": "TikTok", "current_pct": 0, "recommended_pct": 0, "rationale": "why this allocation"},
    {"channel": "Retargeting", "current_pct": 0, "recommended_pct": 0, "rationale": "why this allocation"}
  ],
  "projections_with_optimization": [
    {"month": "M1 (current)", "cpl": "${ads?.cpl ?? 'baseline'}", "leads": "${ads?.leads ?? 'baseline'}", "roas": "${ads?.roas ?? 'baseline'}"},
    {"month": "M2 (after opt)", "cpl": "X EGP (Y% improvement)", "leads": "X leads", "roas": "Xx"},
    {"month": "M3 (optimized)", "cpl": "X EGP", "leads": "X leads", "roas": "Xx"}
  ],
  "quick_wins": [
    {"action": "specific 7-day campaign fix", "timeline": "7 days", "money_impact": "EGP savings/improvement", "expected_result": "measurable outcome"},
    {"action": "second quick win", "timeline": "7 days", "money_impact": "EGP estimate", "expected_result": "outcome"},
    {"action": "third quick win", "timeline": "7 days", "money_impact": "EGP estimate", "expected_result": "outcome"}
  ],
  "risk_alerts": [{"type": "roas_low", "message": "specific risk", "severity": "high", "fix": "specific fix"}],
  "confidence_score": {"pct": ${hasAds ? 85 : 55}, "label": "${hasAds ? 'High' : 'Medium'}", "reason": "${hasAds ? 'Real campaign data provided' : 'Sector benchmarks used — real data would improve accuracy by 30%'}"},
  "sector_rank": "Mid-tier — Growth potential",
  "plan_90_days": {
    "month1": ["specific action with outcome", "action 2", "action 3"],
    "month2": ["action 4", "action 5", "action 6"],
    "month3": ["action 7", "action 8", "action 9"]
  },
  "audit_checklist": [
    {"item": "UTM tracking set up on all campaigns", "status": false},
    {"item": "Facebook Pixel verified firing on all key events", "status": false},
    {"item": "Google Analytics 4 integrated with ad accounts", "status": false},
    {"item": "Retargeting audiences defined and active", "status": false},
    {"item": "A/B testing running at all times", "status": false},
    {"item": "Weekly performance review scheduled", "status": false},
    {"item": "CPL vs benchmark tracked in dashboard", "status": false},
    {"item": "Creative refresh every 3-4 weeks", "status": false}
  ],
  "data_quality_note": "${hasAds ? 'High confidence analysis based on real campaign data' : 'Medium confidence — based on sector benchmarks; connect ad accounts for full accuracy'}",
  "proposal": [
    {"title": "Campaign Optimization Sprint", "desc": "2-week intensive audit + restructure: audience rebuild, creative refresh, bid strategy overhaul, A/B test setup", "price": "EGP 8,000-15,000 flat fee"},
    {"title": "Ongoing Performance Management", "desc": "Monthly campaign management + optimization + reporting + A/B testing pipeline", "price": "EGP 6,000-12,000/month"}
  ],
  "why_us": [
    "Eunoia ${ctx.branch.name}: we've optimized 50+ ${sector.en} campaigns in ${city.en} — we know what works",
    "Benchmarked CPL data across ${sector.en}: your numbers compared to real industry data, not guesses",
    "Integrated approach: strategist + media buyer + creative in one team — faster iteration cycles",
    "Transparent reporting: live dashboard, not monthly PDF"
  ]
}`
}
