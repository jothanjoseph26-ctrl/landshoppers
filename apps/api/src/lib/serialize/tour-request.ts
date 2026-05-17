import type { Agent, Listing, ListingImage, Property, TourRequest, UserProfile } from "@landshoppers/db";

type TourWithRelations = TourRequest & {
  listing: Listing & {
    property: Property;
    images?: ListingImage[];
  };
  agent: (Agent & { user?: { profile: UserProfile | null } | null }) | null;
};

function listingThumbnail(images: ListingImage[] | undefined): string | null {
  if (!images?.length) return null;
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  return primary?.thumbnailUrl ?? primary?.url ?? null;
}

export function tourRequestToJson(row: TourWithRelations) {
  const p = row.listing.property;
  return {
    id: row.id,
    status: row.status,
    tourType: row.tourType,
    preferredDate: row.preferredDate.toISOString(),
    preferredTime: row.preferredTime ?? null,
    confirmedDate: row.confirmedDate?.toISOString() ?? null,
    listing: {
      id: row.listing.id,
      slug: p.slug,
      title: p.title,
      city: p.city,
      thumbnailUrl: listingThumbnail(row.listing.images),
    },
    agent: row.agent
      ? {
          id: row.agent.id,
          agencyName: row.agent.agencyName?.trim() || null,
        }
      : null,
    notes: row.notes ?? null,
    cancelReason: row.cancelReason ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
