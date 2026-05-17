import { apiFetch } from "./client"
import type { ApiListResponse } from "./types"

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&")
}

export type ApiBuyerSettings = {
  email: string
  phone: string | null
  profile: {
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    city: string | null
    state: string | null
    country: string | null
  } | null
  notifications: {
    notifyEmail: boolean
    notifySms: boolean
    notifyPush: boolean
  }
  preferences: Record<string, unknown> | null
}

export type PatchBuyerSettingsBody = {
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  avatarUrl?: string | null
  phone?: string | null
  notifyEmail?: boolean
  notifySms?: boolean
  notifyPush?: boolean
  preferences?: Record<string, unknown> | null
}

export async function fetchBuyerSettings() {
  return apiFetch<{ data: ApiBuyerSettings }>("/v1/me/settings", { auth: true })
}

export async function patchBuyerSettings(body: PatchBuyerSettingsBody) {
  return apiFetch<{ data: ApiBuyerSettings }>("/v1/me/settings", {
    method: "PATCH",
    auth: true,
    body,
  })
}

export type ApiBuyerTour = {
  id: string
  status: string
  tourType: string
  preferredDate: string
  preferredTime: string | null
  confirmedDate: string | null
  listing: {
    id: string
    slug: string
    title: string
    city: string
    thumbnailUrl: string | null
  }
  agent: { id: string; agencyName: string | null } | null
  notes: string | null
  cancelReason: string | null
  createdAt: string
}

export async function fetchBuyerTours(params: {
  page?: number
  pageSize?: number
  status?: string
  upcoming?: boolean
} = {}) {
  return apiFetch<ApiListResponse<ApiBuyerTour[]>>(
    `/v1/me/tours${qs({
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
      upcoming: params.upcoming ? "true" : undefined,
    })}`,
    { auth: true },
  )
}

export async function createBuyerTour(body: {
  listingId: string
  tourType?: "in_person" | "virtual"
  preferredDate: string
  preferredTime?: string
  notes?: string
  buyerPhone?: string
}) {
  return apiFetch<{ data: ApiBuyerTour }>("/v1/me/tours", {
    method: "POST",
    auth: true,
    body: {
      tourType: body.tourType ?? "in_person",
      listingId: body.listingId,
      preferredDate: body.preferredDate,
      preferredTime: body.preferredTime,
      notes: body.notes,
      buyerPhone: body.buyerPhone,
    },
  })
}

export async function cancelBuyerTour(id: string, cancelReason?: string) {
  return apiFetch<{ data: ApiBuyerTour }>(`/v1/me/tours/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    auth: true,
    body: cancelReason ? { cancelReason } : {},
  })
}

/** GET /v1/me/service-leads — mirrors `meServiceLeadRowSchema` (Stream 1). */
export type ApiBuyerServiceLead = {
  id: string
  status: string
  source: string
  serviceRequested: string
  message: string
  location: string
  timeline: string | null
  budgetKobo: string | null
  quotedAmountKobo: string | null
  finalAmountKobo: string | null
  createdAt: string
  respondedAt: string | null
  completedAt: string | null
  provider: {
    id: string
    businessName: string
    slug: string
    /** Present once Agent 1 A1 serializer ships `provider.category`. */
    category?: string
  }
}

export type PostBuyerServiceLeadReviewBody = {
  overallRating: number
  qualityRating: number
  communicationRating: number
  timelinessRating: number
  valueRating: number
  title: string
  body: string
}

export async function fetchBuyerServiceLeads() {
  return apiFetch<{ data: ApiBuyerServiceLead[] }>("/v1/me/service-leads", { auth: true })
}

export async function postBuyerServiceLeadReview(
  leadId: string,
  body: PostBuyerServiceLeadReviewBody,
) {
  return apiFetch<{ data: { ok: boolean } }>(
    `/v1/me/service-leads/${encodeURIComponent(leadId)}/review`,
    { method: "POST", auth: true, body },
  )
}
