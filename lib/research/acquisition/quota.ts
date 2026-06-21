import { redis } from '@/lib/redis/client'

// SerpAPI is metered from the first request (unlike Google CSE's old 100/day
// free tier) — this is now a real cost-control budget, not just an abuse
// guard. Sized conservatively for an entry-level SerpAPI plan; raise via env
// var as the purchased plan's actual monthly search allowance is confirmed,
// without needing a code change/redeploy.
const DAILY_SEARCH_QUOTA = Number(process.env.SEARCH_DAILY_QUOTA) || 150

// Fair-share ceiling on top of the shared budget above. ENTERPRISE plans have
// no monthly report cap (types/plan.types.ts: reportsPerMonth -1) and the
// per-user rate limiter alone permits up to 120 requests/day
// (lib/research/rate-limit.ts: 5/hour), so without a per-tenant sub-quota a
// single tenant could exhaust the entire shared SerpAPI budget and starve
// every other tenant on the platform. Defaults to 20% of the global budget —
// enough headroom for one tenant's real usage burst while guaranteeing room
// for at least 5 active tenants a day at default sizing.
const PER_USER_DAILY_SEARCH_QUOTA = Number(process.env.SEARCH_DAILY_QUOTA_PER_USER) || 30

const SECONDS_IN_DAY = 86400

function dateSuffix(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface QuotaResult {
  ok: boolean
  used: number
  limit: number
}

async function checkCounter(key: string, limit: number): Promise<QuotaResult> {
  try {
    const current = await redis.get<number>(key)
    const used = typeof current === 'number' ? current : parseInt(String(current ?? '0'), 10) || 0

    if (used >= limit) {
      return { ok: false, used, limit }
    }

    if (used === 0) {
      await redis.set(key, 1, { ex: SECONDS_IN_DAY })
    } else {
      await redis.incr(key)
    }

    return { ok: true, used: used + 1, limit }
  } catch {
    return { ok: true, used: 0, limit }
  }
}

/**
 * Shared app-wide daily search budget — a separate, stricter counter than
 * the per-user rate limiter in lib/research/rate-limit.ts. Fail-open if
 * Redis is unavailable, same convention as the rest of the research module.
 *
 * When `userId` is passed, also enforces the per-tenant fair-share sub-quota
 * above it, checked first so a tenant already at their fair share is
 * rejected without ever touching the shared global counter.
 */
export async function checkSearchQuota(userId?: string): Promise<QuotaResult> {
  if (userId) {
    const perUser = await checkCounter(`quota:search-provider:user:${userId}:${dateSuffix()}`, PER_USER_DAILY_SEARCH_QUOTA)
    if (!perUser.ok) return perUser
  }

  return checkCounter(`quota:search-provider:${dateSuffix()}`, DAILY_SEARCH_QUOTA)
}
