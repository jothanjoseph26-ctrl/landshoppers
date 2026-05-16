import type { DeveloperProject } from "@landshoppers/db";

/** JSON-safe developer-owned project row for portal + web. */
export function developerProjectToJson(row: DeveloperProject) {
  return {
    id: row.id,
    developerId: row.developerId,
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
    priceRangeMin: row.priceRangeMin?.toString() ?? null,
    priceRangeMax: row.priceRangeMax?.toString() ?? null,
    totalUnits: row.totalUnits,
    availableUnits: row.availableUnits,
    soldUnits: row.soldUnits,
    amenities: row.amenities,
    features: row.features,
    images: row.images,
    floorPlans: row.floorPlans,
    brochureUrl: row.brochureUrl,
    virtualTourUrl: row.virtualTourUrl,
    completionDate: row.completionDate?.toISOString() ?? null,
    launchDate: row.launchDate?.toISOString() ?? null,
    isFeatured: row.isFeatured,
    viewCount: row.viewCount,
    inquiryCount: row.inquiryCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
