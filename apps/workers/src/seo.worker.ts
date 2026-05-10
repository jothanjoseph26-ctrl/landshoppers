import { Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";

import { DLQ_SEO_GENERATION, QUEUE_SEO_GENERATION } from "./constants.js";
import { attachDeadLetterHandler } from "./dlq.js";

export function startSeoGenerationWorker(connection: Redis): Worker {
  const aiUrl = (process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

  const worker = new Worker(
    QUEUE_SEO_GENERATION,
    async (job: Job) => {
      const res = await fetch(`${aiUrl}/generate-seo-variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job.data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`generate-seo-variants failed: HTTP ${res.status} ${text}`);
      }
      return res.json() as Promise<unknown>;
    },
    {
      connection,
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[${QUEUE_SEO_GENERATION}] completed`, job.id);
  });

  attachDeadLetterHandler(
    connection,
    QUEUE_SEO_GENERATION,
    DLQ_SEO_GENERATION,
    worker,
  );

  return worker;
}
