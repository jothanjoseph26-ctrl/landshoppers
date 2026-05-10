import { ListingStatus, type PropertyType } from "@landshoppers/db";
import type { Prisma } from "@landshoppers/db";

export type ListingTypeFilter = "sale" | "rent" | "both" | undefined;

export type MapSearchFilters = {
  minPrice?: bigint | undefined;
  maxPrice?: bigint | undefined;
  propertyType?: PropertyType | undefined;
  listingType?: ListingTypeFilter;
};

export function prismaMapWhere(filters: MapSearchFilters): Prisma.ListingWhereInput {
  const priceFilter: Prisma.BigIntFilter | undefined =
    filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
        }
      : undefined;

  const listingExtras: Prisma.ListingWhereInput = {
    ...(filters.listingType === "sale" ? { isForSale: true } : {}),
    ...(filters.listingType === "rent" ? { isForRent: true } : {}),
    ...(filters.listingType === "both" ? { isForSale: true, isForRent: true } : {}),
  };

  return {
    deletedAt: null,
    status: ListingStatus.active,
    ...(priceFilter !== undefined ? { price: priceFilter } : {}),
    ...listingExtras,
    property: {
      deletedAt: null,
      ...(filters.propertyType !== undefined ? { propertyType: filters.propertyType } : {}),
    },
  };
}
