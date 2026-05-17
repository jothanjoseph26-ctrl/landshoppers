import { ApiRequestError, apiFetch } from "./client"
import { normalizeServiceProviderFromApi } from "./service-provider-normalize"

/** Normalized card for directory + homepage — matches `GET /v1/services` intent (Stream 1). */
export type ApiServiceProviderListItem = {
  id: string
  businessName: string
  slug: string
  category: string
  description: string | null
  city: string
  state: string
  rating: number
  reviewCount: number
  isVerified: boolean
  isPremium?: boolean
  isFeatured?: boolean
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  /** Hero / card imagery */
  coverImageUrl?: string | null
  galleryImages?: string[]
  services?: string[]
  completedJobCount?: number
  serviceAreas?: string[]
  responseRatePercent?: number
  verificationLevel?: string
  subCategories?: string[]
  /** Contextual engine: short copy for tooltip (e.g. proximity + verification). */
  matchHint?: string
  /** WGS84 from PostGIS geom when API exposes coordinates (SVC-PUB-02). */
  latitude?: number | null
  longitude?: number | null
}

export type ApiServicesCategoriesItem = {
  code: string
  name: string
  providerCount: number
  subCategories?: { code: string; name: string }[]
}

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null
  const data = (raw as { data?: unknown }).data
  return data !== undefined ? (data as T) : (raw as T)
}

/** GET /v1/services/categories — tolerates `{ data: { categories } }` or `{ data: [...] }`. */
export async function tryFetchServicesCategories(): Promise<
  ApiServicesCategoriesItem[] | null
> {
  try {
    const json = await apiFetch<unknown>("/v1/services/categories")
    const inner = unwrapData<unknown>(json)
    if (!inner || typeof inner !== "object") return null
    if (Array.isArray(inner)) return inner as ApiServicesCategoriesItem[]
    const cats = (inner as { categories?: unknown }).categories
    if (Array.isArray(cats)) return cats as ApiServicesCategoriesItem[]
    return null
  } catch (e) {
    if (e instanceof ApiRequestError && (e.status === 404 || e.status === 501)) return null
    return null
  }
}

export type ListServicesParams = {
  category?: string
  state?: string
  keyword?: string
  verified?: boolean
  ratingMin?: number
  sort?: "recommended" | "rating" | "jobs" | "newest" | "response"
  page?: number
  limit?: number
}

/** GET /v1/services */
export async function tryFetchServiceProviders(
  params: ListServicesParams,
): Promise<{ items: ApiServiceProviderListItem[]; total: number } | null> {
  const sp = new URLSearchParams()
  if (params.category) sp.set("category", params.category)
  if (params.state) sp.set("state", params.state)
  if (params.keyword) sp.set("keyword", params.keyword)
  if (params.verified !== undefined) sp.set("verified", String(params.verified))
  if (params.ratingMin !== undefined) sp.set("rating_min", String(params.ratingMin))
  if (params.sort) sp.set("sort", params.sort)
  if (params.page) sp.set("page", String(params.page))
  if (params.limit) sp.set("limit", String(params.limit))
  const q = sp.toString()
  const path = `/v1/services${q ? `?${q}` : ""}`
  try {
    const json = await apiFetch<unknown>(path)
    const inner = unwrapData<{ items?: unknown; total?: unknown }>(json)
    if (!inner || typeof inner !== "object") return null
    const rawItems = (inner as { items?: unknown[] }).items
    const total = (inner as { total?: number }).total
    if (!Array.isArray(rawItems)) return null
    const items: ApiServiceProviderListItem[] = []
    for (const row of rawItems) {
      if (row && typeof row === "object") {
        const n = normalizeServiceProviderFromApi(row as Record<string, unknown>)
        if (n) items.push(n)
      }
    }
    return { items, total: typeof total === "number" ? total : items.length }
  } catch (e) {
    if (e instanceof ApiRequestError && (e.status === 404 || e.status === 501)) return null
    return null
  }
}

