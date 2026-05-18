import { apiFetch } from "./client"
import type { ApiListResponse } from "./types"

export type AgentPortalTier = "free" | "pro" | "elite"

type PageParams = { page?: number; pageSize?: number }

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&")
}

export type AgentPortalContext = {
  persona: "agent" | "developer"
  userId: string
  email: string
  displayName: string | null
  agencyName: string | null
  city: string | null
  state: string | null
  avatarUrl: string | null
  tier: AgentPortalTier
  subscriptionPlan: string | null
  subscriptionStatus: string | null
  rating: number | null
  reviewCount: number | null
  verification: {
    emailVerified: boolean
    phoneVerified: boolean
    bvnOnFile: boolean
    agentVerifiedBadge: boolean
    kycStatus: string
  }
  paystackConfigured: boolean
  featureFlags: {
    agentWhatsappEnabled: boolean
    agentAiInsightsEnabled: boolean
  }
}

export type AgentPortalKpiTrend = {
  value: number
  priorValue: number | null
  changePercent: number | null
}

export type AgentPortalDashboard = {
  tier: AgentPortalTier
  limits: {
    maxActiveListings: number | null
    maxLeadsPerMonth: number | null
    maxAiDescriptionGenerationsPerDay: number | null
    maxWhatsappConnections: number | null
  }
  usage: {
    activeListings: number
    inquiriesThisMonth: number
  }
  kpis: {
    activeListings: AgentPortalKpiTrend
    hotLeads: { count: number; leadScoringAvailable: boolean }
    whatsappMessagesToday: { count: number; bridgeConnected: boolean }
    viewsThisWeek: AgentPortalKpiTrend
    conversionLast30d: {
      responded: number
      total: number
      ratePercent: number | null
    }
    estimatedMonthlyEarningsNgKobo: string | null
    earningsAvailable: boolean
  }
  upcomingTours: Array<{
    id: string
    listingId: string
    propertyTitle: string
    buyerLabel: string
    preferredDate: string
    preferredTime: string | null
    tourType: string
    status: string
  }>
}

export async function fetchAgentContext(): Promise<AgentPortalContext> {
  const res = await apiFetch<{ data: AgentPortalContext }>("/v1/agent/context", { auth: true })
  return res.data
}

export async function fetchAgentDashboard(): Promise<AgentPortalDashboard> {
  const res = await apiFetch<{ data: AgentPortalDashboard }>("/v1/agent/dashboard", { auth: true })
  return res.data
}

export type AgentInsightItem = {
  id: string
  kind: "leads" | "growth" | "verification" | "subscription" | "conversion"
  title: string
  body: string
  severity: "info" | "warning" | "success"
  ctaLabel: string | null
  ctaHref: string | null
  dismissKey: string
  generatedAt: string
}

