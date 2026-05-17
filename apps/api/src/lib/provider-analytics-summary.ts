import { ServiceLeadStatus, type PrismaClient } from "@landshoppers/db";

import type { providerAnalyticsSummaryQuerySchema } from "../contracts/provider-analytics.js";
import { developerAnalyticsWindowStart } from "./developer-analytics-window.js";
import { tierFromServiceProvider } from "./provider-portal-tier.js";
import type { z } from "zod";

type Period = z.infer<typeof providerAnalyticsSummaryQuerySchema>["period"];

const JOB_STATUSES: ServiceLeadStatus[] = [
  ServiceLeadStatus.quoted,
  ServiceLeadStatus.negotiating,
  ServiceLeadStatus.accepted,
  ServiceLeadStatus.completed,
];

function medianHours(samples: number[]): number | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 10) / 10
    : Math.round(sorted[mid]! * 10) / 10;
}

export async function buildProviderAnalyticsSummary(
  prisma: PrismaClient,
  input: { serviceProviderId: string; period: Period },
) {
  const provider = await prisma.serviceProvider.findFirst({
    where: { id: input.serviceProviderId, deletedAt: null },
  });
  if (!provider) return null;

  const tier = tierFromServiceProvider(provider);
  const analyticsDepth: "basic" | "full" = tier === "free" ? "basic" : "full";
  const since =
    tier === "free" && input.period === "all"
      ? developerAnalyticsWindowStart("month")
      : developerAnalyticsWindowStart(input.period);

  const leads = await prisma.serviceLead.findMany({
    where: { serviceProviderId: provider.id, createdAt: { gte: since } },
    select: {
      status: true,
      createdAt: true,
      respondedAt: true,
      quotedAmountKobo: true,
      finalAmountKobo: true,
    },
  });

  const byStatus: Record<string, number> = {};
  for (const s of Object.values(ServiceLeadStatus)) byStatus[s] = 0;
  for (const l of leads) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;

  const funnel = {
    quoted: byStatus[ServiceLeadStatus.quoted] ?? 0,
    negotiating: byStatus[ServiceLeadStatus.negotiating] ?? 0,
    accepted: byStatus[ServiceLeadStatus.accepted] ?? 0,
    completed: byStatus[ServiceLeadStatus.completed] ?? 0,
    cancelled: byStatus[ServiceLeadStatus.cancelled] ?? 0,
  };

  let revenueQuotedKobo = 0n;
  let revenueFinalKobo = 0n;
  const responseHours: number[] = [];

  for (const l of leads) {
    if (l.quotedAmountKobo != null) revenueQuotedKobo += l.quotedAmountKobo;
    if (l.finalAmountKobo != null) revenueFinalKobo += l.finalAmountKobo;
    if (l.respondedAt) {
      const hrs = (l.respondedAt.getTime() - l.createdAt.getTime()) / 3_600_000;
      if (hrs >= 0 && hrs < 24 * 14) responseHours.push(hrs);
    }
  }

  const jobsInProgress = await prisma.serviceLead.count({
    where: {
      serviceProviderId: provider.id,
      status: { in: [ServiceLeadStatus.negotiating, ServiceLeadStatus.accepted] },
    },
  });

  const byDayMap = new Map<string, number>();
  for (const l of leads) {
    const key = l.createdAt.toISOString().slice(0, 10);
    byDayMap.set(key, (byDayMap.get(key) ?? 0) + 1);
  }
  const leadsByDay = [...byDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return {
    period: input.period,
    tier,
    analyticsDepth,
    kpis: {
      totalLeads: leads.length,
      jobsInProgress,
      funnel,
      revenueQuotedKobo: revenueQuotedKobo.toString(),
      revenueFinalKobo: revenueFinalKobo.toString(),
      medianResponseHours: medianHours(responseHours),
      leadsByDay,
    },
  };
}

export { JOB_STATUSES as providerJobStatuses };
