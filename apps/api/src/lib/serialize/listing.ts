import type { Listing, Property } from "@landshoppers/db";

export type ListingWithProperty = Listing & { property: Property };

/** JSON-safe listing shape (BigInt → string); PostGIS `geom` is not exposed. */
export function listingToJson(row: ListingWithProperty) {
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
