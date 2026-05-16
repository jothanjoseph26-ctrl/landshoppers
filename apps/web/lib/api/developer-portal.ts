import { apiFetch } from "./client"
import type { ApiListResponse } from "./types"

/** GET /v1/me/developer/projects row — mirrors `developerProjectToJson` in API. */
export type ApiDeveloperProject = {
  id: string
  developerId: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  status: string
  propertyType: string
  address: string | null
  city: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
  priceRangeMin: string | null
  priceRangeMax: string | null
  totalUnits: number
  availableUnits: number
  soldUnits: number
  amenities: string[]
  features: string[]
  images: string[]
  floorPlans: string[]
  brochureUrl: string | null
  virtualTourUrl: string | null
  completionDate: string | null
  launchDate: string | null
  isFeatured: boolean
  viewCount: number
  inquiryCount: number
  createdAt: string
  updatedAt: string
}

export type ApiDeveloperDashboard = {
  developerId: string
  companyName: string
  userEmail: string
  displayName: string | null
  projectCount: number
  totalUnitsSold: number
  inquiries: { total: number; byStatus: Record<string, number> }
  recentProjects: ApiDeveloperProject[]
}

export type CreateDeveloperProjectBody = {
  name: string
  propertyType: string
  city: string
  state: string
  country?: string
  address?: string
  description?: string
  shortDescription?: string
  latitude?: number
  longitude?: number
  totalUnits?: number
  priceRangeMinKobo?: string
  priceRangeMaxKobo?: string
  status?: string
}

export async function fetchDeveloperDashboard() {
  return apiFetch<{ data: ApiDeveloperDashboard }>("/v1/me/developer/dashboard", {
    auth: true,
  })
}

/** GET /v1/me/developer/inquiries row (inquiry JSON + optional project summary). */
export type ApiDeveloperInquiryRow = {
  id: string
  listingId: string | null
  projectId: string | null
  buyerId: string
  agentId: string | null
  source: string
  status: string
  message: string | null
  buyerName: string | null
  buyerEmail: string | null
  buyerPhone: string | null
  respondedAt: string | null
  closedAt: string | null
  closedReason: string | null
  createdAt: string
  updatedAt: string
  project: { id: string; name: string; slug: string } | null
}

export async function fetchDeveloperInquiries(params: {
  page?: number
  pageSize?: number
  status?: string
}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  if (params.status) sp.set("status", params.status)
  const q = sp.toString()
  return apiFetch<ApiListResponse<ApiDeveloperInquiryRow[]>>(
    `/v1/me/developer/inquiries${q ? `?${q}` : ""}`,
    { auth: true },
  )
}

export async function fetchDeveloperProjects(params: {
  page?: number
  pageSize?: number
  status?: string
}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  if (params.status) sp.set("status", params.status)
  const q = sp.toString()
  return apiFetch<ApiListResponse<ApiDeveloperProject[]>>(
    `/v1/me/developer/projects${q ? `?${q}` : ""}`,
    { auth: true },
  )
}

export async function fetchDeveloperProject(id: string) {
  return apiFetch<{ data: ApiDeveloperProject }>(`/v1/me/developer/projects/${id}`, {
    auth: true,
  })
}

export async function createDeveloperProject(body: CreateDeveloperProjectBody) {
  return apiFetch<{ data: ApiDeveloperProject }>("/v1/me/developer/projects", {
    method: "POST",
    auth: true,
    body: body as Record<string, unknown>,
  })
}

export type ApiDeveloperLeadsDigest = {
  period: string
  since: string
  generatedAt: string
  totals: { inquiriesInPeriod: number; byStatus: Record<string, number> }
  byProject: Array<{ projectId: string; projectName: string; slug: string; count: number }>
  hotLeads: Array<{
    inquiryId: string
    score: number
    reason: string
    summary: string
    projectName: string | null
    status: string
    createdAt: string
  }>
}

export async function fetchDeveloperLeadsDigest(period: "week" | "month" | "all" = "week") {
  const sp = new URLSearchParams({ period })
  return apiFetch<{ data: ApiDeveloperLeadsDigest }>(
    `/v1/me/developer/leads/digest?${sp.toString()}`,
    { auth: true },
  )
}

export type ApiLeadsDigestEmailResult = {
  emailed: boolean
  mode: "resend" | "log_only"
  providerId?: string
  period: string
  totals: { inquiriesInPeriod: number; byStatus: Record<string, number> }
}

export async function postDeveloperLeadsDigestEmail(period: "week" | "month" | "all") {
  return apiFetch<{ data: ApiLeadsDigestEmailResult }>("/v1/me/developer/leads/digest/email", {
    method: "POST",
    auth: true,
    body: { period },
  })
}

