import { ListingStatus, NotificationType, TourStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  cancelMeTourBodySchema,
  createMeTourBodySchema,
  listMeToursQuerySchema,
  patchMeTourBodySchema,
  tourIdParamSchema,
} from "../../contracts/me-tours.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { tourRequestToJson } from "../../lib/serialize/tour-request.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meToursV1 = new Hono<ApiEnv>();

meToursV1.use("*", requireAuth);

const tourInclude = {
  listing: { include: { property: true, images: { orderBy: { sortOrder: "asc" as const }, take: 5 } } },
  agent: true,
} as const;

function parsePreferredDate(raw: string): Date {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid preferredDate");
  }
  return d;
}

meToursV1.get("/", zValidator("query", listMeToursQuerySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { page, pageSize, status, upcoming } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);
  const now = new Date();

  const where = {
    buyerId: auth.id,
    ...(status !== undefined ? { status } : {}),
    ...(upcoming === true
      ? {
          status: { in: [TourStatus.pending, TourStatus.confirmed] },
          preferredDate: { gte: now },
          cancelledAt: null,
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.tourRequest.count({ where }),
    prisma.tourRequest.findMany({
      where,
      orderBy: { preferredDate: "desc" },
      skip,
      take: pageSize,
      include: tourInclude,
    }),
  ]);

  return c.json({
    data: rows.map(tourRequestToJson),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

meToursV1.post("/", zValidator("json", createMeTourBodySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const body = c.req.valid("json");

  const listing = await prisma.listing.findFirst({
    where: { id: body.listingId, deletedAt: null },
    include: { property: true },
  });
  if (!listing || listing.property.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Listing not found");
  }
  if (listing.status !== ListingStatus.active) {
    throw new ApiError(409, "LISTING_NOT_ACTIVE", "Tours can only be requested for active listings");
  }

  const preferredDate = parsePreferredDate(body.preferredDate);

  const created = await prisma.tourRequest.create({
    data: {
      listingId: body.listingId,
      buyerId: auth.id,
      agentId: listing.agentId,
      tourType: body.tourType,
      preferredDate,
      preferredTime: body.preferredTime,
      notes: body.notes,
      buyerPhone: body.buyerPhone,
    },
    include: tourInclude,
  });

  if (listing.agentId) {
    const agent = await prisma.agent.findUnique({
      where: { id: listing.agentId },
      select: { userId: true },
    });
    if (agent?.userId) {
      await prisma.notification.create({
        data: {
          userId: agent.userId,
          type: NotificationType.inquiry,
          title: "New tour request",
          body: `A buyer requested a ${body.tourType.replace("_", " ")} tour for ${listing.property.title}.`,
          metadata: { tourRequestId: created.id, listingId: listing.id },
        },
      });
    }
  }

  return c.json({ data: tourRequestToJson(created) }, 201);
});

async function tourForBuyer(tourId: string, buyerId: string) {
  const row = await prisma.tourRequest.findFirst({
    where: { id: tourId, buyerId },
    include: tourInclude,
  });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Tour not found");
  return row;
}

async function cancelTour(
  row: Awaited<ReturnType<typeof tourForBuyer>>,
  cancelReason?: string,
) {
  if (row.status !== TourStatus.pending && row.status !== TourStatus.confirmed) {
    throw new ApiError(409, "INVALID_TRANSITION", `Cannot cancel tour in status ${row.status}`);
  }
  return prisma.tourRequest.update({
    where: { id: row.id },
    data: {
      status: TourStatus.cancelled,
      cancelledAt: new Date(),
      cancelReason: cancelReason ?? null,
    },
    include: tourInclude,
  });
}

meToursV1.patch(
  "/:id",
  zValidator("param", tourIdParamSchema),
  zValidator("json", patchMeTourBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await tourForBuyer(id, auth.id);

    if (body.status === TourStatus.cancelled) {
      const updated = await cancelTour(row, body.cancelReason);
      return c.json({ data: tourRequestToJson(updated) });
    }

    if (body.notes !== undefined) {
      const updated = await prisma.tourRequest.update({
        where: { id: row.id },
        data: { notes: body.notes },
        include: tourInclude,
      });
      return c.json({ data: tourRequestToJson(updated) });
    }

    throw new ApiError(400, "VALIDATION_ERROR", "No supported fields to update");
  },
);

meToursV1.post(
  "/:id/cancel",
  zValidator("param", tourIdParamSchema),
  zValidator("json", cancelMeTourBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await tourForBuyer(id, auth.id);
    const updated = await cancelTour(row, body.cancelReason);
    return c.json({ data: tourRequestToJson(updated) });
  },
);
