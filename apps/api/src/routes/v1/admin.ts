import { ListingStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage, paginationQuerySchema } from "../../contracts/common.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";
import {
  listingIdParamSchema,
  rejectListingBodySchema,
} from "../../contracts/listings.js";
import { adminAnalyticsV1 } from "./admin.analytics.js";
import { adminAutomationV1 } from "./admin.automation.js";
import { adminPaymentsV1 } from "./admin.payments.js";
import { adminReportsV1 } from "./admin.reports.js";
import { adminUsersV1 } from "./admin.users.js";

export const adminV1 = new Hono<ApiEnv>();

adminV1.use("*", requireAuth, requireAdmin);

adminV1.get(
  "/listings/pending",
  zValidator("query", paginationQuerySchema),
  async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const where = {
      deletedAt: null,
      status: ListingStatus.pending_review,
      property: { deletedAt: null },
    };

    const [total, rows] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy: { submittedAt: "asc" },
        skip,
        take: pageSize,
        include: { property: true },
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

adminV1.post(
  "/listings/:id/approve",
  zValidator("param", listingIdParamSchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id } = c.req.valid("param");

    const current = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: { property: true },
    });
    if (!current || current.property.deletedAt) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }
    if (
      current.status !== ListingStatus.pending_review &&
      current.status !== ListingStatus.draft
    ) {
      throw new ApiError(
        409,
        "INVALID_TRANSITION",
        `Cannot approve a listing in status ${current.status}`,
      );
    }

    const now = new Date();
    const row = await prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.active,
        approvedAt: now,
        approvedBy: authUser.id,
        publishedAt: current.publishedAt ?? now,
        rejectionReason: null,
        rejectedAt: null,
        rejectedBy: null,
      },
      include: { property: true },
    });

    return c.json({ data: listingToJson(row) });
  },
);

adminV1.post(
  "/listings/:id/reject",
  zValidator("param", listingIdParamSchema),
  zValidator("json", rejectListingBodySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id } = c.req.valid("param");
    const { reason } = c.req.valid("json");

    const current = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: { property: true },
    });
    if (!current || current.property.deletedAt) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    const row = await prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.rejected,
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedBy: authUser.id,
      },
      include: { property: true },
    });

    return c.json({ data: listingToJson(row) });
  },
);

adminV1.route("/users", adminUsersV1);
adminV1.route("/payments", adminPaymentsV1);
adminV1.route("/analytics", adminAnalyticsV1);
adminV1.route("/reports", adminReportsV1);
adminV1.route("/", adminAutomationV1);
