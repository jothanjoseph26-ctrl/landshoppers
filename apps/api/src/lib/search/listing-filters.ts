import { ListingStatus, PropertyType } from "@landshoppers/db";
import type { Prisma } from "@landshoppers/db";

import { prisma } from "../prisma.js";

export type ListingSearchFilters = {
  q?: string | undefined;
  city?: string | undefined;
  /** No `neighborhood` column yet — match substring on city/description/title via Prisma/OpenSearch separately. */
  neighborhood?: string | undefined;
  state?: string | undefined;
  minPrice?: bigint | undefined;
  maxPrice?: bigint | undefined;
  minBeds?: number | undefined;
  maxBeds?: number | undefined;
  minBaths?: number | undefined;
  maxBaths?: number | undefined;
  propertyType?: PropertyType | undefined;
  listingType?: "sale" | "rent" | "both" | undefined;
};

export function buildListingWhere(
  q: ListingSearchFilters,
): Prisma.ListingWhereInput {
  const propertyFilters: Prisma.PropertyWhereInput[] = [];

  if (q.city !== undefined) {
    propertyFilters.push({ city: { equals: q.city, mode: "insensitive" } });
  }
  if (q.state !== undefined) {
    propertyFilters.push({ state: { equals: q.state, mode: "insensitive" } });
  }

  const textTokens: Prisma.PropertyWhereInput[] = [];
  if (q.q !== undefined) {
    textTokens.push({
      OR: [
        { title: { contains: q.q, mode: "insensitive" } },
        { city: { contains: q.q, mode: "insensitive" } },
        { state: { contains: q.q, mode: "insensitive" } },
      ],
    });
  }
  if (q.neighborhood !== undefined) {
    textTokens.push({
      OR: [
        { city: { contains: q.neighborhood, mode: "insensitive" } },
        { title: { contains: q.neighborhood, mode: "insensitive" } },
      ],
    });
  }

  const propertyAnd: Prisma.PropertyWhereInput[] = [...propertyFilters];
  if (textTokens.length > 0) {
    propertyAnd.push({ OR: textTokens });
  }
  if (q.propertyType !== undefined) {
    propertyAnd.push({ propertyType: q.propertyType });
  }
  const bedClause: Prisma.IntNullableFilter = {};
  if (q.minBeds !== undefined) bedClause.gte = q.minBeds;
  if (q.maxBeds !== undefined) bedClause.lte = q.maxBeds;
  if (Object.keys(bedClause).length > 0) {
    propertyAnd.push({ bedrooms: bedClause });
  }
  const bathClause: Prisma.IntNullableFilter = {};
  if (q.minBaths !== undefined) bathClause.gte = q.minBaths;
  if (q.maxBaths !== undefined) bathClause.lte = q.maxBaths;
  if (Object.keys(bathClause).length > 0) {
    propertyAnd.push({ bathrooms: bathClause });
  }

  const priceFilter: Prisma.BigIntFilter | undefined =
    q.minPrice !== undefined || q.maxPrice !== undefined
      ? {
          ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
          ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
        }
      : undefined;

  const listingTypeWhere: Prisma.ListingWhereInput = {
    ...(q.listingType === "sale" ? { isForSale: true } : {}),
    ...(q.listingType === "rent" ? { isForRent: true } : {}),
    ...(q.listingType === "both" ? { isForSale: true, isForRent: true } : {}),
  };

  return {
    deletedAt: null,
    status: ListingStatus.active,
    ...(priceFilter !== undefined ? { price: priceFilter } : {}),
    ...(Object.keys(listingTypeWhere).length > 0 ? listingTypeWhere : {}),
    property: {
      deletedAt: null,
      ...(propertyAnd.length > 0 ? { AND: propertyAnd } : {}),
    },
  };
}

export type ListingSortKey = "newest" | "price_asc" | "price_desc" | "relevance";

export function prismaOrderBy(
  sort: ListingSortKey,
): Prisma.ListingOrderByWithRelationInput[] {
  if (sort === "price_asc") return [{ price: "asc" }, { createdAt: "desc" }];
  if (sort === "price_desc") return [{ price: "desc" }, { createdAt: "desc" }];
  return [{ createdAt: "desc" }];
}

export async function postgresListingFacets(where: Prisma.ListingWhereInput): Promise<{
  propertyType: { value: string; count: number }[];
  city: { value: string; count: number }[];
}> {
  const rows = await prisma.listing.findMany({
    where,
    select: {
      property: { select: { propertyType: true, city: true } },
    },
  });
  const typeCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();
  for (const r of rows) {
    typeCounts.set(
      r.property.propertyType,
      (typeCounts.get(r.property.propertyType) ?? 0) + 1,
    );
    cityCounts.set(r.property.city, (cityCounts.get(r.property.city) ?? 0) + 1);
  }
  const propertyType = [...typeCounts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
  const city = [...cityCounts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
  return { propertyType, city };
}
