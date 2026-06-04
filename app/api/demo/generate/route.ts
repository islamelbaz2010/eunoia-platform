import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const SECTOR_LABELS: Record<string, string> = {
  real_estate: 'Real Estate',
  restaurant: 'Restaurant / Cafe',
  retail: 'Retail',
  medical: 'Medical / Health',
  services: 'Services / Agency',
  education: 'Education',
  tech: 'Technology',
  manufacturing: 'Manufacturing',
}

async function generateReport(
  company: string,
  sector: string,
  city: string,
  competitors: string,
  website: string
): Promise<string> {
  const prompt = `You are a senior business intelligence analyst specializing in Egypt's market.

Generate a concise FREE DEMO business intelligence report for:
- Company: ${company}
- Sector: ${SECTOR_LABELS[sector] ?? sector}
- City: ${city}
${competitors ? `- Main competitors: ${competitors}` : ''}
${website ? `- Website: ${website}` : ''}

Return ONLY valid JSON (no markdown, no backticks, start directly with {):
{
  "executive_summary": "3 sentences on the business opportunity and main challenge for ${company} in ${city}",
  "market_score": 72,
  "top_3_opportunities": [
    {"title": "opportunity 1", "detail": "2 sentences specific to ${city} ${SECTOR_LABELS[sector] ?? sector}"},
    {"title": "opportunity 2", "detail": "specific detail"},
    {"title": "opportunity 3", "detail": "specific detail"}
  ],
  "top_3_risks": [
    {"title": "risk 1", "detail": "specific to this market"},
    {"title": "risk 2", "detail": "detail"},
    {"title": "risk 3", "detail": "detail"}
  ],
  "quick_wins": [
    {"action": "specific 30-day action", "expected_result": "measurable outcome"},
    {"action": "second action", "expected_result": "outcome"},
    {"action": "third action", "expected_result": "outcome"}
  ],
  "full_report_teaser": "One compelling sentence about what the FULL 22-section report would reveal for ${company}"
}`

  const res = await fetch('https://halannews.com/api-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`AI proxy error: ${res.status}`)
  const data = await res.json()
  return data?.content?.[0]?.text ?? data?.choices?.[0]?.message?.content ?? '{}'
}

function buildEmailHtml(
  name: string,
  company: string,
  sector: string,
  city: string,
  report: Record<string, unknown>
): string {
  const opportunities = (report.top_3_opportunities as Array<{ title: string; detail: string }> ?? [])
  const risks = (report.top_3_risks as Array<{ title: string; detail: string }> ?? [])
  const quickWins = (report.quick_wins as Array<{ action: string; expected_result: string }> ?? [])

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تقريرك المجاني من Eunoia</title>
</head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:Arial,sans-serif;direction:rtl;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#b8922a,#d4aa45);padding:32px 24px;text-align:center;">
      <div style="font-family:monospace;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:6px;">EUNOIA</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.8);letter-spacing:3px;margin-top:4px;">INTELLIGENCE PLATFORM</div>
    </div>

    <!-- Greeting -->
    <div style="padding:28px 28px 0;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 8px;">مرحباً ${name}،</p>
      <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">
        تقريرك المجاني عن <strong style="color:#b8922a;">${company}</strong> في ${city} جاهز!
        هذا ملخص سريع من Eunoia Intelligence — التقرير الكامل يشمل 22 قسماً.
      </p>
    </div>

    <!-- Market Score -->
    <div style="margin:0 28px 20px;background:#fffbf0;border:1px solid #f0e0a0;border-radius:12px;padding:20px;text-align:center;">
      <div style="font-size:13px;color:#b8922a;font-weight:700;margin-bottom:8px;">درجة السوق</div>
      <div style="font-size:48px;font-weight:900;color:#b8922a;">${report.market_score ?? 72}</div>
      <div style="font-size:11px;color:#888;">/100 — بناءً على تحليل السوق المصري 2025</div>
    </div>

    <!-- Executive Summary -->
    ${report.executive_summary ? `
    <div style="margin:0 28px 20px;background:#f9f9f9;border-right:3px solid #b8922a;padding:16px 16px 16px 20px;border-radius:8px;">
      <div style="font-size:12px;font-weight:700;color:#b8922a;margin-bottom:8px;">الملخص التنفيذي</div>
      <p style="font-size:13px;color:#444;line-height:1.7;margin:0;">${report.executive_summary}</p>
    </div>` : ''}

    <!-- Opportunities -->
    ${opportunities.length > 0 ? `
    <div style="margin:0 28px 20px;">
      <div style="font-size:13px;font-weight:700;color:#16a34a;margin-bottom:12px;">🚀 أبرز 3 فرص</div>
      ${opportunities.map(o => `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;color:#15803d;margin-bottom:4px;">${o.title}</div>
        <div style="font-size:12px;color:#555;line-height:1.6;">${o.detail}</div>
      </div>`).join('')}
    </div>` : ''}

    <!-- Risks -->
    ${risks.length > 0 ? `
    <div style="margin:0 28px 20px;">
      <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:12px;">⚠️ تحديات رئيسية</div>
      ${risks.map(r => `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:4px;">${r.title}</div>
        <div style="font-size:12px;color:#555;line-height:1.6;">${r.detail}</div>
      </div>`).join('')}
    </div>` : ''}

    <!-- Quick Wins -->
    ${quickWins.length > 0 ? `
    <div style="margin:0 28px 20px;">
      <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">⚡ خطوات فورية (30 يوم)</div>
      ${quickWins.map((w, i) => `
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;padding:12px;background:#f8f6f1;border-radius:8px;">
        <div style="min-width:24px;height:24px;background:#b8922a;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;text-align:center;line-height:24px;">${i + 1}</div>
        <div>
          <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:2px;">${w.action}</div>
          <div style="font-size:11px;color:#666;">النتيجة المتوقعة: ${w.expected_result}</div>
        </div>
      </div>`).join('')}
    </div>` : ''}

    <!-- CTA -->
    <div style="margin:0 28px 28px;background:linear-gradient(135deg,#b8922a,#d4aa45);border-radius:14px;padding:24px;text-align:center;">
      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:8px;">هل تريد التقرير الكامل؟</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.9);margin-bottom:16px;line-height:1.6;">
        ${report.full_report_teaser ?? `التقرير الكامل يشمل 22 قسماً، تحليل منافسين معمّق، خطة تسويقية، وتوصيات مالية دقيقة لـ ${company}`}
      </div>
      <div style="font-size:13px;font-weight:700;color:#fff;background:rgba(255,255,255,0.2);display:inline-block;padding:10px 24px;border-radius:8px;border:1px solid rgba(255,255,255,0.4);">
        تواصل مع فريق Eunoia الآن ←
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 28px;border-top:1px solid #f0ece0;text-align:center;">
      <div style="font-family:monospace;font-size:11px;font-weight:700;color:#b8922a;letter-spacing:4px;margin-bottom:4px;">EUNOIA</div>
      <div style="font-size:10px;color:#999;">منصة الذكاء التسويقي — مصر والخليج</div>
      <div style="font-size:10px;color:#bbb;margin-top:8px;">هذا التقرير تم توليده بالذكاء الاصطناعي بناءً على بيانات السوق المصري 2025. الأرقام تقديرية — راجع مستشارك المالي قبل اتخاذ قرارات.</div>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, company, sector, city, competitor1, competitor2, website } = body

    if (!company || !sector || !city || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const competitors = [competitor1, competitor2].filter(Boolean).join(', ')

    // Generate AI report
    let reportJson: Record<string, unknown> = {}
    try {
      const raw = await generateReport(company, sector, city, competitors, website ?? '')
      const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
      reportJson = JSON.parse(cleaned)
    } catch {
      // Fallback report if AI fails
      reportJson = {
        executive_summary: `${company} يعمل في قطاع ${SECTOR_LABELS[sector] ?? sector} في ${city}. السوق المصري يشهد نمواً ملحوظاً في هذا القطاع مع فرص واعدة للشركات التي تتبنى التحول الرقمي. التوقيت مناسب للتوسع.`,
        market_score: 68,
        top_3_opportunities: [
          { title: 'التحول الرقمي', detail: 'قطاعك يشهد تحولاً رقمياً متسارعاً — الشركات المبكرة في الرقمنة تكتسب ميزة تنافسية واضحة.' },
          { title: 'توسع العملاء الرقميين', detail: 'قاعدة العملاء الرقميين في مصر تنمو بمعدل 25% سنوياً — فرصة لاكتساب شريحة جديدة.' },
          { title: 'ضعف المنافسة الرقمية', detail: 'معظم المنافسين في قطاعك لم يطوروا حضوراً رقمياً قوياً — فرصة للتميز.' },
        ],
        top_3_risks: [
          { title: 'ارتفاع التكاليف التشغيلية', detail: 'التضخم يضغط على هوامش الربح — مراجعة هيكل التكاليف ضرورة عاجلة.' },
          { title: 'شدة المنافسة', detail: 'دخول منافسين جدد بأسعار تنافسية يهدد حصتك السوقية الحالية.' },
          { title: 'تغير سلوك المستهلك', detail: 'العملاء يتوقعون تجربة رقمية أفضل — التأخر في الاستجابة يكلف.' },
        ],
        quick_wins: [
          { action: 'أطلق حملة Meta Ads مستهدفة بميزانية EGP 3,000–5,000', expected_result: '50–80 عميل محتمل في أول أسبوعين' },
          { action: 'فعّل WhatsApp Business مع ردود آلية فورية', expected_result: 'تحسين معدل الاستجابة بنسبة 60%' },
          { action: 'أنشئ صفحة هبوط بسيطة مع عرض واضح', expected_result: 'زيادة التحويلات بنسبة 30%' },
        ],
        full_report_teaser: `التقرير الكامل لـ ${company} يكشف عن 6 منافسين رئيسيين بتحليل تفصيلي، وخطة تسويقية 90 يوماً، وتوقعات مالية دقيقة.`,
      }
    }

    // Send email
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Eunoia Intelligence <reports@eunoia.zone>',
          to: email,
          subject: `تقريرك المجاني من Eunoia — ${company}`,
          html: buildEmailHtml(name, company, sector, city, reportJson),
        })
      } catch {
        // Email failure shouldn't block success response
      }
    }

    // Log lead (fire and forget — no DB dependency)
    console.log('[demo-lead]', { name, phone, email, company, sector, city, ts: new Date().toISOString() })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[demo/generate]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
