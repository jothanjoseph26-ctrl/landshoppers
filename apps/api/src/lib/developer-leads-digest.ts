import { InquiryStatus, type Prisma } from "@landshoppers/db";

import { prisma } from "./prisma.js";

export type LeadsDigestHotLead = {
  inquiryId: string;
  score: number;
  reason: string;
  summary: string;
  projectName: string | null;
  status: string;
  createdAt: string;
};

export type LeadsDigestPayload = {
  period: "week" | "month" | "all";
  since: string;
  generatedAt: string;
  totals: { inquiriesInPeriod: number; byStatus: Record<string, number> };
  byProject: Array<{ projectId: string; projectName: string; slug: string; count: number }>;
  hotLeads: LeadsDigestHotLead[];
};

export function digestWindowStart(period: "week" | "month" | "all"): Date {
  const d = new Date();
  if (period === "all") return new Date(0);
  if (period === "month") {
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d;
  }
  d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

function inquiryHeatScore(status: InquiryStatus, createdAt: Date): number {
  const base: Record<InquiryStatus, number> = {
    [InquiryStatus.new]: 100,
    [InquiryStatus.touring]: 88,
    [InquiryStatus.responded]: 72,
    [InquiryStatus.closed]: 28,
    [InquiryStatus.lost]: 12,
  };
  const ageHours = (Date.now() - createdAt.getTime()) / 3_600_000;
  const recency = Math.max(0, 72 - ageHours);
  return (base[status] ?? 40) + recency;
}

type InquiryDigestRow = Prisma.InquiryGetPayload<{
  include: {
    project: { select: { id: true; name: true; slug: true; city: true; state: true } };
  };
}>;

function buildHotLeads(rows: InquiryDigestRow[]): LeadsDigestHotLead[] {
  return rows
    .map((row) => {
      const score = inquiryHeatScore(row.status, row.createdAt);
      const reason =
        row.status === InquiryStatus.new
          ? "New lead — respond first"
          : row.status === InquiryStatus.touring
            ? "Tour stage — high intent"
            : row.status === InquiryStatus.responded
              ? "In conversation"
              : "Pipeline";
      const summary = row.message?.trim().slice(0, 140) ?? "(no message)";
      return {
        inquiryId: row.id,
        score,
        reason,
        summary: summary.length >= 140 ? `${summary}…` : summary,
        projectName: row.project?.name ?? null,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

/** Builds the same payload as `GET /v1/me/developer/leads/digest` for a developer row id. */
export async function buildLeadsDigestForDeveloper(
  developerId: string,
  period: "week" | "month" | "all",
): Promise<LeadsDigestPayload> {
  const since = digestWindowStart(period);
  const generatedAt = new Date();

  const mine = await prisma.developerProject.findMany({
    where: { developerId, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  const projectIds = mine.map((p) => p.id);
  if (projectIds.length === 0) {
    return {
      period,
      since: since.toISOString(),
      generatedAt: generatedAt.toISOString(),
      totals: { inquiriesInPeriod: 0, byStatus: {} },
      byProject: [],
      hotLeads: [],
    };
  }

  const rows = await prisma.inquiry.findMany({
    where: {
      projectId: { in: projectIds },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true, slug: true, city: true, state: true } },
    },
  });

  const inquiryStatuses = Object.values(InquiryStatus);
  const byStatus: Record<string, number> = Object.fromEntries(inquiryStatuses.map((s) => [s, 0]));
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  }

  const byProjectMap = new Map<string, { projectId: string; projectName: string; slug: string; count: number }>();
  for (const row of rows) {
    if (!row.projectId || !row.project) continue;
    const cur = byProjectMap.get(row.projectId);
    if (cur) cur.count += 1;
    else {
      byProjectMap.set(row.projectId, {
        projectId: row.projectId,
        projectName: row.project.name,
        slug: row.project.slug,
        count: 1,
      });
    }
  }
  const byProject = [...byProjectMap.values()].sort((a, b) => b.count - a.count);

  return {
    period,
    since: since.toISOString(),
    generatedAt: generatedAt.toISOString(),
    totals: {
      inquiriesInPeriod: rows.length,
      byStatus,
    },
    byProject,
    hotLeads: buildHotLeads(rows),
  };
}
