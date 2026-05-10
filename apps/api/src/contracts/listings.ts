import { ListingStatus, PropertyType } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

/** GET /v1/listings */
export const listListingsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ListingStatus).optional(),
});

export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;

/** GET /v1/listings/:id */
export const listingIdParamSchema = z.object({
  id: z.string().uuid(),
});

/** POST /v1/listings — draft listing + property (price in kobo as decimal string for JSON safety). */
export const createListingBodySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(8000).optional(),
  propertyType: z.nativeEnum(PropertyType),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().max(120).optional().default("Nigeria"),
  address: z.string().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  toilets: z.number().int().optional(),
  squareMeters: z.number().optional(),
  priceKobo: z.string().regex(/^\d+$/),
  priceNegotiable: z.boolean().optional().default(false),
  isForSale: z.boolean().default(true),
  isForRent: z.boolean().default(false),
  rentPeriod: z.string().max(32).optional(),
});

export type CreateListingBody = z.infer<typeof createListingBodySchema>;

/** PATCH /v1/listings/:id — editable listing/property fields for owner/admin. */
export const updateListingBodySchema = createListingBodySchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required",
  });

/** POST /v1/listings/:id/status — explicit lifecycle transition. */
export const updateListingStatusBodySchema = z.object({
  status: z.nativeEnum(ListingStatus),
});

export type UpdateListingBody = z.infer<typeof updateListingBodySchema>;
export type UpdateListingStatusBody = z.infer<typeof updateListingStatusBodySchema>;