/** GET /v1/services/:slug — public profile payload (Stream 1). */
export async function tryFetchServiceProviderBySlug(
  slug: string,
): Promise<Record<string, unknown> | null> {
  try {
    const json = await apiFetch<unknown>(`/v1/services/${encodeURIComponent(slug)}`)
    const inner = unwrapData<Record<string, unknown>>(json)
    return inner && typeof inner === "object" ? inner : null
  } catch (e) {
    if (e instanceof ApiRequestError && (e.status === 404 || e.status === 501)) return null
    return null
  }
}

export type ApiServicesMatchGroup = {
  category: string
  label?: string
  providers: ApiServiceProviderListItem[]
}

export type ApiServicesMatchPayload = {
  listingId?: string
  areaLabel?: string
  groups: ApiServicesMatchGroup[]
  bundleUpsell?: {
    slug: string
    name: string
    priceFromLabel?: string
  }
}

/** GET /v1/services/match?listingId=&categories= */
export async function tryFetchServicesMatch(params: {
  listingId: string
  categories?: string[]
}): Promise<ApiServicesMatchPayload | null> {
  const sp = new URLSearchParams({ listingId: params.listingId })
  if (params.categories?.length) {
    for (const c of params.categories) sp.append("categories[]", c)
  }
  try {
    const json = await apiFetch<unknown>(
      `/v1/services/match?${sp.toString()}`,
    )
    const inner = unwrapData<Record<string, unknown>>(json)
    if (!inner || typeof inner !== "object") return null
    const rawGroups = (inner as { groups?: unknown }).groups
    if (!Array.isArray(rawGroups)) return null
    const groups: ApiServicesMatchGroup[] = []
    for (const g of rawGroups) {
      if (!g || typeof g !== "object") continue
      const category = String((g as { category?: unknown }).category ?? "")
      const label =
        typeof (g as { label?: unknown }).label === "string"
          ? ((g as { label: string }).label)
          : undefined
      const rawProviders = (g as { providers?: unknown }).providers
      if (!Array.isArray(rawProviders)) continue
      const providers: ApiServiceProviderListItem[] = []
      for (const p of rawProviders) {
        if (p && typeof p === "object") {
          const row = normalizeServiceProviderFromApi(p as Record<string, unknown>)
          if (row) providers.push(row)
        }
      }
      if (category) groups.push({ category, label, providers })
    }
    const bundleUpsellRaw = (inner as { bundleUpsell?: unknown }).bundleUpsell
    let bundleUpsell: ApiServicesMatchPayload["bundleUpsell"]
    if (bundleUpsellRaw && typeof bundleUpsellRaw === "object") {
      const b = bundleUpsellRaw as Record<string, unknown>
      if (typeof b["slug"] === "string" && typeof b["name"] === "string") {
        bundleUpsell = {
          slug: String(b["slug"]),
          name: String(b["name"]),
          priceFromLabel:
            typeof b["priceFromLabel"] === "string" ? b["priceFromLabel"] : undefined,
        }
      }
    }
    return {
      listingId:
        typeof inner["listingId"] === "string" ? inner["listingId"] : params.listingId,
      areaLabel:
        typeof inner["areaLabel"] === "string" ? (inner["areaLabel"] as string) : undefined,
      groups,
      bundleUpsell,
    }
  } catch (e) {
    if (e instanceof ApiRequestError && (e.status === 404 || e.status === 501)) return null
    return null
  }
}

export type ApiServiceBundle = {
  id: string
  name: string
  slug: string
  description: string
  categories: string[]
  priceFromKobo: string
  priceToKobo: string
  triggerContext: string
  activationCount: number
}

/** GET /v1/services/bundles */
export async function fetchServiceBundlesPublic(): Promise<ApiServiceBundle[]> {
  try {
    const json = await apiFetch<unknown>("/v1/services/bundles")
    const inner = unwrapData<unknown>(json)
    if (!Array.isArray(inner)) return []
    return inner as ApiServiceBundle[]
  } catch {
    return []
  }
}

