import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      // Initialize Prisma user after email confirmation
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await fetch(`${origin}/api/users/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.user_metadata?.full_name,
            supabaseId: user.id,
          }),
        }).catch(() => {}) // Non-fatal
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
