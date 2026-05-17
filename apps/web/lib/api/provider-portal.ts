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

// —— PRV-04 jobs (pipeline) ——
export async function fetchProviderJobs(params: {
  page?: number
  pageSize?: number
  status?: string
}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  if (params.status) sp.set("status", params.status)
  const q = sp.toString()
  return apiFetch<ApiListResponse<ApiProviderLead[]>>(`/v1/provider/jobs${q ? `?${q}` : ""}`, {
    auth: true,
  })
}

export async function patchProviderJob(leadId: string, body: { status: string }): Promise<ApiProviderLead> {
  const res = await apiFetch<{ data: ApiProviderLead }>(`/v1/provider/jobs/${leadId}`, {
    method: "PATCH",
    auth: true,
    body: body as Record<string, unknown>,
  })
  return res.data
}

// —— PRV-06 analytics ——
export type ProviderAnalyticsPeriod = "week" | "month" | "quarter" | "all"

export type ApiProviderAnalyticsSummary = {
  period: ProviderAnalyticsPeriod
  tier: ProviderPortalTier
  analyticsDepth: "basic" | "full"
  kpis: {
    totalLeads: number
    jobsInProgress: number
    funnel: {
      quoted: number
      negotiating: number
      accepted: number
      completed: number
      cancelled: number
    }
    revenueQuotedKobo: string
    revenueFinalKobo: string
    medianResponseHours: number | null
    leadsByDay: Array<{ date: string; count: number }>
  }
}

export async function fetchProviderAnalyticsSummary(period: ProviderAnalyticsPeriod = "month") {
  const res = await apiFetch<{ data: ApiProviderAnalyticsSummary }>(
    `/v1/provider/analytics/summary?period=${period}`,
    { auth: true },
  )
  return res.data
}

// —— PRV-07 reviews ——
export type ApiProviderReview = {
  id: string
  serviceLeadId: string
  overallRating: number
  title: string
  body: string
  isJobVerified: boolean
  providerResponse: string | null
  reviewerLabel: string
  createdAt: string
}

export async function fetchProviderReviews(params: { page?: number; pageSize?: number }) {
  const sp = new URLSearchParams()
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  const q = sp.toString()
  return apiFetch<ApiListResponse<ApiProviderReview[]>>(`/v1/provider/reviews${q ? `?${q}` : ""}`, {
    auth: true,
  })
}

export async function patchProviderReview(reviewId: string, body: { providerResponse: string }) {
  const res = await apiFetch<{ data: ApiProviderReview }>(`/v1/provider/reviews/${reviewId}`, {
    method: "PATCH",
    auth: true,
    body: body as Record<string, unknown>,
  })
  return res.data
}

// —— PRV-08 content ——
export type ApiProviderContentCaption = {
  id: string
  platform: string
  text: string
}

export async function postProviderContentGenerate(body: {
  leadId?: string
  category?: string
  tone?: "professional" | "friendly"
}) {
  const res = await apiFetch<{
    data: { captions: ApiProviderContentCaption[]; disclaimer: string }
  }>("/v1/provider/content/generate", {
    method: "POST",
    auth: true,
    body: body as Record<string, unknown>,
  })
  return res.data
}

// —— PRV-09 KYC ——
export type ApiProviderKyc = {
  serviceProviderId: string
  verificationLevel: string
  isVerified: boolean
  licenseNumber: string | null
  licenseBody: string | null
  kycDocuments: Array<{ type: string; label?: string; externalUrl: string; uploadedAt?: string }> | null
  checklist: Array<{ id: string; label: string; complete: boolean }>
}

export async function fetchProviderKyc() {
  const res = await apiFetch<{ data: ApiProviderKyc }>("/v1/provider/kyc", { auth: true })
  return res.data
}

export async function patchProviderKyc(body: {
  licenseNumber?: string | null
  licenseBody?: string | null
  kycDocuments?: ApiProviderKyc["kycDocuments"]
}) {
  const res = await apiFetch<{ data: ApiProviderKyc }>("/v1/provider/kyc", {
    method: "PATCH",
    auth: true,
    body: body as Record<string, unknown>,
  })
  return res.data
}

// —— PRV-10 subscription ——
export type ApiProviderSubscription = {
  serviceProviderId: string
  businessName: string
  tier: ProviderPortalTier
  usage: {
    activeJobs: number
    completedJobs: number
    leadCount: number
    reviewCount: number
  }
  limits: {
    analyticsDepth: "basic" | "full"
    whatsappBridge: boolean
    contentStudio: boolean
  }
  paystackConfigured: boolean
}

export async function fetchProviderSubscription() {
  const res = await apiFetch<{ data: ApiProviderSubscription }>("/v1/provider/subscription", {
    auth: true,
  })
  return res.data
}

export async function postProviderSubscriptionCheckout(tier: "pro" | "elite") {
  const res = await apiFetch<{
    data: {
      mode: string
      tier: string
      authorizationUrl?: string
      subscription?: ApiProviderSubscription
      disclaimer: string
    }
  }>("/v1/provider/subscription/checkout", {
    method: "POST",
    auth: true,
    body: { tier },
  })
  return res.data
}

// —— PRV-11 settings ——
export type ApiProviderSettings = {
  userId: string
  email: string
  businessName: string
  notifyEmail: boolean
  notifySms: boolean
  notifyPush: boolean
  preferences: {
    serviceProvider?: {
      autoAcknowledgeLeads?: boolean
      preferredSources?: string[]
      defaultQuoteNote?: string | null
    }
  } | null
}

export async function fetchProviderSettings() {
  const res = await apiFetch<{ data: ApiProviderSettings }>("/v1/provider/settings", { auth: true })
  return res.data
}

export async function patchProviderSettings(body: Partial<{
  notifyEmail: boolean
  notifySms: boolean
  notifyPush: boolean
  preferences: ApiProviderSettings["preferences"]
}>) {
  const res = await apiFetch<{ data: ApiProviderSettings }>("/v1/provider/settings", {
    method: "PATCH",
    auth: true,
    body: body as Record<string, unknown>,
  })
  return res.data
}

// —— PRV-05 WhatsApp ——
export type ApiProviderWhatsapp = {
  connected: boolean
  phoneNumber: string | null
  evolutionEnabled: boolean
  monitoredGroups: string[]
  extractedLeadsCount: number
  status: "connected" | "disconnected" | "error" | null
  lastActiveAt: string | null
}

export async function fetchProviderWhatsapp() {
  const res = await apiFetch<{ data: ApiProviderWhatsapp }>("/v1/provider/whatsapp", { auth: true })
  return res.data
}

export async function patchProviderWhatsapp(body: { connected?: boolean; phoneNumber?: string | null }) {
  const res = await apiFetch<{ data: ApiProviderWhatsapp }>("/v1/provider/whatsapp", {
    method: "PATCH",
    auth: true,
    body: body as Record<string, unknown>,
  })
  return res.data
}
