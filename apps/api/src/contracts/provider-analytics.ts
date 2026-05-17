import { z } from "zod";

import { providerPortalTierSchema } from "./provider-portal.js";

export const providerAnalyticsPeriodSchema = z.enum(["week", "month", "quarter", "all"]);

export const providerAnalyticsSummaryQuerySchema = z.object({
  period: providerAnalyticsPeriodSchema.default("month"),
});

export const providerAnalyticsSummarySchema = z.object({
  period: providerAnalyticsPeriodSchema,
  tier: providerPortalTierSchema,
  analyticsDepth: z.enum(["basic", "full"]),
  kpis: z.object({
    totalLeads: z.number().int().nonnegative(),
    jobsInProgress: z.number().int().nonnegative(),
    funnel: z.object({
      quoted: z.number().int().nonnegative(),
      negotiating: z.number().int().nonnegative(),
      accepted: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
      cancelled: z.number().int().nonnegative(),
    }),
    revenueQuotedKobo: z.string(),
    revenueFinalKobo: z.string(),
    medianResponseHours: z.number().nullable(),
    leadsByDay: z.array(z.object({ date: z.string(), count: z.number().int().nonnegative() })),
  }),
});
