import { redis } from './client'

export const CACHE_TTL = {
  REPORT: 86400,     // 24h
  USER: 300,         // 5 min
  WORKSPACE: 300,    // 5 min
  SECTOR: 3600,      // 1h
} as const

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get<T>(key)
    return value ?? null
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // Cache write failure is non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch {
    // Non-fatal
  }
}

export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  await cacheSet(key, fresh, ttlSeconds)
  return fresh
}

export function reportCacheKey(id: string): string {
  return `report:${id}`
}

export function workspaceCacheKey(id: string): string {
  return `workspace:${id}`
}

export function userCacheKey(id: string): string {
  return `user:${id}`
}