export type ActivateBundlePayload = {
  clientName: string
  clientPhone: string
  clientEmail?: string
  listingId?: string
  location?: string
  message?: string
  developerProjectId?: string
}

/** POST /v1/services/bundles/:id/activate */
export async function activateServiceBundle(
  bundleId: string,
  body: ActivateBundlePayload,
): Promise<unknown> {
  return apiFetch<unknown>(`/v1/services/bundles/${encodeURIComponent(bundleId)}/activate`, {
    method: "POST",
    auth: true,
    body: body as Record<string, unknown>,
  })
}

export type ServiceQuotePayload = {
  clientName: string
  clientPhone: string
  clientEmail?: string
  serviceRequested: string
  message: string
  timeline?: string
  budgetKobo?: string
  listingId?: string
  source?: "listing_page" | "directory" | "contextual_match"
}

/** POST /v1/services/:slug/quote — guest allowed. */
export async function submitServiceQuote(
  providerSlug: string,
  body: ServiceQuotePayload,
): Promise<unknown> {
  return apiFetch<unknown>(`/v1/services/${encodeURIComponent(providerSlug)}/quote`, {
    method: "POST",
    body: body as unknown as Record<string, unknown>,
  })
}

export type ApiServiceReviewItem = {
  id: string
  authorName: string
  rating: number
  body: string
  createdAt: string
  jobVerified?: boolean
}

/** GET /v1/services/:slug/reviews */
export async function tryFetchServiceReviews(
  slug: string,
  params?: { page?: number; limit?: number },
): Promise<{ items: ApiServiceReviewItem[]; total: number } | null> {
  const sp = new URLSearchParams()
  if (params?.page) sp.set("page", String(params.page))
  if (params?.limit) sp.set("limit", String(params.limit))
  const q = sp.toString()
  try {
    const json = await apiFetch<unknown>(
      `/v1/services/${encodeURIComponent(slug)}/reviews${q ? `?${q}` : ""}`,
    )
    const inner = unwrapData<{ items?: unknown; total?: unknown }>(json)
    if (!inner || typeof inner !== "object") return null
    const raw = (inner as { items?: unknown }).items
    if (!Array.isArray(raw)) return null
    const items: ApiServiceReviewItem[] = []
    for (const r of raw) {
      if (!r || typeof r !== "object") continue
      const o = r as Record<string, unknown>
      const id = String(o["id"] ?? "")
      const authorName = String(o["authorName"] ?? o["author"] ?? "Client")
      const rating = Number(o["rating"] ?? 0)
      const body = String(o["body"] ?? o["comment"] ?? "")
      const createdAt = String(o["createdAt"] ?? o["date"] ?? "")
      if (id && body) items.push({ id, authorName, rating, body, createdAt })
    }
    const total = Number((inner as { total?: unknown }).total)
    return { items, total: Number.isFinite(total) ? total : items.length }
  } catch (e) {
    if (e instanceof ApiRequestError && (e.status === 404 || e.status === 501)) return null
    return null
  }
}

export type ServiceProviderRegistrationPayload = {
  email: string
  password: string
  phone: string
  businessName: string
  category: string
  city: string
  state: string
  description?: string
  servicesOffered: string[]
  serviceAreas: string[]
  portfolioNote?: string
}

/**
 * Intended: `POST /v1/services/register` (Stream 1 — provider acquisition §3.x).
 * Until the route exists, callers should handle ApiRequestError / failures gracefully.
 */
export async function registerServiceProvider(
  body: ServiceProviderRegistrationPayload,
): Promise<unknown> {
  return apiFetch<unknown>("/v1/services/register", {
    method: "POST",
    body: body as unknown as Record<string, unknown>,
  })
}

