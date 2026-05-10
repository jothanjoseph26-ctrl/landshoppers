import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

/** Path param: `:listingId`. */
export const listingIdPathSchema = z.object({
  listingId: z.string().uuid(),
});

/** GET /v1/me/saved-listings */
export const listSavedListingsQuerySchema = paginationQuerySchema;

/** GET /v1/me/recent-listings */
export const listRecentListingsQuerySchema = paginationQuerySchema;

/** Saved-search filters payload — kept loose; matches `apps/api/src/contracts/search.ts`. */
export const savedSearchFiltersSchema = z
  .object({
    q: z.string().max(200).optional(),
    city: z.string().max(120).optional(),
    state: z.string().max(120).optional(),
    minPrice: z.string().regex(/^\d+$/).optional(),
    maxPrice: z.string().regex(/^\d+$/).optional(),
    propertyType: z.string().max(40).optional(),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    isForSale: z.boolean().optional(),
    isForRent: z.boolean().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    radiusKm: z.number().positive().max(500).optional(),
  })
  .partial()
  .strict();

export const alertFrequencySchema = z.enum(["instant", "daily", "weekly"]);

/** POST /v1/me/saved-searches */
export const createSavedSearchBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  filters: savedSearchFiltersSchema,
  emailAlerts: z.boolean().optional().default(true),
  alertFrequency: alertFrequencySchema.optional().default("daily"),
});

/** PATCH /v1/me/saved-searches/:id */
export const updateSavedSearchBodySchema = z
  .object({
    name: z.string().min(1).max(120).nullable().optional(),
    filters: savedSearchFiltersSchema.optional(),
    emailAlerts: z.boolean().optional(),
    alertFrequency: alertFrequencySchema.optional(),
  })
  .refine((b) => Object.keys(b).length > 0, {
    message: "At least one field is required",
  });

export const savedSearchIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateSavedSearchBody = z.infer<typeof createSavedSearchBodySchema>;
export type UpdateSavedSearchBody = z.infer<typeof updateSavedSearchBodySchema>;
export type SavedSearchFilters = z.infer<typeof savedSearchFiltersSchema>;
