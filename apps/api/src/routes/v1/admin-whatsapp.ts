import { ListingStatus, UserRole, WhatsAppMessageStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { offsetFromPage, paginationQuerySchema } from "../../contracts/common.js";
import {
  coercePropertyType,
  storedExtractListingResponseSchema,
} from "../../lib/extraction-stored.js";
import { ApiError } from "../../lib/errors.js";
import { enqueueListingIndexSync } from "../../lib/search/enqueue-listing-index.js";
import { enqueueSeoGeneration } from "../../lib/jobs/enqueue-seo-generation.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { slugifyUnique } from "../../lib/slug.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const adminWhatsappV1 = new Hono<ApiEnv>();

adminWhatsappV1.use("*", requireAuth, requireAdmin);

const reviewsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(WhatsAppMessageStatus).optional(),
});

const reviewIdParamSchema = z.object({
  id: z.string().uuid(),
});

const rejectBodySchema = z.object({
  reason: z.string().min(1).max(2000),
});

function rawWhatsAppToJson(row: {
  id: string;
  messageId: string;
  status: WhatsAppMessageStatus;
  senderPhone: string;
  senderName: string | null;
  messageType: string;
  textContent: string | null;
  mediaUrls: string[];
  extractedData: unknown;
  confidenceScore: number | null;
  extractionError: string | null;
  processedAt: Date | null;
  createdListingId: string | null;
  receivedAt: Date;
}) {
  return {
    id: row.id,
    messageId: row.messageId,
    status: row.status,
    senderPhone: row.senderPhone,
    senderName: row.senderName,
    messageType: row.messageType,
    textContent: row.textContent,
    mediaUrls: row.mediaUrls,
    extractedData: row.extractedData,
    confidenceScore: row.confidenceScore,
    extractionError: row.extractionError,
    processedAt: row.processedAt?.toISOString() ?? null,
    createdListingId: row.createdListingId,
    receivedAt: row.receivedAt.toISOString(),
  };
}

async function resolveListingOwnerUserId(): Promise<string> {
  const envId = process.env.WHATSAPP_DEFAULT_LISTING_USER_ID?.trim();
  if (envId) return envId;
  const buyer = await prisma.user.findFirst({
    where: { deletedAt: null, role: UserRole.buyer },
    orderBy: { createdAt: "asc" },
  });
  if (buyer) return buyer.id;
  const anyUser = await prisma.user.findFirst({ where: { deletedAt: null } });
  if (!anyUser) {
    throw new ApiError(
      500,
      "CONFIG_ERROR",
      "No users available; set WHATSAPP_DEFAULT_LISTING_USER_ID or seed users.",
    );
  }
  return anyUser.id;
}

adminWhatsappV1.get("/reviews", zValidator("query", reviewsQuerySchema), async (c) => {
  const { page, pageSize, status } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where =
    status !== undefined
      ? { status }
      : {
          status: {
            in: [WhatsAppMessageStatus.PROCESSED, WhatsAppMessageStatus.PENDING],
          },
        };

  const [total, rows] = await Promise.all([
    prisma.rawWhatsAppMessage.count({ where }),
    prisma.rawWhatsAppMessage.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return c.json({
    data: rows.map(rawWhatsAppToJson),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

adminWhatsappV1.post(
  "/reviews/:id/approve",
  zValidator("param", reviewIdParamSchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const { id } = c.req.valid("param");

    const raw = await prisma.rawWhatsAppMessage.findFirst({ where: { id } });
    if (!raw) throw new ApiError(404, "NOT_FOUND", "WhatsApp message not found");

    if (
      raw.status !== WhatsAppMessageStatus.PROCESSED &&
      raw.status !== WhatsAppMessageStatus.PENDING
    ) {
      throw new ApiError(
        409,
        "INVALID_STATE",
        `Cannot approve message in status ${raw.status}`,
      );
    }

    const extracted = storedExtractListingResponseSchema.safeParse(raw.extractedData);
    if (!extracted.success) {
      throw new ApiError(
        400,
        "EXTRACTION_MISSING",
        "No valid extraction payload on this message; wait for AI processing or re-ingest.",
      );
    }

    const ex = extracted.data;
    const slug = slugifyUnique(ex.property.title);
    const ownerUserId = await resolveListingOwnerUserId();

    const propertyType = coercePropertyType(ex.property.propertyType);

    const row = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          title: ex.property.title,
          slug,
          description: ex.property.description ?? null,
          propertyType,
          address: ex.property.address ?? null,
          city: ex.property.city,
          state: ex.property.state,
          country: ex.property.country ?? "Nigeria",
          latitude: ex.property.latitude ?? null,
          longitude: ex.property.longitude ?? null,
          bedrooms: ex.property.bedrooms ?? null,
          bathrooms: ex.property.bathrooms ?? null,
          toilets: ex.property.toilets ?? null,
          squareMeters: ex.property.squareMeters ?? null,
        },
      });

      const now = new Date();
      const listing = await tx.listing.create({
        data: {
          propertyId: property.id,
          userId: ownerUserId,
          agentId: null,
          price: BigInt(ex.listing.price),
          priceNegotiable: ex.listing.priceNegotiable ?? false,
          status: ListingStatus.active,
          isForSale: ex.listing.isForSale !== false,
          isForRent: ex.listing.isForRent === true,
          rentPeriod: ex.listing.rentPeriod ?? null,
          publishedAt: now,
          sourceType: "whatsapp",
          sourceMessageId: raw.id,
        },
        include: { property: true },
      });

      await tx.rawWhatsAppMessage.update({
        where: { id: raw.id },
        data: {
          status: WhatsAppMessageStatus.APPROVED,
          approvedAt: now,
          approvedBy: authUser.id,
          createdListingId: listing.id,
        },
      });

      return listing;
    });

    const lat = ex.property.latitude;
    const lng = ex.property.longitude;
    if (lat != null && lng != null) {
      await prisma.$executeRaw`
        UPDATE properties
        SET geom = ST_SetSRID(ST_MakePoint(${lng}::double precision, ${lat}::double precision), 4326)::geography
        WHERE id = ${row.propertyId}::uuid
      `;
    }

    await enqueueListingIndexSync(row.id).catch(() => {});
    await enqueueSeoGeneration({
      listingId: row.id,
      listingTitle: row.property.title,
      city: row.property.city,
      state: row.property.state,
      propertyType: row.property.propertyType,
      descriptionHint: row.property.description ?? undefined,
    }).catch(() => {});

    const full = await prisma.listing.findFirst({
      where: { id: row.id },
      include: { property: true },
    });
    if (!full) throw new ApiError(500, "INTERNAL_ERROR", "Listing missing after approval");

    return c.json({
      data: {
        listing: listingToJson(full),
        whatsappMessageId: raw.id,
      },
    });
  },
);

adminWhatsappV1.post(
  "/reviews/:id/reject",
  zValidator("param", reviewIdParamSchema),
  zValidator("json", rejectBodySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const { id } = c.req.valid("param");
    const { reason } = c.req.valid("json");

    const raw = await prisma.rawWhatsAppMessage.findFirst({ where: { id } });
    if (!raw) throw new ApiError(404, "NOT_FOUND", "WhatsApp message not found");

    await prisma.rawWhatsAppMessage.update({
      where: { id },
      data: {
        status: WhatsAppMessageStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: authUser.id,
        rejectionReason: reason,
      },
    });

    return c.json({
      data: { id, status: WhatsAppMessageStatus.REJECTED },
    });
  },
);
