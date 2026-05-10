import { Queue, type Worker } from "bullmq";
import type { Redis } from "ioredis";

export type DlqEnvelope = {
  sourceQueue: string;
  originalJobId: string | undefined;
  failedReason: string;
  failedAt: string;
  /** Shallow summary only — avoid logging full WhatsApp payloads in DLQ. */
  payloadKeys: string[];
};

/**
 * After all retries are exhausted, enqueue a small DLQ record for ops visibility.
 * BullMQ still retains the failed job in the failed set unless removed.
 */
export function attachDeadLetterHandler(
  connection: Redis,
  sourceQueueName: string,
  dlqName: string,
  worker: Worker,
): Queue<DlqEnvelope> {
  const dlq = new Queue<DlqEnvelope>(dlqName, { connection });

  worker.on("failed", (job, err) => {
    if (!job) return;
    const max = job.opts.attempts ?? 1;
    if (job.attemptsMade < max) return;

    const reason = err instanceof Error ? err.message : String(err);
    const keys =
      job.data && typeof job.data === "object" && !Array.isArray(job.data)
        ? Object.keys(job.data as Record<string, unknown>)
        : [];

    void dlq
      .add(
        "failed-final",
        {
          sourceQueue: sourceQueueName,
          originalJobId: job.id,
          failedReason: reason,
          failedAt: new Date().toISOString(),
          payloadKeys: keys,
        },
        {
          removeOnComplete: { age: 7 * 86400 },
        },
      )
      .catch((e: unknown) => {
        console.error(`[dlq] enqueue failed (${dlqName}):`, e);
      });

    console.error(
      `[workers] job exhausted retries → DLQ (${dlqName})`,
      job.id,
      reason,
    );
  });

  return dlq;
}
