import {
  InquiryStatus,
  ListingStatus,
  UserRole,
} from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  createInquiryBodySchema,
  inquiryIdParamSchema,
  updateInquiryStatusBodySchema,
} from "../../contracts/inquiries.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { inquiryToJson } from "../../lib/serialize/inquiry.js";
import { isAdminRole, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const inquiriesV1 = new Hono<ApiEnv>();

inquiriesV1.use("*", requireAuth);

inquiriesV1.post("/", zValidator("json", createInquiryBodySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const body = c.req.valid("json");

  let agentId: string | null = null;

  if (body.listingId) {
    const listing = await prisma.listing.findFirst({
      where: { id: body.listingId, deletedAt: null },
    });
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found");
    if (
      listing.status !== ListingStatus.active &&
      listing.status !== ListingStatus.paused
    ) {
      throw new ApiError(409, "LISTING_NOT_OPEN", "Listing cannot accept inquiries");
    }
    agentId = listing.agentId ?? null;
  }

  if (body.projectId) {
    const project = await prisma.developerProject.findFirst({
      where: { id: body.projectId, deletedAt: null },
    });
    if (!project) throw new ApiError(404, "NOT_FOUND", "Project not found");
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.inquiry.create({
      data: {
        listingId: body.listingId ?? null,
        projectId: body.projectId ?? null,
        buyerId: authUser.id,
        agentId,
        source: body.source,
        status: InquiryStatus.new,
        message: body.message ?? null,
        buyerName: body.buyerName ?? null,
        buyerEmail: body.buyerEmail ?? null,
        buyerPhone: body.buyerPhone ?? null,
      },
    });

    if (body.listingId) {
      await tx.listing.update({
        where: { id: body.listingId },
        data: { inquiryCount: { increment: 1 } },
      });
    }
    if (body.projectId) {
      await tx.developerProject.update({
        where: { id: body.projectId },
        data: { inquiryCount: { increment: 1 } },
      });
    }

    return created;
  });

  return c.json({ data: inquiryToJson(row) }, 201);
});

inquiriesV1.patch(
  "/:id",
  zValidator("param", inquiryIdParamSchema),
  zValidator("json", updateInquiryStatusBodySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { agent: true, listing: true },
    });
    if (!inquiry) throw new ApiError(404, "NOT_FOUND", "Inquiry not found");

    const isAdmin = isAdminRole(authUser.role);
    const isBuyer = inquiry.buyerId === authUser.id;
    let isAssignedAgent = false;
    if (authUser.role === UserRole.agent) {
      const agent = await prisma.agent.findUnique({ where: { userId: authUser.id } });
      isAssignedAgent =
        agent !== null &&
        (inquiry.agentId === agent.id ||
          (inquiry.listing !== null && inquiry.listing.userId === authUser.id));
    }
    const isListingOwner =
      inquiry.listing !== null && inquiry.listing.userId === authUser.id;

    if (!isAdmin && !isAssignedAgent && !isListingOwner && !isBuyer) {
      throw new ApiError(403, "FORBIDDEN", "You cannot modify this inquiry");
    }

    // Buyer can only close (cancel) their own inquiry; agents/admin can move pipeline.
    if (isBuyer && !isAdmin && !isAssignedAgent && !isListingOwner) {
      const buyerCloseable: InquiryStatus[] = [InquiryStatus.closed];
      if (!buyerCloseable.includes(body.status)) {
        throw new ApiError(403, "FORBIDDEN", "Buyer can only close their inquiry");
      }
    }

    const now = new Date();
    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        status: body.status,
        respondedAt:
          body.status === InquiryStatus.responded && !inquiry.respondedAt
            ? now
            : inquiry.respondedAt,
        closedAt:
          body.status === InquiryStatus.closed || body.status === InquiryStatus.lost
            ? now
            : null,
        closedReason: body.closedReason ?? inquiry.closedReason,
      },
    });

    return c.json({ data: inquiryToJson(updated) });
  },
);
