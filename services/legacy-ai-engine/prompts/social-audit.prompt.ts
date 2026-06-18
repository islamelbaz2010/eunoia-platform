import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const bench = sector.benchmark
  const hasSocial = Boolean(ctx.social?.igFollowers || ctx.social?.fbFollowers)

  return `${base}
${dataBlock}

TASK: Comprehensive Social Media Audit for ${companyName} (${sector.en}, ${city.en}).
Analyze all platforms, content quality, posting strategy, engagement benchmarks.
Benchmark: ${bench.engagement_benchmark} engagement for ${sector.en}, best formats: ${bench.top_formats}.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "Social Media Audit",
  "confidence": "${hasSocial ? 'high' : 'medium'}",
  "executive_summary": "3 sentences on social media health and top opportunity for ${companyName} in ${sector.en}",
  "marketing_score": ${hasSocial ? 72 : 55},
  "score_dimensions": {"digital_presence": ${hasSocial ? 75 : 40}, "content_quality": 65, "paid_performance": 50, "brand_strength": 60, "competitive_position": 55},
  "quick_wins": [
    {"action": "نشر 3 Reels هذا الأسبوع تجيب على أكثر 3 أسئلة يسألها عملاء ${sector.en}", "timeline": "هذا الأسبوع", "money_impact": "Reels educational تحقق reach أعلى بـ 3-5x من posts عادية", "expected_result": "زيادة الـ organic reach بـ 30-50%"},
    {"action": "تفعيل Instagram Stories يومية بـ polls وquestions", "timeline": "اليوم", "money_impact": "Stories تزيد الـ engagement وتبني community أسرع", "expected_result": "زيادة daily active followers interaction"},
    {"action": "Audit كامل لآخر 30 post وحذف/أرشفة المحتوى الضعيف", "timeline": "7 أيام", "money_impact": "Profile نظيف يرفع conversion من زوار الصفحة", "expected_result": "تحسين first impression للزوار الجدد"}
  ],
  "risk_alerts": ${!hasSocial ? '[{"type":"no_social_data","message":"No social media data provided — أضف الأرقام للحصول على تحليل دقيق","severity":"medium","fix":"Enter IG followers, engagement rate, FB followers in the form"}]' : '[]'},
  "confidence_score": {"pct": ${hasSocial ? 78 : 50}, "label": "${hasSocial ? 'High' : 'Medium'}", "reason": "${hasSocial ? 'Real social data provided for gap analysis' : 'Estimated from sector benchmarks — add social data for accuracy'}"},
  "sector_rank": "${hasSocial ? 'Determined from engagement benchmarks' : 'Add data to determine'}",
  "plan_90_days": {
    "month1": ["Content audit وإزالة المحتوى الضعيف", "إنشاء content calendar شهر كامل", "إطلاق 3 Reels أسبوعياً"],
    "month2": ["A/B test formats مختلفة", "تعاون مع micro-influencer في ${city.en}", "تحسين posting times"],
    "month3": ["Scale المحتوى الأعلى أداءً", "إطلاق UGC campaign", "إعداد social listening"]
  },
  "audit_checklist": [
    {"item": "هل تنشر بانتظام 3-5 مرات/أسبوع على كل platform؟", "status": false},
    {"item": "هل engagement rate أعلى من ${bench.engagement_benchmark}؟", "status": false},
    {"item": "هل تستخدم Reels وVideo content بشكل أساسي؟", "status": false},
    {"item": "هل عندك content calendar للشهر القادم؟", "status": false},
    {"item": "هل ترد على التعليقات خلال ساعة؟", "status": false},
    {"item": "هل تستخدم Instagram Stories يومياً؟", "status": false},
    {"item": "هل تتابع analytics أسبوعياً؟", "status": false},
    {"item": "هل visual identity موحدة عبر كل المنصات؟", "status": false}
  ],
  "platforms": {
    "instagram": {
      "followers": "${ctx.social?.igFollowers ?? 'لم يُدخل'}",
      "engagement_rate": "${ctx.social?.igEng ?? 'يحتاج قياس'}",
      "benchmark_engagement": "${bench.engagement_benchmark}",
      "assessment": "${hasSocial ? 'Real data gap analysis: compare vs benchmark' : 'Enter Instagram data for accurate assessment'}",
      "top_content_types": "${bench.top_formats}",
      "recommendations": ["زيادة Reels إلى 3-4/أسبوع", "استخدام trending audio مناسب للمحتوى العربي", "Carousel posts للمحتوى التعليمي في ${sector.en}"]
    },
    "facebook": {
      "followers": "${ctx.social?.fbFollowers ?? 'لم يُدخل'}",
      "reach": "${ctx.social?.reach ?? 'لم يُدخل'}",
      "assessment": "Facebook لا يزال منصة رئيسية للـ ${sector.en} في ${city.en}",
      "recommendations": ["نشر native video بدلاً من شيرينج من Instagram", "Groups للمجتمع حول ${sector.en}", "Facebook Ads دعم للـ organic"]
    },
    "tiktok": {
      "followers": "${ctx.social?.ttFollowers ?? 'لم يُدخل'}",
      "opportunity": "${sector.en} على TikTok يصل لجمهور 18-35 في ${city.en} بتكلفة أقل",
      "recommendations": ["محتوى behind-the-scenes", "تحديات وtrends مرتبطة بـ ${sector.en}", "Duet مع influencers في القطاع"]
    }
  },
  "content_strategy": {
    "recommended_mix": "40% Educational, 30% Behind-the-scenes/Authentic, 20% Promotional, 10% UGC/Testimonials",
    "content_pillars": ["تعليمي: نصائح وحلول مشاكل ${sector.en}", "إنساني: فريق العمل وقصص النجاح", "قبل/بعد: نتائج حقيقية", "ترويجي: عروض وخدمات بطريقة غير مباشرة"],
    "viral_angles": ["حل مشكلة شائعة في ${sector.en} بـ 60 ثانية", "رد على تعليق أو سؤال شائع بشكل غير متوقع", "Day in the life — يوم عمل عادي في ${companyName}"]
  },
  "growth_targets": {
    "instagram_followers_90d": "زيادة 20-30% من الحالي",
    "engagement_rate_target": "${bench.engagement_benchmark}",
    "reach_growth": "50-100% خلال 90 يوم"
  },
  "pain_points": [
    {"level": "high", "title": "غياب الانتظام في النشر", "detail": "الـ algorithm يعاقب الحسابات غير المنتظمة — النشر 3x/أسبوع أفضل من burst ثم توقف طويل"},
    {"level": "med", "title": "محتوى ترويجي بدون قيمة", "detail": "80% من المحتوى يجب أن يكون value-first — الترويج المباشر يقلل الـ reach ويضر الـ engagement long-term"}
  ],
  "data_quality_note": "Social audit based on ${hasSocial ? 'provided social metrics and' : ''} sector benchmarks for ${sector.en} in Egypt 2025",
  "proposal": [
    {"title": "Social Media Management — ${branch.name}", "desc": "4 منصات، 16 post/شهر، Stories يومية، community management، تقرير شهري", "price": "EGP 4,000–8,000/month"},
    {"title": "Content Studio Package — ${branch.name}", "desc": "16 posts + 8 Reels production + Influencer coordination + تعزيز مدفوع + analytics dashboard", "price": "EGP 10,000–18,000/month"}
  ],
  "why_us": [
    "Eunoia تنتج محتوى عربي أصيل يتحدث بلغة الجمهور المصري — مش ترجمة أجنبية",
    "إنتاج فيديو داخلي بسرعة وبتكلفة أقل من السوق — Reels weekly not monthly",
    "استراتيجيات ${sector.en} مجربة من 30+ عميل مشابه في ${city.en}"
  ]
}`
}