export type AgentInsightsResponse = {
  data: { items: AgentInsightItem[] }
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export async function fetchAgentInsights(params: PageParams = {}): Promise<AgentInsightsResponse> {
  return apiFetch<AgentInsightsResponse>(
    `/v1/agent/insights${qs({ page: params.page, pageSize: params.pageSize })}`,
    { auth: true },
  )
}

export type AgentMessageThreadSummary = {
  threadId: string
  peerUserId: string
  peerEmail: string | null
  peerDisplayName: string | null
  lastMessageAt: string
  lastPreview: string
  unreadCount: number
}

export type AgentPortalMessage = {
  id: string
  threadId: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export async function fetchAgentMessageThreads(
  params: PageParams = {},
): Promise<ApiListResponse<AgentMessageThreadSummary[]>> {
  return apiFetch<ApiListResponse<AgentMessageThreadSummary[]>>(
    `/v1/agent/messages/threads${qs({ page: params.page, pageSize: params.pageSize })}`,
    { auth: true },
  )
}

export async function fetchAgentThreadMessages(
  threadId: string,
  params: PageParams = {},
): Promise<ApiListResponse<AgentPortalMessage[]>> {
  return apiFetch<ApiListResponse<AgentPortalMessage[]>>(
    `/v1/agent/messages/threads/${encodeURIComponent(threadId)}${qs({
      page: params.page,
      pageSize: params.pageSize,
    })}`,
    { auth: true },
  )
}

export async function sendAgentPortalMessage(body: {
  threadId?: string
  receiverId: string
  content: string
}): Promise<{ message: AgentPortalMessage }> {
  const res = await apiFetch<{ data: { message: AgentPortalMessage } }>("/v1/agent/messages", {
    method: "POST",
    auth: true,
    body,
  })
  return res.data
}

export type AgentAnalyticsPeriod = "week" | "month" | "quarter" | "all"

export type ApiAgentAnalyticsSummary = {
  period: string
  tier: AgentPortalTier
  analyticsDepth: "basic" | "full"
  kpis: {
    views: {
      byDay: Array<{ date: string; count: number }>
      total: number
      changePercent: number | null
    }
    inquiries: {
      byDay: Array<{ date: string; count: number }>
      byStatus: Record<string, number>
      total: number
    }
    conversionRatePercent: number | null
    topListings: Array<{ listingId: string; title: string; views: number; inquiries: number }>
  }
}

export async function fetchAgentAnalyticsSummary(period: AgentAnalyticsPeriod = "month") {
  return apiFetch<{ data: ApiAgentAnalyticsSummary }>(
    `/v1/agent/analytics/summary${qs({ period })}`,
    { auth: true },
  )
}

export type ApiAgentSubscription = {
  persona: "agent" | "developer"
  agentId: string | null
  agencyName: string | null
  tier: AgentPortalTier
  subscription: {
    plan: string | null
    status: string | null
    renewsAt: string | null
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelledAt: string | null
    paystackCustomerId: string | null
  }
  usage: { activeListings: number; inquiriesThisMonth: number }
  limits: {
    maxActiveListings: number | null
    maxLeadsPerMonth: number | null
    maxAiDescriptionGenerationsPerDay: number | null
    maxWhatsappConnections: number | null
  }
  paystackConfigured: boolean
}

export type AgentSubscriptionPlan = "agent_basic" | "agent_pro"

export async function fetchAgentSubscription() {
  return apiFetch<{ data: ApiAgentSubscription }>("/v1/agent/subscription", { auth: true })
}

export async function fetchAgentSubscriptionInvoices(params: PageParams = {}) {
  return apiFetch<ApiListResponse<
    Array<{
      id: string
      type: string
      status: string
      amount: string
      currency: string
      reference: string
      paidAt: string | null
      createdAt: string
    }>
  >>(`/v1/agent/subscription/invoices${qs({ page: params.page, pageSize: params.pageSize })}`, {
    auth: true,
  })
}

export async function postAgentSubscriptionCheckout(plan: AgentSubscriptionPlan) {
  return apiFetch<{
    data: {
      mode: "stub"
      plan: string
      reference: string
      authorizationUrl: string
      disclaimer: string
    }
  }>("/v1/agent/subscription/checkout", { method: "POST", auth: true, body: { plan } })
}

export type ApiAgentSettings = {
  email: string
  persona: "agent" | "developer"
  agency: { agencyName: string | null; licenseNumber: string | null }
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
}

export type PatchAgentSettingsBody = {
  agencyName?: string | null
  licenseNumber?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  avatarUrl?: string | null
  notifyEmail?: boolean
  notifySms?: boolean
  notifyPush?: boolean
}

export async function fetchAgentSettings() {
  return apiFetch<{ data: ApiAgentSettings }>("/v1/agent/settings", { auth: true })
}

export async function patchAgentSettings(body: PatchAgentSettingsBody) {
  return apiFetch<{ data: ApiAgentSettings }>("/v1/agent/settings", {
    method: "PATCH",
    auth: true,
    body,
  })
}

export type AgentContentKind = "description" | "captions" | "media_brief"

export type ApiAgentContentCaption = {
  id: string
  platform: string
  text: string
}

export type ApiAgentContentGenerateResult = {
  description: string | null
  captions: ApiAgentContentCaption[]
  mediaBrief: string | null
  disclaimer: string
}

export type ApiAgentCommissions = {
  summary: {
    commissionEarnedKobo: string
    walletBalanceKobo: string
    pendingPayoutKobo: string
    paidOutKobo: string
    earningsAvailable: boolean
    estimatedMonthlyNgKobo: string | null
    tier: AgentPortalTier
  }
  transactions: Array<{
    id: string
    type: string
    status: string
    amountKobo: string
    currency: string
    reference: string
    paidAt: string | null
    createdAt: string
  }>
  closedDeals: Array<{
    id: string
    listingTitle: string
    closedAt: string
    estimatedCommissionKobo: string
    payoutStatus: "accrued" | "paid"
  }>
  disclaimer: string
}

export type ApiAgentKycDocument = {
  type: string
  label?: string
  externalUrl: string
  uploadedAt?: string
}

export type ApiAgentKyc = {
  agentId: string
  agencyName: string | null
  email: string
  licenseNumber: string | null
  kycStatus: string
  kycSubmittedAt: string | null
  kycVerifiedAt: string | null
  kycRejectionReason: string | null
  isVerified: boolean
  verificationBadge: boolean
  bvnOnFile: boolean
  ninOnFile: boolean
  kycDocuments: ApiAgentKycDocument[] | null
  checklist: Array<{ id: string; label: string; complete: boolean }>
}

export async function fetchAgentKyc() {
  const res = await apiFetch<{ data: ApiAgentKyc }>("/v1/agent/kyc", { auth: true })
  return res.data
}

export async function patchAgentKyc(body: {
  licenseNumber?: string | null
  kycDocuments?: ApiAgentKycDocument[]
  submitForReview?: boolean
}) {
  const res = await apiFetch<{ data: ApiAgentKyc }>("/v1/agent/kyc", {
    method: "PATCH",
    auth: true,
    body,
  })
  return res.data
}

export async function fetchAgentCommissions() {
  const res = await apiFetch<{ data: ApiAgentCommissions }>("/v1/agent/commissions", { auth: true })
  return res.data
}

export async function postAgentContentGenerate(body: {
  listingId?: string
  kind?: AgentContentKind
  tone?: "professional" | "friendly"
}) {
  const res = await apiFetch<{ data: ApiAgentContentGenerateResult }>("/v1/agent/content/generate", {
    method: "POST",
    auth: true,
    body,
  })
  return res.data
}
