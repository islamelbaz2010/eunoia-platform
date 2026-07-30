import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getRedis } from '@/lib/redis/client'

export const dynamic = 'force-dynamic'

type CheckStatus = 'healthy' | 'degraded' | 'unavailable' | 'not_configured'
type OverallStatus = 'healthy' | 'degraded' | 'unavailable'

interface CheckResult {
  status: CheckStatus
  latency_ms?: number
  message?: string
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
  )
  return Promise.race([promise, timer])
}

// Strip potential credentials from error messages before including them in the response.
function sanitizeMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : 'unknown error'
  return msg.replace(/\w+:\/\/[^\s]*/g, '[redacted]').slice(0, 120)
}

async function checkDatabase(): Promise<CheckResult> {
  if (!process.env.DATABASE_URL) {
    return { status: 'not_configured' }
  }
  const start = Date.now()
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 3000)
    return { status: 'healthy', latency_ms: Date.now() - start }
  } catch (err) {
    return { status: 'unavailable', latency_ms: Date.now() - start, message: sanitizeMessage(err) }
  }
}

async function checkSupabase(): Promise<CheckResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return { status: 'not_configured' }
  }
  const start = Date.now()
  try {
    // Any HTTP response (including 401/404) means the project is reachable.
    // Only network errors or timeouts indicate unavailability.
    await withTimeout(fetch(`${url}/rest/v1/`, { headers: { apikey: key } }), 3000)
    return { status: 'healthy', latency_ms: Date.now() - start }
  } catch (err) {
    return { status: 'unavailable', latency_ms: Date.now() - start, message: sanitizeMessage(err) }
  }
}

async function checkRedis(): Promise<CheckResult> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { status: 'not_configured' }
  }
  const start = Date.now()
  try {
    const result = await withTimeout(getRedis().ping(), 3000)
    if (result === 'PONG') {
      return { status: 'healthy', latency_ms: Date.now() - start }
    }
    return { status: 'degraded', latency_ms: Date.now() - start, message: 'unexpected ping response' }
  } catch (err) {
    return { status: 'unavailable', latency_ms: Date.now() - start, message: sanitizeMessage(err) }
  }
}

export async function GET() {
  const [database, supabase, redis] = await Promise.all([
    checkDatabase(),
    checkSupabase(),
    checkRedis(),
  ])

  const openai: { status: 'configured' | 'not_configured' } = {
    status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
  }

  const criticalDown = (
    database.status === 'unavailable' ||
    database.status === 'not_configured' ||
    supabase.status === 'unavailable' ||
    supabase.status === 'not_configured'
  )
  const anyDegraded = redis.status === 'unavailable' || redis.status === 'degraded'

  const status: OverallStatus = criticalDown ? 'unavailable' : anyDegraded ? 'degraded' : 'healthy'

  const build: { commit?: string; deployment_id?: string } = {}
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    build.commit = process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 8)
  }
  if (process.env.VERCEL_DEPLOYMENT_ID) {
    build.deployment_id = process.env.VERCEL_DEPLOYMENT_ID
  }

  return NextResponse.json(
    {
      status,
      ok: status !== 'unavailable',
      service: 'eunoia-platform',
      version: process.env.npm_package_version ?? 'unknown',
      timestamp: new Date().toISOString(),
      runtime: {
        node: process.version,
        uptime_s: Math.floor(process.uptime()),
      },
      build,
      checks: { database, supabase, redis, openai },
    },
    {
      status: status === 'unavailable' ? 503 : 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
