import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'
import type { PilotConsultantRec, PilotDisagreeSeverity } from '@/lib/pilot/config'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) return null
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any

    const { data, error } = await ab
      .from('pilot_reviews')
      .select('*')
      .eq('pilot_submission_id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return NextResponse.json(data ?? null)
  } catch (err) {
    console.error('[pilot/review GET]', err)
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  try {
    const body = await req.json() as {
      reviewer_name: string
      consultant_recommendation: PilotConsultantRec
      agreement: boolean
      confidence_level?: 'very_high' | 'high' | 'medium' | 'low'
      disagree_root_cause?: string
      disagree_severity?: PilotDisagreeSeverity
      disagree_reason?: string
      defer_assessment?: string
      financing_assessment?: string
      narrative_approved?: boolean
      narrative_correction_count?: number
      advisory_checks?: Record<string, string>
      time_spent_minutes?: number
      lessons_learned?: string
      safe_without_review?: boolean
    }

    if (!body.reviewer_name || !body.consultant_recommendation || body.agreement === undefined) {
      return NextResponse.json(
        { error: 'reviewer_name, consultant_recommendation, and agreement are required' },
        { status: 400 }
      )
    }

    if (!body.agreement && !body.disagree_root_cause) {
      return NextResponse.json(
        { error: 'disagree_root_cause is required when agreement is false' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any

    const reviewPayload = {
      pilot_submission_id:        id,
      reviewer_name:               body.reviewer_name,
      consultant_recommendation:   body.consultant_recommendation,
      agreement:                   body.agreement,
      confidence_level:            body.confidence_level ?? null,
      disagree_root_cause:         body.disagree_root_cause ?? null,
      disagree_severity:           body.disagree_severity ?? null,
      disagree_reason:             body.disagree_reason ?? null,
      defer_assessment:            body.defer_assessment ?? null,
      financing_assessment:        body.financing_assessment ?? null,
      narrative_approved:          body.narrative_approved ?? null,
      narrative_correction_count:  body.narrative_correction_count ?? 0,
      advisory_checks:             body.advisory_checks ?? null,
      time_spent_minutes:          body.time_spent_minutes ?? null,
      lessons_learned:             body.lessons_learned ?? null,
      safe_without_review:         body.safe_without_review ?? null,
      updated_at:                  new Date().toISOString(),
    }

    // Upsert — one review per submission
    const { data, error } = await ab
      .from('pilot_reviews')
      .upsert(reviewPayload, { onConflict: 'pilot_submission_id' })
      .select()
      .single()

    if (error) throw error

    // Update submission status to 'in_review' if still pending
    await ab
      .from('pilot_submissions')
      .update({ status: 'in_review', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending')

    // Auto-create a learning log entry if there's a disagreement
    if (!body.agreement && body.disagree_root_cause) {
      const { data: sub } = await ab
        .from('pilot_submissions')
        .select('system_recommendation')
        .eq('id', id)
        .single()

      await ab.from('pilot_learning_log').insert({
        pilot_submission_id:         id,
        event_type:                  'disagreement',
        primary_root_cause:          body.disagree_root_cause,
        severity:                    body.disagree_severity ?? 'minor',
        system_output:               sub?.system_recommendation ?? null,
        correct_output:              body.consultant_recommendation,
        prevention_note:             body.disagree_reason ?? null,
        engineering_ticket_required: ['RC-03','RC-04','RC-05','RC-06','RC-07','RC-10'].includes(body.disagree_root_cause),
      })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('[pilot/review PUT]', err)
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }
}
