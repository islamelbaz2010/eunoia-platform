import { redis } from '@/lib/redis/client'

const DAILY_FREE_QUOTA = 100
const SECONDS_IN_DAY = 86400

function todayKey(): string {
  return `quota:google-cse:${new Date().toISOString().slice(0, 10)}`
}

export interface QuotaResult {
  ok: boolean
  used: number
  limit: number
}

/**
 * Google Custom Search's free tier is a shared 100-queries/day budget across
 * the whole app, not per-user — a separate, stricter counter than the
 * per-user rate limiter in lib/research/rate-limit.ts. Fail-open if Redis is
 * unavailable, same convention as the rest of the research module.
 */
export async function checkSearchQuota(): Promise<QuotaResult> {
  const key = todayKey()
  try {
    const current = await redis.get<number>(key)
    const used = typeof current === 'number' ? current : parseInt(String(current ?? '0'), 10) || 0

    if (used >= DAILY_FREE_QUOTA) {
      return { ok: false, used, limit: DAILY_FREE_QUOTA }
    }

    if (used === 0) {
      await redis.set(key, 1, { ex: SECONDS_IN_DAY })
    } else {
      await redis.incr(key)
    }

    return { ok: true, used: used + 1, limit: DAILY_FREE_QUOTA }
  } catch {
    return { ok: true, used: 0, limit: DAILY_FREE_QUOTA }
  }
}
