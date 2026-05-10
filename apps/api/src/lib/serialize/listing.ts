import type { Listing, ListingPriceHistory, Property } from "@landshoppers/db";

export type ListingWithProperty = Listing & { property: Property };

export type ListingWithPropertyAndMaybeHistory = ListingWithProperty & {
  priceHistory?: ListingPriceHistory[];
};

/** JSON-safe listing shape (BigInt → string); PostGIS `geom` is not exposed. */
export function listingToJson(row: ListingWithPropertyAndMaybeHistory) {
  const p = row.property;
  return {
    id: row.id,
    propertyId: row.propertyId,
    agentId: row.agentId,
    userId: row.userId,
    price: row.price.toString(),
    priceNegotiable: row.priceNegotiable,
    status: row.status,
    isForSale: row.isForSale,
    isForRent: row.isForRent,
    rentPeriod: row.rentPeriod,
    isFeatured: row.isFeatured,
    featuredUntil: row.featuredUntil?.toISOString() ?? null,
    viewCount: row.viewCount,
    inquiryCount: row.inquiryCount,
    virtualTourUrl: row.virtualTourUrl,
    videoUrl: row.videoUrl,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    sourceType: row.sourceType,
    sourceMessageId: row.sourceMessageId,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvedBy: row.approvedBy,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    rejectedBy: row.rejectedBy,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row.priceHistory !== undefined
      ? {
          priceHistory: row.priceHistory.map((h) => ({
            changedAt: h.changedAt.toISOString(),
            price: h.price.toString(),
          })),
        }
      : {}),
    property: {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      propertyType: p.propertyType,
      address: p.address,
      street: p.street,
      city: p.city,
      state: p.state,
      country: p.country,
      postalCode: p.postalCode,
      latitude: p.latitude,
      longitude: p.longitude,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      toilets: p.toilets,
      squareMeters: p.squareMeters,
      yearBuilt: p.yearBuilt,
      parkingSpaces: p.parkingSpaces,
      isFurnished: p.isFurnished,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    },
  };
}
