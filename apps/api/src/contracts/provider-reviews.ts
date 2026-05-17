import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const listProviderReviewsQuerySchema = paginationQuerySchema;

export const providerReviewRowSchema = z.object({
  id: z.string().uuid(),
  serviceLeadId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  title: z.string(),
  body: z.string(),
  isJobVerified: z.boolean(),
  providerResponse: z.string().nullable(),
  reviewerLabel: z.string(),
  createdAt: z.string(),
});

export const providerReviewIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const patchProviderReviewBodySchema = z.object({
  providerResponse: z.string().min(1).max(4000),
});
