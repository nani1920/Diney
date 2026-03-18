import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

 
export const actionRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/action",
});

 
export const orderRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(2, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/order",
});
