import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const bench = sector.benchmark

  return `${base}
${dataBlock}

TASK: Seasonal Campaign Planner for ${companyName} (${sector.en}) — full year calendar with budget and creative strategy.
Key peak seasons: ${bench.peak_seasons}

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Seasonal Campaign Planner",
  "confidence": "high",
  "executive_summary": "3 sentences on top 3 revenue seasons for ${sector.en} in ${city.en} and annual campaign strategy",
  "marketing_score": 72,
  "score_dimensions": {"digital_presence": 68, "content_quality": 70, "paid_performance": 68, "brand_strength": 72, "competitive_position": 65},
  "quick_wins": [
    {"action": "ابدأ التخطيط للموسم القادم في ${sector.en} الآن — قبل 6 أسابيع من موعده", "timeline": "هذا الأسبوع", "money_impact": "التخطيط المبكر يقلل CPL بـ 30% مقارنة بالحملات العشوائية", "expected_result": "Lower CPL in peak season"},
    {"action": "أنشئ templates جاهزة للمواسم الثلاثة الكبرى (رمضان، عيد، صيف)", "timeline": "2-3 أسابيع", "money_impact": "توفير 40-50% من تكلفة الإنتاج لاحقاً", "expected_result": "Faster seasonal campaign deployment"},
    {"action": "احجز المصورين والـ influencers الآن للموسم القادم", "timeline": "هذا الأسبوع", "money_impact": "توفير 30-50% مقارنة بالحجز اللحظي في الموسم", "expected_result": "Better rates and availability"}
  ],
  "risk_alerts": [],
  "confidence_score": {"pct": 82, "label": "High", "reason": "Seasonal patterns for ${sector.en} in Egypt are well-documented with high predictability"},
  "sector_rank": "Seasonal leader potential",
  "plan_90_days": {
    "month1": ["تحديد 3 مواسم رئيسية وأولوياتها", "إنشاء campaign briefs لكل موسم", "بناء creative template library"],
    "month2": ["إطلاق أول حملة موسمية", "A/B test messaging الموسمي", "إعداد automated email sequences"],
    "month3": ["تحليل نتائج الموسم الأول", "تحضير حملة الموسم القادم", "بناء lookalike audiences من المشترين الموسميين"]
  },
  "audit_checklist": [
    {"item": "هل عندك calendar بالمواسم والأعياد القادمة؟", "status": false},
    {"item": "هل تبدأ التخطيط 4-6 أسابيع مسبقاً؟", "status": false},
    {"item": "هل عندك creative مخصص لكل موسم؟", "status": false},
    {"item": "هل تزيد الـ budget كفاية في الـ peak seasons؟", "status": false},
    {"item": "هل تستفيد من الـ warm audiences من مواسم سابقة؟", "status": false},
    {"item": "هل عندك offers خاصة بكل موسم؟", "status": false},
    {"item": "هل تتابع ما يعمله المنافسون في كل موسم؟", "status": false},
    {"item": "هل عندك post-season retargeting؟", "status": false}
  ],
  "annual_calendar": [
    {"season": "رمضان", "timing": "شهر كامل — يتغير تاريخه سنوياً", "relevance": "HIGH لمعظم القطاعات — ${sector.en} يشهد تغيير كبير في سلوك الاستهلاك", "budget_increase": "50-150%", "best_message": "الحلول التي تناسب الروتين الرمضاني وتوفر الوقت والراحة", "creative_angle": "${bench.top_formats}", "start_campaign": "6 أسابيع قبل بداية رمضان"},
    {"season": "عيد الفطر", "timing": "آخر 10 أيام رمضان + 3 أيام العيد", "relevance": "HIGH — ذروة الشراء في السنة", "budget_increase": "70-120%", "best_message": "الاحتفال والعطاء والاستمتاع — مناسبات خاصة", "creative_angle": "Lifestyle, gifting, celebration", "start_campaign": "2 أسابيع قبل نهاية رمضان"},
    {"season": "الصيف", "timing": "يونيو-أغسطس", "relevance": "MEDIUM — يختلف حسب القطاع", "budget_increase": "30-60%", "best_message": "مناسب للموسم — راحة، ترفيه، استمتاع بالصيف", "creative_angle": "Outdoor, lifestyle, seasonal offers", "start_campaign": "15 مايو"},
    {"season": "العودة للمدارس", "timing": "أغسطس-سبتمبر", "relevance": "يختلف حسب ${sector.en}", "budget_increase": "20-50%", "best_message": "الاستعداد، البداية الجديدة، الإنجاز", "creative_angle": "Preparation, achievement, fresh start", "start_campaign": "أول أغسطس"},
    {"season": "نهاية السنة", "timing": "ديسمبر", "relevance": "MEDIUM-HIGH — احتفالات وأهداف جديدة", "budget_increase": "40-80%", "best_message": "إنجازات السنة وأهداف القادمة", "creative_angle": "Year-end review, new year goals", "start_campaign": "1 ديسمبر"},
    {"season": "يناير — New Year Goals", "timing": "يناير كامل", "relevance": "HIGH لـ gym/health/education — MEDIUM لباقي القطاعات", "budget_increase": "40-100%", "best_message": "التغيير والتطوير وتحقيق الأهداف", "creative_angle": "Transformation, commitment, achievement", "start_campaign": "28 ديسمبر"}
  ],
  "campaign_ideas": {
    "ramadan": [
      "Series محتوى يومي '30 نصيحة في 30 يوم' مرتبطة بـ ${sector.en}",
      "Live Q&A أسبوعي في وقت السحور أو قبل الإفطار",
      "Collaboration مع food delivery لـ Iftar special offer"
    ],
    "eid": [
      "'هدية العيد' — package خاص بسعر مميز لوقت محدود",
      "Campaign UGC: شارك لحظة عيدك مع ${companyName}",
      "Flash sale 48 ساعة في أول يومين العيد"
    ],
    "summer": [
      "Campaign 'صيفك مع ${companyName}' — lifestyle focused",
      "Behind-the-scenes من الفريق في الصيف",
      "Challenge على TikTok مرتبط بـ ${sector.en}"
    ]
  },
  "pain_points": [
    {"level": "high", "title": "الاستعداد اللحظي للمواسم", "detail": "الشركات اللي تبدأ إعلانات رمضان في رمضان خسرت 6 أسابيع من الـ brand building — المنافسون المستعدون يأخذون الـ market share"},
    {"level": "med", "title": "نفس الـ creative في كل موسم", "detail": "الجمهور يتعرف على المحتوى المعاد — كل موسم يحتاج angle جديد وresonate مع اللحظة"}
  ],
  "data_quality_note": "${sector.en} seasonal patterns in Egypt 2025 — well-established data with high confidence",
  "proposal": [
    {"title": "Seasonal Campaign Package — ${branch.name}", "desc": "Annual calendar، 4 حملات مواسم كبرى، creative production، media buying، reporting", "price": "EGP 8,000–15,000/month"},
    {"title": "Campaign Sprint — موسم واحد — ${branch.name}", "desc": "استراتيجية موسم كامل: creative + media + optimization + تقرير", "price": "EGP 5,000–10,000 per season"}
  ],
  "why_us": [
    "Eunoia نفّذت 200+ حملة موسمية في مصر — نعرف ما ينجح في كل موسم لكل قطاع",
    "Arabic creative studio داخلي — لا تأخير ولا outsourcing",
    "Seasonal ROI database: نعرف CPL وROAS المتوقع في كل موسم لـ ${sector.en}"
  ]
}`
}
