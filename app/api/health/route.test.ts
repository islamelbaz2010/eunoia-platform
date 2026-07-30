import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockQueryRaw } = vi.hoisted(() => ({ mockQueryRaw: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({ prisma: { $queryRaw: mockQueryRaw } }))

const { mockPing } = vi.hoisted(() => ({ mockPing: vi.fn() }))
vi.mock('@/lib/redis/client', () => ({ getRedis: () => ({ ping: mockPing }) }))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { GET } from './route'

const ENV_KEYS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'OPENAI_API_KEY',
]

let savedEnv: Record<string, string | undefined>

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]]))

  process.env.DATABASE_URL = 'postgresql://test'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
  process.env.OPENAI_API_KEY = 'sk-test'

  mockQueryRaw.mockResolvedValue([{ one: 1 }])
  mockPing.mockResolvedValue('PONG')
  mockFetch.mockResolvedValue({ ok: true, status: 200 })
})

afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) {
      delete process.env[k]
    } else {
      process.env[k] = v
    }
  }
  vi.clearAllMocks()
})

describe('GET /api/health', () => {
  it('returns healthy with 200 when all services are operational', async () => {
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(payload.status).toBe('healthy')
    expect(payload.ok).toBe(true)
    expect(payload.service).toBe('eunoia-platform')
    expect(typeof payload.timestamp).toBe('string')
    expect(payload.checks.database.status).toBe('healthy')
    expect(payload.checks.supabase.status).toBe('healthy')
    expect(payload.checks.redis.status).toBe('healthy')
    expect(payload.checks.openai.status).toBe('configured')
  })

  it('returns 503 unavailable when database is down', async () => {
    mockQueryRaw.mockRejectedValue(new Error('Connection refused'))

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.status).toBe('unavailable')
    expect(payload.ok).toBe(false)
    expect(payload.checks.database.status).toBe('unavailable')
  })

  it('returns 503 unavailable when supabase is unreachable', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.status).toBe('unavailable')
    expect(payload.checks.supabase.status).toBe('unavailable')
  })

  it('returns 200 degraded when redis is down but critical services are healthy', async () => {
    mockPing.mockRejectedValue(new Error('Redis unavailable'))

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe('degraded')
    expect(payload.ok).toBe(true)
    expect(payload.checks.redis.status).toBe('unavailable')
    expect(payload.checks.database.status).toBe('healthy')
    expect(payload.checks.supabase.status).toBe('healthy')
  })

  it('returns 503 unavailable when critical services have no credentials', async () => {
    delete process.env.DATABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.status).toBe('unavailable')
    expect(payload.checks.database.status).toBe('not_configured')
    expect(payload.checks.supabase.status).toBe('not_configured')
  })

  it('reports not_configured for redis when its env vars are absent', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const response = await GET()
    const payload = await response.json()

    expect(payload.checks.redis.status).toBe('not_configured')
  })

  it('reports openai as not_configured when key is absent', async () => {
    delete process.env.OPENAI_API_KEY

    const response = await GET()
    const payload = await response.json()

    expect(payload.checks.openai.status).toBe('not_configured')
  })

  it('includes runtime metadata without exposing env var values', async () => {
    const response = await GET()
    const text = await response.text()
    const payload = JSON.parse(text) as Record<string, unknown>

    expect(payload).not.toHaveProperty('env')
    expect(payload).not.toHaveProperty('hasOpenAI')
    expect(payload).not.toHaveProperty('hasSupabase')
    expect(text).not.toContain('postgresql://test')
    expect(text).not.toContain('test-anon-key')
    expect(text).not.toContain('test-token')
    expect(text).not.toContain('sk-test')

    expect((payload.runtime as Record<string, unknown>).node).toMatch(/^v\d+/)
    expect(typeof (payload.runtime as Record<string, unknown>).uptime_s).toBe('number')
    expect(typeof payload.version).toBe('string')
  })

  it('includes latency_ms for checks that make network calls', async () => {
    const response = await GET()
    const payload = await response.json()

    expect(typeof payload.checks.database.latency_ms).toBe('number')
    expect(typeof payload.checks.supabase.latency_ms).toBe('number')
    expect(typeof payload.checks.redis.latency_ms).toBe('number')
  })
})
