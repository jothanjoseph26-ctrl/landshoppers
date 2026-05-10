import "./env.js";

import { createRedis } from "./connection.js";
import { startSeoGenerationWorker } from "./seo.worker.js";
import { startWhatsAppExtractionWorker } from "./whatsapp.worker.js";

const connection = createRedis();

connection.on("error", (err: Error) => {
  console.error("[workers] Redis error:", err.message);
});

const whatsappWorker = startWhatsAppExtractionWorker(connection);
const seoWorker = startSeoGenerationWorker(connection);

console.log(
  "[workers] listening on queues: whatsapp-extraction-queue, seo-generation-queue (+ DLQ on exhausted retries) → AI_SERVICE_URL",
);

async function shutdown(signal: string): Promise<void> {
  console.log(`[workers] ${signal}, closing…`);
  await whatsappWorker.close();
  await seoWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
