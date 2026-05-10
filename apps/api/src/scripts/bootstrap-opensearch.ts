/**
 * Create the listings search index when missing (safe to re-run; fails if mapping conflicts).
 *
 * Usage: `pnpm --filter @landshoppers/api run search:bootstrap`
 */

import "../env.js";

import { DEFAULT_LISTINGS_INDEX_NAME, listingSearchIndexCreateBody } from "@landshoppers/search-listing";

const osUrl = (process.env.OPENSEARCH_URL ?? "http://127.0.0.1:9200").replace(/\/$/, "");
const index = process.env.OPENSEARCH_LISTINGS_INDEX ?? DEFAULT_LISTINGS_INDEX_NAME;

async function main(): Promise<void> {
  const head = await fetch(`${osUrl}/${index}`, { method: "HEAD" });
  if (head.ok) {
    console.log(`[search:bootstrap] index already exists → ${index}`);
    return;
  }

  const res = await fetch(`${osUrl}/${index}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listingSearchIndexCreateBody()),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OpenSearch PUT ${index} failed: HTTP ${res.status} ${text}`);
  }
  console.log(`[search:bootstrap] created index ${index}`, text.slice(0, 500));
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
