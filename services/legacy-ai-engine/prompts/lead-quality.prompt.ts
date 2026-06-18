import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const bench = sector.benchmark
  const hasAds = Boolean(ctx.ads?.budget || ctx.ads?.cpl || ctx.ads?.leads)

  return `${base}
${dataBlock}

TASK: Lead Quality Analysis for ${companyName} — why leads aren't converting and how to fix it.
Analyze: CPL vs benchmark, lead qualification gaps, funnel friction, follow-up speed, audience targeting quality.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Lead Quality Analysis",
  "confidence": "${hasAds ? 'high' : 'medium'}",
  "executive_summary": "3 sentences on lead quality issues and the fix for ${companyName} in ${sector.en} — what's causing poor conversion, the key fix, and expected improvement",
  "marketing_score": 65,
  "score_dimensions": {"digital_presence": 65, "content_quality": 60, "paid_performance": ${hasAds ? 72 : 45}, "brand_strength": 62, "competitive_position": 58},
  "quick_wins": [
    {"action": "إضافة qualifying question في الـ lead form: 'ما ميزانيتك المتوقعة؟'", "timeline": "اليوم", "money_impact": "يقلل الـ leads الغير مؤهلة بـ 30-40% ويرفع جودة الـ leads المتبقية", "expected_result": "أقل leads لكن أعلى conversion rate"},
    {"action": "تفعيل follow-up تلقائي خلال 5 دقائق من استلام الـ lead", "timeline": "أسبوع 1", "money_impact": "الـ leads اللي يُتواصل معها في 5 دق تتحول بنسبة 3x أعلى", "expected_result": "زيادة 40-60% في conversion rate"},
    {"action": "إنشاء Lookalike Audience من أفضل 20% من العملاء الحاليين", "timeline": "7 أيام", "money_impact": "Lookalike campaigns تقلل CPL وترفع الجودة في نفس الوقت", "expected_result": "leads quality improvement without CPL increase"}
  ],
  "risk_alerts": [${hasAds && ctx.ads?.cpl ? `{"type":"cpl_vs_benchmark","message":"CPL الحالي ${ctx.ads.cpl} مقارنة بـ benchmark القطاع ${bench.cpl_meta} — تحليل السبب مطلوب","severity":"high","fix":"Review targeting precision and creative relevance score"}` : ''}],
  "confidence_score": {"pct": ${hasAds ? 76 : 52}, "label": "${hasAds ? 'High' : 'Medium'}", "reason": "${hasAds ? 'Real ads data available for lead quality analysis' : 'Sector benchmarks applied — add real ads data for accurate analysis'}"},
  "sector_rank": "${hasAds ? 'Determined from CPL vs benchmark comparison' : 'Add ads data to determine'}",
  "plan_90_days": {
    "month1": ["Lead scoring setup", "Qualification questions في الـ forms", "CRM tagging لكل مصدر"],
    "month2": ["A/B test lead forms", "Warm lead nurture sequence", "Sales team feedback loop"],
    "month3": ["Predictive lead scoring", "Lookalike من أفضل المتحولين", "Referral program"]
  },
  "audit_checklist": [
    {"item": "هل تتبع Lead-to-Customer conversion rate لكل channel؟", "status": false},
    {"item": "هل عندك lead scoring system يفرق بين الـ leads؟", "status": false},
    {"item": "هل follow-up بيحصل خلال 5 دقائق؟", "status": false},
    {"item": "هل الـ lead form بها qualifying questions؟", "status": false},
    {"item": "هل CRM يسجل مصدر كل lead؟", "status": false},
    {"item": "هل تعمل Lookalike Audiences من العملاء الفعليين؟", "status": false},
    {"item": "هل عندك nurture sequence للـ leads الباردة؟", "status": false},
    {"item": "هل تحسب Revenue per Lead لكل channel؟", "status": false}
  ],
  "lead_analysis": {
    "current_cpl": "${ctx.ads?.cpl ?? 'not provided'}",
    "benchmark_cpl": "${bench.cpl_meta}",
    "monthly_leads": "${ctx.ads?.leads ?? 'not provided'}",
    "quality_issues": [
      "Broad targeting يجذب leads غير مهتمة بـ ${sector.en} في ${city.en}",
      "Lead form بسيطة بدون تأهيل مسبق — أي شخص يقدر يملأها",
      "وقت الاستجابة أطول من 30 دقيقة يقتل الـ conversion rate"
    ],
    "funnel_gaps": [
      "Awareness: reach كافٍ لكن targeting يحتاج تدقيق أعمق",
      "Consideration: مفيش nurture content بين الـ lead والـ closing",
      "Conversion: friction في عملية الشراء أو التواصل"
    ]
  },
  "optimization_plan": [
    {"area": "Targeting", "action": "Narrow targeting بـ job title أو interest أكثر تحديداً لـ ${sector.en} في ${city.en}", "expected_improvement": "CPL قد يرتفع 20% لكن جودة الـ leads ترتفع 50%"},
    {"area": "Creative", "action": "استخدام testimonials وcase studies من عملاء ${sector.en} حقيقيين في ${city.en}", "expected_improvement": "CTR أعلى وleads أكثر دراية بالخدمة — lower waste"},
    {"area": "Form", "action": "إضافة 2-3 qualifying questions مع pre-filled options للـ ${sector.en}", "expected_improvement": "تقليل الـ unqualified leads بـ 35% وزيادة conversion rate"}
  ],
  "pain_points": [
    {"level": "high", "title": "Lead volume عالٍ لكن conversion منخفض", "detail": "المشكلة في ${sector.en} في مصر: volume سهل — الجودة هي التحدي الحقيقي. الحل في التأهيل المسبق والـ targeting الدقيق"},
    {"level": "med", "title": "غياب lead nurturing system", "detail": "80% من الـ leads تحتاج 2-8 نقاط تواصل قبل الشراء — بدون sequence، بتخسر الـ leads الدافئة لصالح المنافسين"}
  ],
  "data_quality_note": "Lead quality analysis based on ${hasAds ? 'provided ads data and' : ''} ${sector.en} sector benchmarks in Egypt 2025",
  "proposal": [
    {"title": "Lead Quality Optimization — ${branch.name}", "desc": "Funnel audit، targeting refinement، form A/B testing، lead scoring، 60-day optimization", "price": "EGP 5,000–10,000/month"},
    {"title": "Full Funnel Build — ${branch.name}", "desc": "Landing pages، CRM integration، automation sequences، quality scoring، continuous optimization", "price": "EGP 12,000–20,000/month"}
  ],
  "why_us": [
    "Media buyers عند Eunoia متخصصون في جودة الـ leads — مش مجرد volume وأرقام",
    "نعمل lead scoring وCRM integration لكل عميل من أول يوم",
    "قاعدة بيانات targeting خاصة بـ ${sector.en} في ${city.en} من 30+ حملة سابقة"
  ]
}`
}
