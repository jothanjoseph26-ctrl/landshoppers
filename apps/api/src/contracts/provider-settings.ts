import { z } from "zod";

export const providerServicePreferencesSchema = z.object({
  autoAcknowledgeLeads: z.boolean().optional(),
  preferredSources: z.array(z.string().max(64)).max(12).optional(),
  defaultQuoteNote: z.string().max(500).nullable().optional(),
});

export const providerSettingsSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  businessName: z.string(),
  notifyEmail: z.boolean(),
  notifySms: z.boolean(),
  notifyPush: z.boolean(),
  preferences: z
    .object({
      serviceProvider: providerServicePreferencesSchema.optional(),
    })
    .nullable(),
});

export const patchProviderSettingsBodySchema = z.object({
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  preferences: z
    .object({
      serviceProvider: providerServicePreferencesSchema.optional(),
    })
    .nullable()
    .optional(),
});
