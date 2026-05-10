import type { Context, MiddlewareHandler } from "hono";

import { ApiError } from "../lib/errors.js";
import { getRateLimiterStore } from "../lib/rate-limiter-store.js";
import type { ApiEnv } from "../types/env.js";

export type RateLimitOptions = {
  /** Logical bucket name (auth:login, auth:register…). */
  bucket: string;
  /** Number of requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /** Override the per-request key; defaults to client IP. */
  keyFromContext?: (c: Context<ApiEnv>) => string | Promise<string>;
};

const DISABLE_FLAGS = new Set(["true", "1", "yes"]);

function rateLimitDisabled(): boolean {
  const flag = process.env["RATE_LIMIT_DISABLED"];
  return flag !== undefined && DISABLE_FLAGS.has(flag.toLowerCase());
}

function defaultKey(c: Context<ApiEnv>): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    c.req.header("x-real-ip") ??
    c.req.header("cf-connecting-ip") ??
    "anonymous"
  );
}

/** Fixed-window rate limit; throws 429 on overflow. Falls back to in-memory store when Redis is missing. */
export function rateLimit(opts: RateLimitOptions): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    if (rateLimitDisabled()) {
      await next();
      return;
    }
    const subject = await (opts.keyFromContext?.(c) ?? defaultKey(c));
    const key = `rl:${opts.bucket}:${subject}`;
    const store = getRateLimiterStore();
    const { count, resetSeconds } = await store.hit(key, opts.windowSeconds);

    c.header("X-RateLimit-Limit", String(opts.limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, opts.limit - count)));
    c.header("X-RateLimit-Reset", String(resetSeconds));

    if (count > opts.limit) {
      c.header("Retry-After", String(resetSeconds));
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "Too many requests; please retry after the cooldown",
        { retryAfterSeconds: resetSeconds, bucket: opts.bucket },
      );
    }

    await next();
  };
}
