import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next()
  }
  try {
    return await updateSession(request)
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
