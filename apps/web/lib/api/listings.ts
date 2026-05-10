import { ApiRequestError } from "./client"
import { apiFetchServer } from "./server-fetch"
import type { ApiListResponse, ApiListing } from "./types"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function fetchListingBySlugOrId(
  slug: string,
): Promise<ApiListing | null> {
  try {
    if (UUID_RE.test(slug)) {
      const one = await apiFetchServer<ApiListResponse<ApiListing>>(
        `/v1/listings/${slug}`,
        { next: { revalidate: 30 } },
      )
      return one.data
    }

    const list = await apiFetchServer<ApiListResponse<ApiListing[]>>(
      `/v1/listings?pageSize=500`,
      { next: { revalidate: 30 } },
    )
    return list.data.find((row) => row.property.slug === slug) ?? null
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) {
      return null
    }
    throw e
  }
}

export async function fetchFeaturedListings(limit: number): Promise<ApiListing[]> {
  try {
    const res = await apiFetchServer<ApiListResponse<ApiListing[]>>(
      `/v1/listings?pageSize=${limit}&page=1`,
      { next: { revalidate: 30 } },
    )
    const rows = res.data ?? []
    const featured = rows.filter((r) => r.isFeatured)
    return (featured.length > 0 ? featured : rows).slice(0, limit)
  } catch {
    return []
  }
}

export async function fetchSimilarListings(
  excludeId: string,
  limit: number,
): Promise<ApiListing[]> {
  try {
    const res = await apiFetchServer<ApiListResponse<ApiListing[]>>(
      `/v1/listings?pageSize=${limit + 8}&page=1`,
      { next: { revalidate: 30 } },
    )
    return (res.data ?? []).filter((r) => r.id !== excludeId).slice(0, limit)
  } catch {
    return []
  }
}
