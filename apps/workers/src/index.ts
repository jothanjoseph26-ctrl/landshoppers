import "./env.js";

import { createRedis } from "./connection.js";
import { startListingIndexWorker } from "./listing-index.worker.js";
import { startSavedSearchAlertsWorker } from "./saved-search-alerts.worker.js";
import { startSeoGenerationWorker } from "./seo.worker.js";
import { startWhatsAppExtractionWorker } from "./whatsapp.worker.js";

const connection = createRedis();

connection.on("error", (err: Error) => {
  console.error("[workers] Redis error:", err.message);
});

const whatsappWorker = startWhatsAppExtractionWorker(connection);
const seoWorker = startSeoGenerationWorker(connection);
const listingIndexWorker = startListingIndexWorker(connection);
const savedSearchAlertsWorker = startSavedSearchAlertsWorker(connection);

console.log(
  "[workers] listening on queues: whatsapp-extraction, seo-generation, listing-index, saved-search-alerts (+ DLQs) → AI_SERVICE_URL / OpenSearch",
);

async function shutdown(signal: string): Promise<void> {
  console.log(`[workers] ${signal}, closing…`);
  await whatsappWorker.close();
  await seoWorker.close();
  await listingIndexWorker.close();
  await savedSearchAlertsWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
