import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, city, projectType, projectLocation, projectSize } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const projDesc = [projectType, projectLocation, projectSize].filter(Boolean).join(' | ') || 'Real Estate Project'

  return `${base}\n${dataBlock}

PROJECT DETAILS: ${projDesc}
TASK: Generate a Real Estate Investment Feasibility & Marketing Strategy Report for ${companyName}.
Context: Egypt real estate 2025 benchmarks — residential yield 7-10% annually, luxury 8-12%, commercial 10-14%. Average price appreciation 15-25% YoY in prime locations. Typical pre-sales absorption target 30% in launch month. Mortgage penetration 8% (most buyers pay cash or installments direct from developer).
This is exhibition-quality investment analysis for serious developers and investors.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Investment Feasibility & Marketing Strategy",
  "feasibility_score": {
    "total": 0,
    "grade": "A/B/C/D",
    "verdict": "Strong GO / Conditional GO / High Risk — Revise / Not Recommended",
    "confidence": "Medium — based on market benchmarks (higher with project financials)",
    "dimensions": {
      "market_demand": {"score": 0, "weight": 25, "rationale": "demand assessment for ${projectType || 'residential'} in ${projectLocation || city.en}"},
      "financial_returns": {"score": 0, "weight": 25, "rationale": "yield and appreciation potential"},
      "competitive_position": {"score": 0, "weight": 20, "rationale": "differentiation vs competing projects"},
      "location_quality": {"score": 0, "weight": 15, "rationale": "infrastructure, accessibility, amenities"},
      "developer_capability": {"score": 0, "weight": 15, "rationale": "track record and execution capacity"}
    }
  },
  "project_overview": {
    "type": "${projectType || 'Residential Development'}",
    "location": "${projectLocation || city.en}",
    "scale": "${projectSize || 'To be confirmed'}",
    "development_type": "For Sale / Rental / Mixed",
    "target_completion": "estimated delivery timeline based on project size",
    "key_risk_flag": "the single biggest risk that could impact feasibility"
  },
  "financial_projections": {
    "revenue": {
      "avg_price_psm": "EGP X,000–X,000 per sqm (benchmark for ${projectLocation || city.en} ${projectType || 'residential'} 2025)",
      "total_sellable_area": "${projectSize || 'To be confirmed'}",
      "gross_development_value": "EGP X–X million (estimated)",
      "pre_sales_target_month1": "X% of units = X units = EGP X million",
      "absorption_rate": "X units/month at market rate for this location",
      "break_even_sales": "X% of units sold = EGP X million"
    },
    "costs": {
      "land_cost_estimate": "EGP X–X million (benchmark for ${projectLocation || city.en})",
      "construction_cost_psm": "EGP X,000–X,000 (standard/premium finish)",
      "marketing_budget": "2-4% of GDV = EGP X–X million recommended",
      "total_development_cost_estimate": "EGP X–X million",
      "contingency": "10-15% recommended"
    },
    "returns": {
      "gross_profit_margin": "X% (estimated — GDV minus total costs)",
      "net_developer_profit": "EGP X–X million",
      "roi": "X% on total investment",
      "irr_estimate": "X% per annum (estimated)",
      "payback_period": "X months from first sale to full capital recovery",
      "comparison_vs_benchmark": "vs Egypt real estate average ROI X% — above/below/in line"
    }
  },
  "market_analysis": {
    "demand_assessment": {
      "population_growth": "specific growth data for ${projectLocation || city.en} and its effect on demand",
      "income_levels": "HHI distribution for target buyer in ${projectLocation || city.en}",
      "housing_deficit": "Egypt housing deficit context — X million units backlog, demand drivers",
      "absorption_market_data": "similar projects absorbed X units/month in this area over past 12 months",
      "demand_verdict": "Strong / Moderate / Weak with 1-sentence specific rationale"
    },
    "supply_analysis": {
      "competing_projects": ["Real competitor project 1 in ${projectLocation || city.en} with price and status", "Real competitor project 2", "Real competitor project 3"],
      "pipeline_risk": "X,000 units planned for delivery in ${projectLocation || city.en} next 24 months — impact on pricing",
      "differentiation_gap": "specific gap this project can fill that competitors don't address"
    },
    "pricing_analysis": {
      "market_price_range": "EGP X,000–X,000 psm for comparable projects in ${projectLocation || city.en}",
      "premium_justification": "what features justify premium pricing vs market",
      "payment_plan_benchmark": "market standard: X% down, X% during construction, X% on delivery",
      "recommended_price_position": "price at / below / above market — specific rationale"
    }
  },
  "risk_assessment": [
    {
      "risk": "Market saturation in ${projectLocation || city.en}",
      "probability": "medium/high",
      "financial_impact": "EGP X–X million revenue risk",
      "mitigation": "specific differentiation or pre-sales strategy",
      "severity": "high/medium/low"
    },
    {
      "risk": "Construction cost inflation (cement, steel pricing in Egypt)",
      "probability": "high",
      "financial_impact": "X% margin compression",
      "mitigation": "lock in material contracts early, add 15% contingency to cost base",
      "severity": "medium"
    },
    {
      "risk": "Currency devaluation impact on material costs",
      "probability": "medium",
      "financial_impact": "X% cost increase if EGP weakens further",
      "mitigation": "dollarize pricing where market allows, hedge imported materials",
      "severity": "high"
    },
    {
      "risk": "Absorption rate slower than projected",
      "probability": "medium",
      "financial_impact": "delays cash flow, extends payback period by X months",
      "mitigation": "aggressive pre-sales incentives, broker commission, flexible payment plans",
      "severity": "high"
    },
    {
      "risk": "Regulatory / permitting delays",
      "probability": "low-medium",
      "financial_impact": "X months delay = EGP X million carrying cost",
      "mitigation": "begin permitting 6-12 months before ground-breaking",
      "severity": "medium"
    }
  ],
  "opportunity_score_dimensions": {
    "total": 0,
    "grade": "A/B/C",
    "breakdown": {
      "location_premium": {"score": 0, "rationale": "specific location advantage or disadvantage in ${projectLocation || city.en}"},
      "timing": {"score": 0, "rationale": "market cycle position — buyer's or developer's market"},
      "product_fit": {"score": 0, "rationale": "how well ${projectType || 'residential'} matches local demand"},
      "competitive_moat": {"score": 0, "rationale": "defensibility of market position"},
      "financial_upside": {"score": 0, "rationale": "ROI vs risk vs alternatives"}
    }
  },
  "go_nogo_recommendation": {
    "decision": "GO / CONDITIONAL GO / NO-GO",
    "confidence": "X%",
    "rationale": "3 sentences: overall assessment, key strength, key condition or risk",
    "conditions": ["condition 1 that must be met before proceeding", "condition 2", "condition 3"],
    "immediate_next_steps": [
      "Step 1: specific action before committing capital",
      "Step 2: validation milestone",
      "Step 3: go/no-go decision checkpoint date"
    ]
  },
  "marketing_strategy_brief": {
    "positioning": "1 sentence: how to position this project in the market",
    "target_primary": "primary buyer persona in 2 sentences",
    "target_secondary": "secondary buyer persona in 1 sentence",
    "launch_budget_recommendation": "EGP X–X million for first 3 months (X% of projected GDV)",
    "pre_sales_strategy": "3-phase pre-sales approach: VIP list → broker launch → public launch",
    "sales_velocity_target": "X units/month minimum to meet financial projections",
    "channel_priority": ["1. Meta Ads — lead volume", "2. Google Search — intent capture", "3. Property portals — ready buyers", "4. Broker network — commission upside", "5. Events — VIP and investor segment"],
    "kpis": ["CPL target: EGP X–X", "Pre-sales target: X units in first 30 days", "Site visit rate: X% of leads", "Conversion to reservation: X%"]
  },
  "agency_proposal": [
    {
      "title": "Feasibility-to-Launch Package",
      "desc": "Complete journey from this report to first reservations: detailed marketing plan, go-to-market strategy, campaign execution across all channels, sales team briefing, and monthly performance reporting",
      "price": "EGP 45,000–70,000/month",
      "best_for": "Projects at planning stage needing full marketing partner from day one"
    },
    {
      "title": "Pre-Sales Sprint — 90 Days",
      "desc": "Focused 3-month intensive to hit pre-sales targets: VIP launch event, broker network blast, full digital campaign, weekly optimization, and reservation ceremony event production",
      "price": "EGP 55,000–90,000/month",
      "best_for": "Projects needing to demonstrate pre-sales velocity to secure financing or partners"
    },
    {
      "title": "Investor Relations & Marketing",
      "desc": "Dual track: institutional investor presentations and marketing materials + retail buyer campaign. Perfect for mixed-use or investment-led projects.",
      "price": "EGP 35,000–55,000/month + EGP 20,000 one-time investor deck",
      "best_for": "Commercial, mixed-use, or large residential seeking institutional co-investors"
    }
  ]
}`
}