/** Offline/demo directory used when the API slice is not deployed (Phase A). */
export const DEMO_SERVICE_PROVIDERS: ApiServiceProviderListItem[] = [
  {
    id: "1",
    businessName: "Adekunle & Partners Legal",
    slug: "adekunle-partners-legal",
    category: "legal",
    description:
      "Expert property law firm specializing in transactions, title verification, and documentation across Nigeria.",
    city: "Lagos",
    state: "Lagos",
    rating: 4.9,
    reviewCount: 128,
    isVerified: true,
    isPremium: true,
    isFeatured: true,
    phone: "+234 801 234 5678",
    coverImageUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop",
    services: ["Title Search", "Documentation", "Contract Review", "Land Registration"],
    completedJobCount: 214,
    serviceAreas: ["Victoria Island", "Ikoyi", "Lekki"],
  },
  {
    id: "2",
    businessName: "First Mortgage Partners",
    slug: "first-mortgage-partners",
    category: "mortgage",
    description: "Mortgage origination and advisory for Nigerian homebuyers.",
    city: "Lagos",
    state: "Lagos",
    rating: 4.7,
    reviewCount: 256,
    isVerified: true,
    isFeatured: true,
    phone: "+234 802 345 6789",
    coverImageUrl:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop",
    services: ["Home Loans", "Refinancing", "Advisory"],
    completedJobCount: 410,
    serviceAreas: ["Ikoyi", "VI"],
  },
  {
    id: "3",
    businessName: "BuildRight Architects",
    slug: "buildright-architects",
    category: "architecture",
    description: "Residential and commercial architectural design.",
    city: "Lagos",
    state: "Lagos",
    rating: 4.8,
    reviewCount: 89,
    isVerified: true,
    isFeatured: true,
    phone: "+234 803 456 7890",
    coverImageUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop",
    services: ["Design", "Interiors", "Project Management"],
    completedJobCount: 120,
    serviceAreas: ["Lekki", "Ajah"],
  },
  {
    id: "4",
    businessName: "GeoPoint Survey Ltd",
    slug: "geopoint-survey",
    category: "survey",
    description: "Licensed land and building surveyors.",
    city: "Lagos",
    state: "Lagos",
    rating: 4.6,
    reviewCount: 67,
    isVerified: true,
    phone: "+234 804 567 8901",
    coverImageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop",
    services: ["Boundary", "Topographic", "Survey Plan"],
    completedJobCount: 95,
    serviceAreas: ["Ikeja", "Maryland"],
  },
  {
    id: "5",
    businessName: "Shield Property Insurance",
    slug: "shield-property-insurance",
    category: "insurance",
    description: "Property and mortgage protection products.",
    city: "Lagos",
    state: "Lagos",
    rating: 4.5,
    reviewCount: 143,
    isVerified: true,
    isPremium: true,
    phone: "+234 805 678 9012",
    coverImageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
    services: ["Home", "Landlord", "Mortgage Protection"],
    completedJobCount: 312,
    serviceAreas: ["VI", "Lekki"],
  },
  {
    id: "6",
    businessName: "ProShot Real Estate Photography",
    slug: "proshot-photography",
    category: "photography",
    description: "Listing media, drone, and virtual tours.",
    city: "Lagos",
    state: "Lagos",
    rating: 4.9,
    reviewCount: 78,
    isVerified: true,
    isFeatured: true,
    phone: "+234 807 890 1234",
    coverImageUrl:
      "https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400&h=300&fit=crop",
    services: ["Photos", "Drone", "Virtual tour"],
    completedJobCount: 540,
    serviceAreas: ["Surulere", "Yaba"],
  },
]

export function mergeCategoryCounts(
  api: ApiServicesCategoriesItem[] | null,
): Map<string, number> {
  const map = new Map<string, number>()
  if (api) {
    for (const row of api) {
      map.set(row.code, row.providerCount)
    }
  }
  return map
}

export { normalizeServiceProviderFromApi } from "./service-provider-normalize"
