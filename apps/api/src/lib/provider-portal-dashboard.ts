import { ServiceLeadStatus } from "@landshoppers/db";
import type { PrismaClient } from "@landshoppers/db";
import type { ServiceProvider } from "@landshoppers/db";

import type { ProviderPortalTier } from "../contracts/provider-portal.js";
import { tierFromServiceProvider } from "./provider-portal-tier.js";
import { serviceLabelsFromServicesOffered } from "./service-provider-offerings.js";
import { serviceLeadToDashboardRecent } from "./serialize/service-lead-portal.js";

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function buildInsights(p: ServiceProvider, tier: ProviderPortalTier) {
  const out: Array<{
    id: string;
    kind: "response" | "growth" | "verification" | "portfolio";
    title: string;
    body: string;
    severity: "info" | "warning" | "success";
  }> = [];

  if (!p.description || p.description.trim().length < 40) {
    out.push({
      id: "profile-desc",
      kind: "growth",
      title: "Complete your service description",
      body: "Profiles with a clear description convert more leads from directory and contextual matches.",
      severity: "info",
    });
  }

  if (serviceLabelsFromServicesOffered(p.servicesOffered).length < 2) {
    out.push({
      id: "services-count",
      kind: "portfolio",
      title: "Add more services",
      body: "List at least two concrete services so buyers know exactly what you offer.",
      severity: "info",
    });
  }

  if (!p.isVerified) {
    out.push({
      id: "verify",
      kind: "verification",
      title: "Get verified",
      body: "Verified providers rank higher in ServiceHub recommendations.",
      severity: "warning",
    });
  }

  if (tier === "free") {
    out.push({
      id: "tier",
      kind: "growth",
      title: "Unlock Pro insights",
      body: "Upgrade to see AI lead scoring, WhatsApp bridge, and match appearance stats.",
      severity: "success",
    });
  }

  return out.slice(0, 4);
}

export async function buildProviderPortalDashboard(prisma: PrismaClient, params: { userId: string }) {
  const provider = await prisma.serviceProvider.findFirst({
    where: { userId: params.userId, deletedAt: null },
  });

  if (!provider) {
    return null;
  }

  const tier = tierFromServiceProvider(provider);

  const leadScoringAvailable = tier !== "free";

  const leadWhere = { serviceProviderId: provider.id };
  const dayStart = startOfUtcDay();

  const [newLeadsToday, hotLeadsCount, jobsInProgress, recentLeadRows] = await Promise.all([
    prisma.serviceLead.count({
      where: { ...leadWhere, createdAt: { gte: dayStart } },
    }),
    prisma.serviceLead.count({
      where: { ...leadWhere, aiScore: { gte: 70 } },
    }),
    prisma.serviceLead.count({
      where: {
        ...leadWhere,
        status: {
          in: [
            ServiceLeadStatus.quoted,
            ServiceLeadStatus.negotiating,
            ServiceLeadStatus.accepted,
          ],
        },
      },
    }),
    prisma.serviceLead.findMany({
      where: leadWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    tier,
    businessName: provider.businessName,
    category: provider.category,
    kpis: {
      newLeadsToday,
      newLeadsPulse: newLeadsToday > 0,
      hotLeads: { count: hotLeadsCount, leadScoringAvailable },
      jobsInProgress,
      profileViewsWeek: {
        value: provider.viewCount,
        priorValue: null,
        changePercent: null,
      },
      matchAppearancesWeek: null,
    },
    trust: {
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      leadCount: provider.leadCount,
      aiMatchScore: provider.aiMatchScore === 0 ? null : provider.aiMatchScore,
    },
    recentLeads: recentLeadRows.map((lead) => serviceLeadToDashboardRecent(lead)),
    insights: buildInsights(provider, tier),
  };
}
