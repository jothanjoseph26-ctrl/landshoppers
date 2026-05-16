import { z } from "zod";

export const agentPortalTierSchema = z.enum(["free", "pro", "elite"]);

export const agentPortalContextDataSchema = z.object({
  persona: z.enum(["agent", "developer"]),
  userId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  agencyName: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  tier: agentPortalTierSchema,
  subscriptionPlan: z.string().nullable(),
  subscriptionStatus: z.string().nullable(),
  rating: z.number().nullable(),
  reviewCount: z.number().int().nullable(),
  verification: z.object({
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
    bvnOnFile: z.boolean(),
    agentVerifiedBadge: z.boolean(),
    kycStatus: z.string(),
  }),
  paystackConfigured: z.boolean(),
  featureFlags: z.object({
    agentWhatsappEnabled: z.boolean(),
    agentAiInsightsEnabled: z.boolean(),
  }),
});

export const agentPortalKpiTrendSchema = z.object({
  value: z.number().int().nonnegative(),
  priorValue: z.number().int().nonnegative().nullable(),
  changePercent: z.number().nullable(),
});

export const agentPortalDashboardDataSchema = z.object({
  tier: agentPortalTierSchema,
  limits: z.object({
    maxActiveListings: z.number().int().positive().nullable(),
    maxLeadsPerMonth: z.number().int().positive().nullable(),
    maxAiDescriptionGenerationsPerDay: z.number().int().positive().nullable(),
    maxWhatsappConnections: z.number().int().nonnegative().nullable(),
  }),
  usage: z.object({
    activeListings: z.number().int().nonnegative(),
    inquiriesThisMonth: z.number().int().nonnegative(),
  }),
  kpis: z.object({
    activeListings: agentPortalKpiTrendSchema,
    hotLeads: z.object({
      count: z.number().int().nonnegative(),
      leadScoringAvailable: z.boolean(),
    }),
    whatsappMessagesToday: z.object({
      count: z.number().int().nonnegative(),
      bridgeConnected: z.boolean(),
    }),
    viewsThisWeek: agentPortalKpiTrendSchema,
    conversionLast30d: z.object({
      responded: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
      ratePercent: z.number().nullable(),
    }),
    estimatedMonthlyEarningsNgKobo: z.string().nullable(),
    earningsAvailable: z.boolean(),
  }),
  upcomingTours: z.array(
    z.object({
      id: z.string().uuid(),
      listingId: z.string().uuid(),
      propertyTitle: z.string(),
      buyerLabel: z.string(),
      preferredDate: z.string(),
      preferredTime: z.string().nullable(),
      tourType: z.string(),
      status: z.string(),
    }),
  ),
});

export const listAgentToursQuerySchema = z
  .object({
    upcoming: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
  })
  .strict();

export const agentMessageThreadIdParamSchema = z.object({
  threadId: z.string().uuid(),
});

export const sendAgentMessageBodySchema = z
  .object({
    threadId: z.string().uuid().optional(),
    receiverId: z.string().uuid(),
    content: z.string().min(1).max(8000),
  })
  .strict();
