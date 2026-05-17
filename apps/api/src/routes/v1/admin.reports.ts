import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { adminReportKindParamSchema, adminReportQuerySchema } from "../../contracts/admin-reports.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import type { ApiEnv } from "../../types/env.js";

export const adminReportsV1 = new Hono<ApiEnv>();

adminReportsV1.use("*", requireAuth, requireAdmin);

const reportRateLimit = rateLimit({
  bucket: "admin:reports-export",
  limit: 10,
  windowSeconds: 3600,
  keyFromContext: async (c) => c.get("authUser")?.id ?? "anonymous",
});

function csvEscape(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  return lines.join("\n");
}

adminReportsV1.get(
  "/:kind",
  reportRateLimit,
  zValidator("param", adminReportKindParamSchema),
  zValidator("query", adminReportQuerySchema),
  async (c) => {
    const { kind } = c.req.valid("param");
    const { format } = c.req.valid("query");
    if (format !== "csv") {
      throw new ApiError(400, "UNSUPPORTED_FORMAT", "Only format=csv is supported");
    }

    let csv = "";
    const filename = `landshoppers-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (kind === "users") {
      const rows = await prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: { profile: { select: { firstName: true, lastName: true, city: true } } },
      });
      csv = toCsv(
        ["id", "email", "role", "city", "createdAt", "lastLoginAt"],
        rows.map((u) => [
          u.id,
          u.email,
          u.role,
          u.profile?.city ?? "",
          u.createdAt.toISOString(),
          u.lastLoginAt?.toISOString() ?? "",
        ]),
      );
    } else if (kind === "listings") {
      const rows = await prisma.listing.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: { property: { select: { title: true, city: true, state: true } } },
      });
      csv = toCsv(
        ["id", "status", "price", "title", "city", "state", "createdAt"],
        rows.map((l) => [
          l.id,
          l.status,
          l.price.toString(),
          l.property.title,
          l.property.city,
          l.property.state,
          l.createdAt.toISOString(),
        ]),
      );
    } else {
      const rows = await prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: { agent: { select: { agencyName: true } } },
      });
      csv = toCsv(
        ["id", "agentAgency", "type", "status", "amount", "currency", "reference", "createdAt"],
        rows.map((p) => [
          p.id,
          p.agent?.agencyName ?? "",
          p.type,
          p.status,
          p.amount.toString(),
          p.currency,
          p.reference,
          p.createdAt.toISOString(),
        ]),
      );
    }

    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.body(csv);
  },
);
