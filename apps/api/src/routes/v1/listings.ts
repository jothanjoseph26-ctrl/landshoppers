import { ListingStatus, UserRole } from "@landshoppers/db";
import type { Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { offsetFromPage } from "../../contracts/common.js";
import {
  createListingBodySchema,
  listListingsQuerySchema,
  listingIdParamSchema,
  listingSlugParamSchema,
  rejectListingBodySchema,
  updateListingBodySchema,
  updateListingStatusBodySchema,
} from "../../contracts/listings.js";
import { similarListingsQuerySchema } from "../../contracts/search.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { enqueueListingIndexSync } from "../../lib/search/enqueue-listing-index.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { slugifyUnique } from "../../lib/slug.js";
import {
  isAdminRole,
  requireAdmin,
  requireAuth,
  requireRoles,
} from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const listingsV1 = new Hono<ApiEnv>();

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

function canManageListing(params: {
  listing: { userId: string };
  user: { id: string; role: UserRole };
}) {
  return params.listing.userId === params.user.id || isAdminRole(params.user.role);
}

listingsV1.get("/", zValidator("query", listListingsQuerySchema), async (c) => {
  const { page, pageSize, status } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where: Prisma.ListingWhereInput = {
    deletedAt: null,
    ...(status !== undefined ? { status } : { status: ListingStatus.active }),
    property: { deletedAt: null },
  };

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
});

listingsV1.get(
  "/:id/similar",
  zValidator("param", listingIdParamSchema),
  zValidator("query", similarListingsQuerySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { limit } = c.req.valid("query");

    const source = await prisma.listing.findFirst({
      where: { id, deletedAt: null, status: ListingStatus.active, property: { deletedAt: null } },
      include: { property: true },
    });

    if (!source) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    const lat = source.property.latitude;
    const lng = source.property.longitude;
    if (lat === null || lng === null) {
      return c.json({ data: [], meta: { mode: "no_coordinates" } });
    }

    const lo = (source.price * 70n) / 100n;
    const hi = (source.price * 130n) / 100n;

    const candidates = await prisma.listing.findMany({
      where: {
        deletedAt: null,
        status: ListingStatus.active,
        id: { not: id },
        price: { gte: lo, lte: hi },
        property: {
          deletedAt: null,
          propertyType: source.property.propertyType,
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      include: { property: true },
      take: 80,
    });

    const ranked = [...candidates]
      .map((row) => ({
        row,
        km: haversineKm(lat, lng, row.property.latitude!, row.property.longitude!),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, limit);

    return c.json({
      data: ranked.map((r) => listingToJson(r.row)),
      meta: { mode: "price_band_geo", referenceListingId: id },
    });
  },
);

listingsV1.get(
  "/by-slug/:slug",
  zValidator("param", listingSlugParamSchema),
  async (c) => {
    const { slug } = c.req.valid("param");

    const row = await prisma.listing.findFirst({
      where: {
        deletedAt: null,
        property: { deletedAt: null, slug },
      },
      include: {
        property: true,
        priceHistory: { orderBy: { changedAt: "desc" }, take: 36 },
      },
    });

    if (!row) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    return c.json({ data: listingToJson(row) });
  },
);

listingsV1.get("/:id", zValidator("param", listingIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");

  const row = await prisma.listing.findFirst({
    where: { id, deletedAt: null, property: { deletedAt: null } },
    include: {
      property: true,
      priceHistory: { orderBy: { changedAt: "desc" }, take: 36 },
    },
  });

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Listing not found");
  }

  return c.json({ data: listingToJson(row) });
});

const listingAuthorRoles = [
  UserRole.agent,
  UserRole.developer,
  UserRole.admin,
  UserRole.super_admin,
] as const;

listingsV1.post(
  "/",
  requireAuth,
  requireRoles(...listingAuthorRoles),
  zValidator("json", createListingBodySchema),
  async (c) => {
    const body = c.req.valid("json");
    const authUser = c.get("authUser");
    if (!authUser) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    let agentId: string | null = null;
    if (authUser.role === UserRole.agent) {
      const agent = await prisma.agent.findUnique({ where: { userId: authUser.id } });
      agentId = agent?.id ?? null;
    }

    const price = BigInt(body.priceKobo);
    const slug = slugifyUnique(body.title);

    const row = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          title: body.title,
          slug,
          description: body.description ?? null,
          propertyType: body.propertyType,
          address: body.address ?? null,
          city: body.city,
          state: body.state,
          country: body.country,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          bedrooms: body.bedrooms ?? null,
          bathrooms: body.bathrooms ?? null,
          toilets: body.toilets ?? null,
          squareMeters: body.squareMeters ?? null,
        },
      });

      return tx.listing.create({
        data: {
          propertyId: property.id,
          userId: authUser.id,
          agentId,
          price,
          priceNegotiable: body.priceNegotiable,
          status: ListingStatus.draft,
          isForSale: body.isForSale,
          isForRent: body.isForRent,
          rentPeriod: body.rentPeriod ?? null,
          sourceType: "web",
        },
        include: { property: true },
      });
    });

    await enqueueListingIndexSync(row.id).catch(() => {});

    return c.json({ data: listingToJson(row) }, 201);
  },
);

