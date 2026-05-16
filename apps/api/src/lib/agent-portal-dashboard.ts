import { ListingStatus, TourStatus, UserRole, type PrismaClient } from "@landshoppers/db";
import type { z } from "zod";

import type { agentPortalDashboardDataSchema } from "../contracts/agent-portal.js";
import {
  limitsForTier,
  tierFromAgentSubscription,
  tierFromDeveloperSubscription,
  type AgentPortalTier,
} from "./agent-portal-tier.js";

type DashboardPayload = z.infer<typeof agentPortalDashboardDataSchema>;

function monthStartUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function daysAgoUtc(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

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

export async function buildAgentPortalDashboard(
  prisma: PrismaClient,
  input: { userId: string; role: UserRole },
): Promise<DashboardPayload> {
  const { userId, role } = input;

  const [agentRow, developerRow] = await Promise.all([
    role === UserRole.agent
      ? prisma.agent.findFirst({ where: { userId, deletedAt: null } })
      : null,
    role === UserRole.developer
      ? prisma.developer.findFirst({ where: { userId, deletedAt: null } })
      : null,
  ]);

  const [agentSub, developerSub] = await Promise.all([
    agentRow
      ? prisma.subscription.findUnique({ where: { agentId: agentRow.id } })
      : null,
    developerRow
      ? prisma.subscription.findUnique({ where: { developerId: developerRow.id } })
      : null,
  ]);

  const tier: AgentPortalTier =
    role === UserRole.agent
      ? tierFromAgentSubscription(agentSub)
      : developerRow
        ? tierFromDeveloperSubscription(developerSub)
        : "free";

  const limits = limitsForTier(tier);

  const listingWhere = { userId, deletedAt: null } as const;
  const listingIds = await listingIdsForUser(prisma, userId);

  const sinceMonth = monthStartUtc();
  const since30d = daysAgoUtc(30);
  const weekStart = daysAgoUtc(7);
  const priorWeekStart = daysAgoUtc(14);

  const [
    activeListings,
    viewsThisWeek,
    viewsPriorWeek,
    inquiriesThisMonth,
    inquiriesLast30d,
    respondedLast30d,
    hotLeadPlaceholder,
  ] = await Promise.all([
    prisma.listing.count({
      where: { ...listingWhere, status: ListingStatus.active },
    }),
    listingIds.length === 0
      ? 0
      : prisma.listingRecentView.count({
          where: { listingId: { in: listingIds }, lastViewedAt: { gte: weekStart } },
        }),
    listingIds.length === 0
      ? 0
      : prisma.listingRecentView.count({
          where: {
            listingId: { in: listingIds },
            lastViewedAt: { gte: priorWeekStart, lt: weekStart },
          },
        }),
    listingIds.length === 0
      ? 0
      : prisma.inquiry.count({
          where: { listingId: { in: listingIds }, createdAt: { gte: sinceMonth } },
        }),
    listingIds.length === 0
      ? 0
      : prisma.inquiry.count({
          where: { listingId: { in: listingIds }, createdAt: { gte: since30d } },
        }),
    listingIds.length === 0
      ? 0
      : prisma.inquiry.count({
          where: {
            listingId: { in: listingIds },
            createdAt: { gte: since30d },
            respondedAt: { not: null },
          },
        }),
    Promise.resolve(0),
  ]);

  const conversionRatePercent =
    inquiriesLast30d === 0 ? null : Math.round((respondedLast30d / inquiriesLast30d) * 1000) / 10;

  const commissionEarned = agentRow?.commissionEarned ?? 0n;
  const earningsAvailable = tier === "pro" || tier === "elite";
  const estimatedMonthlyEarningsNgKobo =
    earningsAvailable && commissionEarned > 0n
      ? (commissionEarned / 12n).toString()
      : earningsAvailable
        ? "0"
        : null;

  const now = new Date();
  const tours =
    listingIds.length === 0
      ? []
      : await prisma.tourRequest.findMany({
          where: {
            listingId: { in: listingIds },
            status: { in: [TourStatus.pending, TourStatus.confirmed] },
            preferredDate: { gte: now },
            cancelledAt: null,
          },
          orderBy: { preferredDate: "asc" },
          take: 10,
          include: {
            listing: { include: { property: true } },
            buyer: { include: { profile: true } },
          },
        });

  const upcomingTours = tours.slice(0, 3).map((t) => {
    const p = t.listing?.property;
    const prof = t.buyer?.profile;
    const buyerLabel =
      [prof?.firstName?.trim(), prof?.lastName?.trim()].filter(Boolean).join(" ").trim() ||
      t.buyer?.email ||
      "Buyer";
    return {
      id: t.id,
      listingId: t.listingId,
      propertyTitle: p?.title ?? "Listing",
      buyerLabel,
      preferredDate: t.preferredDate.toISOString(),
      preferredTime: t.preferredTime ?? null,
      tourType: t.tourType,
      status: t.status,
    };
  });

  return {
    tier,
    limits: {
      maxActiveListings: limits.maxActiveListings,
      maxLeadsPerMonth: limits.maxLeadsPerMonth,
      maxAiDescriptionGenerationsPerDay: limits.maxAiDescriptionGenerationsPerDay,
      maxWhatsappConnections: limits.maxWhatsappConnections,
    },
    usage: {
      activeListings,
      inquiriesThisMonth,
    },
    kpis: {
      activeListings: {
        value: activeListings,
        priorValue: null,
        changePercent: null,
      },
      hotLeads: { count: hotLeadPlaceholder, leadScoringAvailable: false },
      whatsappMessagesToday: { count: 0, bridgeConnected: false },
      viewsThisWeek: {
        value: viewsThisWeek,
        priorValue: viewsPriorWeek,
        changePercent: pctChange(viewsThisWeek, viewsPriorWeek),
      },
      conversionLast30d: {
        responded: respondedLast30d,
        total: inquiriesLast30d,
        ratePercent: conversionRatePercent,
      },
      estimatedMonthlyEarningsNgKobo,
      earningsAvailable,
    },
    upcomingTours,
  };
}

export async function listAgentPortalTours(
  prisma: PrismaClient,
  input: { userId: string; upcomingOnly: boolean },
) {
  const listingIds = await listingIdsForUser(prisma, input.userId);
  if (listingIds.length === 0) return [];

  const now = new Date();
  const rows = await prisma.tourRequest.findMany({
    where: {
      listingId: { in: listingIds },
      cancelledAt: null,
      ...(input.upcomingOnly
        ? {
            status: { in: [TourStatus.pending, TourStatus.confirmed] },
            preferredDate: { gte: now },
          }
        : {}),
    },
    orderBy: { preferredDate: "desc" },
    take: input.upcomingOnly ? 20 : 50,
    include: {
      listing: { include: { property: true } },
      buyer: { include: { profile: true } },
    },
  });

  return rows.map((t) => {
    const p = t.listing?.property;
    const prof = t.buyer?.profile;
    const buyerLabel =
      [prof?.firstName?.trim(), prof?.lastName?.trim()].filter(Boolean).join(" ").trim() ||
      t.buyer?.email ||
      "Buyer";
    return {
      id: t.id,
      listingId: t.listingId,
      propertyTitle: p?.title ?? "Listing",
      buyerLabel,
      preferredDate: t.preferredDate.toISOString(),
      preferredTime: t.preferredTime ?? null,
      tourType: t.tourType,
      status: t.status,
    };
  });
}
