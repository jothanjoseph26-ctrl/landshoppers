import type { Client } from "@opensearch-project/opensearch";

import { getListingsIndexName } from "../opensearch.js";
import type { ListingSearchFilters, ListingSortKey } from "./listing-filters.js";

function osResponseBody(res: unknown): Record<string, unknown> {
  if (typeof res !== "object" || res === null) return {};
  const root = res as Record<string, unknown>;
  const body = root["body"];
  if (typeof body === "object" && body !== null) return body as Record<string, unknown>;
  return root;
}

export type OpenSearchListingHit = {
  _id: string;
  _score: number | undefined;
};

export type OpenSearchFacets = {
  propertyType: { value: string; count: number }[];
  city: { value: string; count: number }[];
};

function listingTypeClause(listingType?: "sale" | "rent" | "both") {
  if (listingType === "sale") return { term: { is_for_sale: true } };
  if (listingType === "rent") return { term: { is_for_rent: true } };
  if (listingType === "both") {
    return {
      bool: {
        filter: [{ term: { is_for_sale: true } }, { term: { is_for_rent: true } }],
      },
    };
  }
  return undefined;
}

function sortClause(sort: ListingSortKey, hasTextQuery: boolean): Record<string, unknown>[] {
  if (sort === "relevance" && hasTextQuery) {
    return [
      { _score: "desc" },
      { published_at: "desc" },
    ];
  }
  if (sort === "price_asc") return [{ price: "asc" }, { published_at: "desc" }];
  if (sort === "price_desc") return [{ price: "desc" }, { published_at: "desc" }];
  return [{ published_at: "desc" }, { created_at: "desc" }];
}

export function listingsSearchBody(params: {
  filters: ListingSearchFilters;
  page: number;
  pageSize: number;
  sort: ListingSortKey;
  includeAggregations: boolean;
}): Record<string, unknown> {
  const { filters: q, page, pageSize, sort, includeAggregations } = params;
  const must: Record<string, unknown>[] = [];
  const hasTextQuery = q.q !== undefined && q.q.trim().length > 0;

  if (hasTextQuery) {
    must.push({
      multi_match: {
        query: q.q!.trim(),
        type: "best_fields",
        fields: ["title^2", "description", "city", "state"],
      },
    });
  }
  if (q.city !== undefined) {
    must.push({ term: { "city.raw": q.city.toLowerCase() } });
  }
  if (q.state !== undefined) {
    must.push({ term: { "state.raw": q.state.toLowerCase() } });
  }
  if (q.neighborhood !== undefined) {
    must.push({
      multi_match: {
        query: q.neighborhood,
        fields: ["city", "title"],
        type: "phrase_prefix",
      },
    });
  }

  const filter: Record<string, unknown>[] = [];
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.push({
      range: {
        price: {
          ...(q.minPrice !== undefined ? { gte: Number(q.minPrice) } : {}),
          ...(q.maxPrice !== undefined ? { lte: Number(q.maxPrice) } : {}),
        },
      },
    });
  }
  if (q.minBeds !== undefined || q.maxBeds !== undefined) {
    filter.push({
      range: {
        bedrooms: {
          ...(q.minBeds !== undefined ? { gte: q.minBeds } : {}),
          ...(q.maxBeds !== undefined ? { lte: q.maxBeds } : {}),
        },
      },
    });
  }
  if (q.minBaths !== undefined || q.maxBaths !== undefined) {
    filter.push({
      range: {
        bathrooms: {
          ...(q.minBaths !== undefined ? { gte: q.minBaths } : {}),
          ...(q.maxBaths !== undefined ? { lte: q.maxBaths } : {}),
        },
      },
    });
  }
  if (q.propertyType !== undefined) {
    filter.push({ term: { property_type: q.propertyType } });
  }
  const lt = listingTypeClause(q.listingType);
  if (lt) filter.push(lt);

  const from = (page - 1) * pageSize;
  const sortToUse = sortClause(sort === "relevance" && !hasTextQuery ? "newest" : sort, hasTextQuery);

  const body: Record<string, unknown> = {
    track_total_hits: true,
    from,
    size: pageSize,
    query: {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter,
      },
    },
    sort: sortToUse,
  };

  if (includeAggregations) {
    body.aggs = {
      property_type: {
        terms: { field: "property_type", size: 30 },
      },
      city: {
        terms: { field: "city.raw", size: 40 },
      },
    };
  }

  return body;
}

