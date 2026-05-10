import { Client } from "@opensearch-project/opensearch";

let client: Client | null | undefined;

export function getOpenSearchUrl(): string {
  return (process.env.OPENSEARCH_URL ?? "http://127.0.0.1:9200").replace(/\/$/, "");
}

export function getListingsIndexName(): string {
  return process.env.OPENSEARCH_LISTINGS_INDEX ?? "landshoppers-listings-v1";
}

/** Lazy singleton; `null` means client creation failed at runtime. */
export function getOpenSearchClient(): Client | null {
  if (client !== undefined) return client;
  try {
    client = new Client({ node: getOpenSearchUrl() });
    return client;
  } catch {
    client = null;
    return null;
  }
}

export function resetOpenSearchClientForTests(): void {
  client = undefined;
}
