import { PropertyType } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

const bigintFromQuery = z
  .string()
  .regex(/^\d+$/, "Must be a non-negative integer string")
  .transform((s) => BigInt(s));

export const listingSortSchema = z
  .enum(["newest", "price_asc", "price_desc", "relevance"])
  .default("newest");

export const listingTypeFilterSchema = z.enum(["sale", "rent", "both"]).optional();

/** Facets + listing search (OpenSearch when available, else Postgres). */
export const listingsSearchQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(120).optional(),
  neighborhood: z.string().min(1).max(120).optional(),
  state: z.string().min(1).max(120).optional(),
  minPrice: bigintFromQuery.optional(),
  maxPrice: bigintFromQuery.optional(),
  minBeds: z.coerce.number().int().min(0).max(50).optional(),
  maxBeds: z.coerce.number().int().min(0).max(50).optional(),
  minBaths: z.coerce.number().int().min(0).max(50).optional(),
  maxBaths: z.coerce.number().int().min(0).max(50).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  listingType: listingTypeFilterSchema,
  sort: listingSortSchema,
  facets: z.coerce.boolean().optional().default(true),
  /** `auto` tries OpenSearch then falls back; `postgres` forces DB; `opensearch` forces index (errors if down). */
  backend: z.enum(["auto", "postgres", "opensearch"]).optional().default("auto"),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
}).superRefine((val, ctx) => {
  const geoCount = [val.lat, val.lng, val.radiusKm].filter((x) => x !== undefined).length;
  if (geoCount !== 0 && geoCount !== 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "lat, lng, and radiusKm must all be provided together for radius listing search",
    });
  }
});

export type ListingsSearchQuery = z.infer<typeof listingsSearchQuerySchema>;

/** GET /v1/search/map — geo payload for map clients (PostGIS). */
export const mapSearchQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(500).default(150),
    minLng: z.coerce.number().min(-180).max(180),
    minLat: z.coerce.number().min(-90).max(90),
    maxLng: z.coerce.number().min(-180).max(180),
    maxLat: z.coerce.number().min(-90).max(90),
    centerLat: z.coerce.number().min(-90).max(90).optional(),
    centerLng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().max(500).optional(),
    minPrice: bigintFromQuery.optional(),
    maxPrice: bigintFromQuery.optional(),
    propertyType: z.nativeEnum(PropertyType).optional(),
    listingType: listingTypeFilterSchema,
  })
  .superRefine((v, ctx) => {
    if (v.minLng >= v.maxLng) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "minLng must be < maxLng" });
    if (v.minLat >= v.maxLat) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "minLat must be < maxLat" });
    const r = [v.radiusKm, v.centerLat, v.centerLng].filter((x) => x !== undefined).length;
    if (r !== 0 && r !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "centerLat, centerLng, and radiusKm must be provided together for circular map search",
      });
    }
  });

export type MapSearchQuery = z.infer<typeof mapSearchQuerySchema>;

export const autocompleteQuerySchema = z.object({
  q: z.string().min(1).max(80),
  backend: z.enum(["auto", "postgres", "opensearch"]).optional().default("auto"),
});

export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;

export const similarListingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(6),
});

export type SimilarListingsQuery = z.infer<typeof similarListingsQuerySchema>;

export const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
