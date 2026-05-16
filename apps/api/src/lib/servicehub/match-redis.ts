import type { Redis } from "ioredis";

import { createRedis } from "@landshoppers/workers/producer";

let cached: Redis | null | undefined;

/** Lazy Redis for §3.3 contextual match cache — mirrors listing-index enqueue pattern. */
export function getServicehubMatchRedis(): Redis | null {
  if (cached !== undefined) return cached;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    cached = null;
    return null;
  }
  cached = createRedis();
  return cached;
}
