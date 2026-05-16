import { z } from "zod";

/** PATCH /v1/me/developer/settings — organisation profile (Developer row). */
export const patchDeveloperSettingsBodySchema = z
  .object({
    companyName: z.string().min(1).max(200).optional(),
    rcNumber: z.string().max(64).nullable().optional(),
    companyAddress: z.string().max(500).nullable().optional(),
    companyCity: z.string().max(120).nullable().optional(),
    companyState: z.string().max(120).nullable().optional(),
    companyPhone: z.string().max(40).nullable().optional(),
    companyEmail: z.string().email().max(320).nullable().optional(),
    companyWebsite: z
      .union([z.literal(""), z.string().url().max(2000)])
      .nullable()
      .optional(),
    description: z.string().max(20_000).nullable().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });
