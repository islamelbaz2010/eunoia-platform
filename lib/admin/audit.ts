import { createAdminClient } from '@/lib/supabase/admin'

export type AuditEventType = 'plan_changed' | 'account_deleted' | 'account_exported'

interface AuditEntry {
  actorId: string | null
  actorEmail: string | null
  targetUserId: string
  targetEmail: string | null
  eventType: AuditEventType
  payload?: Record<string, unknown>
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ab = admin as any
    await ab.from('audit_log').insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      target_user_id: entry.targetUserId,
      target_email: entry.targetEmail,
      event_type: entry.eventType,
      payload: entry.payload ?? null,
    })
  } catch {
    // Audit log writes are best-effort and must never block the primary action.
  }
}
