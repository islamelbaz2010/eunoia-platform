import { redis } from '@/lib/redis/client'

// SerpAPI is metered from the first request (unlike Google CSE's old 100/day
// free tier) — this is now a real cost-control budget, not just an abuse
// guard. Sized conservatively for an entry-level SerpAPI plan; raise via env
// var as the purchased plan's actual monthly search allowance is confirmed,
// without needing a code change/redeploy.
const DAILY_SEARCH_QUOTA = Number(process.env.SEARCH_DAILY_QUOTA) || 150
const SECONDS_IN_DAY = 86400

function todayKey(): string {
  return `quota:search-provider:${new Date().toISOString().slice(0, 10)}`
}

export interface QuotaResult {
  ok: boolean
  used: number
  limit: number
}

/**
 * Shared app-wide daily search budget — a separate, stricter counter than
 * the per-user rate limiter in lib/research/rate-limit.ts. Fail-open if
 * Redis is unavailable, same convention as the rest of the research module.
 */
export async function checkSearchQuota(): Promise<QuotaResult> {
  const key = todayKey()
  try {
    const current = await redis.get<number>(key)
    const used = typeof current === 'number' ? current : parseInt(String(current ?? '0'), 10) || 0

    if (used >= DAILY_SEARCH_QUOTA) {
      return { ok: false, used, limit: DAILY_SEARCH_QUOTA }
    }

    if (used === 0) {
      await redis.set(key, 1, { ex: SECONDS_IN_DAY })
    } else {
      await redis.incr(key)
    }

    return { ok: true, used: used + 1, limit: DAILY_SEARCH_QUOTA }
  } catch {
    return { ok: true, used: 0, limit: DAILY_SEARCH_QUOTA }
  }
}
