import { z } from "zod";

/** PATCH /v1/agent/settings — agency + profile notification prefs. */
export const patchAgentSettingsBodySchema = z
  .object({
    agencyName: z.string().min(1).max(200).nullable().optional(),
    licenseNumber: z.string().max(64).nullable().optional(),
    firstName: z.string().max(120).nullable().optional(),
    lastName: z.string().max(120).nullable().optional(),
    city: z.string().max(120).nullable().optional(),
    state: z.string().max(120).nullable().optional(),
    country: z.string().max(120).nullable().optional(),
    avatarUrl: z.string().url().max(2000).nullable().optional(),
    notifyEmail: z.boolean().optional(),
    notifySms: z.boolean().optional(),
    notifyPush: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });
