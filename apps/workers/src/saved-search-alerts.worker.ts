import type { Redis } from "ioredis";
import type { Job } from "bullmq";
import { Worker } from "bullmq";

import { QUEUE_SAVED_SEARCH_ALERTS } from "./constants.js";

type AlertJob = {
  savedSearchId: string;
  userId: string;
};

/** Placeholder consumer: persists queue contract while email/in-app alerting is wired (Agent 6). */
export function startSavedSearchAlertsWorker(connection: Redis): Worker {
  return new Worker(
    QUEUE_SAVED_SEARCH_ALERTS,
    async (job: Job<AlertJob>) => {
      console.log(`[${QUEUE_SAVED_SEARCH_ALERTS}] queued`, job.id, job.data);
    },
    { connection, concurrency: 1 },
  );
}
