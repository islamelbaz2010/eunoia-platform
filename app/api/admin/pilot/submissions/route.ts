import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'
import { PILOT_CONFIG } from '@/lib/pilot/config'
import type { PilotStatus } from '@/lib/pilot/config'

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

    const { data: submissions, error } = await ab
      .from('pilot_submissions')
      .select(`
        *,
        review:pilot_reviews (
          id, reviewer_name, consultant_recommendation, agreement,
          confidence_level, disagree_root_cause, disagree_severity,
          disagree_reason, time_spent_minutes, narrative_correction_count,
          safe_without_review, created_at, updated_at
        )
      `)
      .order('pilot_id', { ascending: true })

    if (error) throw error
    return NextResponse.json(submissions ?? [])
  } catch (err) {
    console.error('[pilot/submissions GET]', err)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json() as {
      pilot_id?: string
      report_id?: string
      research_request_id?: string
      client_identifier?: string
      project_location?: string
      intake_at?: string
    }

    const { pilot_id, report_id, research_request_id, client_identifier, project_location, intake_at } = body

    if (!pilot_id || !client_identifier) {
      return NextResponse.json({ error: 'pilot_id and client_identifier are required' }, { status: 400 })
    }

    if (!PILOT_CONFIG.IDS.includes(pilot_id)) {
      return NextResponse.json({ error: `pilot_id must be one of PILOT-01 through PILOT-20` }, { status: 400 })
    }

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any

    // Resolve system recommendation + confidence from the linked report's decision_report
    let system_recommendation: string | null = null
    let system_confidence: number | null = null
    let system_trust_score: number | null = null

    if (report_id) {
      const { data: reportRow } = await ab
        .from('reports')
        .select('decision_report, trust_score')
        .eq('id', report_id)
        .single()

      if (reportRow?.decision_report) {
        const dr = reportRow.decision_report as Record<string, unknown>
        system_recommendation = typeof dr.recommendedOptionId === 'string' ? dr.recommendedOptionId : null
        system_confidence = typeof dr.confidence === 'number' ? dr.confidence : null
        system_trust_score = typeof reportRow.trust_score === 'number' ? reportRow.trust_score : null
      }
    }

    const { data, error } = await ab
      .from('pilot_submissions')
      .insert({
        pilot_id,
        report_id: report_id ?? null,
        research_request_id: research_request_id ?? null,
        client_identifier,
        project_location: project_location ?? null,
        intake_at: intake_at ?? null,
        submitted_at: new Date().toISOString(),
        status: 'pending' as PilotStatus,
        system_recommendation,
        system_confidence,
        system_trust_score,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `${pilot_id} is already registered` }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[pilot/submissions POST]', err)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
