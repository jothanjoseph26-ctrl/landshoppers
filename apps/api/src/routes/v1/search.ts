import { zValidator } from "@hono/zod-validator";
import { ListingStatus } from "@landshoppers/db";
import type { Prisma } from "@landshoppers/db";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import { searchQuerySchema } from "../../contracts/search.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import type { ApiEnv } from "../../types/env.js";

export const searchV1 = new Hono<ApiEnv>();

function buildListingWhere(q: {
  q?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  minPrice?: bigint | undefined;
  maxPrice?: bigint | undefined;
}): Prisma.ListingWhereInput {
  const propertyFilters: Prisma.PropertyWhereInput[] = [];
  if (q.city !== undefined) {
    propertyFilters.push({ city: { equals: q.city, mode: "insensitive" } });
  }
  if (q.state !== undefined) {
    propertyFilters.push({ state: { equals: q.state, mode: "insensitive" } });
  }
  if (q.q !== undefined) {
    propertyFilters.push({
      OR: [
        { title: { contains: q.q, mode: "insensitive" } },
        { city: { contains: q.q, mode: "insensitive" } },
        { state: { contains: q.q, mode: "insensitive" } },
      ],
    });
  }

  const priceFilter =
    q.minPrice !== undefined || q.maxPrice !== undefined
      ? {
          ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
          ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
        }
      : undefined;

  return {
    deletedAt: null,
    status: ListingStatus.active,
    ...(priceFilter !== undefined ? { price: priceFilter } : {}),
    property: {
      deletedAt: null,
      ...(propertyFilters.length > 0 ? { AND: propertyFilters } : {}),
    },
  };
}

searchV1.get("/", zValidator("query", searchQuerySchema), async (c) => {
  const q = c.req.valid("query");
  const { page, pageSize, lat, lng, radiusKm } = q;
  const skip = offsetFromPage(page, pageSize);

  if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
    const radiusMeters = Math.round(radiusKm * 1000);

    const inRadius = await prisma.$queryRaw<{ id: string }[]>`
      SELECT l.id
      FROM listings l
      INNER JOIN properties p ON p.id = l.property_id
      WHERE l.deleted_at IS NULL
        AND l.status = 'active'
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
          mode: "postgres_geo",
          note:
            "Radius uses PostGIS ST_DWithin; large result sets should move filters into SQL before launch.",
        },
      });
    }

    const geoWhere: Prisma.ListingWhereInput = {
      ...buildListingWhere(q),
      id: { in: inSet },
    };

    const [total, rows] = await Promise.all([
      prisma.listing.count({ where: geoWhere }),
      prisma.listing.findMany({
        where: geoWhere,
        include: { property: true },
        orderBy: { createdAt: "desc" },
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
        mode: "postgres_geo",
        note:
          "Radius uses PostGIS ST_DWithin; large result sets should move filters into SQL before launch.",
      },
    });
  }

  const baseWhere = buildListingWhere(q);

  const [total, rows] = await Promise.all([
    prisma.listing.count({ where: baseWhere }),
    prisma.listing.findMany({
      where: baseWhere,
      include: { property: true },
      orderBy: { createdAt: "desc" },
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
      mode: "prisma_filters",
      note: "OpenSearch sync and ranking will replace this MVP search.",
    },
  });
});
