import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Upstash Redis credentials are missing in environment variables')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Helper to generate cache keys
export const getCacheKey = (tenantSlug: string, type: 'menu' | 'config') => {
  return `tenant:${tenantSlug}:${type}`
}

// Global cache TTL (Time To Live) - default 1 hour
export const DEFAULT_TTL = 3600 
