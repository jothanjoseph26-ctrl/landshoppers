import type { Redis } from "ioredis";

/** §3.3 — contextual match payload TTL (30 minutes). */
export const SERVICEHUB_MATCH_CACHE_TTL_SEC = 30 * 60;

export function buildServicehubMatchCacheKey(input: {
  listingId: string;
  categories: readonly string[];
  subCategories?: readonly string[] | undefined;
}): string {
  const cats = [...input.categories].sort().join(",");
  const subs = input.subCategories?.length
    ? [...input.subCategories].sort().join("|")
    : "";
  return `svc:match:v1:${input.listingId}:${cats}:${subs}`;
}

export async function readServicehubMatchCache(
  redis: Redis,
  key: string,
): Promise<string | null> {
  const raw = await redis.get(key);
  return raw;
}

export async function writeServicehubMatchCache(
  redis: Redis,
  key: string,
  payload: string,
): Promise<void> {
  await redis.setex(key, SERVICEHUB_MATCH_CACHE_TTL_SEC, payload);
}
