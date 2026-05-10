import { apiFetch } from "./client"
import type {
  ApiInquiry,
  ApiInquiryStatus,
  ApiListResponse,
  ApiListing,
  ApiListingStatus,
  ApiMeUser,
  ApiRecentListing,
  ApiSavedListing,
  ApiSavedSearch,
} from "./types"

type PageParams = { page?: number; pageSize?: number }

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&")
}

/* ============== /v1/me ============== */

export async function fetchMe(): Promise<ApiMeUser> {
  const res = await apiFetch<{ data: ApiMeUser }>("/v1/auth/me", { auth: true })
  return res.data
}

/* ============== Saved listings ============== */

export async function fetchSavedListings(
  params: PageParams = {},
): Promise<ApiListResponse<ApiSavedListing[]>> {
  return apiFetch<ApiListResponse<ApiSavedListing[]>>(
    `/v1/me/saved-listings${qs({ page: params.page, pageSize: params.pageSize })}`,
    { auth: true },
  )
}

export async function saveListing(listingId: string): Promise<void> {
  await apiFetch(`/v1/me/saved-listings/${listingId}`, { method: "POST", auth: true })
}

export async function unsaveListing(listingId: string): Promise<void> {
  await apiFetch(`/v1/me/saved-listings/${listingId}`, { method: "DELETE", auth: true })
}

/* ============== Saved searches ============== */

export async function fetchSavedSearches(): Promise<ApiSavedSearch[]> {
  const res = await apiFetch<{ data: ApiSavedSearch[] }>("/v1/me/saved-searches", { auth: true })
  return res.data
}

export async function createSavedSearch(body: {
  name?: string
  filters: Record<string, unknown>
  alertFrequency?: "instant" | "daily" | "weekly"
  emailAlerts?: boolean
}): Promise<ApiSavedSearch> {
  const res = await apiFetch<{ data: ApiSavedSearch }>("/v1/me/saved-searches", {
    method: "POST",
    auth: true,
    body,
  })
  return res.data
}

export async function updateSavedSearch(
  id: string,
  body: Partial<{ name: string | null; filters: Record<string, unknown>; alertFrequency: "instant" | "daily" | "weekly"; emailAlerts: boolean }>,
): Promise<ApiSavedSearch> {
  const res = await apiFetch<{ data: ApiSavedSearch }>(`/v1/me/saved-searches/${id}`, {
    method: "PATCH",
    auth: true,
    body,
  })
  return res.data
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await apiFetch(`/v1/me/saved-searches/${id}`, { method: "DELETE", auth: true })
}

/* ============== Recent listings ============== */

export async function fetchRecentListings(
  params: PageParams = {},
): Promise<ApiListResponse<ApiRecentListing[]>> {
  return apiFetch<ApiListResponse<ApiRecentListing[]>>(
    `/v1/me/recent-listings${qs({ page: params.page, pageSize: params.pageSize })}`,
    { auth: true },
  )
}

export async function recordRecentView(listingId: string): Promise<void> {
  await apiFetch(`/v1/me/recent-listings/${listingId}`, { method: "POST", auth: true })
}

/* ============== Inquiries (buyer) ============== */

export async function fetchMyInquiries(
  params: PageParams & { status?: ApiInquiryStatus } = {},
): Promise<ApiListResponse<ApiInquiry[]>> {
  return apiFetch<ApiListResponse<ApiInquiry[]>>(
    `/v1/me/inquiries${qs({ page: params.page, pageSize: params.pageSize, status: params.status })}`,
    { auth: true },
  )
}

export async function createInquiry(body: {
  listingId?: string
  projectId?: string
  message?: string
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
}): Promise<ApiInquiry> {
  const res = await apiFetch<{ data: ApiInquiry }>("/v1/inquiries", {
    method: "POST",
    auth: true,
    body,
  })
  return res.data
}

export async function updateInquiryStatus(
  id: string,
  body: { status: ApiInquiryStatus; closedReason?: string },
): Promise<ApiInquiry> {
  const res = await apiFetch<{ data: ApiInquiry }>(`/v1/inquiries/${id}`, {
    method: "PATCH",
    auth: true,
    body,
  })
  return res.data
}

/* ============== Agent listings + leads ============== */

export async function fetchAgentListings(
  params: PageParams & { status?: ApiListingStatus } = {},
): Promise<ApiListResponse<ApiListing[]>> {
  return apiFetch<ApiListResponse<ApiListing[]>>(
    `/v1/agent/listings${qs({ page: params.page, pageSize: params.pageSize, status: params.status })}`,
    { auth: true },
  )
}

export async function fetchAgentInquiries(
  params: PageParams & { status?: ApiInquiryStatus } = {},
): Promise<ApiListResponse<ApiInquiry[]>> {
  return apiFetch<ApiListResponse<ApiInquiry[]>>(
    `/v1/agent/inquiries${qs({ page: params.page, pageSize: params.pageSize, status: params.status })}`,
    { auth: true },
  )
}

export async function createListing(body: {
  title: string
  description?: string
  propertyType: "apartment" | "house" | "land" | "commercial" | "estate_unit"
  city: string
  state: string
  country?: string
  address?: string
  latitude?: number
  longitude?: number
  bedrooms?: number
  bathrooms?: number
  toilets?: number
  squareMeters?: number
  priceKobo: string
  priceNegotiable?: boolean
  isForSale?: boolean
  isForRent?: boolean
  rentPeriod?: string
}): Promise<ApiListing> {
  const res = await apiFetch<{ data: ApiListing }>("/v1/listings", {
    method: "POST",
    auth: true,
    body,
  })
  return res.data
}

export async function submitListing(id: string): Promise<ApiListing> {
  const res = await apiFetch<{ data: ApiListing }>(`/v1/listings/${id}/submit`, {
    method: "POST",
    auth: true,
  })
  return res.data
}

export async function softDeleteListing(id: string): Promise<void> {
  await apiFetch(`/v1/listings/${id}`, { method: "DELETE", auth: true })
}

/* ============== Admin moderation ============== */

export async function fetchAdminPendingListings(
  params: PageParams = {},
): Promise<ApiListResponse<ApiListing[]>> {
  return apiFetch<ApiListResponse<ApiListing[]>>(
    `/v1/admin/listings/pending${qs({ page: params.page, pageSize: params.pageSize })}`,
    { auth: true },
  )
}

export async function adminApproveListing(id: string): Promise<ApiListing> {
  const res = await apiFetch<{ data: ApiListing }>(`/v1/admin/listings/${id}/approve`, {
    method: "POST",
    auth: true,
  })
  return res.data
}

export async function adminRejectListing(id: string, reason: string): Promise<ApiListing> {
  const res = await apiFetch<{ data: ApiListing }>(`/v1/admin/listings/${id}/reject`, {
    method: "POST",
    auth: true,
    body: { reason },
  })
  return res.data
}
