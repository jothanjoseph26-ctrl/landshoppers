/**
 * Import `@landshoppers/workers/producer` from API / scripts.
 * Do **not** import the package root — that starts BullMQ processors (`src/index.ts`).
 */
export { createRedis } from "./connection.js";
export { createQueues } from "./queues.js";
export {
  DLQ_SEO_GENERATION,
  DLQ_WHATSAPP_EXTRACTION,
  QUEUE_SEO_GENERATION,
  QUEUE_WHATSAPP_EXTRACTION,
} from "./constants.js";
export { defaultProducerJobOptions } from "./job-defaults.js";
