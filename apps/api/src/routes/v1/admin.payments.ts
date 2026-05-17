import { PaymentStatus, SubscriptionStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  adminPaymentsSummaryQuerySchema,
  listAdminPaymentsQuerySchema,
} from "../../contracts/admin-payments.js";
import { offsetFromPage } from "../../contracts/common.js";
import { developerAnalyticsWindowStart } from "../../lib/developer-analytics-window.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const adminPaymentsV1 = new Hono<ApiEnv>();

adminPaymentsV1.use("*", requireAuth, requireAdmin);

function paymentToJson(
  row: {
    id: string;
    agentId: string | null;
    type: string;
    status: string;
    amount: bigint;
    currency: string;
    reference: string;
    paidAt: Date | null;
    createdAt: Date;
  },
  agent: { agencyName: string | null } | null,
) {
  return {
    id: row.id,
    agentId: row.agentId,
    agentAgencyName: agent?.agencyName ?? null,
    type: row.type,
    status: row.status,
    amount: row.amount.toString(),
    currency: row.currency,
    reference: row.reference,
    paidAt: row.paidAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

adminPaymentsV1.get("/", zValidator("query", listAdminPaymentsQuerySchema), async (c) => {
  const { page, pageSize, status, type, from, to } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where = {
    ...(status !== undefined ? { status } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { agent: { select: { agencyName: true } } },
    }),
  ]);

  return c.json({
    data: rows.map((r) => paymentToJson(r, r.agent)),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

adminPaymentsV1.get("/summary", zValidator("query", adminPaymentsSummaryQuerySchema), async (c) => {
  const { period } = c.req.valid("query");
  const since = developerAnalyticsWindowStart(period);

  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: since } },
    select: { status: true, amount: true, type: true },
  });

  const byStatus: Record<string, number> = {};
  let gmvKobo = 0n;
  for (const p of payments) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    if (p.status === PaymentStatus.successful) gmvKobo += p.amount;
  }

  const activeSubs = await prisma.subscription.count({
    where: { status: SubscriptionStatus.active },
  });

  return c.json({
    data: {
      period,
      since: since.toISOString(),
      gmvNgKobo: gmvKobo.toString(),
      paymentCount: payments.length,
      byStatus,
      activeSubscriptions: activeSubs,
      subscriptionMrrEstimateNgKobo: null as string | null,
    },
  });
});
