import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { cacheGet, cacheSet, reportCacheKey, CACHE_TTL } from '@/lib/redis/cache'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try cache first
    const cached = await cacheGet(reportCacheKey(id))
    if (cached) {
      return NextResponse.json(cached)
    }

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const report = await prisma.report.findFirst({
      where: { id, userId: dbUser.id },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status === 'COMPLETED') {
      await cacheSet(reportCacheKey(id), report, CACHE_TTL.REPORT)
    }

    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
