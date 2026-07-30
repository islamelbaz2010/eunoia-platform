import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAuditLog } from '@/lib/admin/audit'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Auth cascade deletes all app data (reports, research_requests, user_plans all
    // reference auth.users(id) on delete cascade), so deleting the auth user is
    // sufficient — no manual table cleanup needed.
    const admin = createAdminClient()

    // Write audit entry before deletion so actor and target references are still valid
    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email ?? null,
      targetUserId: user.id,
      targetEmail: user.email ?? null,
      eventType: 'account_deleted',
    })

    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete account'
    console.error('[account/delete]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