listingsV1.patch(
  "/:id",
  requireAuth,
  zValidator("param", listingIdParamSchema),
  zValidator("json", updateListingBodySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const authUser = c.get("authUser");
    if (!authUser) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    const current = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: { property: true },
    });
    if (!current || current.property.deletedAt) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }
    if (!canManageListing({ listing: current, user: authUser })) {
      throw new ApiError(403, "FORBIDDEN", "You cannot edit this listing");
    }

    const row = await prisma.$transaction(async (tx) => {
      const propertyPatch: Prisma.PropertyUpdateInput = {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.propertyType !== undefined ? { propertyType: body.propertyType } : {}),
        ...(body.address !== undefined ? { address: body.address ?? null } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.country !== undefined ? { country: body.country } : {}),
        ...(body.latitude !== undefined ? { latitude: body.latitude ?? null } : {}),
        ...(body.longitude !== undefined ? { longitude: body.longitude ?? null } : {}),
        ...(body.bedrooms !== undefined ? { bedrooms: body.bedrooms ?? null } : {}),
        ...(body.bathrooms !== undefined ? { bathrooms: body.bathrooms ?? null } : {}),
        ...(body.toilets !== undefined ? { toilets: body.toilets ?? null } : {}),
        ...(body.squareMeters !== undefined ? { squareMeters: body.squareMeters ?? null } : {}),
      };

      if (Object.keys(propertyPatch).length > 0) {
        await tx.property.update({
          where: { id: current.propertyId },
          data: propertyPatch,
        });
      }

      const listingPatch: Prisma.ListingUpdateInput = {
        ...(body.priceKobo !== undefined ? { price: BigInt(body.priceKobo) } : {}),
        ...(body.priceNegotiable !== undefined ? { priceNegotiable: body.priceNegotiable } : {}),
        ...(body.isForSale !== undefined ? { isForSale: body.isForSale } : {}),
        ...(body.isForRent !== undefined ? { isForRent: body.isForRent } : {}),
        ...(body.rentPeriod !== undefined ? { rentPeriod: body.rentPeriod ?? null } : {}),
      };

      // Editing a previously rejected listing reopens it as a draft so reviewers see fresh changes.
      if (current.status === ListingStatus.rejected) {
        listingPatch.status = ListingStatus.draft;
        listingPatch.rejectionReason = null;
      }

      // Track price history when price changed.
      if (body.priceKobo !== undefined && BigInt(body.priceKobo) !== current.price) {
        await tx.listingPriceHistory.create({
          data: { listingId: current.id, price: BigInt(body.priceKobo) },
        });
      }

      if (Object.keys(listingPatch).length > 0) {
        await tx.listing.update({
          where: { id },
          data: listingPatch,
        });
      }

      return tx.listing.findUniqueOrThrow({
        where: { id },
        include: { property: true },
      });
    });

    void enqueueListingIndexSync(row.id).catch(() => {});

    return c.json({ data: listingToJson(row) });
  },
);

/** Direct status setter (admin/super_admin only). */
listingsV1.post(
  "/:id/status",
  requireAuth,
  requireAdmin,
  zValidator("param", listingIdParamSchema),
  zValidator("json", updateListingStatusBodySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { status } = c.req.valid("json");
    const authUser = c.get("authUser");
    if (!authUser) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

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
        status,
        publishedAt:
          status === ListingStatus.active
            ? (current.publishedAt ?? new Date())
            : current.publishedAt,
      },
      include: { property: true },
    });

    void enqueueListingIndexSync(row.id).catch(() => {});

    return c.json({ data: listingToJson(row) });
  },
);

/** Owner submits draft or rejected listing for review. */
listingsV1.post(
  "/:id/submit",
  requireAuth,
  zValidator("param", listingIdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const current = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: { property: true },
    });
    if (!current || current.property.deletedAt) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }
    if (!canManageListing({ listing: current, user: authUser })) {
      throw new ApiError(403, "FORBIDDEN", "You cannot submit this listing");
    }
    if (
      current.status !== ListingStatus.draft &&
      current.status !== ListingStatus.rejected
    ) {
      throw new ApiError(
        409,
        "INVALID_TRANSITION",
        `Cannot submit a listing in status ${current.status}`,
      );
    }

    const row = await prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.pending_review,
        submittedAt: new Date(),
        rejectionReason: null,
        rejectedAt: null,
        rejectedBy: null,
      },
      include: { property: true },
    });

    void enqueueListingIndexSync(row.id).catch(() => {});

    return c.json({ data: listingToJson(row) });
  },
);

/** Admin approves a listing under review (idempotent). */
listingsV1.post(
  "/:id/approve",
  requireAuth,
  requireAdmin,
  zValidator("param", listingIdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

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

    void enqueueListingIndexSync(row.id).catch(() => {});

    return c.json({ data: listingToJson(row) });
  },
);

/** Admin rejects with reason; listing returns to a `rejected` state for owner edits. */
listingsV1.post(
  "/:id/reject",
  requireAuth,
  requireAdmin,
  zValidator("param", listingIdParamSchema),
  zValidator("json", rejectListingBodySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { reason } = c.req.valid("json");
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

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

    void enqueueListingIndexSync(row.id).catch(() => {});

    return c.json({ data: listingToJson(row) });
  },
);

/** Soft delete: owner or admin. */
listingsV1.delete(
  "/:id",
  requireAuth,
  zValidator("param", listingIdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const current = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: { property: true },
    });
    if (!current || current.property.deletedAt) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }
    if (!canManageListing({ listing: current, user: authUser })) {
      throw new ApiError(403, "FORBIDDEN", "You cannot delete this listing");
    }

    await prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date(), status: ListingStatus.expired },
    });

    void enqueueListingIndexSync(id).catch(() => {});

    return c.json({ data: { ok: true } });
  },
);

// Keep the explicit z import to avoid linter unused warnings if status/reject schemas evolve.
void z;
