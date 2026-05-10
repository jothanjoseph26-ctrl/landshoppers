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
  return queues.whatsappExtraction;
}

export type WhatsAppExtractionJobData = {
  rawMessageId: string;
  messageId: string;
  textContent?: string | null;
  mediaUrls: string[];
  senderPhone: string;
  senderName?: string | null;
  groupId?: string | null;
  groupName?: string | null;
};

export async function enqueueWhatsAppExtraction(data: WhatsAppExtractionJobData): Promise<void> {
  try {
    const q = getQueue();
    if (!q) return;
    await q.add(
      `extract:${data.messageId}`,
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
      { jobId: `whatsapp-extract:${data.rawMessageId}` },
    );
  } catch (err) {
    console.warn(
      "[api] enqueueWhatsAppExtraction failed:",
      err instanceof Error ? err.message : err,
    );
  }
}
