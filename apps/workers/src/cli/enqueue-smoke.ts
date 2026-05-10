/**
 * Week 2 smoke: enqueue one job per queue using AI service test fixtures.
 * Requires Redis (`pnpm docker:up`) and paths under `apps/ai-service/tests/fixtures`.
 *
 * Run: `pnpm --filter @landshoppers/workers run enqueue-smoke`
 */
import "../env.js";

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createRedis } from "../connection.js";
import { createQueues } from "../queues.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const fixturesDir = join(__dirname, "../../../../ai-service/tests/fixtures");
  const extractPayload = JSON.parse(
    readFileSync(join(fixturesDir, "extract_luxury_duplex.json"), "utf8"),
  ) as Record<string, unknown>;
  const seoPayload = JSON.parse(
    readFileSync(join(fixturesDir, "seo_waterfront.json"), "utf8"),
  ) as Record<string, unknown>;

  const connection = createRedis();
  const queues = createQueues(connection);

  const [w, s] = await Promise.all([
    queues.whatsappExtraction.add("smoke-extract", extractPayload),
    queues.seoGeneration.add("smoke-seo", seoPayload),
  ]);

  console.log(
    `[enqueue-smoke] enqueued whatsapp job ${w.id}, seo job ${s.id} — run workers + AI service to process.`,
  );

  await connection.quit();
}

main().catch((e: unknown) => {
  console.error("[enqueue-smoke] failed:", e);
  process.exit(1);
});
