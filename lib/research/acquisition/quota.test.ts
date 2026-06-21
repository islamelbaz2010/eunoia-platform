import { describe, it, expect, vi, beforeEach } from 'vitest'

const { get, set, incr } = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
}))

vi.mock('@/lib/redis/client', () => ({
  redis: { get, set, incr },
}))

import { checkSearchQuota } from './quota'

describe('checkSearchQuota', () => {
  beforeEach(() => {
    get.mockReset()
    set.mockReset()
    incr.mockReset()
  })

  it('allows a search with no prior usage and no userId', async () => {
    get.mockResolvedValue(null)

    const result = await checkSearchQuota()

    expect(result.ok).toBe(true)
    expect(set).toHaveBeenCalledTimes(1)
  })

  it('blocks once the shared global daily budget is exhausted', async () => {
    get.mockResolvedValue(150)

    const result = await checkSearchQuota()

    expect(result).toEqual({ ok: false, used: 150, limit: 150 })
  })

  it('fails open (allows the search) when Redis is unavailable', async () => {
    get.mockRejectedValue(new Error('redis down'))

    const result = await checkSearchQuota()

    expect(result.ok).toBe(true)
  })

  it('blocks a single tenant once their fair-share sub-quota is exhausted, without touching the global counter', async () => {
    get.mockResolvedValueOnce(30) // per-user counter already at its limit

    const result = await checkSearchQuota('tenant-a')

    expect(result).toEqual({ ok: false, used: 30, limit: 30 })
    expect(get).toHaveBeenCalledTimes(1) // never reached the global counter check
  })

  it('checks both the per-user and global counters when a userId is under its fair share', async () => {
    get.mockResolvedValueOnce(5) // per-user: well under its limit
    get.mockResolvedValueOnce(10) // global: well under its limit

    const result = await checkSearchQuota('tenant-a')

    expect(result.ok).toBe(true)
    expect(get).toHaveBeenCalledTimes(2)
    expect(get.mock.calls[0][0]).toContain('user:tenant-a')
  })

  it('one tenant exhausting their own fair share cannot exhaust the shared global budget for everyone else', async () => {
    // tenant-a has used its full fair share; tenant-b has used none
    get.mockImplementation((key: string) => {
      if (key.includes('user:tenant-a')) return Promise.resolve(30)
      if (key.includes('user:tenant-b')) return Promise.resolve(0)
      return Promise.resolve(0) // global counter barely touched
    })

    const tenantA = await checkSearchQuota('tenant-a')
    const tenantB = await checkSearchQuota('tenant-b')

    expect(tenantA.ok).toBe(false)
    expect(tenantB.ok).toBe(true)
  })
})
