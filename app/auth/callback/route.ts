import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initUserFromSupabase } from '@/lib/prisma/init-user'

// Handles Supabase email confirmation redirects
// Set NEXT_PUBLIC_SITE_URL/auth/callback as the redirect URL in Supabase dashboard
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Initialize Prisma user after email confirmation. Calls the shared
      // helper directly (not a self-fetch to /api/users/init) — a
      // server-to-server fetch from this route wouldn't carry the session
      // cookie the API route now requires for auth.
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await initUserFromSupabase({
          id: user.id,
          email: user.email,
          name: (user.user_metadata?.full_name as string | undefined) ?? null,
        }).catch(err => console.error('[auth/callback] initUserFromSupabase failed:', err))
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
