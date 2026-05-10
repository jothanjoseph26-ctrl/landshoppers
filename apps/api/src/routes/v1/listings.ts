import { ListingStatus, UserRole } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  createListingBodySchema,
  listListingsQuerySchema,
  listingIdParamSchema,
  updateListingBodySchema,
  updateListingStatusBodySchema,
} from "../../contracts/listings.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { slugifyUnique } from "../../lib/slug.js";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const listingsV1 = new Hono<ApiEnv>();

function canManageListing(params: {
  listing: { userId: string };
  user: { id: string; role: UserRole };
}) {
  return (
    params.listing.userId === params.user.id ||
    params.user.role === UserRole.admin ||
    params.user.role === UserRole.super_admin
  );
}

listingsV1.get("/", zValidator("query", listListingsQuerySchema), async (c) => {
  const { page, pageSize, status } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where = {
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

listingsV1.get("/:id", zValidator("param", listingIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");

  const row = await prisma.listing.findFirst({
    where: { id, deletedAt: null, property: { deletedAt: null } },
    include: { property: true },
  });

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Listing not found");
  }

  return c.json({ data: listingToJson(row) });
});

const listingAuthorRoles = [
  UserRole.buyer,
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
      const propertyPatch = {
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

      const listingPatch = {
        ...(body.priceKobo !== undefined ? { price: BigInt(body.priceKobo) } : {}),
        ...(body.priceNegotiable !== undefined ? { priceNegotiable: body.priceNegotiable } : {}),
        ...(body.isForSale !== undefined ? { isForSale: body.isForSale } : {}),
        ...(body.isForRent !== undefined ? { isForRent: body.isForRent } : {}),
        ...(body.rentPeriod !== undefined ? { rentPeriod: body.rentPeriod ?? null } : {}),
      };

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

    return c.json({ data: listingToJson(row) });
  },
);

listingsV1.post(
  "/:id/status",
  requireAuth,
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
    if (!canManageListing({ listing: current, user: authUser })) {
      throw new ApiError(403, "FORBIDDEN", "You cannot change this listing status");
    }

    const row = await prisma.listing.update({
      where: { id },
      data: {
        status,
        publishedAt: status === ListingStatus.active ? (current.publishedAt ?? new Date()) : current.publishedAt,
      },
      include: { property: true },
    });

    return c.json({ data: listingToJson(row) });
  },
);
