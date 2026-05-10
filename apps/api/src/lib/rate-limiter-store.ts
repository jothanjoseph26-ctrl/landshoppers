import type { Redis } from "ioredis";

/**
 * Simple fixed-window rate limiter store.
 *
 * Returns the post-increment count for the active window. Backed by Redis when
 * available so multiple API replicas share state; falls back to an in-process
 * Map for tests or when Redis is unreachable. The shared interface keeps the
 * middleware unaware of which mode is active.
 */
export interface RateLimiterStore {
  hit(key: string, windowSeconds: number): Promise<{ count: number; resetSeconds: number }>;
}

class InMemoryStore implements RateLimiterStore {
  private buckets = new Map<string, { count: number; expiresAt: number }>();

  async hit(key: string, windowSeconds: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.expiresAt <= now) {
      const expiresAt = now + windowSeconds * 1000;
      this.buckets.set(key, { count: 1, expiresAt });
      return { count: 1, resetSeconds: windowSeconds };
    }
    existing.count += 1;
    return {
      count: existing.count,
      resetSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
    };
  }
}

class RedisStore implements RateLimiterStore {
  constructor(private redis: Redis) {}

  async hit(key: string, windowSeconds: number) {
    const pipeline = this.redis.multi();
    pipeline.incr(key);
    pipeline.expire(key, windowSeconds, "NX");
    pipeline.ttl(key);
    const results = await pipeline.exec();
    if (!results) {
      return { count: 1, resetSeconds: windowSeconds };
    }
    const count = Number(results[0]?.[1] ?? 1);
    const ttl = Number(results[2]?.[1] ?? windowSeconds);
    return {
      count,
      resetSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  }
}

let cachedStore: RateLimiterStore | null = null;
let cachedRedis: Redis | null = null;

/** Resolve the singleton rate-limit store; tests can override via `setRateLimiterStore`. */
export function getRateLimiterStore(): RateLimiterStore {
  if (cachedStore) return cachedStore;

  const url = process.env["REDIS_URL"];
  if (!url) {
    cachedStore = new InMemoryStore();
    return cachedStore;
  }

  try {
    // Lazy-load ioredis to keep test environments without the dep working.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require("ioredis") as typeof import("ioredis");
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    client.on("error", () => {
      // Swallow connection errors so a missing Redis does not crash the API;
      // we transparently fall back to the in-memory store on next hit.
      cachedStore = new InMemoryStore();
    });
    cachedRedis = client;
    cachedStore = new RedisStore(client);
    return cachedStore;
  } catch {
    cachedStore = new InMemoryStore();
    return cachedStore;
  }
}

export function setRateLimiterStore(store: RateLimiterStore | null) {
  cachedStore = store;
  if (cachedRedis) {
    void cachedRedis.quit().catch(() => {});
    cachedRedis = null;
  }
}
