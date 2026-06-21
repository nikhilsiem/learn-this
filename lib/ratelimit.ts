import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = url && token ? new Redis({ url, token }) : null

const memoryStore = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(userId: string, limit = 10, windowSeconds = 3600) {
  const key = `ratelimit:${userId}`

  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, windowSeconds)
      }
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
    } catch {
      console.warn('Redis unavailable, falling back to in-memory rate limiting')
    }
  }

  const now = Date.now()
  const entry = memoryStore.get(key)
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, remaining: limit - 1 }
  }
  entry.count++
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) }
}
