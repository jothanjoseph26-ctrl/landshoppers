import { z } from "zod";

import { agentPortalTierSchema } from "./agent-portal.js";

export const agentCommissionSummarySchema = z.object({
  commissionEarnedKobo: z.string(),
  walletBalanceKobo: z.string(),
  pendingPayoutKobo: z.string(),
  paidOutKobo: z.string(),
  earningsAvailable: z.boolean(),
  estimatedMonthlyNgKobo: z.string().nullable(),
  tier: agentPortalTierSchema,
});

export const agentCommissionTransactionSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  amountKobo: z.string(),
  currency: z.string(),
  reference: z.string(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
});

export const agentCommissionDealSchema = z.object({
  id: z.string().uuid(),
  listingTitle: z.string(),
  closedAt: z.string(),
  estimatedCommissionKobo: z.string(),
  payoutStatus: z.enum(["accrued", "paid"]),
});

export const agentCommissionsResponseSchema = z.object({
  summary: agentCommissionSummarySchema,
  transactions: z.array(agentCommissionTransactionSchema),
  closedDeals: z.array(agentCommissionDealSchema),
  disclaimer: z.string(),
});
