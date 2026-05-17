import { z } from "zod";

import { providerVerificationLevelSchema } from "./provider-portal.js";

export const providerKycDocumentEntrySchema = z.object({
  type: z.string().min(1).max(64),
  label: z.string().max(200).optional(),
  externalUrl: z.string().url().max(2000),
  uploadedAt: z.string().optional(),
});

export const providerKycSchema = z.object({
  serviceProviderId: z.string().uuid(),
  verificationLevel: providerVerificationLevelSchema,
  isVerified: z.boolean(),
  licenseNumber: z.string().nullable(),
  licenseBody: z.string().nullable(),
  kycDocuments: z.array(providerKycDocumentEntrySchema).nullable(),
  checklist: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      complete: z.boolean(),
    }),
  ),
});

export const patchProviderKycBodySchema = z.object({
  licenseNumber: z.string().max(120).nullable().optional(),
  licenseBody: z.string().max(200).nullable().optional(),
  kycDocuments: z.array(providerKycDocumentEntrySchema).max(20).optional(),
});
