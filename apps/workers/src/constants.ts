/** BullMQ queue names — shared with `@landshoppers/api` producers (Agent 2). */
export const QUEUE_WHATSAPP_EXTRACTION = "whatsapp-extraction-queue";
export const QUEUE_SEO_GENERATION = "seo-generation-queue";
export const QUEUE_LISTING_INDEX = "listing-index-queue";
/** Placeholder for saved-search email/in-app digests (Agent 3 foundation). */
export const QUEUE_SAVED_SEARCH_ALERTS = "saved-search-alerts-queue";

/** Dead-letter queues receive metadata after a job exhausts retries (Week 2 skeleton). */
export const DLQ_WHATSAPP_EXTRACTION = "whatsapp-extraction-queue-dlq";
export const DLQ_SEO_GENERATION = "seo-generation-queue-dlq";
export const DLQ_LISTING_INDEX = "listing-index-queue-dlq";
