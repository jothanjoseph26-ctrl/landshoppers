import { Queue } from "bullmq";
import type { Redis } from "ioredis";

import {
  QUEUE_SEO_GENERATION,
  QUEUE_WHATSAPP_EXTRACTION,
} from "./constants.js";
import { defaultProducerJobOptions } from "./job-defaults.js";

/** Queue producers import these from `@landshoppers/workers` once Agent 2 enqueues jobs. */
export function createQueues(connection: Redis) {
  return {
    whatsappExtraction: new Queue(QUEUE_WHATSAPP_EXTRACTION, {
      connection,
      defaultJobOptions: defaultProducerJobOptions,
    }),
    seoGeneration: new Queue(QUEUE_SEO_GENERATION, {
      connection,
      defaultJobOptions: defaultProducerJobOptions,
    }),
  };
}
