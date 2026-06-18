import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const hasSocial = Boolean(ctx.social?.igFollowers || ctx.social?.fbFollowers)

  return `${base}
${dataBlock}

TASK: Rebranding Feasibility Report for ${companyName} (${sector.en} in ${city.en}).
Assess whether rebranding is needed, the risk/reward, and provide a full rebranding roadmap if justified.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Rebranding Feasibility",
  "confidence": "${hasSocial ? 'high' : 'medium'}",
  "executive_summary": "3 specific sentences: current brand health assessment, rebranding recommendation (yes/partial/no), and expected business impact",
  "marketing_score": 65,
  "score_dimensions": {"digital_presence": 60, "content_quality": 58, "paid_performance": 55, "brand_strength": 50, "competitive_position": 55},
  "quick_wins": [
    {"action": "Audit current brand assets: logo, colors, tone of voice — identify inconsistencies", "timeline": "This week", "money_impact": "Identify easy fixes that improve brand without full rebrand cost", "expected_result": "Brand consistency score"},
    {"action": "Run a 1-week social poll: ask audience what word they associate with ${companyName}", "timeline": "7 days", "money_impact": "Free brand perception data worth thousands in research", "expected_result": "Audience brand perception data"},
    {"action": "Check 3 top competitors brand positioning vs ${companyName} — identify the gap", "timeline": "3 days", "money_impact": "Clarify whether rebranding is competitive necessity or optional", "expected_result": "Competitive brand gap identified"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": ${hasSocial ? 68 : 52}, "label": "${hasSocial ? 'Medium-High' : 'Medium'}", "reason": "Brand assessment requires social data — ${hasSocial ? 'social data available' : 'add social data for more accurate brand health score'}"},
  "sector_rank": "Brand needs assessment",
  "plan_90_days": {
    "month1": ["Complete brand audit", "Stakeholder interviews (5-10 customers)", "Competitive brand mapping"],
    "month2": ["Define new brand positioning", "Design direction (2-3 options)", "Internal alignment"],
    "month3": ["Soft launch new brand elements", "A/B test audience response", "Full rollout plan"]
  },
  "audit_checklist": [
    {"item": "هل تتذكر جمهورك المستهدف الـ brand بوضوح؟", "status": false},
    {"item": "هل الـ visual identity (لوجو/ألوان) موحدة عبر كل المنصات؟", "status": false},
    {"item": "هل tone of voice واضح ومتسق في كل المحتوى؟", "status": false},
    {"item": "هل البراند يعبر عن قيمة حقيقية مختلفة عن المنافسين؟", "status": false},
    {"item": "هل تلقيت شكاوى أو feedback سلبي عن صورة البراند؟", "status": false},
    {"item": "هل المبيعات تتأثر سلباً بسبب الـ brand perception؟", "status": false},
    {"item": "هل دخلتم سوق أو segment جديد لا يتناسب مع الـ brand الحالي؟", "status": false},
    {"item": "هل مر أكثر من 5 سنوات بدون أي تطوير في الهوية البصرية؟", "status": false}
  ],
  "brand_health_assessment": {
    "current_score": "0-100 based on available data for ${companyName}",
    "brand_awareness": "High/Medium/Low estimate for ${sector.en} in ${city.en}",
    "brand_perception": "Positive/Neutral/Negative based on ${hasSocial ? 'social data' : 'sector patterns'}",
    "key_brand_problems": [
      "most critical brand problem for ${companyName}",
      "second problem",
      "third problem"
    ],
    "brand_strengths": ["brand strength 1", "strength 2"]
  },
  "rebranding_recommendation": {
    "verdict": "Full Rebrand / Partial Refresh / Brand Evolution / No Change Needed",
    "justification": "specific reason based on ${companyName} brand health data",
    "urgency": "Immediate / Within 6 months / Can wait 1+ year",
    "risk_if_not_done": "specific business risk of maintaining current brand"
  },
  "rebranding_roadmap": {
    "phase1": {
      "name": "Discovery & Strategy (Month 1-2)",
      "activities": ["Brand audit", "Customer research", "Competitor analysis", "New positioning definition"],
      "cost_estimate": "EGP 5,000-15,000",
      "deliverable": "Brand Strategy Document"
    },
    "phase2": {
      "name": "Design & Identity (Month 2-3)",
      "activities": ["Logo redesign options", "Color palette", "Typography", "Brand guidelines"],
      "cost_estimate": "EGP 8,000-25,000",
      "deliverable": "Complete Brand Identity Kit"
    },
    "phase3": {
      "name": "Implementation (Month 3-6)",
      "activities": ["Social media rebrand", "Website update", "Print materials", "Internal alignment"],
      "cost_estimate": "EGP 10,000-30,000",
      "deliverable": "Live New Brand Across All Channels"
    }
  },
  "competitive_brand_map": [
    {"competitor": "Real competitor name in ${city.en}", "positioning": "their brand positioning", "strength": "their brand strength", "gap_for_client": "opportunity for ${companyName} to differentiate"}
  ],
  "pain_points": [
    {"level": "high", "title": "Brand confusion or negative perception", "detail": "specific brand issue for ${companyName} in ${sector.en}"},
    {"level": "med", "title": "Inconsistent brand execution", "detail": "Inconsistent branding reduces recognition by 50% — audiences need 7+ exposures before recall"}
  ],
  "data_quality_note": "Rebranding feasibility based on ${hasSocial ? 'provided social data and' : ''} brand assessment patterns in Egypt 2025",
  "proposal": [
    {"title": "Brand Audit & Strategy — ${branch.name}", "desc": "Complete brand health assessment، competitor analysis، positioning workshop، brand strategy document", "price": "EGP 8,000-15,000 one-time"},
    {"title": "Full Rebrand Package — ${branch.name}", "desc": "Strategy + Design + Implementation across all digital and physical touchpoints", "price": "EGP 25,000-60,000 complete project"}
  ],
  "why_us": [
    "Eunoia has rebranded 15+ companies in Egypt and UAE — we know what resonates with local audiences",
    "Data-driven approach: we test brand concepts with real audience before full rollout",
    "Full-service: strategy + design + digital implementation in one team"
  ]
}`
}
