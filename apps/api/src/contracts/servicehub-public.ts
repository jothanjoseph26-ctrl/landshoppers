import { ServiceBundleTrigger, ServiceLeadStatus, ServiceCategory } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

/** GET /v1/services — public directory (spec §3.1). */
export const listPublicServicesQuerySchema = paginationQuerySchema.extend({
  category: z.nativeEnum(ServiceCategory).optional(),
  state: z.string().min(1).max(120).optional(),
  /** LGA / area filter — matches `serviceAreas` text or city (MVP). */
  lga: z.string().min(1).max(120).optional(),
  verified: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  rating_min: z.coerce.number().min(0).max(5).optional(),
  keyword: z.string().min(1).max(120).optional(),
  lat: z.coerce.number().gte(-90).lte(90).optional(),
  lng: z.coerce.number().gte(-180).lte(180).optional(),
  radius_km: z.coerce.number().positive().max(200).optional(),
  sort: z
    .enum(["recommended", "rating", "jobs", "newest", "response"])
    .optional()
    .default("recommended"),
  /** Alias for `pageSize` (spec §3.1). */
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type ListPublicServicesQuery = z.infer<typeof listPublicServicesQuerySchema>;

/** GET /v1/services — directory list row (map pins use optional lat/lng from PostGIS geom). */
export const publicServiceProviderListRowSchema = z.object({
  id: z.string().uuid(),
  businessName: z.string(),
  slug: z.string(),
  category: z.nativeEnum(ServiceCategory),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

/** Categories from `categories[]=a&categories[]=b` or single comma-separated `categories=`. Omit → sensible defaults server-side. */
const matchCategoriesPreprocess = z.preprocess((val) => {
  if (val === undefined || val === null) return undefined;
  return (Array.isArray(val) ? val : [val]).flatMap((x) =>
    String(x)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}, z.array(z.nativeEnum(ServiceCategory)).optional());

/** GET /v1/services/match (§3.3 Sprint B — Redis cache + Postgres candidates). */
export const servicesMatchQuerySchema = z.object({
  listingId: z.string().uuid(),
  categories: matchCategoriesPreprocess,
  sub_categories: z
    .string()
    .max(600)
    .optional()
    .transform((s) =>
      s
        ? s
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : undefined,
    ),
});

/** @deprecated Prefer `servicesMatchQuerySchema`; kept for parity with handlers. */
export const serviceMatchQuerySchema = servicesMatchQuerySchema;

export type ServiceMatchQuery = z.infer<typeof servicesMatchQuerySchema>;


/** Review list — accepts `limit` alias (web client) alongside `page` / `pageSize`. §3.1 filters: rating (min stars), verified_only. */
export const serviceProviderReviewsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(30).optional(),
    limit: z.coerce.number().int().min(1).max(30).optional(),
    /** Minimum overall star rating (1–5). */
    rating: z.coerce.number().int().min(1).max(5).optional(),
    verified_only: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  })
  .transform(({ page, pageSize, limit, rating, verified_only }) => ({
    page,
    pageSize: limit ?? pageSize ?? 10,
    rating,
    verified_only,
  }));

/** POST /v1/services/:slug/quote */
export const postServiceQuoteBodySchema = z
  .object({
    clientName: z.string().min(2).max(120),
    clientPhone: z.string().min(5).max(32),
    clientEmail: z.string().email().max(255).optional(),
    message: z.string().min(1).max(2000),
    serviceRequested: z.string().min(1).max(200),
    listingId: z.string().uuid().optional(),
    timeline: z.string().max(200).optional(),
    budgetKobo: z.string().regex(/^[0-9]+$/).max(24).optional(),
    /** Required when omitting listingId — free-text place context for directory quotes. */
    location: z.string().min(2).max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.listingId && !data.location?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "location is required when listingId is omitted",
        path: ["location"],
      });
    }
  });

export type PostServiceQuoteBody = z.infer<typeof postServiceQuoteBodySchema>;

/** POST /v1/services/bundles/:id/activate (spec §3.1) — requires Authorization. */
export const postActivateBundleParamSchema = z.object({
  id: z.string().uuid(),
});

export const postActivateBundleBodySchema = z
  .object({
    listingId: z.string().uuid().optional(),
    developerProjectId: z.string().uuid().optional(),
    location: z.string().min(2).max(500).optional(),
    clientName: z.string().min(2).max(120),
    clientPhone: z.string().min(5).max(32),
    clientEmail: z.string().email().max(255).optional(),
    message: z.string().min(1).max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.listingId && !data.location?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "location is required when listingId is omitted",
        path: ["location"],
      });
    }
  });

export type PostActivateBundleBody = z.infer<typeof postActivateBundleBodySchema>;

/** GET /v1/services/bundles — list row */
export const publicServiceBundleRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  categories: z.array(z.nativeEnum(ServiceCategory)),
  priceFromKobo: z.string(),
  priceToKobo: z.string(),
  triggerContext: z.nativeEnum(ServiceBundleTrigger),
  activationCount: z.number().int().nonnegative(),
});

/** PATCH /v1/admin/services/providers/:id (verification) */
export const adminPatchServiceProviderParamSchema = z.object({
  id: z.string().uuid(),
});

export const adminPatchServiceProviderBodySchema = z
  .object({
    verificationLevel: z.enum(["basic", "standard", "professional", "elite"]).optional(),
    isVerified: z.boolean().optional(),
  })
  .refine((b) => b.verificationLevel !== undefined || b.isVerified !== undefined, {
    message: "Provide verificationLevel and/or isVerified",
  });

export const serviceMatchGroupSchema = z.object({
  category: z.string(),
  label: z.string(),
  providers: z.array(z.record(z.string(), z.unknown())),
});

export const serviceMatchResponseSchema = z.object({
  data: z.object({
    listingId: z.string().uuid(),
    groups: z.array(serviceMatchGroupSchema),
    computedAt: z.string(),
    cached: z.boolean(),
    areaLabel: z.string().optional(),
    bundleUpsell: z.null().optional(),
  }),
});

export const serviceQuoteCreatedSchema = z.object({
  leadId: z.string().uuid(),
  status: z.nativeEnum(ServiceLeadStatus),
});

export const servicePublicReviewSchema = z.object({
  id: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  title: z.string(),
  body: z.string(),
  isJobVerified: z.boolean(),
  providerResponse: z.string().nullable(),
  createdAt: z.string(),
  reviewerLabel: z.literal("verified_client"),
});

/** GET /v1/admin/services/providers */
export const adminListServiceProvidersQuerySchema = paginationQuerySchema.extend({
  tier: z.enum(["free", "pro", "elite"]).optional(),
  verification: z.enum(["basic", "standard", "professional", "elite"]).optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  city: z.string().min(1).max(120).optional(),
});
