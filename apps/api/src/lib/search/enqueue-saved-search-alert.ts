import type { Redis } from "ioredis";

import { createQueues, createRedis } from "@landshoppers/workers/producer";

let redis: Redis | null = null;
let queues: ReturnType<typeof createQueues> | null = null;

function getAlertsQueue() {
  if (!process.env.REDIS_URL?.trim()) return null;
  if (!redis || !queues) {
    redis = createRedis();
    queues = createQueues(redis);
  }
  return queues.savedSearchAlerts;
}

/** Queues digest work for Buyer saved-search alerts (worker is a stub until notifications ship). */
export async function enqueueSavedSearchAlertRegistered(params: {
  savedSearchId: string;
  userId: string;
}): Promise<void> {
  try {
    const q = getAlertsQueue();
    if (!q) return;
    await q.add(
      "saved-search-registered",
      { savedSearchId: params.savedSearchId, userId: params.userId },
      { jobId: `saved-search:${params.savedSearchId}` },
    );
  } catch (err) {
    console.warn(
      "[api] enqueueSavedSearchAlertRegistered failed:",
      err instanceof Error ? err.message : err,
    );
  }
}
