import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'
import type { PilotStatus, PilotClientResponse } from '@/lib/pilot/config'

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
      .from('pilot_submissions')
      .select(`
        *,
        review:pilot_reviews (*),
        learning_events:pilot_learning_log (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[pilot/submissions/[id] GET]', err)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  try {
    const body = await req.json() as {
      status?: PilotStatus
      client_response?: PilotClientResponse
      client_response_notes?: string
      delivered_at?: string
    }

    const allowed: Record<string, unknown> = {}
    if (body.status !== undefined)               allowed.status = body.status
    if (body.client_response !== undefined)      allowed.client_response = body.client_response
    if (body.client_response_notes !== undefined) allowed.client_response_notes = body.client_response_notes
    if (body.delivered_at !== undefined)         allowed.delivered_at = body.delivered_at
    allowed.updated_at = new Date().toISOString()

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any

    const { data, error } = await ab
      .from('pilot_submissions')
      .update(allowed)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[pilot/submissions/[id] PATCH]', err)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
