import { apiFetch } from "./client"
import type { ApiListResponse } from "./types"

export type ProviderPortalTier = "free" | "pro" | "elite"

export type ProviderPortalContext = {
  userId: string
  email: string
  displayName: string | null
  businessName: string
  category: string
  city: string
  state: string
  logoUrl: string | null
  avatarUrl: string | null
  tier: ProviderPortalTier
  verificationLevel: "basic" | "standard" | "professional" | "elite"
  isVerified: boolean
  featureFlags: {
    providerWhatsappEnabled: boolean
  }
}

export type ProviderPortalDashboard = {
  tier: ProviderPortalTier
  businessName: string
  category: string
  kpis: {
    newLeadsToday: number
    newLeadsPulse: boolean
    hotLeads: { count: number; leadScoringAvailable: boolean }
    jobsInProgress: number
    profileViewsWeek: {
      value: number
      priorValue: number | null
      changePercent: number | null
    }
    matchAppearancesWeek: number | null
  }
  trust: {
    rating: number
    reviewCount: number
    leadCount: number
    aiMatchScore: number | null
  }
  recentLeads: Array<{
    id: string
    maskedClientLabel: string
    serviceRequested: string
    source: string
    aiScore: number | null
    createdAt: string
  }>
  insights: Array<{
    id: string
    kind: "response" | "growth" | "verification" | "portfolio"
    title: string
    body: string
    severity: "info" | "warning" | "success"
  }>
}

export type ApiProviderProfile = {
  id: string
  userId: string
  businessName: string
  slug: string
  category: string
  description: string | null
  services: string[]
  address: string | null
  city: string
  state: string
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  galleryImages: string[]
  socialLinks: Record<string, string> | null
  rating: number
  reviewCount: number
  isVerified: boolean
  viewCount: number
  leadCount: number
  updatedAt: string
}

export async function fetchProviderContext(): Promise<ProviderPortalContext> {
  const res = await apiFetch<{ data: ProviderPortalContext }>("/v1/provider/context", { auth: true })
  return res.data
}

export async function fetchProviderDashboard(): Promise<ProviderPortalDashboard> {
  const res = await apiFetch<{ data: ProviderPortalDashboard }>("/v1/provider/dashboard", {
    auth: true,
  })
  return res.data
}

export async function fetchProviderProfile(): Promise<ApiProviderProfile> {
  const res = await apiFetch<{ data: ApiProviderProfile }>("/v1/provider/profile", { auth: true })
  return res.data
}

export type PatchProviderProfilePayload = {
  category?: string
  businessName?: string
  description?: string | null
  services?: string[]
  address?: string | null
  city?: string
  state?: string
  country?: string
  phone?: string | null
  email?: string | null
  website?: string | null
  socialLinks?: Record<string, string> | null
}

export async function patchProviderProfile(body: PatchProviderProfilePayload): Promise<ApiProviderProfile> {
  const res = await apiFetch<{ data: ApiProviderProfile }>("/v1/provider/profile", {
    method: "PATCH",
    auth: true,
    body: body as Record<string, unknown>,
  })
  return res.data
}

/** GET /v1/provider/leads row — mirrors `providerLeadRowSchema`. */
export type ApiProviderLead = {
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
  clientNameMasked: string
  clientPhone: string
  clientEmail: string | null
  aiScore: number | null
  aiSummary: string | null
  listingId: string | null
  projectId: string | null
  bundleId: string | null
  createdAt: string
  respondedAt: string | null
  completedAt: string | null
}

export async function fetchProviderLeads(params: {
  page?: number
  pageSize?: number
  status?: string
  source?: string
}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  if (params.status) sp.set("status", params.status)
  if (params.source) sp.set("source", params.source)
  const q = sp.toString()
  return apiFetch<ApiListResponse<ApiProviderLead[]>>(`/v1/provider/leads${q ? `?${q}` : ""}`, {
    auth: true,
  })
}

export async function patchProviderLead(
  leadId: string,
  body: { status?: string; quotedAmountKobo?: string },
): Promise<ApiProviderLead> {
  const res = await apiFetch<{ data: ApiProviderLead }>(`/v1/provider/leads/${leadId}`, {
    method: "PATCH",
    auth: true,
    body: body as Record<string, unknown>,
  })
  return res.data
}
