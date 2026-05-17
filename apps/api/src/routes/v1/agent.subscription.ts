import { randomUUID } from "node:crypto";

import { UserRole } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  agentSubscriptionCheckoutBodySchema,
  listAgentSubscriptionInvoicesQuerySchema,
} from "../../contracts/agent-subscription.js";
import { offsetFromPage } from "../../contracts/common.js";
import {
  limitsForTier,
  paystackConfigured,
  tierFromAgentSubscription,
  tierFromDeveloperSubscription,
} from "../../lib/agent-portal-tier.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAgentOrDeveloper, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const agentSubscriptionV1 = new Hono<ApiEnv>();

agentSubscriptionV1.use("*", requireAuth, requireAgentOrDeveloper);

function monthStartUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

agentSubscriptionV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const [agentRow, developerRow] = await Promise.all([
    auth.role === UserRole.agent
      ? prisma.agent.findFirst({ where: { userId: auth.id, deletedAt: null } })
      : null,
    auth.role === UserRole.developer
      ? prisma.developer.findFirst({ where: { userId: auth.id, deletedAt: null } })
      : null,
  ]);

  if (!agentRow && !developerRow) {
    throw new ApiError(404, "NOT_FOUND", "Portal profile not found");
  }

  const [agentSub, developerSub, listingCount, inquiriesThisMonth] = await Promise.all([
    agentRow ? prisma.subscription.findUnique({ where: { agentId: agentRow.id } }) : null,
    developerRow ? prisma.subscription.findUnique({ where: { developerId: developerRow.id } }) : null,
    prisma.listing.count({ where: { userId: auth.id, deletedAt: null } }),
    prisma.inquiry.count({
      where: {
        listing: { userId: auth.id, deletedAt: null },
        createdAt: { gte: monthStartUtc() },
      },
    }),
  ]);

  const sub = agentSub ?? developerSub;
  const tier =
    auth.role === UserRole.agent
      ? tierFromAgentSubscription(agentSub)
      : tierFromDeveloperSubscription(developerSub);
  const limits = limitsForTier(tier);

  return c.json({
    data: {
      persona: auth.role === UserRole.agent ? "agent" : "developer",
      agentId: agentRow?.id ?? null,
      agencyName: agentRow?.agencyName ?? developerRow?.companyName ?? null,
      tier,
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            renewsAt: sub.currentPeriodEnd.toISOString(),
            currentPeriodStart: sub.currentPeriodStart.toISOString(),
            currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
            cancelledAt: sub.cancelledAt?.toISOString() ?? null,
            paystackCustomerId: sub.paystackCustomerId,
          }
        : {
            plan: null,
            status: null,
            renewsAt: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelledAt: null,
            paystackCustomerId: null,
          },
      usage: {
        activeListings: listingCount,
        inquiriesThisMonth,
      },
      limits,
      paystackConfigured: paystackConfigured(),
    },
  });
});

agentSubscriptionV1.get(
  "/invoices",
  zValidator("query", listAgentSubscriptionInvoicesQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const agentRow =
      auth.role === UserRole.agent
        ? await prisma.agent.findFirst({ where: { userId: auth.id, deletedAt: null } })
        : null;

    const { page, pageSize } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const [total, rows] = agentRow
      ? await Promise.all([
          prisma.payment.count({ where: { agentId: agentRow.id } }),
          prisma.payment.findMany({
            where: { agentId: agentRow.id },
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
          }),
        ])
      : [0, []];

    return c.json({
      data: rows.map((p) => ({
        id: p.id,
        type: p.type,
        status: p.status,
        amount: p.amount.toString(),
        currency: p.currency,
        reference: p.reference,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        paystackConfigured: paystackConfigured(),
      },
    });
  },
);

agentSubscriptionV1.post(
  "/checkout",
  zValidator("json", agentSubscriptionCheckoutBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    if (auth.role !== UserRole.agent) {
      throw new ApiError(403, "FORBIDDEN", "Agent checkout is only available for agent accounts");
    }

    const agentRow = await prisma.agent.findFirst({ where: { userId: auth.id, deletedAt: null } });
    if (!agentRow) throw new ApiError(404, "NOT_FOUND", "Agent profile not found");

    const body = c.req.valid("json");

    if (!paystackConfigured()) {
      throw new ApiError(
        503,
        "CHECKOUT_UNAVAILABLE",
        "Paystack is not configured (set PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY).",
      );
    }

    const reference = `agt_sub_${randomUUID().replace(/-/g, "")}`;
    return c.json({
      data: {
        mode: "stub" as const,
        plan: body.plan,
        reference,
        authorizationUrl: `https://paystack.com/pay/${encodeURIComponent(reference)}`,
        disclaimer:
          "Stub checkout URL until Paystack initialize transaction is wired; do not treat as a live charge.",
      },
    });
  },
);