export type ApiPitchDraftResponse = {
  inquiryId: string
  projectId: string | null
  status: "pending_review"
  confidence: number
  model: string
  disclaimer: string
  draft: { subject: string; body: string }
}

export async function requestInquiryPitchDraft(inquiryId: string) {
  return apiFetch<{ data: ApiPitchDraftResponse }>(
    `/v1/me/developer/inquiries/${inquiryId}/pitch-draft`,
    { method: "POST", auth: true },
  )
}

export type ApiDeveloperBulkUpload = {
  id: string
  projectId: string
  filename: string
  status: string
  errorMessage: string | null
  headers: unknown
  columnMap: unknown
  commitMode: string | null
  committedAt: string | null
  createdAt: string
  updatedAt: string
  stats?: { rowCount: number; validCount: number; invalidCount: number }
}

export type ApiDeveloperBulkUploadRow = {
  rowIndex: number
  payload: Record<string, unknown>
  errors: string[]
  warnings: string[]
}

export async function fetchDeveloperBulkUploads(params?: { page?: number; pageSize?: number }) {
  const sp = new URLSearchParams()
  if (params?.page) sp.set("page", String(params.page))
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize))
  const q = sp.toString()
  return apiFetch<ApiListResponse<ApiDeveloperBulkUpload[]>>(
    `/v1/me/developer/bulk-uploads${q ? `?${q}` : ""}`,
    { auth: true },
  )
}

export async function createDeveloperBulkUpload(body: {
  projectId: string
  filename?: string
  csvText: string
}) {
  return apiFetch<{ data: ApiDeveloperBulkUpload }>("/v1/me/developer/bulk-uploads", {
    method: "POST",
    auth: true,
    body: body as Record<string, unknown>,
  })
}

export async function fetchDeveloperBulkUpload(id: string) {
  return apiFetch<{ data: ApiDeveloperBulkUpload }>(`/v1/me/developer/bulk-uploads/${id}`, {
    auth: true,
  })
}

export async function fetchDeveloperBulkUploadRows(id: string, params?: { page?: number; pageSize?: number }) {
  const sp = new URLSearchParams()
  if (params?.page) sp.set("page", String(params.page))
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize))
  const q = sp.toString()
  return apiFetch<ApiListResponse<ApiDeveloperBulkUploadRow[]>>(
    `/v1/me/developer/bulk-uploads/${id}/rows${q ? `?${q}` : ""}`,
    { auth: true },
  )
}

export async function patchDeveloperBulkUploadMapping(
  id: string,
  columnMap: Record<string, string | null | undefined>,
) {
  return apiFetch<{ data: ApiDeveloperBulkUpload }>(`/v1/me/developer/bulk-uploads/${id}/mapping`, {
    method: "PATCH",
    auth: true,
    body: { columnMap } as Record<string, unknown>,
  })
}

export async function commitDeveloperBulkUpload(id: string, mode: "draft" | "publish") {
  return apiFetch<{
    data: ApiDeveloperBulkUpload & {
      insertedUnits?: number
      counters?: { totalAdded: number; availableAdded: number; soldAdded: number; reservedAdded: number }
    }
  }>(`/v1/me/developer/bulk-uploads/${id}/commit`, {
    method: "POST",
    auth: true,
    body: { mode },
  })
}

export type DeveloperAnalyticsPeriod = "week" | "month" | "quarter" | "all"

export type ApiDeveloperAnalyticsSummary = {
  period: DeveloperAnalyticsPeriod
  since: string
  generatedAt: string
  currency: "NGN"
  kpis: {
    projectCount: number
    totalUnits: number
    availableUnits: number
    soldUnits: number
    inquiriesInPeriod: number
    revenueNgN: null
    conversionRate: null
  }
  inquiriesByDay: Array<{ date: string; count: number }>
  inquiriesByStatus: Record<string, number>
  byProject: Array<{ projectId: string; projectName: string; slug: string; inquiryCount: number }>
  insights: string[]
}

export async function fetchDeveloperAnalyticsSummary(params: {
  period: DeveloperAnalyticsPeriod
  projectIds?: string[]
}) {
  const sp = new URLSearchParams({ period: params.period })
  for (const id of params.projectIds ?? []) {
    sp.append("projectIds", id)
  }
  return apiFetch<{ data: ApiDeveloperAnalyticsSummary }>(
    `/v1/me/developer/analytics/summary?${sp.toString()}`,
    { auth: true },
  )
}

