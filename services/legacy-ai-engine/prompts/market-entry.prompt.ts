import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const bench = sector.benchmark

  return `${base}
${dataBlock}

TASK: Market Entry Report for ${companyName} entering ${city.en} ${sector.en} market.
Assess viability, identify barriers and success factors, and recommend entry strategy.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Market Entry Report",
  "confidence": "medium",
  "executive_summary": "3 sentences on market attractiveness, entry strategy recommendation, and key success factor for ${companyName} in ${sector.en} ${city.en}",
  "marketing_score": 60,
  "score_dimensions": {"digital_presence": 55, "content_quality": 50, "paid_performance": 50, "brand_strength": 60, "competitive_position": 55},
  "quick_wins": [
    {"action": "اختبار الفكرة بـ landing page وbudget إعلاني 5,000 EGP لقياس CPL الحقيقي في ${city.en}", "timeline": "أسبوع 1-2", "money_impact": "توفير مخاطرة كبيرة — البيانات الحقيقية أفضل من أي توقع", "expected_result": "Real CPL data for ${sector.en} in ${city.en}"},
    {"action": "مقابلة 10 عملاء محتملين في ${city.en} لفهم pain points حقيقية قبل الإطلاق", "timeline": "أسبوع 1", "money_impact": "Customer discovery يوفر شهور من الأخطاء المكلفة", "expected_result": "Validated product-market fit"},
    {"action": "تحليل الـ Facebook Ads Library للمنافسين في ${sector.en} في ${city.en}", "timeline": "3 أيام", "money_impact": "تعرف على الـ messaging الناجح مجاناً قبل تصرف ميزانية", "expected_result": "Proven ad angles to adapt"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": 62, "label": "Medium", "reason": "Market entry analysis based on sector benchmarks — real pilot data will increase accuracy to 80%+"},
  "sector_rank": "New Entrant",
  "plan_90_days": {
    "month1": ["Market validation: test campaign بـ minimal budget", "Competitor deep dive وFacebook Ad Library analysis", "Digital presence setup: موقع + سوشيال"],
    "month2": ["Soft launch: 2-3 campaigns مختلفة", "جمع أول 50 lead وتحليل جودتهم", "Refine targeting بناءً على البيانات"],
    "month3": ["Scale ما نجح", "زيادة budget 2x على الـ winning campaigns", "تأسيس market position واضح"]
  },
  "audit_checklist": [
    {"item": "هل حددت الـ target segment بدقة داخل ${city.en} لـ ${sector.en}؟", "status": false},
    {"item": "هل أجريت competitive analysis كامل للـ 5 منافسين الرئيسيين؟", "status": false},
    {"item": "هل عندك budget كافٍ لـ 6 أشهر دخول وتجريب؟", "status": false},
    {"item": "هل بنيت digital presence قبل الإطلاق؟", "status": false},
    {"item": "هل اخترت distribution channels المناسبة لـ ${sector.en}؟", "status": false},
    {"item": "هل حددت USP واضح ضد المنافسين الحاليين في ${city.en}؟", "status": false},
    {"item": "هل عندك plan B لو الـ CPL جاء أعلى من المتوقع؟", "status": false},
    {"item": "هل فهمت cultural preferences وbuying behavior في ${city.en}؟", "status": false}
  ],
  "market_assessment": {
    "attractiveness": "Medium-High based on ${sector.en} market dynamics",
    "market_size": "${bench.market_size}",
    "growth_rate": "${bench.market_growth}",
    "competition_level": "Medium-High — ${sector.en} in ${city.en} has established players",
    "barriers_to_entry": [
      "Brand awareness محتاج وقت وinvestment في ${city.en}",
      "المنافسون الحاليون عندهم customer base راسخة وloyalty programs",
      "تكلفة اكتساب العميل الأولى أعلى من المتوسط في العادة"
    ],
    "success_factors": [
      "Digital-first approach — ${bench.top_formats}",
      "Local market intelligence وfast response to ${city.en} consumer feedback",
      "Speed to market: الـ first-mover advantage في الـ digital presence الآن"
    ]
  },
  "entry_strategy": {
    "recommended_approach": "Digital-first entry: paid ads + content + landing page قبل investment كبير في operations",
    "timeline": "3 أشهر اختبار — قرار التوسع في شهر 4",
    "initial_budget": "EGP 15,000–30,000 للـ test phase (ads + setup)",
    "channels": ["Meta Ads: ${bench.cpl_meta} CPL benchmark", "Google Search: ${bench.cpl_google}", "Organic social: content strategy للـ ${sector.en}"]
  },
  "competitive_landscape": {
    "top_players": ["REAL competitor 1 in ${city.en} ${sector.en}", "REAL competitor 2", "REAL competitor 3"],
    "market_leader": "most dominant player and their main strength",
    "blue_ocean": "specific underserved segment ALL competitors ignore — ${companyName}'s entry opportunity"
  },
  "pain_points": [
    {"level": "high", "title": "عدم معرفة الـ CPL الحقيقي قبل الدخول", "detail": "كل السوق مختلف — CPL في ${city.en} لـ ${sector.en} محتاج test حقيقي. ابدأ بـ validation campaign صغيرة قبل الـ full investment"},
    {"level": "med", "title": "الدخول بسرعة كبيرة قبل التحقق", "detail": "الدخول بـ full budget قبل validation هو أكبر خطأ في الـ market entry — ابدأ صغير وscale ما يثبت نجاحه"}
  ],
  "data_quality_note": "Market entry analysis based on ${sector.en} sector benchmarks in Egypt 2025 — real pilot campaign data will significantly improve accuracy",
  "proposal": [
    {"title": "Market Entry Sprint — ${branch.name}", "desc": "3-month validation: research، digital setup، test campaigns، data collection، go/no-go recommendation", "price": "EGP 8,000–15,000 one-time"},
    {"title": "Market Launch Package — ${branch.name}", "desc": "6-month full launch: digital presence، campaigns، optimization، market establishment، quarterly review", "price": "EGP 12,000–20,000/month"}
  ],
  "why_us": [
    "Eunoia أطلقت 20+ brand في ${city.en} — نعرف ما ينجح وما يفشل في ${sector.en}",
    "Local market intelligence database للـ ${sector.en} من حملات حقيقية",
    "نهج مبني على البيانات: نختبر قبل ما نصرف — validation first"
  ]
}`
}
