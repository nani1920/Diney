import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Upstash Redis credentials are missing in environment variables')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

 
export const getCacheKey = (tenantIdOrSlug: string, type: 'menu' | 'config' | 'analytics' | string) => {
  return `tenant:${tenantIdOrSlug}:${type}`
}

 
export const DEFAULT_TTL = 3600 
