import { apiFetch } from "./client"
import { getPublicApiBaseUrl } from "./config"
import { getAccessToken } from "./auth-session"
import type { ApiListResponse } from "./types"

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&")
}

export type ApiAdminUser = {
  id: string
  email: string
  role: string
  isEmailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
  profile: { firstName: string | null; lastName: string | null; city: string | null } | null
  flags: { suspended: boolean }
}

export async function fetchAdminUsers(params: {
  page?: number
  pageSize?: number
  role?: string
  q?: string
  status?: "active" | "suspended"
} = {}) {
  return apiFetch<ApiListResponse<ApiAdminUser[]>>(
    `/v1/admin/users${qs({
      page: params.page,
      pageSize: params.pageSize,
      role: params.role,
      q: params.q,
      status: params.status,
    })}`,
    { auth: true },
  )
}

export async function patchAdminUser(
  id: string,
  body: { suspended?: boolean; role?: string },
) {
  return apiFetch<{ data: ApiAdminUser }>(`/v1/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    auth: true,
    body,
  })
}

export type ApiAdminPayment = {
  id: string
  agentId: string | null
  agentAgencyName: string | null
  type: string
  status: string
  amount: string
  currency: string
  reference: string
  paidAt: string | null
  createdAt: string
}

export type ApiAdminPaymentsSummary = {
  period: string
  since: string
  gmvNgKobo: string
  paymentCount: number
  byStatus: Record<string, number>
  activeSubscriptions: number
  subscriptionMrrEstimateNgKobo: string | null
}

export async function fetchAdminPayments(params: {
  page?: number
  pageSize?: number
  status?: string
  type?: string
} = {}) {
  return apiFetch<ApiListResponse<ApiAdminPayment[]>>(
    `/v1/admin/payments${qs({
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
      type: params.type,
    })}`,
    { auth: true },
  )
}

export async function fetchAdminPaymentsSummary(period: "week" | "month" | "quarter" | "all" = "month") {
  return apiFetch<{ data: ApiAdminPaymentsSummary }>(
    `/v1/admin/payments/summary${qs({ period })}`,
    { auth: true },
  )
}

export type ApiAdminAnalyticsSummary = {
  period: string
  since: string
  kpis: {
    totalUsers: number
    activeUsersProxy: number
    totalListings: number
    activeListings: number
    inquiriesInPeriod: number
    pendingKycCount: number
  }
  trends: {
    newUsersByDay: Array<{ date: string; count: number }>
    newListingsByDay: Array<{ date: string; count: number }>
  }
}

export async function fetchAdminAnalyticsSummary(period: "week" | "month" | "quarter" | "all" = "month") {
  return apiFetch<{ data: ApiAdminAnalyticsSummary }>(
    `/v1/admin/analytics/summary${qs({ period })}`,
    { auth: true },
  )
}

export type AdminReportKind = "listings" | "users" | "payments"

export async function downloadAdminReport(kind: AdminReportKind): Promise<void> {
  const token = getAccessToken()
  const url = `${getPublicApiBaseUrl()}/v1/admin/reports/${kind}?format=csv`
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`Export failed (${res.status})`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = objectUrl
  a.download = `landshoppers-${kind}.csv`
  a.click()
  URL.revokeObjectURL(objectUrl)
}

/* ============== Automation: WhatsApp ============== */

export type AdminWhatsappSummary = {
  pending: number
  processed: number
  approvedToday: number
}

export type AdminWhatsappReview = {
  id: string
  messageId: string
  status: string
  senderPhone: string
  senderName: string | null
  messageType: string
  textContent: string | null
  mediaUrls: string[]
  extractedData: unknown
  confidenceScore: number | null
  extractionError: string | null
  processedAt: string | null
  createdListingId: string | null
  receivedAt: string
}

export async function fetchAdminWhatsappSummary(): Promise<AdminWhatsappSummary> {
  const res = await apiFetch<{ data: AdminWhatsappSummary }>("/v1/admin/whatsapp/summary", {
    auth: true,
  })
  return res.data
}

export async function fetchAdminWhatsappReviews(
  params: { page?: number; pageSize?: number; status?: string } = {},
): Promise<ApiListResponse<AdminWhatsappReview[]>> {
  return apiFetch<ApiListResponse<AdminWhatsappReview[]>>(
    `/v1/admin/whatsapp/reviews${qs({
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    })}`,
    { auth: true },
  )
}

export async function approveAdminWhatsappReview(
  id: string,
): Promise<{ listing: { id: string; status: string }; whatsappMessageId: string }> {
  const res = await apiFetch<{
    data: { listing: { id: string; status: string }; whatsappMessageId: string }
  }>(`/v1/admin/whatsapp/reviews/${id}/approve`, { method: "POST", auth: true })
  return res.data
}

export async function rejectAdminWhatsappReview(id: string, reason: string): Promise<{ id: string; status: string }> {
  const res = await apiFetch<{ data: { id: string; status: string } }>(
    `/v1/admin/whatsapp/reviews/${id}/reject`,
    { method: "POST", auth: true, body: { reason } },
  )
  return res.data
}

/* ============== Automation: SEO ============== */

export type AdminSeoSummary = {
  draft: number
  approved: number
  pendingPost: number
}

export type AdminSeoVariant = {
  id: string
  listingId: string
  variantType: string
  seoTitle: string | null
  metaDescription: string | null
  hashtags: string[]
  status: string
  approvedAt: string | null
  createdAt: string
}

export async function fetchAdminSeoSummary(): Promise<AdminSeoSummary> {
  const res = await apiFetch<{ data: AdminSeoSummary }>("/v1/admin/seo/summary", { auth: true })
  return res.data
}

export async function fetchAdminSeoVariants(
  params: { page?: number; pageSize?: number; status?: string } = {},
): Promise<ApiListResponse<AdminSeoVariant[]>> {
  return apiFetch<ApiListResponse<AdminSeoVariant[]>>(
    `/v1/admin/seo/variants${qs({
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    })}`,
    { auth: true },
  )
}

export async function approveAdminSeoVariant(id: string): Promise<AdminSeoVariant> {
  const res = await apiFetch<{ data: AdminSeoVariant }>(`/v1/admin/seo/variants/${id}/approve`, {
    method: "POST",
    auth: true,
  })
  return res.data
}

export async function rejectAdminSeoVariant(id: string, reason: string): Promise<AdminSeoVariant> {
  const res = await apiFetch<{ data: AdminSeoVariant }>(`/v1/admin/seo/variants/${id}/reject`, {
    method: "POST",
    auth: true,
    body: { reason },
  })
  return res.data
}

/* ============== Automation: audit logs ============== */

export type AdminAuditLog = {
  id: string
  action: string
  actorEmail: string | null
  actorRole: string | null
  targetType: string | null
  targetId: string | null
  createdAt: string
  changesPreview: string | null
}

export async function fetchAdminAuditLogs(
  params: {
    page?: number
    pageSize?: number
    action?: string
    actorId?: string
    from?: string
    to?: string
  } = {},
): Promise<ApiListResponse<AdminAuditLog[]>> {
  return apiFetch<ApiListResponse<AdminAuditLog[]>>(
    `/v1/admin/audit-logs${qs({
      page: params.page,
      pageSize: params.pageSize,
      action: params.action,
      actorId: params.actorId,
      from: params.from,
      to: params.to,
    })}`,
    { auth: true },
  )
}

/* ============== Automation: platform settings ============== */

export type AdminPlatformSettings = {
  maintenanceMode: boolean
  whatsappAutoApproveMinScore: number | null
  paystackConfigured: boolean
  resendConfigured: boolean
  whatsappDefaultListingUserId: string | null
  featureFlags: {
    agentWhatsappEnabled: boolean
    agentAiInsightsEnabled: boolean
    providerWhatsappEnabled: boolean
  }
  patchSupported: boolean
  updatedAt: string
  updatedBy: string | null
}

export async function fetchAdminSettings(): Promise<AdminPlatformSettings> {
  const res = await apiFetch<{ data: AdminPlatformSettings }>("/v1/admin/settings", { auth: true })
  return res.data
}

export async function patchAdminSettings(body: {
  maintenanceMode?: boolean
  whatsappAutoApproveMinScore?: number | null
}): Promise<AdminPlatformSettings> {
  const res = await apiFetch<{ data: AdminPlatformSettings }>("/v1/admin/settings", {
    method: "PATCH",
    auth: true,
    body,
  })
  return res.data
}

/* ============== ServiceHub admin (ADM-08) ============== */

export type AdminServiceProvider = {
  id: string
  businessName: string
  slug: string
  category: string
  city: string
  state: string
  isVerified: boolean
  verificationLevel: string
  subscriptionTier: string
  rating: number
  reviewCount: number
}

export async function fetchAdminServiceProviders(params: {
  page?: number
  pageSize?: number
  category?: string
  city?: string
  tier?: string
  verification?: string
} = {}) {
  return apiFetch<ApiListResponse<AdminServiceProvider[]>>(
    `/v1/admin/services/providers${qs({
      page: params.page,
      pageSize: params.pageSize,
      category: params.category,
      city: params.city,
      tier: params.tier,
      verification: params.verification,
    })}`,
    { auth: true },
  )
}

export async function patchAdminServiceProvider(
  id: string,
  body: { isVerified?: boolean; verificationLevel?: string },
) {
  return apiFetch<{ data: AdminServiceProvider }>(
    `/v1/admin/services/providers/${encodeURIComponent(id)}`,
    { method: "PATCH", auth: true, body },
  )
}
