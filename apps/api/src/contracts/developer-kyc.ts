import { DeveloperKycDocumentStatus, DeveloperKycDocumentType } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const kycDocumentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listDeveloperKycDocumentsQuerySchema = paginationQuerySchema.extend({
  projectId: z.string().uuid().optional(),
  status: z.nativeEnum(DeveloperKycDocumentStatus).optional(),
});

const httpsUrl = z.string().url().max(2000).refine((u) => /^https:\/\//i.test(u), {
  message: "externalUrl must use https",
});

export const createDeveloperKycDocumentBodySchema = z
  .object({
    documentType: z.nativeEnum(DeveloperKycDocumentType),
    projectId: z.string().uuid().optional(),
    title: z.string().max(200).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    fileName: z.string().min(1).max(255),
    mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
    byteSize: z.coerce.number().int().min(0).max(25_000_000).default(0),
    externalUrl: httpsUrl,
  })
  .strict();

export const patchDeveloperKycDocumentBodySchema = z
  .object({
    title: z.string().max(200).nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    externalUrl: httpsUrl.optional(),
  })
  .strict();
