import { describe, it, expect, vi, beforeEach } from 'vitest'

const { findUnique, $transaction } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  $transaction: vi.fn(),
}))

vi.mock('./client', () => ({
  prisma: {
    user: { findUnique },
    $transaction,
  },
}))

import { initUserFromSupabase } from './init-user'

describe('initUserFromSupabase', () => {
  beforeEach(() => {
    findUnique.mockReset()
    $transaction.mockReset()
  })

  it('returns the existing user without starting a transaction', async () => {
    findUnique.mockResolvedValue({ id: 'user-1', workspaceId: 'ws-1' })

    const result = await initUserFromSupabase({ id: 'user-1', email: 'a@b.com' })

    expect(result).toEqual({ userId: 'user-1', workspaceId: 'ws-1', created: false })
    expect($transaction).not.toHaveBeenCalled()
  })

  it('creates a workspace and user when none exists', async () => {
    findUnique.mockResolvedValue(null)

    const create = vi.fn()
    $transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        workspace: {
          create: vi.fn().mockResolvedValue({ id: 'ws-2', name: "a's Workspace" }),
        },
        user: {
          create: vi.fn().mockResolvedValue({ id: 'user-2', email: 'a@b.com' }),
        },
      }
      create(tx)
      return callback(tx)
    })

    const result = await initUserFromSupabase({ id: 'user-2', email: 'a@b.com' })

    expect(result).toEqual({ userId: 'user-2', workspaceId: 'ws-2', created: true })
  })

  it('defaults the workspace name to the email local-part when no name is given', async () => {
    findUnique.mockResolvedValue(null)

    let workspaceCreateArgs: { data: { name: string } } | undefined
    $transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        workspace: {
          create: vi.fn().mockImplementation((args: { data: { name: string } }) => {
            workspaceCreateArgs = args
            return Promise.resolve({ id: 'ws-3' })
          }),
        },
        user: {
          create: vi.fn().mockResolvedValue({ id: 'user-3' }),
        },
      }
      return callback(tx)
    })

    await initUserFromSupabase({ id: 'user-3', email: 'jane@example.com' })

    expect(workspaceCreateArgs?.data.name).toBe("jane's Workspace")
  })

  it('uses an explicit workspaceName over the derived default', async () => {
    findUnique.mockResolvedValue(null)

    let workspaceCreateArgs: { data: { name: string } } | undefined
    $transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        workspace: {
          create: vi.fn().mockImplementation((args: { data: { name: string } }) => {
            workspaceCreateArgs = args
            return Promise.resolve({ id: 'ws-4' })
          }),
        },
        user: {
          create: vi.fn().mockResolvedValue({ id: 'user-4' }),
        },
      }
      return callback(tx)
    })

    await initUserFromSupabase({ id: 'user-4', email: 'jane@example.com', workspaceName: 'Acme Inc' })

    expect(workspaceCreateArgs?.data.name).toBe('Acme Inc')
  })
})
