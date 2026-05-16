import { InquiryStatus, ProjectStatus, PropertyType } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";
import { projectIdParamSchema } from "./directory.js";

export const listDeveloperProjectsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const createDeveloperProjectBodySchema = z.object({
  name: z.string().min(1).max(200),
  propertyType: z.nativeEnum(PropertyType),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(120).default("Nigeria"),
  address: z.string().max(500).optional(),
  description: z.string().max(20_000).optional(),
  shortDescription: z.string().max(500).optional(),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  totalUnits: z.coerce.number().int().min(0).max(100_000).default(0),
  priceRangeMinKobo: z.string().regex(/^\d+$/).optional(),
  priceRangeMaxKobo: z.string().regex(/^\d+$/).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const patchDeveloperProjectBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    propertyType: z.nativeEnum(PropertyType).optional(),
    city: z.string().min(1).max(120).optional(),
    state: z.string().min(1).max(120).optional(),
    country: z.string().min(1).max(120).optional(),
    address: z.string().max(500).nullable().optional(),
    description: z.string().max(20_000).nullable().optional(),
    shortDescription: z.string().max(500).nullable().optional(),
    latitude: z.number().finite().nullable().optional(),
    longitude: z.number().finite().nullable().optional(),
    totalUnits: z.coerce.number().int().min(0).max(100_000).optional(),
    availableUnits: z.coerce.number().int().min(0).max(100_000).optional(),
    soldUnits: z.coerce.number().int().min(0).max(100_000).optional(),
    priceRangeMinKobo: z.string().regex(/^\d+$/).nullable().optional(),
    priceRangeMaxKobo: z.string().regex(/^\d+$/).nullable().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    virtualTourUrl: z.string().url().max(2000).nullable().optional(),
    brochureUrl: z.string().url().max(2000).nullable().optional(),
    completionDate: z.string().datetime().nullable().optional(),
  })
  .strict();

export const developerProjectIdParamSchema = projectIdParamSchema;

export const listDeveloperInquiriesQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(InquiryStatus).optional(),
});

/** GET /v1/me/developer/leads/digest — snapshot for email/UI. */
export const leadsDigestQuerySchema = z.object({
  period: z.enum(["week", "month", "all"]).default("week"),
});

/** POST /v1/me/developer/leads/digest/email — send digest to the signed-in developer. */
export const leadsDigestEmailBodySchema = z
  .object({
    period: z.enum(["week", "month", "all"]).default("week"),
  })
  .strict();
