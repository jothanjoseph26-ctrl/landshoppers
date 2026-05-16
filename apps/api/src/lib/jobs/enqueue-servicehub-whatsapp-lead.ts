import type { Redis } from "ioredis";

import { createQueues, createRedis } from "@landshoppers/workers/producer";

import type { WhatsAppExtractionJobData } from "./enqueue-whatsapp-extraction.js";

let redis: Redis | null = null;
let queues: ReturnType<typeof createQueues> | null = null;

function getQueue() {
  if (!process.env.REDIS_URL?.trim()) return null;
  if (!redis || !queues) {
    redis = createRedis();
    queues = createQueues(redis);
  }
  return queues.servicehubWhatsAppLead;
}

export type ServicehubWhatsAppLeadJobData = WhatsAppExtractionJobData;

/** Phase C — enqueue structured WhatsApp → ServiceHub lead worker (§6.3). */
export async function enqueueServicehubWhatsAppLead(data: ServicehubWhatsAppLeadJobData): Promise<void> {
  try {
    const q = getQueue();
    if (!q) return;
    await q.add(
      `servicehub-wa:${data.messageId}`,
      {
        rawMessageId: data.rawMessageId,
        messageId: data.messageId,
        textContent: data.textContent ?? undefined,
        mediaUrls: data.mediaUrls,
        senderPhone: data.senderPhone,
        senderName: data.senderName ?? undefined,
        groupId: data.groupId ?? undefined,
        groupName: data.groupName ?? undefined,
      },
      { jobId: `servicehub-wa-lead:${data.rawMessageId}` },
    );
  } catch (err) {
    console.warn(
      "[api] enqueueServicehubWhatsAppLead failed:",
      err instanceof Error ? err.message : err,
    );
  }
}
