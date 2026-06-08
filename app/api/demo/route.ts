import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, company, sector, city } = body

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 }
      )
    }

    // Save to Supabase using service role — bypasses RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await supabase
      .from('demo_leads')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: (company || '').trim(),
        sector: (sector || '').trim(),
        city: (city || '').trim(),
      })

    if (dbError) {
      console.error('[demo] Supabase error:', dbError.message)
      // Continue to send email even if DB fails
    }

    // Resend — MUST be initialized inside the handler
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Eunoia Intelligence <onboarding@resend.dev>',
        to: [email.trim()],
        subject: 'طلبك وصلنا — Eunoia Zones Marketing Intelligence',
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FAFAF7">
            <div style="background:#4A1042;padding:20px 24px;border-radius:10px 10px 0 0">
              <h2 style="color:#fff;margin:0;font-size:20px">EUNOIA ZONES</h2>
              <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Marketing Intelligence Platform</p>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #E8E2DA">
              <h3 style="color:#4A1042;margin-top:0">مرحباً ${name}،</h3>
              <p style="color:#444;line-height:1.6">شكراً لاهتمامك بـ Eunoia Zones Marketing Intelligence.</p>
              <p style="color:#444;line-height:1.6">استلمنا طلبك وسيتواصل معك فريقنا خلال <strong>24 ساعة</strong>.</p>
              <hr style="border:none;border-top:1px solid #E8E2DA;margin:20px 0">
              <p style="color:#888;font-size:12px;margin:0">Eunoia Zones Agency · eunoiazones.com</p>
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('[demo] Resend error:', emailErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      saved_to_db: !dbError,
    })
  } catch (err) {
    console.error('[demo] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
