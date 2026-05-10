export type ListingIndexSource = {
  listingId: string;
  propertySlug: string;
  title: string;
  description: string | null;
  city: string;
  state: string;
  country: string;
  propertyType: string;
  price: bigint;
  bedrooms: number | null;
  bathrooms: number | null;
  isForSale: boolean;
  isForRent: boolean;
  verificationBadge: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  latitude: number | null;
  longitude: number | null;
  features: string[];
};

/** Document body indexed in OpenSearch; `_id` is `listing_id`. */
export function listingOpenSearchDocument(source: ListingIndexSource): Record<string, unknown> {
  const primaryLine = `${source.city}, ${source.state}`;
  return {
    listing_id: source.listingId,
    property_slug: source.propertySlug,
    title: source.title,
    description: source.description ?? "",
    city: source.city,
    state: source.state,
    country: source.country,
    property_type: source.propertyType,
    price: Number(source.price),
    bedrooms: source.bedrooms ?? 0,
    bathrooms: source.bathrooms ?? 0,
    is_for_sale: source.isForSale,
    is_for_rent: source.isForRent,
    verification_badge: source.verificationBadge,
    published_at: source.publishedAt?.toISOString() ?? source.createdAt.toISOString(),
    created_at: source.createdAt.toISOString(),
    ...(source.latitude !== null &&
    source.longitude !== null &&
    !Number.isNaN(source.latitude) &&
    !Number.isNaN(source.longitude)
      ? { location: { lat: source.latitude, lon: source.longitude } }
      : {}),
    ...(source.features.length > 0 ? { features: source.features } : {}),
    suggest: {
      input: [...new Set([source.title, source.city, primaryLine].filter(Boolean))],
    },
  };
}
