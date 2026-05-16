import type { ApiServiceProviderListItem } from "./services-marketplace"

/** Best-effort map for `GET /v1/services/:slug` (Stream 1 contract TBD). */
export function normalizeServiceProviderFromApi(
  j: Record<string, unknown>,
): ApiServiceProviderListItem | null {
  if (typeof j["slug"] !== "string" || typeof j["businessName"] !== "string") return null
  const services = pickServices(j)
  return {
    id: String(j["id"] ?? j["slug"]),
    businessName: String(j["businessName"]),
    slug: String(j["slug"]),
    category: String(j["category"] ?? ""),
    description: typeof j["description"] === "string" ? j["description"] : null,
    city: String(j["city"] ?? ""),
    state: String(j["state"] ?? ""),
    rating: Number(j["rating"] ?? 0),
    reviewCount: Number(j["reviewCount"] ?? 0),
    isVerified: Boolean(j["isVerified"] ?? false),
    isPremium: Boolean(j["isPremium"]),
    isFeatured: Boolean(j["isFeatured"]),
    phone: typeof j["phone"] === "string" ? j["phone"] : null,
    logoUrl: typeof j["logoUrl"] === "string" ? j["logoUrl"] : null,
    coverImageUrl:
      typeof j["coverImageUrl"] === "string"
        ? j["coverImageUrl"]
        : typeof j["logoUrl"] === "string"
          ? j["logoUrl"]
          : null,
    galleryImages: pickGallery(j),
    services,
    completedJobCount:
      typeof j["completedJobCount"] === "number" ? j["completedJobCount"] : undefined,
    serviceAreas: Array.isArray(j["serviceAreas"])
      ? (j["serviceAreas"] as unknown[]).map(String)
      : undefined,
    responseRatePercent:
      typeof j["responseRatePercent"] === "number" ? j["responseRatePercent"] : undefined,
    verificationLevel:
      typeof j["verificationLevel"] === "string" ? j["verificationLevel"] : undefined,
    subCategories: Array.isArray(j["subCategories"])
      ? (j["subCategories"] as unknown[]).map(String)
      : undefined,
    matchHint: typeof j["matchHint"] === "string" ? j["matchHint"] : undefined,
  }
}

function pickServices(j: Record<string, unknown>): string[] | undefined {
  if (Array.isArray(j["services"])) {
    const raw = j["services"] as unknown[]
    if (raw.length && typeof raw[0] === "string") return raw as string[]
    return raw
      .map((row) => {
        if (row && typeof row === "object" && "name" in row)
          return String((row as { name: unknown }).name)
        return null
      })
      .filter((x): x is string => Boolean(x))
  }
  return undefined
}

function pickGallery(j: Record<string, unknown>): string[] | undefined {
  if (Array.isArray(j["galleryImages"])) {
    return (j["galleryImages"] as unknown[]).map(String).filter(Boolean)
  }
  if (Array.isArray(j["portfolioItems"])) {
    const urls: string[] = []
    for (const item of j["portfolioItems"] as unknown[]) {
      if (item && typeof item === "object" && "imageS3Key" in item) {
        const k = (item as { imageS3Key?: unknown }).imageS3Key
        if (typeof k === "string" && /^https?:\/\//i.test(k)) urls.push(k)
      }
    }
    return urls.length ? urls : undefined
  }
  return undefined
}
