import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'
import type { UserPlan } from '@/types/plan.types'

const VALID_PLANS: UserPlan[] = ['STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null) as { plan?: string } | null
  const newPlan = body?.plan as UserPlan | undefined

  if (!newPlan || !VALID_PLANS.includes(newPlan)) {
    return NextResponse.json({ error: `plan must be one of: ${VALID_PLANS.join(', ')}` }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any

    // Read current plan for audit payload
    const { data: existing } = await ab.from('user_plans').select('plan').eq('user_id', id).maybeSingle()
    const fromPlan = existing?.plan ?? 'STARTER'

    const { error } = await ab
      .from('user_plans')
      .upsert({ user_id: id, plan: newPlan, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (error) throw error

    // Fetch target email for audit log denormalisation
    const { data: { user: targetAuthUser } } = await admin.auth.admin.getUserById(id)
    await writeAuditLog({
      actorId: user!.id,
      actorEmail: user!.email ?? null,
      targetUserId: id,
      targetEmail: targetAuthUser?.email ?? null,
      eventType: 'plan_changed',
      payload: { from_plan: fromPlan, to_plan: newPlan },
    })

    return NextResponse.json({ ok: true, user_id: id, plan: newPlan })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update plan'
    console.error('[admin/users/plan]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
