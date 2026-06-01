import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
    if (!dbUser) {
      return NextResponse.json({ reports: [], page: 1, totalPages: 0, total: 0 })
    }

    const [reports, total] = await prisma.$transaction([
      prisma.report.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          completedAt: true,
          input: true,
        },
      }),
      prisma.report.count({ where: { userId: dbUser.id } }),
    ])

    const items = reports.map((r: {
      id: string
      type: string
      status: string
      createdAt: Date
      completedAt: Date | null
      input: unknown
    }) => {
      const input = r.input as { companyName?: string; sectorKey?: string; cityKey?: string }
      return {
        id: r.id,
        type: r.type,
        status: r.status,
        companyName: input?.companyName ?? '',
        sectorKey: input?.sectorKey ?? '',
        cityKey: input?.cityKey ?? '',
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
      }
    })

    return NextResponse.json({
      reports: items,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
