import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import { listSavedListingsQuerySchema, listingIdPathSchema } from "../../contracts/me.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const savedListingsV1 = new Hono<ApiEnv>();

savedListingsV1.use("*", requireAuth);

savedListingsV1.get("/", zValidator("query", listSavedListingsQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { page, pageSize } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where = { userId: authUser.id, listing: { deletedAt: null } } as const;

  const [total, rows] = await Promise.all([
    prisma.savedListing.count({ where }),
    prisma.savedListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { listing: { include: { property: true } } },
    }),
  ]);

  return c.json({
    data: rows.map((row) => ({
      id: row.id,
      savedAt: row.createdAt.toISOString(),
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

savedListingsV1.post("/:listingId", zValidator("param", listingIdPathSchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { listingId } = c.req.valid("param");

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, deletedAt: null, property: { deletedAt: null } },
  });
  if (!listing) {
    throw new ApiError(404, "NOT_FOUND", "Listing not found");
  }

  const row = await prisma.savedListing.upsert({
    where: { userId_listingId: { userId: authUser.id, listingId } },
    update: {},
    create: { userId: authUser.id, listingId },
  });

  return c.json(
    {
      data: {
        id: row.id,
        listingId: row.listingId,
        savedAt: row.createdAt.toISOString(),
      },
    },
    201,
  );
});

savedListingsV1.delete("/:listingId", zValidator("param", listingIdPathSchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { listingId } = c.req.valid("param");

  await prisma.savedListing.deleteMany({
    where: { userId: authUser.id, listingId },
  });

  return c.json({ data: { ok: true } });
});
