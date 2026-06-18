import { redis } from '@/lib/redis/client'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 3600

export interface RateLimitResult {
  ok: boolean
  resetIn: number
}

/** Mirrors the legacy /api/reports/generate rate limit: 5 requests/hour per user, fail-open if Redis is unavailable. */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  try {
    const current = await redis.get<number>(key)
    const count = typeof current === 'number' ? current : parseInt(String(current ?? '0'), 10) || 0

    if (count >= RATE_LIMIT_MAX) {
      const ttl = await redis.ttl(key)
      return { ok: false, resetIn: ttl > 0 ? ttl : RATE_LIMIT_WINDOW }
    }

    if (count === 0) {
      await redis.set(key, 1, { ex: RATE_LIMIT_WINDOW })
    } else {
      await redis.incr(key)
    }

    return { ok: true, resetIn: 0 }
  } catch {
    return { ok: true, resetIn: 0 }
  }
}

export function rateLimitMessage(resetIn: number): string {
  const mins = Math.ceil(resetIn / 60)
  return `Rate limit exceeded: ${RATE_LIMIT_MAX} requests per hour. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`
}
