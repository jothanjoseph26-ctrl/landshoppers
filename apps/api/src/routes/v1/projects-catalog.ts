import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { projectIdParamSchema } from "../../contracts/directory.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { ApiEnv } from "../../types/env.js";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80";

export const projectsCatalogV1 = new Hono<ApiEnv>();

projectsCatalogV1.get("/:id", zValidator("param", projectIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");

  const row = await prisma.developerProject.findFirst({
    where: { id, deletedAt: null },
    include: {
      developer: true,
      units: { where: { status: "available" }, take: 20, orderBy: { price: "asc" } },
    },
  });

  if (!row || row.developer.deletedAt || !row.developer.isVerified) {
    throw new ApiError(404, "NOT_FOUND", "Project not found");
  }

  const d = row.developer;

  return c.json({
    data: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      shortDescription: row.shortDescription,
      status: row.status,
      propertyType: row.propertyType,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      amenities: row.amenities,
      features: row.features,
      images: row.images.length > 0 ? row.images : [PLACEHOLDER],
      totalUnits: row.totalUnits,
      availableUnits: row.availableUnits,
      soldUnits: row.soldUnits,
      priceRangeMin: row.priceRangeMin?.toString() ?? null,
      priceRangeMax: row.priceRangeMax?.toString() ?? null,
      completionDate: row.completionDate?.toISOString() ?? null,
      virtualTourUrl: row.virtualTourUrl,
      brochureUrl: row.brochureUrl,
      developer: {
        id: d.id,
        companyName: d.companyName,
        isVerified: d.isVerified,
        companyLogo: d.companyLogo ?? PLACEHOLDER,
      },
      sampleUnits: row.units.map((u) => ({
        id: u.id,
        unitName: u.unitName,
        unitType: u.unitType,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        squareMeters: u.squareMeters,
        price: u.price.toString(),
        status: u.status,
      })),
    },
  });
});
