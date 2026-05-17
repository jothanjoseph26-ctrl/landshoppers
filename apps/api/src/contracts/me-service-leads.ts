import { ServiceCategory, ServiceLeadSource, ServiceLeadStatus } from "@landshoppers/db";
import { z } from "zod";

/** GET /v1/me/service-leads — response item (must match serviceLeadToClientJson). */
export const meServiceLeadRowSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ServiceLeadStatus),
  source: z.nativeEnum(ServiceLeadSource),
  serviceRequested: z.string(),
  message: z.string(),
  location: z.string(),
  timeline: z.string().nullable(),
  budgetKobo: z.string().nullable(),
  quotedAmountKobo: z.string().nullable(),
  finalAmountKobo: z.string().nullable(),
  createdAt: z.string().datetime(),
  respondedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  provider: z.object({
    id: z.string().uuid(),
    businessName: z.string(),
    slug: z.string(),
    category: z.nativeEnum(ServiceCategory),
  }),
});

export const meServiceLeadsListResponseSchema = z.object({
  data: z.array(meServiceLeadRowSchema),
});

export type MeServiceLeadRow = z.infer<typeof meServiceLeadRowSchema>;

/** POST /v1/me/service-leads/:leadId/review — logged-in client only; lead must be completed. */
export const meServiceLeadReviewParamSchema = z.object({
  leadId: z.string().uuid(),
});

export const postMeServiceLeadReviewBodySchema = z.object({
  overallRating: z.number().int().min(1).max(5),
  qualityRating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5),
  timelinessRating: z.number().int().min(1).max(5),
  valueRating: z.number().int().min(1).max(5),
  title: z.string().min(2).max(100),
  body: z.string().min(10).max(2000),
});

export type PostMeServiceLeadReviewBody = z.infer<typeof postMeServiceLeadReviewBodySchema>;
