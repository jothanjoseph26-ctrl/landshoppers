import type { Redis } from "ioredis";

import { createQueues, createRedis } from "@landshoppers/workers/producer";

let redis: Redis | null = null;
let queues: ReturnType<typeof createQueues> | null = null;

function getQueue() {
  if (!process.env.REDIS_URL?.trim()) return null;
  if (!redis || !queues) {
    redis = createRedis();
    queues = createQueues(redis);
  }
  return queues.seoGeneration;
}

export type SeoGenerationJobData = {
  listingId: string;
  listingTitle?: string | null;
  city?: string | null;
  state?: string | null;
  propertyType?: string | null;
  descriptionHint?: string | null;
};

export async function enqueueSeoGeneration(data: SeoGenerationJobData): Promise<void> {
  try {
    const q = getQueue();
    if (!q) return;
    await q.add(
      `seo:${data.listingId}`,
      {
        listingId: data.listingId,
        listingTitle: data.listingTitle ?? undefined,
        city: data.city ?? undefined,
        state: data.state ?? undefined,
        propertyType: data.propertyType ?? undefined,
        descriptionHint: data.descriptionHint ?? undefined,
      },
      { jobId: `seo-gen:${data.listingId}:${Date.now()}` },
    );
  } catch (err) {
    console.warn(
      "[api] enqueueSeoGeneration failed:",
      err instanceof Error ? err.message : err,
    );
  }
}
