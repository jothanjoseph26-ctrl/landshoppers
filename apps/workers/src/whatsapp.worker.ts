import { Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";

import {
  DLQ_WHATSAPP_EXTRACTION,
  QUEUE_WHATSAPP_EXTRACTION,
} from "./constants.js";
import { attachDeadLetterHandler } from "./dlq.js";

export function startWhatsAppExtractionWorker(connection: Redis): Worker {
  const aiUrl = (process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

  const worker = new Worker(
    QUEUE_WHATSAPP_EXTRACTION,
    async (job: Job) => {
      const res = await fetch(`${aiUrl}/extract-listing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job.data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`extract-listing failed: HTTP ${res.status} ${text}`);
      }
      return res.json() as Promise<unknown>;
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
