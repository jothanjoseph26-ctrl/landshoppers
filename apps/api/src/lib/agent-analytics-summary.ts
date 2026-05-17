import { InquiryStatus, ListingStatus, type PrismaClient, UserRole } from "@landshoppers/db";

import type { agentAnalyticsSummaryQuerySchema } from "../contracts/agent-analytics.js";
import { developerAnalyticsWindowStart } from "./developer-analytics-window.js";
import {
  limitsForTier,
  tierFromAgentSubscription,
  tierFromDeveloperSubscription,
  type AgentPortalTier,
} from "./agent-portal-tier.js";
import type { z } from "zod";

type Period = z.infer<typeof agentAnalyticsSummaryQuerySchema>["period"];

function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

async function listingIdsForUser(prisma: PrismaClient, userId: string): Promise<string[]> {
  const rows = await prisma.listing.findMany({
    where: { userId, deletedAt: null },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function buildAgentAnalyticsSummary(
  prisma: PrismaClient,
  input: { userId: string; role: UserRole; period: Period },
) {
  const period = input.period;
  const since = developerAnalyticsWindowStart(period);
  const listingIds = await listingIdsForUser(prisma, input.userId);

  const [agentRow, developerRow] = await Promise.all([
    input.role === UserRole.agent
      ? prisma.agent.findFirst({ where: { userId: input.userId, deletedAt: null } })
      : null,
    input.role === UserRole.developer
      ? prisma.developer.findFirst({ where: { userId: input.userId, deletedAt: null } })
      : null,
  ]);

  const [agentSub, developerSub] = await Promise.all([
    agentRow ? prisma.subscription.findUnique({ where: { agentId: agentRow.id } }) : null,
    developerRow ? prisma.subscription.findUnique({ where: { developerId: developerRow.id } }) : null,
  ]);

  const tier: AgentPortalTier =
    input.role === UserRole.agent
      ? tierFromAgentSubscription(agentSub)
      : developerRow
        ? tierFromDeveloperSubscription(developerSub)
        : "free";

  const analyticsDepth: "basic" | "full" = tier === "free" ? "basic" : "full";
  const effectiveSince = tier === "free" && period === "all" ? developerAnalyticsWindowStart("month") : since;

  if (listingIds.length === 0) {
    return {
      period,
      kpis: {
        views: { byDay: [] as Array<{ date: string; count: number }>, total: 0, changePercent: null as number | null },
        inquiries: {
          byDay: [] as Array<{ date: string; count: number }>,
          byStatus: Object.fromEntries(Object.values(InquiryStatus).map((s) => [s, 0])),
          total: 0,
        },
        conversionRatePercent: null as number | null,
        topListings: [] as Array<{ listingId: string; title: string; views: number; inquiries: number }>,
      },
      tier,
      analyticsDepth,
    };
  }

  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  const priorWeekStart = new Date();
  priorWeekStart.setUTCDate(priorWeekStart.getUTCDate() - 14);

  const [views, priorViews, inquiries, viewRows] = await Promise.all([
    prisma.listingRecentView.count({
      where: { listingId: { in: listingIds }, lastViewedAt: { gte: effectiveSince } },
    }),
    prisma.listingRecentView.count({
      where: {
        listingId: { in: listingIds },
        lastViewedAt: { gte: priorWeekStart, lt: weekStart },
      },
    }),
    prisma.inquiry.findMany({
      where: { listingId: { in: listingIds }, createdAt: { gte: effectiveSince } },
      select: { id: true, status: true, createdAt: true, listingId: true, respondedAt: true },
    }),
    prisma.listingRecentView.findMany({
      where: { listingId: { in: listingIds }, lastViewedAt: { gte: effectiveSince } },
      select: { listingId: true, lastViewedAt: true },
    }),
  ]);

  const viewsByDay = new Map<string, number>();
  for (const row of viewRows) {
    const key = row.lastViewedAt.toISOString().slice(0, 10);
    viewsByDay.set(key, (viewsByDay.get(key) ?? 0) + 1);
  }

  const inquiriesByDay = new Map<string, number>();
  const byStatus = Object.fromEntries(Object.values(InquiryStatus).map((s) => [s, 0])) as Record<string, number>;
  let responded = 0;
  for (const row of inquiries) {
    const key = row.createdAt.toISOString().slice(0, 10);
    inquiriesByDay.set(key, (inquiriesByDay.get(key) ?? 0) + 1);
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (row.respondedAt) responded += 1;
  }

  const conversionRatePercent =
    inquiries.length === 0 ? null : Math.round((responded / inquiries.length) * 1000) / 10;

  const listingStats = new Map<string, { views: number; inquiries: number }>();
  for (const id of listingIds) listingStats.set(id, { views: 0, inquiries: 0 });
  for (const row of viewRows) {
    const cur = listingStats.get(row.listingId);
    if (cur) cur.views += 1;
  }
  for (const row of inquiries) {
    if (!row.listingId) continue;
    const cur = listingStats.get(row.listingId);
    if (cur) cur.inquiries += 1;
  }

  const topIds = [...listingStats.entries()]
    .sort((a, b) => b[1].inquiries + b[1].views - (a[1].inquiries + a[1].views))
    .slice(0, 5)
    .map(([id]) => id);

  const listings =
    topIds.length === 0
      ? []
      : await prisma.listing.findMany({
          where: { id: { in: topIds }, deletedAt: null, status: ListingStatus.active },
          include: { property: { select: { title: true } } },
        });

  const topListings = topIds
    .map((listingId) => {
      const listing = listings.find((l) => l.id === listingId);
      const stats = listingStats.get(listingId);
      if (!listing || !stats) return null;
      return {
        listingId,
        title: listing.property.title,
        views: stats.views,
        inquiries: stats.inquiries,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const limits = limitsForTier(tier);
  void limits;

  return {
    period,
    kpis: {
      views: {
        byDay: [...viewsByDay.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        total: views,
        changePercent: pctChange(views, priorViews),
      },
      inquiries: {
        byDay: [...inquiriesByDay.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        byStatus,
        total: inquiries.length,
      },
      conversionRatePercent,
      topListings: tier === "elite" ? topListings : topListings.slice(0, tier === "pro" ? 5 : 0),
    },
    tier,
    analyticsDepth,
  };
}
