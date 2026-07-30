import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'
import type { UserPlan } from '@/types/plan.types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const admin = createAdminClient()

    // Fetch auth user list (paginated — returns up to 1000 per page)
    const { data: { users: authUsers }, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (authErr) throw authErr

    // Fetch all plan rows and this-month usage per user
    const som = new Date()
    som.setDate(1); som.setHours(0, 0, 0, 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any
    const [{ data: planRows }, { data: usageRows }] = await Promise.all([
      ab.from('user_plans').select('user_id, plan, updated_at'),
      ab.from('research_requests')
        .select('user_id, credits_used')
        .gte('created_at', som.toISOString()),
    ])

    const planMap = new Map<string, { plan: UserPlan; updated_at: string }>()
    for (const row of planRows ?? []) {
      planMap.set(row.user_id, { plan: row.plan as UserPlan, updated_at: row.updated_at })
    }

    const usageMap = new Map<string, number>()
    for (const row of usageRows ?? []) {
      usageMap.set(row.user_id, (usageMap.get(row.user_id) ?? 0) + (row.credits_used ?? 1))
    }

    const result = authUsers.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      plan: planMap.get(u.id)?.plan ?? 'STARTER',
      plan_updated_at: planMap.get(u.id)?.updated_at ?? null,
      usage_this_month: usageMap.get(u.id) ?? 0,
    }))

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users'
    console.error('[admin/users]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
