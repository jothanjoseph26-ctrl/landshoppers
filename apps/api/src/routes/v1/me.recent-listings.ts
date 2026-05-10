import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import { listRecentListingsQuerySchema, listingIdPathSchema } from "../../contracts/me.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const recentListingsV1 = new Hono<ApiEnv>();

recentListingsV1.use("*", requireAuth);

recentListingsV1.get("/", zValidator("query", listRecentListingsQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { page, pageSize } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where = { userId: authUser.id, listing: { deletedAt: null } } as const;

  const [total, rows] = await Promise.all([
    prisma.listingRecentView.count({ where }),
    prisma.listingRecentView.findMany({
      where,
      orderBy: { lastViewedAt: "desc" },
      skip,
      take: pageSize,
      include: { listing: { include: { property: true } } },
    }),
  ]);

  return c.json({
    data: rows.map((row) => ({
      id: row.id,
      lastViewedAt: row.lastViewedAt.toISOString(),
      listing: listingToJson(row.listing),
    })),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

/** Idempotent upsert by (userId, listingId); refreshes `lastViewedAt`. */
recentListingsV1.post("/:listingId", zValidator("param", listingIdPathSchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { listingId } = c.req.valid("param");

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, deletedAt: null, property: { deletedAt: null } },
  });
  if (!listing) {
    throw new ApiError(404, "NOT_FOUND", "Listing not found");
  }

  const row = await prisma.listingRecentView.upsert({
    where: { userId_listingId: { userId: authUser.id, listingId } },
    update: { lastViewedAt: new Date() },
    create: { userId: authUser.id, listingId },
  });

  return c.json(
    {
      data: {
        id: row.id,
        listingId: row.listingId,
        lastViewedAt: row.lastViewedAt.toISOString(),
      },
    },
    201,
  );
});
