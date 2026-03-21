import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

 
export const actionRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/action",
});

 
// Order Creation: Range [10, 20]. Current: 15 (50% increase from 10)
export const orderRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(15, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/order",
});

export const cartRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/cart",
});

// View Orders: Increased to 40/min to prevent blocking customers during navigation
export const viewOrderRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/vieworder",
});