export type DeveloperKycDocumentType =
  | "c_of_o"
  | "survey"
  | "governor_consent"
  | "cac"
  | "tax_clearance"
  | "other"

export type DeveloperKycDocumentStatus = "pending" | "verified" | "rejected" | "expired"

export type ApiDeveloperKycDocument = {
  id: string
  developerId: string
  projectId: string | null
  documentType: DeveloperKycDocumentType
  status: DeveloperKycDocumentStatus
  title: string | null
  fileName: string
  mimeType: string
  byteSize: number
  storageKey: string | null
  externalUrl: string
  rejectionReason: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  project?: { id: string; name: string; slug: string } | null
}

export type ApiDeveloperKycDocumentsMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  countsByStatus: Record<string, number>
}

export async function fetchDeveloperKycDocuments(params?: {
  page?: number
  pageSize?: number
  projectId?: string
  status?: DeveloperKycDocumentStatus
}) {
  const sp = new URLSearchParams()
  if (params?.page) sp.set("page", String(params.page))
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize))
  if (params?.projectId) sp.set("projectId", params.projectId)
  if (params?.status) sp.set("status", params.status)
  const q = sp.toString()
  return apiFetch<{ data: ApiDeveloperKycDocument[]; meta: ApiDeveloperKycDocumentsMeta }>(
    `/v1/me/developer/kyc/documents${q ? `?${q}` : ""}`,
    { auth: true },
  )
}

export async function createDeveloperKycDocument(body: {
  documentType: DeveloperKycDocumentType
  projectId?: string
  title?: string
  expiresAt?: string | null
  fileName: string
  mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp"
  byteSize?: number
  externalUrl: string
}) {
  return apiFetch<{ data: ApiDeveloperKycDocument & { previewUrl: string } }>(
    "/v1/me/developer/kyc/documents",
    {
      method: "POST",
      auth: true,
      body: body as Record<string, unknown>,
    },
  )
}

export async function fetchDeveloperKycDocument(id: string) {
  return apiFetch<{ data: ApiDeveloperKycDocument & { previewUrl: string } }>(
    `/v1/me/developer/kyc/documents/${id}`,
    { auth: true },
  )
}

export async function patchDeveloperKycDocument(
  id: string,
  body: { title?: string | null; expiresAt?: string | null; externalUrl?: string },
) {
  return apiFetch<{ data: ApiDeveloperKycDocument & { previewUrl: string } }>(
    `/v1/me/developer/kyc/documents/${id}`,
    {
      method: "PATCH",
      auth: true,
      body: body as Record<string, unknown>,
    },
  )
}

export type DeveloperTeamRole = "admin" | "sales" | "marketing" | "viewer"

export type ApiTeamMember = {
  userId: string
  email: string
  displayName: string
  role: string
  status: "active" | "disabled"
  isOwner: boolean
  projectIds: string[]
  lastActiveAt: string | null
}

export type ApiTeamInvite = {
  id: string
  email: string
  role: DeveloperTeamRole
  projectIds: string[]
  expiresAt: string
  createdAt: string
}

export type ApiTeamActivityRow = {
  id: string
  action: string
  actorEmail: string | null
  createdAt: string
  metadata: unknown
}

function portalHeaders(portalDeveloperId?: string) {
  const headers = new Headers()
  if (portalDeveloperId) headers.set("X-Portal-Developer-Id", portalDeveloperId)
  return headers
}

export async function fetchDeveloperTeamMembers(opts?: { portalDeveloperId?: string }) {
  return apiFetch<{ data: ApiTeamMember[]; meta: { portalAdmin: boolean; developerId: string } }>(
    "/v1/me/developer/team/members",
    { auth: true, headers: portalHeaders(opts?.portalDeveloperId) },
  )
}

export async function fetchDeveloperTeamInvites(opts?: { portalDeveloperId?: string }) {
  return apiFetch<{ data: ApiTeamInvite[]; meta: { portalAdmin: boolean; developerId: string } }>(
    "/v1/me/developer/team/invites",
    { auth: true, headers: portalHeaders(opts?.portalDeveloperId) },
  )
}

export async function fetchDeveloperTeamActivity(
  params: { page?: number; pageSize?: number },
  opts?: { portalDeveloperId?: string },
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  const q = sp.toString()
  return apiFetch<{
    data: ApiTeamActivityRow[]
    meta: {
      page: number
      pageSize: number
      total: number
      totalPages: number
      portalAdmin: boolean
      developerId: string
    }
  }>(`/v1/me/developer/team/activity${q ? `?${q}` : ""}`, {
    auth: true,
    headers: portalHeaders(opts?.portalDeveloperId),
  })
}

