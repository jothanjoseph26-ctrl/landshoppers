import { z } from "zod";

/** PATCH /v1/me/settings — profile + notification preferences. */
export const patchMeSettingsBodySchema = z
  .object({
    firstName: z.string().max(120).nullable().optional(),
    lastName: z.string().max(120).nullable().optional(),
    city: z.string().max(120).nullable().optional(),
    state: z.string().max(120).nullable().optional(),
    country: z.string().max(120).nullable().optional(),
    avatarUrl: z.string().url().max(2000).nullable().optional(),
    phone: z.string().max(40).nullable().optional(),
    notifyEmail: z.boolean().optional(),
    notifySms: z.boolean().optional(),
    notifyPush: z.boolean().optional(),
    preferences: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });
