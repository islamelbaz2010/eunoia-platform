import type { PromptContext } from './types'
import { buildBasePrompt } from './base.prompt'

// Egypt 2025 macro benchmarks used across all sectors
const MACRO = `
EGYPT 2025 MACRO BENCHMARKS:
- CBE interest rate: 27.25%
- Inflation: 25% annually
- USD/EGP: ~49.5
- WACC minimum: 32% (CBE 27.25% + 5% risk premium) — use for NPV discounting
- Developer net margin benchmark: 20–35%
- Broker commission: 2–3% of sales value
`

function sectorBenchmarks(sectorType: string): string {
  switch (sectorType) {
    case 'residential':
      return `
RESIDENTIAL BENCHMARKS (Egypt 2025):
- Construction cost/sqm: Basic 4,500–6,000 EGP | Medium 7,000–9,500 EGP | Premium 11,000–16,000 EGP
- Sale prices: New Cairo 45,000–65,000 EGP/sqm | 6th October 18,000–30,000 EGP/sqm | Sheikh Zayed 22,000–38,000 EGP/sqm | North Coast 15,000–35,000 EGP/sqm
- Typical gross margin: 25–40% on residential
- Absorption rate: 60–80% pre-sales before construction
- Down payment: 10–20%; instalments over 5–10 years
- Typical project duration: 24–48 months
`
    case 'commercial':
      return `
COMMERCIAL (OFFICES / RETAIL) BENCHMARKS (Egypt 2025):
- Construction cost/sqm: 8,000–14,000 EGP (finished offices)
- Office rent (Grade A): New Cairo 800–1,200 EGP/sqm/month | Downtown Cairo 600–900 EGP/sqm/month
- Retail rent: Mall 400–800 EGP/sqm/month | Strip 200–450 EGP/sqm/month
- Typical cap rate: 8–12%
- Occupancy benchmark: 75–90%
- Fit-out cost: 3,000–8,000 EGP/sqm additional for tenants
`
    case 'hotel':
      return `
HOTEL / TOURISM BENCHMARKS (Egypt 2025):
- Construction cost/key: 600,000–1,200,000 EGP (3-star) | 1,200,000–2,500,000 EGP (4-5 star)
- ADR (Cairo 5-star): 3,500–6,000 EGP | Resort 2,000–5,000 EGP
- Occupancy benchmark: Cairo 65–80% | Coastal 55–75% (seasonal)
- RevPAR (Revenue per Available Room) target: ADR × Occupancy
- GOP margin: 35–55% (Gross Operating Profit)
- Hotel cap rate: 9–14%
- F&B revenue typically 25–35% of total hotel revenue
`
    case 'industrial':
      return `
INDUSTRIAL / LOGISTICS BENCHMARKS (Egypt 2025):
- Construction cost/sqm: Warehouse 2,500–4,000 EGP | Light Industrial 3,500–5,500 EGP
- Industrial rent: 10th Ramadan 80–150 EGP/sqm/month | 6th October 90–160 EGP/sqm/month | Borg El Arab 60–120 EGP/sqm/month
- Cap rate industrial: 10–14%
- Occupancy: 85–95% for well-located logistics
- Fit-out: minimal — base shell typical
- Demand drivers: e-commerce growth 25%+ YoY in Egypt; cold chain gap
`
    case 'medical':
      return `
MEDICAL / HEALTHCARE BENCHMARKS (Egypt 2025):
- Construction cost/sqm (hospital): 12,000–20,000 EGP | Polyclinic 8,000–13,000 EGP
- Revenue/bed/month (private hospital): 15,000–40,000 EGP
- Outpatient revenue/clinic/day: 3,000–8,000 EGP
- Payback period: 8–12 years for hospitals | 4–7 years for clinics
- EBITDA margin: 18–30%
- Occupancy target (hospital): 65–80%
- Private healthcare market growing 15–20% annually in Egypt
`
    case 'education':
      return `
EDUCATIONAL BENCHMARKS (Egypt 2025):
- Construction cost/sqm: 6,000–10,000 EGP (school) | 8,000–14,000 EGP (university campus)
- Tuition: International schools 80,000–300,000 EGP/year | National private 20,000–80,000 EGP/year
- Student:sqm ratio: 5–8 sqm/student
- Payback period: 6–10 years
- EBITDA margin at scale: 25–40%
- Ramp-up: 3–5 years to reach 80% capacity
- Demand: 500,000+ new students annually in Egypt; private school market shortage
`
    case 'mixed_use':
      return `
MIXED-USE BENCHMARKS (Egypt 2025):
- Construction cost: weighted average of residential + commercial components
- Residential pricing: 30,000–60,000 EGP/sqm (location-dependent)
- Commercial rent: 400–1,000 EGP/sqm/month
- Mixed-use premium: 10–20% above mono-use projects
- Parking: 1 space per 100 sqm commercial; 1 per unit residential
- Synergy: commercial reduces residential vacancy; retail foot traffic boosts values
- Target blended margin: 28–38%
`
    case 'coastal':
      return `
COASTAL / RESORT BENCHMARKS (Egypt 2025):
- Construction cost/sqm: Standard chalet 5,000–7,500 EGP | Premium 8,000–12,000 EGP
- North Coast prices: Ras El Hekma 20,000–45,000 EGP/sqm | Sahel 15,000–35,000 EGP/sqm | Ain Sokhna 12,000–25,000 EGP/sqm
- Selling season: May–August (90% of sales activity)
- Absorption: 50–70% pre-sales in launch season
- Installment plans: 3–7 years typical
- Seasonal rental income: 3,000–15,000 EGP/night (managed units)
- Developer margin coastal: 30–50%
`
    case 'retail_mall':
      return `
RETAIL MALL BENCHMARKS (Egypt 2025):
- Construction cost/sqm GLA: 10,000–16,000 EGP (finished shell)
- Fit-out for anchor tenants: developer-contributed 3,000–6,000 EGP/sqm
- Rent: Anchor tenants 200–400 EGP/sqm/month | Inline 500–900 EGP/sqm/month | F&B 600–1,000 EGP/sqm/month
- Cap rate: 9–13%
- Occupancy benchmark: 85–95%
- Revenue streams: base rent + service charges + parking + revenue share
- GLA efficiency: 60–70% of gross built area
- Mall management cost: 15–20% of gross revenue
`
    default:
      return `
GENERAL REAL ESTATE BENCHMARKS (Egypt 2025):
- Construction cost/sqm: Basic 4,500–6,000 EGP | Medium 7,000–9,500 EGP | Premium 11,000–16,000 EGP
- Developer net margin benchmark: 20–35%
`
  }
}

function sectorLabel(sectorType: string): string {
  const labels: Record<string, string> = {
    residential: 'Residential',
    commercial: 'Commercial (Offices / Retail)',
    hotel: 'Hotel / Tourism',
    industrial: 'Industrial / Logistics',
    medical: 'Medical / Healthcare',
    education: 'Educational',
    mixed_use: 'Mixed Use',
    coastal: 'Coastal / Resort',
    retail_mall: 'Retail Mall',
  }
  return labels[sectorType] ?? sectorType
}

export function buildPrompt(ctx: PromptContext): string {
  const { companyName } = ctx
  const base = buildBasePrompt(ctx)

  // Parse sector and inputs from ctx.extra
  let sectorType = 'residential'
  let inputs: Record<string, string> = {}
  if (ctx.extra) {
    try {
      const parsed = JSON.parse(ctx.extra) as { sectorType?: string; inputs?: Record<string, string> }
      if (parsed.sectorType) sectorType = parsed.sectorType
      if (parsed.inputs) inputs = parsed.inputs
    } catch {
      // fallback to defaults
    }
  }

  const projLabel = sectorLabel(sectorType)
  const inputLines = Object.entries(inputs)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  return `${base}

PROJECT TYPE: ${projLabel}
DEVELOPER: ${companyName}

USER-PROVIDED INPUTS:
${inputLines || '(no specific inputs provided — use sector benchmarks)'}
${MACRO}
${sectorBenchmarks(sectorType)}

TASK: Generate a comprehensive INVESTMENT FEASIBILITY STUDY for ${companyName} — ${projLabel} project in Egypt 2025.

Use the user-provided inputs as the primary data. Where inputs are missing, apply Egypt 2025 benchmarks above. Show all major calculations transparently. All monetary values in EGP unless noted.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "دراسة جدوى استثمارية — ${projLabel}",
  "project_name": "${companyName} — ${projLabel}",
  "sector": "${projLabel}",
  "executive_summary": "3 sentences: project viability, key return metric, main risk",
  "confidence": "high",

  "kpis": {
    "total_investment": "EGP X",
    "total_revenue": "EGP X",
    "gross_profit": "EGP X",
    "gross_margin_pct": "X%",
    "net_profit": "EGP X",
    "net_margin_pct": "X%",
    "roi": "X%",
    "irr": "X%",
    "npv": "EGP X (at 32% WACC)",
    "payback_years": "X years",
    "break_even": "EGP X in revenue"
  },

  "investment_breakdown": [
    {"item": "Land Cost", "amount": "EGP X", "pct_of_total": "X%"},
    {"item": "Construction Cost", "amount": "EGP X", "pct_of_total": "X%"},
    {"item": "Soft Costs (design, permits, legal)", "amount": "EGP X", "pct_of_total": "X%"},
    {"item": "Marketing & Sales", "amount": "EGP X", "pct_of_total": "X%"},
    {"item": "Financing Costs", "amount": "EGP X", "pct_of_total": "X%"},
    {"item": "Contingency (10%)", "amount": "EGP X", "pct_of_total": "X%"}
  ],

  "revenue_model": {
    "primary_stream": "description of main revenue (sales/rent/fees)",
    "annual_revenue_y1": "EGP X",
    "annual_revenue_y3": "EGP X",
    "annual_revenue_y5": "EGP X",
    "key_assumptions": ["assumption 1", "assumption 2", "assumption 3"]
  },

  "scenarios": {
    "optimistic": {
      "label": "Optimistic (+20%)",
      "revenue": "EGP X",
      "net_profit": "EGP X",
      "roi": "X%",
      "irr": "X%"
    },
    "base": {
      "label": "Base Case",
      "revenue": "EGP X",
      "net_profit": "EGP X",
      "roi": "X%",
      "irr": "X%"
    },
    "pessimistic": {
      "label": "Pessimistic (-20%)",
      "revenue": "EGP X",
      "net_profit": "EGP X",
      "roi": "X%",
      "irr": "X%"
    }
  },

  "cash_flow": [
    {"year": "Year 0", "investment": "EGP X", "revenue": "0", "net": "EGP -X"},
    {"year": "Year 1", "investment": "EGP X", "revenue": "EGP X", "net": "EGP X"},
    {"year": "Year 2", "investment": "EGP X", "revenue": "EGP X", "net": "EGP X"},
    {"year": "Year 3", "investment": "0", "revenue": "EGP X", "net": "EGP X"},
    {"year": "Year 4", "investment": "0", "revenue": "EGP X", "net": "EGP X"},
    {"year": "Year 5", "investment": "0", "revenue": "EGP X", "net": "EGP X"}
  ],

  "risk_matrix": [
    {"risk": "Interest rate / financing risk", "probability": "high", "impact": "high", "mitigation": "pre-sell 60% before drawing down financing"},
    {"risk": "Construction cost overrun", "probability": "medium", "impact": "high", "mitigation": "10% contingency budget; fixed-price contracts"},
    {"risk": "Market absorption slowdown", "probability": "medium", "impact": "medium", "mitigation": "flexible payment plans; phased delivery"},
    {"risk": "Regulatory / permitting delays", "probability": "medium", "impact": "medium", "mitigation": "engage licensed real estate legal advisor early"},
    {"risk": "FX / inflation impact on costs", "probability": "high", "impact": "medium", "mitigation": "USD-indexed pricing; import materials early"}
  ],

  "market_context": {
    "sector_outlook": "2-sentence sector outlook for ${projLabel} in Egypt 2025",
    "demand_drivers": ["driver 1", "driver 2", "driver 3"],
    "competitive_landscape": "brief competitive analysis for this sector",
    "location_advantage": "advantage of chosen location"
  },

  "recommendations": [
    {"priority": "high", "action": "specific action 1", "rationale": "why"},
    {"priority": "high", "action": "specific action 2", "rationale": "why"},
    {"priority": "medium", "action": "specific action 3", "rationale": "why"},
    {"priority": "medium", "action": "specific action 4", "rationale": "why"}
  ],

  "next_steps": [
    "Immediate: Appoint technical consultant and legal advisor",
    "30 days: Finalize land acquisition / title deed review",
    "60 days: Complete architectural concept and permits application",
    "90 days: Soft launch marketing and pre-sales / pre-leasing"
  ],

  "data_quality_note": "Analysis based on provided inputs and Egypt 2025 sector benchmarks. Engage quantity surveyor and financial advisor for final investment decision."
}`
}
