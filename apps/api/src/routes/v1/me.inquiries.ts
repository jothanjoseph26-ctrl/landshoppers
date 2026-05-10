import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import { listMyInquiriesQuerySchema } from "../../contracts/inquiries.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { inquiryToJson } from "../../lib/serialize/inquiry.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meInquiriesV1 = new Hono<ApiEnv>();

meInquiriesV1.use("*", requireAuth);

meInquiriesV1.get("/", zValidator("query", listMyInquiriesQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { page, pageSize, status } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where = {
    buyerId: authUser.id,
    ...(status !== undefined ? { status } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        listing: { include: { property: true } },
      },
    }),
  ]);

  return c.json({
    data: rows.map((row) => ({
      ...inquiryToJson(row),
      listing: row.listing && row.listing.deletedAt === null ? listingToJson(row.listing) : null,
    })),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
