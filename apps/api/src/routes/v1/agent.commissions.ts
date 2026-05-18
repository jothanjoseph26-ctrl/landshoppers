import { InquiryStatus, UserRole } from "@landshoppers/db";
import { Hono } from "hono";

import { ApiError } from "../../lib/errors.js";
import { tierFromAgentSubscription } from "../../lib/agent-portal-tier.js";
import { prisma } from "../../lib/prisma.js";
import { requireAgentOrDeveloper, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const agentCommissionsV1 = new Hono<ApiEnv>();

agentCommissionsV1.use("*", requireAuth, requireAgentOrDeveloper);

/** Heuristic commission rate until deal-close webhooks allocate real ledger rows. */
const COMMISSION_BPS = 250n;

agentCommissionsV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  if (auth.role !== UserRole.agent) {
    return c.json({
      data: {
        summary: {
          commissionEarnedKobo: "0",
          walletBalanceKobo: "0",
          pendingPayoutKobo: "0",
          paidOutKobo: "0",
          earningsAvailable: false,
          estimatedMonthlyNgKobo: null,
          tier: "free" as const,
        },
        transactions: [],
        closedDeals: [],
        disclaimer:
          "Commission tracking is for agent accounts. Developer billing uses the developer subscription portal.",
      },
    });
  }

  const agentRow = await prisma.agent.findFirst({
    where: { userId: auth.id, deletedAt: null },
  });
  if (!agentRow) throw new ApiError(404, "NOT_FOUND", "Agent profile not found");

  const sub = await prisma.subscription.findUnique({ where: { agentId: agentRow.id } });
  const tier = tierFromAgentSubscription(sub);
  const earningsAvailable = tier === "pro" || tier === "elite";

  const commissionEarned = agentRow.commissionEarned;
  const walletBalance = agentRow.walletBalance;
  const paidOutKobo =
    commissionEarned > walletBalance ? commissionEarned - walletBalance : 0n;
  const estimatedMonthlyNgKobo =
    earningsAvailable && commissionEarned > 0n
      ? (commissionEarned / 12n).toString()
      : earningsAvailable
        ? "0"
        : null;

  const [payments, closedInquiries] = await Promise.all([
    prisma.payment.findMany({
      where: { agentId: agentRow.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.inquiry.findMany({
      where: {
        agentId: agentRow.id,
        status: InquiryStatus.closed,
        closedAt: { not: null },
      },
      orderBy: { closedAt: "desc" },
      take: 25,
      include: {
        listing: { include: { property: true } },
      },
    }),
  ]);

  const transactions = payments.map((p) => ({
    id: p.id,
    type: p.type,
    status: p.status,
    amountKobo: p.amount.toString(),
    currency: p.currency,
    reference: p.reference,
    paidAt: p.paidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  const closedDeals = closedInquiries.map((inq) => {
    const price = inq.listing?.price ?? 0n;
    const estimated = price > 0n ? (price * COMMISSION_BPS) / 10000n : 0n;
    const payoutStatus: "accrued" | "paid" =
      estimated > 0n && walletBalance >= estimated ? "paid" : "accrued";
    return {
      id: inq.id,
      listingTitle: inq.listing?.property?.title ?? "Listing",
      closedAt: inq.closedAt!.toISOString(),
      estimatedCommissionKobo: estimated.toString(),
      payoutStatus,
    };
  });

  return c.json({
    data: {
      summary: {
        commissionEarnedKobo: commissionEarned.toString(),
        walletBalanceKobo: walletBalance.toString(),
        pendingPayoutKobo: walletBalance.toString(),
        paidOutKobo: paidOutKobo.toString(),
        earningsAvailable,
        estimatedMonthlyNgKobo,
        tier,
      },
      transactions,
      closedDeals,
      disclaimer:
        "Wallet totals come from your agent profile. Closed-deal rows use a 2.5% heuristic on listing price until Paystack payout webhooks post real commission ledger entries.",
    },
  });
});
