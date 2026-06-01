import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// Called after Supabase signup to create Prisma User + Workspace
// Safe to call multiple times — upsert semantics
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string
      name?: string
      supabaseId?: string
      workspaceName?: string
      branchKey?: string
    }

    const { email, name, supabaseId, workspaceName, branchKey } = body

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ userId: existing.id, workspaceId: existing.workspaceId, created: false })
    }

    // Create workspace + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName ?? `${name ?? email.split('@')[0]}'s Workspace`,
          plan: 'STARTER',
          ownerId: supabaseId ?? email,
        },
      })

      const user = await tx.user.create({
        data: {
          id: supabaseId ?? undefined, // Use Supabase UUID as Prisma ID if available
          email,
          name: name ?? null,
          role: 'ADMIN',
          workspaceId: workspace.id,
        },
      })

      return { user, workspace }
    })

    return NextResponse.json({
      userId: result.user.id,
      workspaceId: result.workspace.id,
      created: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to initialize user'
    console.error('[users/init]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
