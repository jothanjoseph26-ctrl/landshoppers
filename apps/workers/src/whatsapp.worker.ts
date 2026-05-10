import { WhatsAppMessageStatus, createPrismaClient } from "@landshoppers/db";
import { Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";

import {
  DLQ_WHATSAPP_EXTRACTION,
  QUEUE_WHATSAPP_EXTRACTION,
} from "./constants.js";
import { attachDeadLetterHandler } from "./dlq.js";

const prisma = createPrismaClient();

export type WhatsAppExtractionJobPayload = {
  rawMessageId: string;
  messageId: string;
  textContent?: string;
  mediaUrls?: string[];
  senderPhone: string;
  senderName?: string;
  groupId?: string;
  groupName?: string;
};

export function startWhatsAppExtractionWorker(connection: Redis): Worker {
  const aiUrl = (process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

  const worker = new Worker(
    QUEUE_WHATSAPP_EXTRACTION,
    async (job: Job<WhatsAppExtractionJobPayload>) => {
      const payload = job.data;
      const res = await fetch(`${aiUrl}/extract-listing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawMessageId: payload.rawMessageId,
          messageId: payload.messageId,
          textContent: payload.textContent ?? null,
          mediaUrls: payload.mediaUrls ?? [],
          senderPhone: payload.senderPhone,
          senderName: payload.senderName ?? null,
          groupId: payload.groupId ?? null,
          groupName: payload.groupName ?? null,
        }),
      });

      const responseText = await res.text();
      let rawJson: Record<string, unknown> = {};
      try {
        rawJson = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        rawJson = { detail: responseText };
      }

      if (!res.ok) {
        const msg =
          typeof rawJson["detail"] === "string"
            ? rawJson["detail"]
            : responseText || JSON.stringify(rawJson);
        await prisma.rawWhatsAppMessage
          .update({
            where: { id: payload.rawMessageId },
            data: {
              status: WhatsAppMessageStatus.FAILED,
              extractionError: `HTTP ${res.status}: ${msg}`,
              processedAt: new Date(),
            },
          })
          .catch(() => {});
        throw new Error(`extract-listing failed: HTTP ${res.status} ${msg}`);
      }

      const dupId = rawJson["duplicateOfMessageId"];
      const status =
        dupId != null && String(dupId).length > 0
          ? WhatsAppMessageStatus.DUPLICATE
          : WhatsAppMessageStatus.PROCESSED;

      await prisma.rawWhatsAppMessage.update({
        where: { id: payload.rawMessageId },
        data: {
          extractedData: rawJson as object,
          confidenceScore:
            typeof rawJson["confidence"] === "number" ? rawJson["confidence"] : null,
          extractionError: null,
          processedAt: new Date(),
          status,
        },
      });

      return rawJson;
    },
    {
      connection,
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[${QUEUE_WHATSAPP_EXTRACTION}] completed`, job.id);
  });

  attachDeadLetterHandler(
    connection,
    QUEUE_WHATSAPP_EXTRACTION,
    DLQ_WHATSAPP_EXTRACTION,
    worker,
  );

  return worker;
}
