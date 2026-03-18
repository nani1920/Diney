import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Global rate limiter for sensitive actions.
 * Allows 5 requests per 10 seconds per identifier.
 */
export const actionRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/action",
});

/**
 * Specific rate limiter for order creation.
 * Allows 2 orders per minute per identifier.
 */
export const orderRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(2, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/order",
});
