/** BullMQ queue names — shared with `@landshoppers/api` producers (Agent 2). */
export const QUEUE_WHATSAPP_EXTRACTION = "whatsapp-extraction-queue";
export const QUEUE_SEO_GENERATION = "seo-generation-queue";

/** Dead-letter queues receive metadata after a job exhausts retries (Week 2 skeleton). */
export const DLQ_WHATSAPP_EXTRACTION = "whatsapp-extraction-queue-dlq";
export const DLQ_SEO_GENERATION = "seo-generation-queue-dlq";
