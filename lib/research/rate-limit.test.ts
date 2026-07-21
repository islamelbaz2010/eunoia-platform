import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, set, incr, ttl } = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  ttl: vi.fn(),
}))

vi.mock('@/lib/redis/client', () => ({
  redis: { get, set, incr, ttl },
}))

import { checkRateLimit, rateLimitMessage } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    get.mockReset()
    set.mockReset()
    incr.mockReset()
    ttl.mockReset()
  })

  it('starts a new hourly window for first use', async () => {
    get.mockResolvedValue(null)

    const result = await checkRateLimit('ratelimit:user-1')

    expect(result).toEqual({ ok: true, resetIn: 0 })
    expect(set).toHaveBeenCalledWith('ratelimit:user-1', 1, { ex: 3600 })
    expect(incr).not.toHaveBeenCalled()
  })

  it('increments an existing window below the limit', async () => {
    get.mockResolvedValue('3')

    const result = await checkRateLimit('ratelimit:user-1')

    expect(result).toEqual({ ok: true, resetIn: 0 })
    expect(incr).toHaveBeenCalledWith('ratelimit:user-1')
    expect(set).not.toHaveBeenCalled()
  })

  it('blocks once the hourly limit is reached and returns redis ttl', async () => {
    get.mockResolvedValue(5)
    ttl.mockResolvedValue(480)

    const result = await checkRateLimit('ratelimit:user-1')

    expect(result).toEqual({ ok: false, resetIn: 480 })
    expect(incr).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
  })

  it('fails open when Redis is unavailable', async () => {
    get.mockRejectedValue(new Error('redis unavailable'))

    const result = await checkRateLimit('ratelimit:user-1')

    expect(result).toEqual({ ok: true, resetIn: 0 })
  })
})

describe('rateLimitMessage', () => {
  it('formats a user-facing reset message in minutes', () => {
    expect(rateLimitMessage(61)).toBe('Rate limit exceeded: 5 requests per hour. Try again in 2 minutes.')
    expect(rateLimitMessage(60)).toBe('Rate limit exceeded: 5 requests per hour. Try again in 1 minute.')
  })
})
