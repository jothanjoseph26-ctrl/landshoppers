import type { Redis } from "ioredis";

import { createQueues, createRedis } from "@landshoppers/workers/producer";

let redis: Redis | null = null;
let queues: ReturnType<typeof createQueues> | null = null;

function getListingIndexQueue() {
  if (!process.env.REDIS_URL?.trim()) return null;
  if (!redis || !queues) {
    redis = createRedis();
    queues = createQueues(redis);
  }
  return queues.listingIndex;
}

/**
 * Enqueues a BullMQ job to upsert/delete a listing document in OpenSearch.
 * Fails quietly when Redis is unavailable so the API stays responsive.
 */
export async function enqueueListingIndexSync(listingId: string): Promise<void> {
  try {
    const q = getListingIndexQueue();
    if (!q) return;
    await q.add("listing-index-sync", { listingId }, { jobId: `listing-index:${listingId}` });
  } catch (err) {
    console.warn("[api] enqueueListingIndexSync failed:", err instanceof Error ? err.message : err);
  }
}
