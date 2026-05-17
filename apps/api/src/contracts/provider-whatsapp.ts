import { z } from "zod";

export const providerWhatsappSchema = z.object({
  connected: z.boolean(),
  phoneNumber: z.string().nullable(),
  evolutionEnabled: z.boolean(),
  monitoredGroups: z.array(z.string()),
  extractedLeadsCount: z.number().int().nonnegative(),
  status: z.enum(["connected", "disconnected", "error"]).nullable(),
  lastActiveAt: z.string().nullable(),
});

export const patchProviderWhatsappBodySchema = z.object({
  connected: z.boolean().optional(),
  phoneNumber: z.string().max(32).nullable().optional(),
});
