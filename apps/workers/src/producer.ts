/**
 * Import `@landshoppers/workers/producer` from API / scripts.
 * Do **not** import the package root — that starts BullMQ processors (`src/index.ts`).
 */
export { createRedis } from "./connection.js";
export type { ProviderMatchScoreJobPayload } from "./provider-match-score.worker.js";
export { createQueues } from "./queues.js";
export {
  DLQ_LISTING_INDEX,
  DLQ_PROVIDER_MATCH_SCORE,
  DLQ_SERVICEHUB_WHATSAPP_LEAD,
  DLQ_SEO_GENERATION,
  DLQ_WHATSAPP_EXTRACTION,
  QUEUE_LISTING_INDEX,
  QUEUE_PROVIDER_MATCH_SCORE,
  QUEUE_SAVED_SEARCH_ALERTS,
  QUEUE_SEO_GENERATION,
  QUEUE_SERVICEHUB_WHATSAPP_LEAD,
  QUEUE_WHATSAPP_EXTRACTION,
} from "./constants.js";
export { defaultProducerJobOptions } from "./job-defaults.js";
