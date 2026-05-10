import type { DefaultJobOptions } from "bullmq";

/**
 * Default retry/backoff when Agent 2 enqueues jobs via `createQueues`.
 * Callers may override per-job.
 */
export const defaultProducerJobOptions: DefaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600,
    count: 500,
  },
  removeOnFail: {
    age: 86400,
  },
};
