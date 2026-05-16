import { UserRole, type PrismaClient } from "@landshoppers/db";

import { buildAgentPortalDashboard } from "./agent-portal-dashboard.js";

export type AgentInsightItem = {
  id: string;
  kind: "leads" | "growth" | "verification" | "subscription" | "conversion";
  title: string;
  body: string;
  severity: "info" | "warning" | "success";
  ctaLabel: string | null;
  ctaHref: string | null;
  dismissKey: string;
  generatedAt: string;
};

/** Rule-based insights (Stream 4 MVP) — replace with AI pipeline later. */
export async function buildAgentInsights(
  prisma: PrismaClient,
  input: { userId: string; role: UserRole },
): Promise<AgentInsightItem[]> {
  const dash = await buildAgentPortalDashboard(prisma, input);
  const now = new Date().toISOString();
  const items: AgentInsightItem[] = [];

  const push = (partial: Omit<AgentInsightItem, "generatedAt">) => {
    items.push({ ...partial, generatedAt: now });
  };

  if (dash.kpis.hotLeads.count >= 5) {
    push({
      id: "insight-hot-backlog",
      kind: "leads",
      title: "High lead volume",
      body: `You have ${dash.kpis.hotLeads.count} hot inquiries. Consider batching first responses today so none go cold.`,
      severity: "warning",
      ctaLabel: "Open leads",
      ctaHref: "/agent/leads",
      dismissKey: "hot-backlog",
    });
  } else if (dash.kpis.hotLeads.count > 0) {
    push({
      id: "insight-hot-followup",
      kind: "leads",
      title: "Follow up on new inquiries",
      body: "Replying within an hour materially improves tour booking rates for Nigerian buyers.",
      severity: "info",
      ctaLabel: "Open leads",
      ctaHref: "/agent/leads",
      dismissKey: "hot-followup",
    });
  }

  if (dash.kpis.activeListings.value === 0) {
    push({
      id: "insight-no-listings",
      kind: "growth",
      title: "Publish your first listing",
      body: "Active listings power search visibility and inbound inquiries across LandShoppers.",
      severity: "info",
      ctaLabel: "New listing",
      ctaHref: "/agent/listings/new",
      dismissKey: "no-listings",
    });
  }

  const conv = dash.kpis.conversionLast30d;
  if (conv.total >= 5 && (conv.ratePercent ?? 0) < 25) {
    push({
      id: "insight-low-conversion",
      kind: "conversion",
      title: "Improve inquiry-to-reply rate",
      body: `Only ${conv.ratePercent ?? 0}% of inquiries moved to “responded” in the last 30 days. Templates and faster callbacks help.`,
      severity: "warning",
      ctaLabel: "View leads",
      ctaHref: "/agent/leads",
      dismissKey: "low-conversion",
    });
  }

  if (dash.tier === "free" && dash.usage.activeListings >= 2) {
    push({
      id: "insight-tier-upgrade",
      kind: "subscription",
      title: "Unlock Pro analytics",
      body: "Upgrade to compare week-over-week performance and WhatsApp bridge limits when you are ready.",
      severity: "info",
      ctaLabel: "Subscription",
      ctaHref: "/agent/subscription",
      dismissKey: "tier-upgrade",
    });
  }

  if (input.role === UserRole.agent) {
    const agent = await prisma.agent.findFirst({
      where: { userId: input.userId, deletedAt: null },
      select: { kycStatus: true, isVerified: true },
    });
    if (agent && agent.kycStatus !== "verified" && !agent.isVerified) {
      push({
        id: "insight-kyc",
        kind: "verification",
        title: "Finish KYC verification",
        body: "Verified agents rank higher in directory modules and unlock payout-ready workflows.",
        severity: "warning",
        ctaLabel: "KYC",
        ctaHref: "/agent/kyc",
        dismissKey: "kyc-pending",
      });
    }
  }

  return items;
}

export function paginateInsights(
  items: AgentInsightItem[],
  page: number,
  pageSize: number,
): { items: AgentInsightItem[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = items.length;
  const skip = (page - 1) * pageSize;
  const slice = items.slice(skip, skip + pageSize);
  return {
    items: slice,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 0,
  };
}
