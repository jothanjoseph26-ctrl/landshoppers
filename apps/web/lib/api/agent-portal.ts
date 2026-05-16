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
