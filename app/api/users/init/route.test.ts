import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const getUser = vi.fn()
const checkRateLimit = vi.fn()
const initUserFromSupabase = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => getUser() },
  }),
}))

vi.mock('@/lib/research/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  rateLimitMessage: (resetIn: number) => `Rate limit exceeded. Try again in ${resetIn}s.`,
}))

vi.mock('@/lib/prisma/init-user', () => ({
  initUserFromSupabase: (...args: unknown[]) => initUserFromSupabase(...args),
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/users/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/users/init', () => {
  beforeEach(() => {
    getUser.mockReset()
    checkRateLimit.mockReset()
    initUserFromSupabase.mockReset()
    checkRateLimit.mockResolvedValue({ ok: true, resetIn: 0 })
  })

  it('returns 401 and never calls initUserFromSupabase when there is no session', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const res = await POST(makeRequest({ workspaceName: 'Acme' }))

    expect(res.status).toBe(401)
    expect(initUserFromSupabase).not.toHaveBeenCalled()
  })

  it('derives identity from the session and ignores spoofed email/supabaseId in the body', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'real-user-id', email: 'real@user.com', user_metadata: {} } },
    })
    initUserFromSupabase.mockResolvedValue({ userId: 'real-user-id', workspaceId: 'ws-1', created: true })

    const res = await POST(
      makeRequest({
        email: 'attacker@evil.com',
        supabaseId: 'victim-id',
        workspaceName: 'My Workspace',
      })
    )

    expect(res.status).toBe(200)
    expect(initUserFromSupabase).toHaveBeenCalledWith({
      id: 'real-user-id',
      email: 'real@user.com',
      name: null,
      workspaceName: 'My Workspace',
    })
  })

  it('returns 429 when the rate limit is exceeded', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'real-user-id', email: 'real@user.com', user_metadata: {} } },
    })
    checkRateLimit.mockResolvedValue({ ok: false, resetIn: 120 })

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(429)
    expect(initUserFromSupabase).not.toHaveBeenCalled()
  })
})
