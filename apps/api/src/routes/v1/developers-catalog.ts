import type { Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  developerIdParamSchema,
  listDevelopersCatalogQuerySchema,
} from "../../contracts/directory.js";
import { offsetFromPage } from "../../contracts/common.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { ApiEnv } from "../../types/env.js";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80";

function catalogJson(row: Prisma.DeveloperGetPayload<object>) {
  return {
    id: row.id,
    companyName: row.companyName,
    companyCity: row.companyCity,
    companyState: row.companyState,
    companyAddress: row.companyAddress,
    companyPhone: row.companyPhone,
    companyEmail: row.companyEmail,
    companyWebsite: row.companyWebsite,
    companyLogo: row.companyLogo ?? PLACEHOLDER,
    description: row.description,
    isVerified: row.isVerified,
    totalProjects: row.totalProjects,
    totalUnitsSold: row.totalUnitsSold,
    rating: row.rating,
    reviewCount: row.reviewCount,
  };
}

export const developersCatalogV1 = new Hono<ApiEnv>();

developersCatalogV1.get("/", zValidator("query", listDevelopersCatalogQuerySchema), async (c) => {
  const { page, pageSize, q, city } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where: Prisma.DeveloperWhereInput = {
    deletedAt: null,
    isVerified: true,
    ...(q
      ? {
          OR: [
            { companyName: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(city
      ? {
          companyCity: { equals: city, mode: "insensitive" },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.developer.count({ where }),
    prisma.developer.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }, { companyName: "asc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return c.json({
    data: rows.map(catalogJson),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

developersCatalogV1.get("/:id", zValidator("param", developerIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const row = await prisma.developer.findFirst({
    where: { id, deletedAt: null },
    include: {
      projects: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });
  if (!row || !row.isVerified) {
    throw new ApiError(404, "NOT_FOUND", "Developer not found");
  }

  const projectsOut = row.projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    city: p.city,
    state: p.state,
    status: p.status,
    propertyType: p.propertyType,
    thumbnail: p.images[0] ?? PLACEHOLDER,
  }));

  return c.json({
    data: {
      ...catalogJson(row),
      projects: projectsOut,
    },
  });
});
