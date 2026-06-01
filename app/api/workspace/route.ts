import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: {
        workspace: {
          include: {
            users: { select: { id: true, email: true, name: true, role: true, workspaceId: true, createdAt: true } },
            _count: { select: { reports: true } },
          },
        },
      },
    })

    if (!dbUser?.workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...dbUser.workspace,
      createdAt: dbUser.workspace.createdAt.toISOString(),
      updatedAt: dbUser.workspace.updatedAt.toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