export async function createDeveloperTeamInvite(
  body: { email: string; role: DeveloperTeamRole; projectIds?: string[] },
  opts?: { portalDeveloperId?: string },
) {
  return apiFetch<{
    data: ApiTeamInvite & { acceptToken: string; acceptPath: string }
  }>("/v1/me/developer/team/invites", {
    method: "POST",
    auth: true,
    headers: portalHeaders(opts?.portalDeveloperId),
    body: body as Record<string, unknown>,
  })
}

export async function revokeDeveloperTeamInvite(
  id: string,
  opts?: { portalDeveloperId?: string },
) {
  return apiFetch<{ data: { id: string; revokedAt: string } }>(`/v1/me/developer/team/invites/${id}`, {
    method: "DELETE",
    auth: true,
    headers: portalHeaders(opts?.portalDeveloperId),
  })
}

export async function patchDeveloperTeamMember(
  userId: string,
  body: { role?: DeveloperTeamRole; isDisabled?: boolean },
  opts?: { portalDeveloperId?: string },
) {
  return apiFetch<{
    data: { userId: string; role: string; isDisabled: boolean; projectIds: string[]; updatedAt: string }
  }>(`/v1/me/developer/team/members/${userId}`, {
    method: "PATCH",
    auth: true,
    headers: portalHeaders(opts?.portalDeveloperId),
    body: body as Record<string, unknown>,
  })
}

export type DeveloperSubscriptionPlan = "developer_basic" | "developer_pro"

export type ApiDeveloperSubscriptionSummary = {
  developerId: string
  companyName: string
  subscription: {
    plan: DeveloperSubscriptionPlan | null
    status: string | null
    renewsAt: string | null
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelledAt: string | null
    paystackCustomerId: string | null
  }
  usage: {
    projectCount: number
    listedUnits: number
    inquiriesThisMonth: number
    aiCreditsRemaining: number | null
  }
  limits: {
    maxActiveProjects: number | null
    maxMonthlyLeads: number | null
  }
  paystackConfigured: boolean
}

export type ApiDeveloperSubscriptionInvoice = {
  id: string
  amountKobo: string
  currency: string
  status: string
  paidAt: string | null
  createdAt: string
}

export async function fetchDeveloperSubscription() {
  return apiFetch<{ data: ApiDeveloperSubscriptionSummary }>("/v1/me/developer/subscription", { auth: true })
}

export async function fetchDeveloperSubscriptionInvoices(params?: { page?: number; pageSize?: number }) {
  const sp = new URLSearchParams()
  if (params?.page) sp.set("page", String(params.page))
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize))
  const q = sp.toString()
  return apiFetch<{
    data: ApiDeveloperSubscriptionInvoice[]
    meta: { page: number; pageSize: number; total: number; totalPages: number; paystackConfigured: boolean }
  }>(`/v1/me/developer/subscription/invoices${q ? `?${q}` : ""}`, { auth: true })
}

export async function postDeveloperSubscriptionCheckout(plan: DeveloperSubscriptionPlan) {
  return apiFetch<{
    data: {
      mode: "stub"
      plan: DeveloperSubscriptionPlan
      reference: string
      authorizationUrl: string
      disclaimer: string
    }
  }>("/v1/me/developer/subscription/checkout", {
    method: "POST",
    auth: true,
    body: { plan },
  })
}

export type ApiDeveloperSettings = {
  developerId: string
  userId: string
  email: string
  companyName: string
  rcNumber: string | null
  companyAddress: string | null
  companyCity: string | null
  companyState: string | null
  companyPhone: string | null
  companyEmail: string | null
  companyWebsite: string | null
  description: string | null
  isVerified: boolean
  kycStatus: string
  createdAt: string
  updatedAt: string
}

export type PatchDeveloperSettingsBody = {
  companyName?: string
  rcNumber?: string | null
  companyAddress?: string | null
  companyCity?: string | null
  companyState?: string | null
  companyPhone?: string | null
  companyEmail?: string | null
  companyWebsite?: string | null | ""
  description?: string | null
}

export async function fetchDeveloperSettings() {
  return apiFetch<{ data: ApiDeveloperSettings }>("/v1/me/developer/settings", { auth: true })
}

export async function patchDeveloperSettings(body: PatchDeveloperSettingsBody) {
  return apiFetch<{ data: ApiDeveloperSettings }>("/v1/me/developer/settings", {
    method: "PATCH",
    auth: true,
    body: body as Record<string, unknown>,
  })
}
