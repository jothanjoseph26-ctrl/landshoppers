import { z } from "zod";

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
