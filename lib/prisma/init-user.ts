import { Prisma } from './generated'
import { prisma } from './client'

export interface InitUserInput {
  /** Must be the caller's own already-verified Supabase auth.users id — never accept this from a request body. */
  id: string
  /** Must be the caller's own already-verified Supabase auth.users email — never accept this from a request body. */
  email: string
  name?: string | null
  workspaceName?: string
}

export interface InitUserResult {
  userId: string
  workspaceId: string
  created: boolean
}

/**
 * Finds or creates the Prisma User+Workspace bootstrap row for an
 * already-authenticated Supabase identity. Trusts its input completely —
 * callers (the API route and the auth callback) are responsible for
 * deriving `id`/`email` from a verified session before calling this.
 */
export async function initUserFromSupabase(input: InitUserInput): Promise<InitUserResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    return { userId: existing.id, workspaceId: existing.workspaceId, created: false }
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const workspace = await tx.workspace.create({
      data: {
        name: input.workspaceName ?? `${input.name ?? input.email.split('@')[0]}'s Workspace`,
        plan: 'STARTER',
        ownerId: input.id,
      },
    })

    const user = await tx.user.create({
      data: {
        id: input.id,
        email: input.email,
        name: input.name ?? null,
        role: 'ADMIN',
        workspaceId: workspace.id,
      },
    })

    return { user, workspace }
  })

  return { userId: result.user.id, workspaceId: result.workspace.id, created: true }
}
