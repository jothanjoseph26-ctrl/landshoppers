import { KycStatus, ListingStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { adminAnalyticsSummaryQuerySchema } from "../../contracts/admin-analytics.js";
import { developerAnalyticsWindowStart } from "../../lib/developer-analytics-window.js";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const adminAnalyticsV1 = new Hono<ApiEnv>();

adminAnalyticsV1.use("*", requireAuth, requireAdmin);

adminAnalyticsV1.get("/summary", zValidator("query", adminAnalyticsSummaryQuerySchema), async (c) => {
  const { period } = c.req.valid("query");
  const since = developerAnalyticsWindowStart(period);

  const [
    totalUsers,
    activeUsers,
    totalListings,
    activeListings,
    inquiriesInPeriod,
    pendingAgentKyc,
    pendingDeveloperKyc,
    usersByDay,
    listingsByDay,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, lastLoginAt: { gte: since } } }),
    prisma.listing.count({ where: { deletedAt: null } }),
    prisma.listing.count({ where: { deletedAt: null, status: ListingStatus.active } }),
    prisma.inquiry.count({ where: { createdAt: { gte: since } } }),
    prisma.agent.count({ where: { deletedAt: null, kycStatus: KycStatus.pending } }),
    prisma.developer.count({ where: { deletedAt: null, kycStatus: KycStatus.pending } }),
    prisma.user.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.listing.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const bucket = (rows: { createdAt: Date }[]) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  };

  return c.json({
    data: {
      period,
      since: since.toISOString(),
      kpis: {
        totalUsers,
        activeUsersProxy: activeUsers,
        totalListings,
        activeListings,
        inquiriesInPeriod,
        pendingKycCount: pendingAgentKyc + pendingDeveloperKyc,
      },
      trends: {
        newUsersByDay: bucket(usersByDay),
        newListingsByDay: bucket(listingsByDay),
      },
    },
  });
});
