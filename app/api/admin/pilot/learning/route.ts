import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) return null
  return user
}

export async function GET() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any

    const { data, error } = await ab
      .from('pilot_learning_log')
      .select(`
        *,
        submission:pilot_submissions (pilot_id, client_identifier)
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[pilot/learning GET]', err)
    return NextResponse.json({ error: 'Failed to fetch learning log' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json() as {
      pilot_submission_id?: string
      event_type: string
      primary_root_cause: string
      secondary_root_cause?: string
      severity: string
      system_output?: string
      correct_output?: string
      prevention_note?: string
      engineering_ticket_required?: boolean
      ticket_description?: string
    }

    if (!body.event_type || !body.primary_root_cause || !body.severity) {
      return NextResponse.json(
        { error: 'event_type, primary_root_cause, and severity are required' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any

    const { data, error } = await ab
      .from('pilot_learning_log')
      .insert({
        pilot_submission_id:         body.pilot_submission_id ?? null,
        event_type:                  body.event_type,
        primary_root_cause:          body.primary_root_cause,
        secondary_root_cause:        body.secondary_root_cause ?? null,
        severity:                    body.severity,
        system_output:               body.system_output ?? null,
        correct_output:              body.correct_output ?? null,
        prevention_note:             body.prevention_note ?? null,
        engineering_ticket_required: body.engineering_ticket_required ?? false,
        ticket_description:          body.ticket_description ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[pilot/learning POST]', err)
    return NextResponse.json({ error: 'Failed to create learning entry' }, { status: 500 })
  }
}
