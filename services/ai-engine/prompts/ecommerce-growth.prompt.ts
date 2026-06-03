import type { PromptContext } from './types'
import { buildBasePrompt, buildDataBlock } from './base.prompt'

export function buildPrompt(ctx: PromptContext): string {
  const { companyName, sector, city, branch } = ctx
  const base = buildBasePrompt(ctx)
  const dataBlock = buildDataBlock(ctx)
  const bench = sector.benchmark
  const hasAds = Boolean(ctx.ads?.budget || ctx.ads?.cpl)
  const hasSales = Boolean(ctx.sales?.revenue || ctx.sales?.convRate)
  const hasReal = hasAds || hasSales

  const sessions = ctx.ads?.leads ?? null
  const convRate = ctx.sales?.convRate ?? null
  const aov = ctx.sales?.aov ?? null
  const returning = ctx.sales?.returning ?? null

  return `${base}
${dataBlock}

TASK: E-commerce Growth Report for ${companyName}. Full funnel analysis: traffic, conversion, AOV, retention, LTV.

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "report_type": "E-commerce Growth Report",
  "confidence": "${hasReal ? 'high' : 'medium'}",
  "executive_summary": "3 sentences on e-commerce health and biggest growth lever for ${companyName}",
  "marketing_score": 70,
  "score_dimensions": {"digital_presence": ${ctx.websiteUrl ? 75 : 45}, "content_quality": 65, "paid_performance": ${hasAds ? 75 : 50}, "brand_strength": 65, "competitive_position": 60},
  "quick_wins": [
    {"action": "إضافة Abandoned Cart Recovery عبر WhatsApp وEmail", "timeline": "أسبوع 1", "money_impact": "استرداد 15-25% من الـ carts المتروكة — revenue مجاني من traffic موجود", "expected_result": "Higher revenue from existing traffic"},
    {"action": "A/B test صورة المنتج: lifestyle vs white background", "timeline": "7 أيام", "money_impact": "الصورة الأقوى ترفع conversion rate بـ 10-30%", "expected_result": "Higher product page conversion"},
    {"action": "إضافة Social Proof (reviews + عدد المشترين) على صفحة كل منتج", "timeline": "7 أيام", "money_impact": "Social proof يرفع conversion بـ 15-25% للمنتجات", "expected_result": "Higher trust and conversion"}
  ],
  "risk_alerts": ${!hasSales ? '[{"type":"no_sales_data","message":"أضف بيانات المبيعات (Revenue, Conversion Rate, AOV) لتحليل أدق","severity":"medium","fix":"Enter revenue, conversion rate, and AOV in the form"}]' : '[]'},
  "confidence_score": {"pct": ${hasReal ? 80 : 55}, "label": "${hasReal ? 'High' : 'Medium'}", "reason": "${hasReal ? 'Real e-commerce data provided' : 'Sector benchmarks applied'}"},
  "sector_rank": "${hasSales ? 'يمكن التحديد بعد المقارنة' : 'أضف بيانات'}",
  "plan_90_days": {
    "month1": ["Conversion rate audit وCRO fixes", "Speed optimization (هدف <3 ثانية)", "Email/WhatsApp capture setup"],
    "month2": ["A/B test product pages", "إطلاق abandoned cart recovery", "Loyalty program v1"],
    "month3": ["Scale top SKUs", "Upsell sequences", "Referral program"]
  },
  "audit_checklist": [
    {"item": "هل الموقع يُحمّل في أقل من 3 ثوانٍ؟", "status": false},
    {"item": "هل تتبع conversion rate لكل صفحة منتج؟", "status": false},
    {"item": "هل عندك abandoned cart recovery؟", "status": false},
    {"item": "هل تستخدم product recommendations في الـ checkout؟", "status": false},
    {"item": "هل عندك loyalty program؟", "status": false},
    {"item": "هل تقيس LTV مقابل CAC؟", "status": false},
    {"item": "هل تستخدم retargeting للزوار؟", "status": false},
    {"item": "هل صفحات المنتجات بها reviews واضحة؟", "status": false}
  ],
  "funnel_analysis": {
    "traffic": {
      "monthly_sessions": "${sessions ?? 'لم يُدخل'}",
      "assessment": "يحتاج Google Analytics للتحليل الكامل",
      "paid_vs_organic": "estimate — ideally 40-60% organic long-term"
    },
    "conversion": {
      "current_rate": "${convRate ?? 'متوسط E-commerce: 2-4%'}",
      "benchmark": "2-5% industry average",
      "gap": "${convRate ? 'compare vs 3% benchmark' : 'Enter conversion rate for gap analysis'}",
      "top_friction_points": [
        "صفحة checkout معقدة أو بطيئة",
        "Shipping cost مفاجئة في آخر خطوة",
        "مفيش social proof كافٍ على صفحة المنتج"
      ]
    },
    "aov": {
      "current": "${aov ?? 'لم يُدخل'}",
      "improvement_tactics": [
        "Product bundles ذات صلة بـ ${sector.en}",
        "Free shipping threshold أعلى من متوسط الـ order",
        "Upsell في الـ checkout: 'أضف X وخلي إجمالي Y'"
      ]
    },
    "retention": {
      "returning_pct": "${returning ?? 'لم يُدخل'}",
      "target": "30-50% returning customers",
      "tactics": [
        "Email sequence بعد الشراء: review + next purchase offer",
        "VIP program للأكثر شراءً",
        "Seasonal reactivation campaigns: ${bench.peak_seasons}"
      ]
    }
  },
  "pain_points": [
    {"level": "high", "title": "Conversion rate منخفض مقارنة بالـ traffic", "detail": "الـ traffic مش المشكلة — الـ conversion هي. إصلاح بطء الموقع وtrust signals يرفع المبيعات من نفس الـ traffic"},
    {"level": "med", "title": "AOV منخفض", "detail": "بدون upsell/cross-sell strategy، بتترك على الطاولة 20-40% من الـ revenue الممكن"}
  ],
  "data_quality_note": "E-commerce analysis based on ${hasReal ? 'provided data and' : ''} ${sector.en} sector benchmarks in Egypt 2025",
  "proposal": [
    {"title": "E-commerce Growth Sprint — ${branch.name}", "desc": "CRO audit، speed optimization، email automation، retargeting، 60-day optimization", "price": "EGP 6,000–12,000/month"},
    {"title": "Full E-commerce Growth Suite — ${branch.name}", "desc": "كل ما سبق + content production + influencer strategy + loyalty program + advanced analytics", "price": "EGP 15,000–25,000/month"}
  ],
  "why_us": [
    "Eunoia حسّنت 15+ متجر إلكتروني مصري بمتوسط زيادة 35% في الإيراد خلال 90 يوم",
    "Full-stack: ads + CRO + email + content في فريق واحد",
    "نفهم سلوك الشراء الأونلاين في مصر — مش best practices أجنبية"
  ]
}`
}
