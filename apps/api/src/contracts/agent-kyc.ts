import { z } from "zod";

export const agentKycDocumentEntrySchema = z.object({
  type: z.string().min(1).max(64),
  label: z.string().max(200).optional(),
  externalUrl: z.string().url().max(2000),
  uploadedAt: z.string().optional(),
});

export const agentKycSchema = z.object({
  agentId: z.string().uuid(),
  agencyName: z.string().nullable(),
  email: z.string().email(),
  licenseNumber: z.string().nullable(),
  kycStatus: z.string(),
  kycSubmittedAt: z.string().nullable(),
  kycVerifiedAt: z.string().nullable(),
  kycRejectionReason: z.string().nullable(),
  isVerified: z.boolean(),
  verificationBadge: z.boolean(),
  bvnOnFile: z.boolean(),
  ninOnFile: z.boolean(),
  kycDocuments: z.array(agentKycDocumentEntrySchema).nullable(),
  checklist: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      complete: z.boolean(),
    }),
  ),
});

export const patchAgentKycBodySchema = z
  .object({
    licenseNumber: z.string().max(120).nullable().optional(),
    kycDocuments: z.array(agentKycDocumentEntrySchema).max(20).optional(),
    submitForReview: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });
