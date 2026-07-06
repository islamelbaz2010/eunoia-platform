import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitMessage } from '@/lib/research/rate-limit'
import { initUserFromSupabase } from '@/lib/prisma/init-user'

/**
 * Bootstraps the Prisma User + Workspace for the CALLER'S OWN authenticated
 * Supabase session. Identity (id/email) is always derived from the verified
 * session below, never from the request body — a prior version trusted a
 * client-supplied email/supabaseId, which let anyone enumerate or
 * pre-register a Workspace+User for an arbitrary email (see
 * AUDIT_CONSOLIDATION.md §1.1).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rate = await checkRateLimit(`ratelimit:users:init:${user.id}`)
    if (!rate.ok) {
      return NextResponse.json({ error: rateLimitMessage(rate.resetIn), resetIn: rate.resetIn }, { status: 429 })
    }

    const body = await req.json().catch(() => null) as { workspaceName?: string } | null

    const result = await initUserFromSupabase({
      id: user.id,
      email: user.email,
      name: (user.user_metadata?.full_name as string | undefined) ?? null,
      workspaceName: body?.workspaceName?.trim() || undefined,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to initialize user'
    console.error('[users/init]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
