import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Supabase admin client (service role — bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const body = await req.json()
    const { name, phone, email, company, sector, city } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // 1. Generate quick report
    const report = {
      company,
      sector,
      opportunity_score: Math.floor(Math.random() * 30) + 70,
      top_opportunity: getTopOpportunity(sector),
      quick_wins: getQuickWins(sector),
      market_insight: getMarketInsight(sector),
      recommendation: 'تواصل مع Eunoia Zones للحصول على تقرير تفصيلي كامل',
    }

    // 2. Save lead to Supabase
    const { error: dbError } = await supabaseAdmin
      .from('demo_leads')
      .insert({
        name,
        phone: phone || null,
        email,
        company: company || null,
        sector: sector || null,
        city: city || null,
        report_data: report,
      })

    if (dbError) {
      console.error('Supabase insert error:', dbError)
      // Don't fail the request — still send the email
    }

    // 3. Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Eunoia Intelligence <onboarding@resend.dev>',
      to: [email],
      subject: `تقريرك الذكي جاهز — ${company || 'شركتك'} 🎯`,
      html: buildEmailHtml(name, company, sector, city, report),
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: 'Failed to send email', detail: emailError }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Demo API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getTopOpportunity(sector: string): string {
  const map: Record<string, string> = {
    'عقارات': 'استهداف المشترين الجدد عبر Meta Ads بـ CPL منخفض',
    'تجزئة': 'زيادة الـ repeat purchase عبر WhatsApp automation',
    'مطاعم': 'حملات Reels + تجربة delivery محسّنة',
    'تعليم': 'Webinars مجانية لجذب leads عالية الجودة',
    'صحة': 'Google Ads لاستهداف البحث المحلي',
    'تكنولوجيا': 'Content marketing + SEO عربي',
  }
  return map[sector] || 'تفعيل حضور رقمي متكامل عبر القنوات الأساسية'
}

function getQuickWins(_sector: string): string[] {
  return [
    'تحسين صفحة Google My Business',
    'تفعيل Meta Pixel وتتبع التحويلات',
    'إنشاء WhatsApp Business catalog',
  ]
}

function getMarketInsight(sector: string): string {
  return `قطاع ${sector || 'السوق'} في مصر يشهد نمواً ملحوظاً في الطلب الرقمي خلال 2025`
}

function buildEmailHtml(
  name: string,
  company: string,
  sector: string,
  city: string,
  report: Record<string, unknown>
): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;direction:rtl">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px">
<tr><td>
<table width="600" align="center" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">

<!-- Header -->
<tr><td style="background:#1a1a1a;padding:32px;border-radius:12px 12px 0 0;text-align:center">
<div style="color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px">EUNOIA ZONES</div>
<div style="color:white;font-size:22px;font-weight:700">Marketing Intelligence</div>
<div style="color:#888;font-size:13px;margin-top:4px">Decision Engine</div>
</td></tr>

<!-- Body -->
<tr><td style="background:white;padding:40px;border-radius:0 0 12px 12px">

<p style="color:#333;font-size:18px;font-weight:600;margin:0 0 8px">أهلاً ${name}،</p>
<p style="color:#666;font-size:15px;margin:0 0 32px">تقريرك الذكي لـ <strong>${company || 'شركتك'}</strong> جاهز 🎯</p>

<!-- Score -->
<div style="background:#f8f6f1;border-right:4px solid #c9a84c;padding:20px 24px;border-radius:8px;margin-bottom:24px">
<div style="color:#888;font-size:12px;margin-bottom:4px">Opportunity Score</div>
<div style="color:#1a1a1a;font-size:36px;font-weight:700">${report.opportunity_score}<span style="font-size:18px;color:#888">/100</span></div>
<div style="color:#c9a84c;font-size:13px;margin-top:4px">فرص تسويقية واعدة في ${sector || 'قطاعك'}</div>
</div>

<!-- Top Opportunity -->
<div style="margin-bottom:24px">
<div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:12px">🎯 أكبر فرصة لك الآن</div>
<div style="background:#fff8e7;border:1px solid #f0d98a;padding:16px;border-radius:8px;color:#5a4a00;font-size:14px">
${report.top_opportunity}
</div>
</div>

<!-- Quick Wins -->
<div style="margin-bottom:32px">
<div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:12px">⚡ Quick Wins — ابدأ بيهم هذا الأسبوع</div>
${(report.quick_wins as string[]).map((w: string) => `
<div style="display:flex;align-items:flex-start;margin-bottom:8px">
<span style="color:#c9a84c;margin-left:8px;font-weight:700">•</span>
<span style="color:#444;font-size:14px">${w}</span>
</div>`).join('')}
</div>

<!-- CTA -->
<div style="text-align:center;background:#1a1a1a;padding:28px;border-radius:10px">
<div style="color:white;font-size:16px;font-weight:600;margin-bottom:8px">احصل على تقرير تفصيلي كامل</div>
<div style="color:#888;font-size:13px;margin-bottom:20px">22 محور تحليلي • بيانات حقيقية • استراتيجية قابلة للتنفيذ</div>
<a href="https://wa.me/201005489864?text=مرحباً، أريد تقرير تفصيلي لـ ${encodeURIComponent(company || 'شركتي')}"
   style="background:#c9a84c;color:#1a1a1a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
تواصل معنا الآن
</a>
</div>

<p style="color:#aaa;font-size:11px;text-align:center;margin-top:24px">
Eunoia Zones Agency • eunoiazones.com
</p>

</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`
}
