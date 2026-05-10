import { InquirySource, InquiryStatus } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

/** Path id for inquiry mutations. */
export const inquiryIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Buyers (or anonymous web visitors with logged-in account) create inquiries on either
 * a listing OR a developer project. Exactly one target id is required.
 */
export const createInquiryBodySchema = z
  .object({
    listingId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    message: z.string().min(1).max(4000).optional(),
    buyerName: z.string().min(1).max(160).optional(),
    buyerEmail: z.string().email().optional(),
    buyerPhone: z.string().min(5).max(32).optional(),
    source: z.nativeEnum(InquirySource).optional().default(InquirySource.web),
  })
  .superRefine((val, ctx) => {
    if (!val.listingId && !val.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "listingId or projectId is required",
      });
    }
    if (val.listingId && val.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one of listingId or projectId may be provided",
      });
    }
  });

/** GET /v1/me/inquiries */
export const listMyInquiriesQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(InquiryStatus).optional(),
});

/** GET /v1/agent/inquiries */
export const listAgentInquiriesQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(InquiryStatus).optional(),
});

/** PATCH /v1/inquiries/:id */
export const updateInquiryStatusBodySchema = z.object({
  status: z.nativeEnum(InquiryStatus),
  closedReason: z.string().max(500).optional(),
});

export type CreateInquiryBody = z.infer<typeof createInquiryBodySchema>;
export type UpdateInquiryStatusBody = z.infer<typeof updateInquiryStatusBodySchema>;
