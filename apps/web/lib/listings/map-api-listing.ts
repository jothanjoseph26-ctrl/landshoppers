import type { PropertyCardProps } from "@/components/listings/property-card"
import type { ApiListing } from "@/lib/api/types"

export const LISTING_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"

/** Schema stores amounts in kobo (₦1 = 100 kobo). UI cards use naira. */
export function koboToNairaNumber(priceKobo: string): number {
  const n = BigInt(priceKobo)
  return Number(n / BigInt(100))
}

export function mapApiListingToCardProps(row: ApiListing): PropertyCardProps {
  const p = row.property
  const price = koboToNairaNumber(row.price)
  const location = [p.city, p.state].filter(Boolean).join(", ")
  const type: PropertyCardProps["type"] =
    row.isForRent && !row.isForSale ? "rent" : "sale"

  const created = new Date(row.createdAt).getTime()
  const isNew = Date.now() - created < 14 * 24 * 60 * 60 * 1000

  return {
    id: row.id,
    title: p.title,
    slug: p.slug,
    price,
    location,
    city: p.city,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    sqm: p.squareMeters ?? undefined,
    image: LISTING_PLACEHOLDER_IMAGE,
    type,
    propertyType: p.propertyType,
    isNew,
    isFeatured: row.isFeatured,
    isVerified: true,
    priceLabel: type === "rent" ? "/year" : undefined,
  }
}

/** Detail page view model (fills gaps until images/agent APIs exist). */
export function mapApiListingToDetailView(row: ApiListing) {
  const p = row.property
  const price = koboToNairaNumber(row.price)
  const created = new Date(row.createdAt).getTime()
  const isNew = Date.now() - created < 14 * 24 * 60 * 60 * 1000

  return {
    id: row.id,
    title: p.title,
    slug: p.slug,
    description:
      p.description ??
      "Description will appear here once the listing detail pipeline is fully wired.",
    price,
    priceHistory: [] as { date: string; price: number }[],
    location: p.city,
    address: p.address ?? p.street ?? `${p.city}`,
    city: p.city,
    state: p.state,
    country: p.country,
    latitude: p.latitude ?? 6.5244,
    longitude: p.longitude ?? 3.3792,
    propertyType: p.propertyType,
    listingType:
      row.isForRent && !row.isForSale ? ("rent" as const) : ("sale" as const),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    toilets: p.toilets,
    sqm: p.squareMeters,
    yearBuilt: p.yearBuilt,
    parkingSpaces: p.parkingSpaces,
    isFurnished: p.isFurnished,
    images: Array.from({ length: 6 }, (_, i) => ({
      url: LISTING_PLACEHOLDER_IMAGE,
      alt: `Photo ${i + 1}`,
    })),
    features: [] as { name: string; icon: string }[],
    agent: {
      id: "pending",
      name: "Listing agent",
      company: "LandShoppers",
      phone: "+2340000000000",
      whatsapp: "2340000000000",
      image: LISTING_PLACEHOLDER_IMAGE,
      isVerified: false,
      rating: 0,
      reviewCount: 0,
    },
    viewCount: row.viewCount,
    isNew,
    isFeatured: row.isFeatured,
    isVerified: true,
    publishedAt: row.publishedAt ?? row.createdAt,
    virtualTourUrl: row.virtualTourUrl,
  }
}
