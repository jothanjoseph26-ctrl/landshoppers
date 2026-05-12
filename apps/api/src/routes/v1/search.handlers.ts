import { ListingStatus } from "@landshoppers/db";
import type { Context } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import type { AutocompleteQuery, ListingsSearchQuery, MapSearchQuery } from "../../contracts/search.js";
import type { ListingSearchFilters, ListingSortKey } from "../../lib/search/listing-filters.js";
import {
  buildListingWhere,
  postgresListingFacets,
  prismaOrderBy,
} from "../../lib/search/listing-filters.js";
import {
  executeAutocompleteMatch,
  executeAutocompleteSuggest,
  executeListingsOpenSearch,
} from "../../lib/search/opensearch-queries.js";
import { getListingsIndexName, getOpenSearchClient } from "../../lib/opensearch.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import type { ListingWithProperty } from "../../lib/serialize/listing.js";
import type { ApiEnv } from "../../types/env.js";

function coerceSort(s: ListingSortKey | undefined): ListingSortKey {
  return s ?? "newest";
}

function queryToFilters(q: ListingsSearchQuery): ListingSearchFilters {
  return {
    q: q.q,
    city: q.city,
    neighborhood: q.neighborhood,
    state: q.state,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    minBeds: q.minBeds,
    maxBeds: q.maxBeds,
    minBaths: q.minBaths,
    maxBaths: q.maxBaths,
    propertyType: q.propertyType,
    listingType: q.listingType,
  };
}

async function hydrateListingsOrdered(hitIds: string[]): Promise<ListingWithProperty[]> {
  if (hitIds.length === 0) return [];
  const rows = await prisma.listing.findMany({
    where: {
      id: { in: hitIds },
      deletedAt: null,
      property: { deletedAt: null },
    },
    include: { property: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return hitIds.map((id) => byId.get(id)).filter(Boolean) as ListingWithProperty[];
}

export async function handleListingsSearch(c: Context<ApiEnv>, q: ListingsSearchQuery): Promise<Response> {
  const { page, pageSize, backend, facets: wantFacets, sort: sortRaw, lat, lng, radiusKm } = q;
  const sort = coerceSort(sortRaw);
  const skip = offsetFromPage(page, pageSize);
  const filters = queryToFilters(q);

  /** Radius-first path (legacy GET /v1/search semantics). */
  if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
    const radiusMeters = Math.round(radiusKm * 1000);
    const inRadius = await prisma.$queryRaw<{ id: string }[]>`
      SELECT l.id
      FROM listings l
      INNER JOIN properties p ON p.id = l.property_id
      WHERE l.deleted_at IS NULL
        AND l.status = 'active'::"ListingStatus"
        AND p.deleted_at IS NULL
        AND p.geom IS NOT NULL
        AND ST_DWithin(
          p.geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
    `;
    const inSet = inRadius.map((r) => r.id);
    if (inSet.length === 0) {
      return c.json({
        data: [],
        meta: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
          mode: "postgres_geo_radius",
          ...(wantFacets ? { facets: { propertyType: [], city: [] } } : {}),
          backendUsed: "postgres",
        },
      });
    }

    const geoWhere = { ...buildListingWhere(filters), id: { in: inSet } };
    const [total, facetData, rows] = await Promise.all([
      prisma.listing.count({ where: geoWhere }),
      wantFacets ? postgresListingFacets(geoWhere) : Promise.resolve(null),
      prisma.listing.findMany({
        where: geoWhere,
        include: { property: true },
        orderBy: prismaOrderBy(sort),
        skip,
        take: pageSize,
      }),
    ]);

    return c.json({
      data: rows.map(listingToJson),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        mode: "postgres_geo_radius",
        ...(facetData !== null ? { facets: facetData } : {}),
        backendUsed: "postgres",
      },
    });
  }

  const baseWhere = buildListingWhere(filters);

  if (backend === "opensearch" || backend === "auto") {
    const osClient = getOpenSearchClient();
    if (backend === "opensearch" && !osClient) {
      return c.json(
        {
          data: null,
          error: {
            code: "OPENSEARCH_UNAVAILABLE",
            message:
              "OpenSearch client unavailable; set SEARCH_BACKEND=auto or postgres, or configure OPENSEARCH_URL.",
          },
        },
        503,
      );
    }

    if (osClient) {
      try {
        const { total, hits, facets } = await executeListingsOpenSearch(osClient, {
          filters,
          page,
          pageSize,
          sort,
          includeAggregations: wantFacets,
        });
        const ordered = await hydrateListingsOrdered(hits.map((h) => h._id));

        return c.json({
          data: ordered.map(listingToJson),
          meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            mode: "opensearch",
            index: getListingsIndexName(),
            ...(wantFacets && facets ? { facets } : {}),
            sort,
            backendUsed: "opensearch",
          },
        });
      } catch {
        if (backend === "opensearch") {
          return c.json(
            {
              data: null,
              error: {
                code: "OPENSEARCH_SEARCH_FAILED",
                message: "OpenSearch query failed.",
              },
            },
            503,
          );
        }
      }
    }
  }

  const order = prismaOrderBy(sort === "relevance" ? "newest" : sort);
  const [total, facetData, rows] = await Promise.all([
    prisma.listing.count({ where: baseWhere }),
    wantFacets ? postgresListingFacets(baseWhere) : Promise.resolve(null),
    prisma.listing.findMany({
      where: baseWhere,
      include: { property: true },
      orderBy: order,
      skip,
      take: pageSize,
    }),
  ]);

  return c.json({
    data: rows.map(listingToJson),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      mode: "postgres",
      ...(facetData !== null ? { facets: facetData } : {}),
      backendUsed: "postgres",
    },
  });
}

