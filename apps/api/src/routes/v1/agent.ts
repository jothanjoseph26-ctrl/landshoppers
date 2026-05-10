import { ListingStatus, Prisma, UserRole } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage, paginationQuerySchema } from "../../contracts/common.js";
import {
  listAgentInquiriesQuerySchema,
} from "../../contracts/inquiries.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { inquiryToJson } from "../../lib/serialize/inquiry.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import {
  requireAgentOrDeveloper,
  requireAuth,
} from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";
import { z } from "zod";

export const agentScopedV1 = new Hono<ApiEnv>();

agentScopedV1.use("*", requireAuth, requireAgentOrDeveloper);

const listAgentListingsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ListingStatus).optional(),
});

agentScopedV1.get(
  "/listings",
  zValidator("query", listAgentListingsQuerySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { page, pageSize, status } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const where = {
      userId: authUser.id,
      deletedAt: null,
      ...(status !== undefined ? { status } : {}),
    } as const;

    const [total, rows] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
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
      },
    });
  },
);

agentScopedV1.get(
  "/inquiries",
  zValidator("query", listAgentInquiriesQuerySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { page, pageSize, status } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const agentRow =
      authUser.role === UserRole.agent
        ? await prisma.agent.findUnique({ where: { userId: authUser.id } })
        : null;

    const where: Prisma.InquiryWhereInput = {
      AND: [
        ...(status !== undefined ? [{ status }] : []),
        {
          OR: [
            agentRow ? { agentId: agentRow.id } : { agentId: "00000000-0000-0000-0000-000000000000" },
            { listing: { userId: authUser.id, deletedAt: null } },
          ],
        },
      ],
    };

    const [total, rows] = await Promise.all([
      prisma.inquiry.count({ where }),
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { listing: { include: { property: true } } },
      }),
    ]);

    return c.json({
      data: rows.map((row) => ({
        ...inquiryToJson(row),
        listing:
          row.listing && row.listing.deletedAt === null ? listingToJson(row.listing) : null,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);
