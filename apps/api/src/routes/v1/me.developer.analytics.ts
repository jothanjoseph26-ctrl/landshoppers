import { InquiryStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { analyticsSummaryQuerySchema } from "../../contracts/developer-analytics.js";
import { developerAnalyticsWindowStart } from "../../lib/developer-analytics-window.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireDeveloper } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meDeveloperAnalyticsV1 = new Hono<ApiEnv>();

meDeveloperAnalyticsV1.use("*", requireAuth, requireDeveloper);

async function developerForUser(userId: string) {
  const row = await prisma.developer.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Developer profile not found for this account");
  }
  return row;
}

const INSIGHTS_DEFAULT = [
  "Compare inquiry velocity before and after price or marketing changes.",
  "New leads that stay in “new” for more than 48 hours often need faster WhatsApp follow-up.",
  "When a single project dominates volume, consider splitting phases for clearer reporting.",
] as const;

meDeveloperAnalyticsV1.get(
  "/summary",
  zValidator("query", analyticsSummaryQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { period, projectIds: requestedIds } = c.req.valid("query");
    const since = developerAnalyticsWindowStart(period);
    const generatedAt = new Date();

    const allMine = await prisma.developerProject.findMany({
      where: { developerId: dev.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        totalUnits: true,
        availableUnits: true,
        soldUnits: true,
      },
    });

    const ownedIds = new Set(allMine.map((p) => p.id));
    let scope = allMine;
    if (requestedIds !== undefined && requestedIds.length > 0) {
      const allowed = requestedIds.filter((id) => ownedIds.has(id));
      scope = allMine.filter((p) => allowed.includes(p.id));
    }

    const projectIds = scope.map((p) => p.id);
    const inquiryStatuses = Object.values(InquiryStatus);
    const byStatusEmpty = Object.fromEntries(inquiryStatuses.map((s) => [s, 0])) as Record<string, number>;

    if (projectIds.length === 0) {
      return c.json({
        data: {
          period,
          since: since.toISOString(),
          generatedAt: generatedAt.toISOString(),
          currency: "NGN" as const,
          kpis: {
            projectCount: 0,
            totalUnits: 0,
            availableUnits: 0,
            soldUnits: 0,
            inquiriesInPeriod: 0,
            revenueNgN: null as null,
            conversionRate: null as null,
          },
          inquiriesByDay: [] as Array<{ date: string; count: number }>,
          inquiriesByStatus: byStatusEmpty,
          byProject: [] as Array<{
            projectId: string;
            projectName: string;
            slug: string;
            inquiryCount: number;
          }>,
          insights: [...INSIGHTS_DEFAULT],
        },
      });
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: since },
      },
      select: { id: true, status: true, createdAt: true, projectId: true },
    });

    const byStatus = { ...byStatusEmpty };
    for (const row of inquiries) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    }

    const byDay = new Map<string, number>();
    for (const row of inquiries) {
      const key = row.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    const inquiriesByDay = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const byProjectMap = new Map<string, { projectId: string; projectName: string; slug: string; inquiryCount: number }>();
    for (const row of inquiries) {
      if (!row.projectId) continue;
      const proj = scope.find((p) => p.id === row.projectId);
      if (!proj) continue;
      const cur = byProjectMap.get(row.projectId);
      if (cur) cur.inquiryCount += 1;
      else {
        byProjectMap.set(row.projectId, {
          projectId: row.projectId,
          projectName: proj.name,
          slug: proj.slug,
          inquiryCount: 1,
        });
      }
    }
    const byProject = [...byProjectMap.values()]
      .sort((a, b) => b.inquiryCount - a.inquiryCount)
      .slice(0, 12);

    let totalUnits = 0;
    let availableUnits = 0;
    let soldUnits = 0;
    for (const p of scope) {
      totalUnits += p.totalUnits;
      availableUnits += p.availableUnits;
      soldUnits += p.soldUnits;
    }

    return c.json({
      data: {
        period,
        since: since.toISOString(),
        generatedAt: generatedAt.toISOString(),
        currency: "NGN" as const,
        kpis: {
          projectCount: scope.length,
          totalUnits,
          availableUnits,
          soldUnits,
          inquiriesInPeriod: inquiries.length,
          revenueNgN: null as null,
          conversionRate: null as null,
        },
        inquiriesByDay,
        inquiriesByStatus: byStatus,
        byProject,
        insights: [...INSIGHTS_DEFAULT],
      },
    });
  },
);