export async function handleMapSearch(c: Context<ApiEnv>, q: MapSearchQuery): Promise<Response> {
  const {
    minLng,
    minLat,
    maxLng,
    maxLat,
    page,
    pageSize,
    radiusKm,
    centerLat,
    centerLng,
    minPrice,
    maxPrice,
    propertyType,
    listingType,
  } = q;
  const skip = offsetFromPage(page, pageSize);
  const baseWhere = {
    deletedAt: null,
    status: ListingStatus.active,
    ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
    ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
    ...(minPrice !== undefined && maxPrice !== undefined
      ? { price: { gte: minPrice, lte: maxPrice } }
      : {}),
    ...(listingType === "sale" ? { isForSale: true } : {}),
    ...(listingType === "rent" ? { isForRent: true } : {}),
    ...(listingType === "both" ? { isForSale: true, isForRent: true } : {}),
  };

  const propertyFilter = {
    deletedAt: null,
    latitude: { not: null, gte: minLat, lte: maxLat },
    longitude: { not: null, gte: minLng, lte: maxLng },
    ...(propertyType !== undefined ? { propertyType } : {}),
  };

  let rows = await prisma.listing.findMany({
    where: {
      ...baseWhere,
      property: propertyFilter,
    },
    include: { property: true },
    orderBy: { createdAt: "desc" },
    skip: radiusKm !== undefined ? 0 : skip,
    take: radiusKm !== undefined ? Math.min(skip + pageSize + 250, 500) : pageSize,
  });

  if (radiusKm !== undefined && centerLat !== undefined && centerLng !== undefined) {
    rows = rows
      .filter((row) => {
        const lat = row.property.latitude;
        const lng = row.property.longitude;
        return lat !== null && lng !== null && distanceKm(centerLat, centerLng, lat, lng) <= radiusKm;
      })
      .slice(skip, skip + pageSize);
  }

  const geojson = {
    type: "FeatureCollection" as const,
    features: rows.map((row) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [row.property.longitude, row.property.latitude],
      },
      properties: {
        id: row.id,
        price: row.price.toString(),
        title: row.property.title,
        slug: row.property.slug,
        propertyType: row.property.propertyType,
      },
    })),
  };

  return c.json({
    data: geojson,
    meta: {
      page,
      pageSize,
      totalInPage: rows.length,
      clusterReady: true,
      mode:
        radiusKm !== undefined ? ("postgres_latlng_radius" as const) : ("postgres_latlng_bbox" as const),
    },
  });
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export async function handleAutocomplete(c: Context<ApiEnv>, query: AutocompleteQuery): Promise<Response> {
  const { q: qRaw, backend } = query;
  const q = qRaw.trim();

  let suggestions: string[] = [];
  let backendUsed: "opensearch" | "postgres" | "mixed" = "postgres";

  const osClient = getOpenSearchClient();
  const trySuggest = backend === "postgres" ? null : osClient;

  if (trySuggest) {
    try {
      const fromSuggest = await executeAutocompleteSuggest(trySuggest, q);
      suggestions = [...fromSuggest];
      if (suggestions.length === 0) suggestions = await executeAutocompleteMatch(trySuggest, q);
      if (suggestions.length > 0) backendUsed = "opensearch";
    } catch {
      if (backend === "opensearch") {
        return c.json(
          {
            data: null,
            error: {
              code: "OPENSEARCH_AUTOCOMPLETE_FAILED",
              message: "OpenSearch suggest failed.",
            },
          },
          503,
        );
      }
    }
  }

  if (suggestions.length === 0) {
    const rows = await prisma.property.findMany({
      where: {
        deletedAt: null,
        OR: [
          { city: { startsWith: q, mode: "insensitive" } },
          { title: { startsWith: q, mode: "insensitive" } },
        ],
        listings: { some: { deletedAt: null, status: ListingStatus.active } },
      },
      select: { city: true, title: true },
      take: 24,
    });
    const set = new Set<string>();
    for (const row of rows) {
      set.add(row.city);
      set.add(row.title);
    }
    suggestions = [...set].slice(0, 12);
    backendUsed = "postgres";
  }

  return c.json({
    data: suggestions,
    meta: { backendUsed },
  });
}
