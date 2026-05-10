import { ListingStatus, PropertyType } from "@landshoppers/db";
import type { Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { recommendationsQuerySchema } from "../../contracts/search.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meRecommendationsV1 = new Hono<ApiEnv>();

meRecommendationsV1.use("*", requireAuth);

meRecommendationsV1.get("/", zValidator("query", recommendationsQuerySchema), async (c) => {
  const authUser = c.get("authUser")!;

  const { limit } = c.req.valid("query");

  const [saved, recent] = await Promise.all([
    prisma.savedListing.findMany({
      where: { userId: authUser.id },
      select: { listingId: true },
      take: 20,
    }),
    prisma.listingRecentView.findMany({
      where: { userId: authUser.id },
      orderBy: { lastViewedAt: "desc" },
      select: { listingId: true },
      take: 12,
    }),
  ]);

  const seedIds = [...new Set([...saved.map((s) => s.listingId), ...recent.map((r) => r.listingId)])];
  const exclude = new Set(seedIds);

  const basis =
    seedIds.length > 0
      ? await prisma.listing.findMany({
          where: {
            id: { in: seedIds },
            deletedAt: null,
            property: { deletedAt: null },
          },
          include: { property: true },
        })
      : [];

  const types = new Set(basis.map((b) => b.property.propertyType));
  const cities = new Set(basis.map((b) => b.property.city));

  if (types.size === 0 && cities.size === 0) {
    const fallback = await prisma.listing.findMany({
      where: {
        deletedAt: null,
        status: ListingStatus.active,
        property: { deletedAt: null },
      },
      include: { property: true },
      orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
    return c.json({ data: fallback.map(listingToJson), meta: { source: "featured_fallback" } });
  }

  const orBlock: Prisma.ListingWhereInput[] = [];
  if (types.size > 0) {
    orBlock.push({
      property: { propertyType: { in: [...types] as PropertyType[] } },
    });
  }
  if (cities.size > 0) {
    orBlock.push({
      property: { city: { in: [...cities] } },
    });
  }

  const rows = await prisma.listing.findMany({
    where: {
      deletedAt: null,
      status: ListingStatus.active,
      id: { notIn: [...exclude] },
      property: { deletedAt: null },
      OR: orBlock,
    },
    include: { property: true },
    take: limit,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return c.json({
    data: rows.map(listingToJson),
    meta: {
      source: "saved_recent_profile",
      types: [...types],
      cities: [...cities],
    },
  });
});
