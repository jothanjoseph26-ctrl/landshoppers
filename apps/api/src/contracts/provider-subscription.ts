import { z } from "zod";

import { providerPortalTierSchema } from "./provider-portal.js";

export const providerSubscriptionCheckoutBodySchema = z.object({
  tier: z.enum(["pro", "elite"]),
});

export const providerSubscriptionSchema = z.object({
  serviceProviderId: z.string().uuid(),
  businessName: z.string(),
  tier: providerPortalTierSchema,
  usage: z.object({
    activeJobs: z.number().int().nonnegative(),
    completedJobs: z.number().int().nonnegative(),
    leadCount: z.number().int().nonnegative(),
    reviewCount: z.number().int().nonnegative(),
  }),
  limits: z.object({
    analyticsDepth: z.enum(["basic", "full"]),
    whatsappBridge: z.boolean(),
    contentStudio: z.boolean(),
  }),
  paystackConfigured: z.boolean(),
});
