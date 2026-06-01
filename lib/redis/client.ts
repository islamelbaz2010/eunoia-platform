import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

export function getRedis(): Redis {
  if (_redis) return _redis

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set')
  }

  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  return _redis
}

type RedisSetOpts = Parameters<Redis['set']>[2]

// Convenience export — defers initialization until first call
export const redis = {
  get: <T>(key: string) => getRedis().get<T>(key),
  set: <T>(key: string, value: T, opts?: RedisSetOpts) => getRedis().set(key, value, opts),
  del: (key: string) => getRedis().del(key),
  incr: (key: string) => getRedis().incr(key),
  expire: (key: string, seconds: number) => getRedis().expire(key, seconds),
  ttl: (key: string) => getRedis().ttl(key),
}