function parseTermsAgg(
  buckets: { key: string | number; doc_count: number }[] | undefined,
): { value: string; count: number }[] {
  if (!buckets) return [];
  return buckets
    .filter((b) => String(b.key).length > 0)
    .map((b) => ({ value: String(b.key), count: b.doc_count }));
}

export async function executeListingsOpenSearch(client: Client, params: {
  filters: ListingSearchFilters;
  page: number;
  pageSize: number;
  sort: ListingSortKey;
  includeAggregations: boolean;
}): Promise<{ total: number; hits: OpenSearchListingHit[]; facets: OpenSearchFacets | null }> {
  const index = getListingsIndexName();
  const body = listingsSearchBody(params);
  const res = await client.search({ index, body });
  const parsed = osResponseBody(res);

  const hits = (parsed.hits as { hits?: { _id: string; _score?: number }[] } | undefined)?.hits ?? [];

  const totalRaw = (parsed.hits as { total?: number | { value?: number } } | undefined)?.total;
  const total =
    typeof totalRaw === "number"
      ? totalRaw
      : typeof totalRaw === "object" && totalRaw !== null && "value" in totalRaw
        ? Number((totalRaw as { value: number }).value)
        : hits.length;

  const parsedHits: OpenSearchListingHit[] = hits.map((h) => ({
    _id: h._id,
    _score: h._score,
  }));

  let facets: OpenSearchFacets | null = null;
  const aggs = parsed.aggregations as
    | {
        property_type?: { buckets?: { key: string | number; doc_count: number }[] };
        city?: { buckets?: { key: string | number; doc_count: number }[] };
      }
    | undefined;
  if (aggs) {
    facets = {
      propertyType: parseTermsAgg(aggs.property_type?.buckets),
      city: parseTermsAgg(aggs.city?.buckets),
    };
  }

  return { total, hits: parsedHits, facets };
}

export async function executeAutocompleteSuggest(
  client: Client,
  prefix: string,
): Promise<string[]> {
  const index = getListingsIndexName();
  const res = await client.search({
    index,
    body: {
      size: 0,
      suggest: {
        listing_suggest: {
          prefix: prefix.trim().toLowerCase(),
          completion: {
            field: "suggest",
            size: 12,
            skip_duplicates: true,
          },
        },
      },
    },
  });

  const body = osResponseBody(res);
  const suggestBucket = (
    body.suggest as Record<string, { options?: { text: string }[] }[]> | undefined
  )?.listing_suggest;
  const opts = (suggestBucket?.[0]?.options ?? []) as { text: string }[];
  return [...new Set(opts.map((o) => o.text))].slice(0, 12);
}

export async function executeAutocompleteMatch(
  client: Client,
  prefix: string,
): Promise<string[]> {
  const index = getListingsIndexName();
  const res = await client.search({
    index,
    body: {
      size: 8,
      _source: ["city", "title"],
      query: {
        multi_match: {
          query: prefix.trim(),
          type: "bool_prefix",
          fields: ["city", "title"],
        },
      },
    },
  });

  const body = osResponseBody(res);
  const hitsRoot = body.hits as { hits?: { _source?: { city?: string; title?: string } }[] } | undefined;
  const hits = hitsRoot?.hits ?? [];
  const out: string[] = [];
  for (const h of hits) {
    if (h._source?.city) out.push(h._source.city);
    if (h._source?.title) out.push(h._source.title);
  }
  return [...new Set(out)].slice(0, 12);
}
