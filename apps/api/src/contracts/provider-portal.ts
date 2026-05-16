import {
  ServiceCategory,
  ServiceLeadSource,
  ServiceLeadStatus,
} from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

/** UI + billing tier (`subscriptionTier` on service_providers; §7). */
export const providerPortalTierSchema = z.enum(["free", "pro", "elite"]);

export type ProviderPortalTier = z.infer<typeof providerPortalTierSchema>;

export const providerVerificationLevelSchema = z.enum([
  "basic",
  "standard",
  "professional",
  "elite",
]);

export type ProviderVerificationLevel = z.infer<typeof providerVerificationLevelSchema>;

/** GET /v1/provider/context */
export const providerPortalContextSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  businessName: z.string(),
  category: z.nativeEnum(ServiceCategory),
  city: z.string(),
  state: z.string(),
  logoUrl: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  tier: providerPortalTierSchema,
  verificationLevel: providerVerificationLevelSchema,
  isVerified: z.boolean(),
  featureFlags: z.object({
    providerWhatsappEnabled: z.boolean(),
  }),
});

/** GET /v1/provider/dashboard */
export const providerPortalDashboardSchema = z.object({
  tier: providerPortalTierSchema,
  businessName: z.string(),
  category: z.nativeEnum(ServiceCategory),
  kpis: z.object({
    newLeadsToday: z.number().int().nonnegative(),
    newLeadsPulse: z.boolean(),
    hotLeads: z.object({
      count: z.number().int().nonnegative(),
      leadScoringAvailable: z.boolean(),
    }),
    jobsInProgress: z.number().int().nonnegative(),
    profileViewsWeek: z.object({
      value: z.number().int().nonnegative(),
      priorValue: z.number().int().nonnegative().nullable(),
      changePercent: z.number().nullable(),
    }),
    matchAppearancesWeek: z.number().int().nonnegative().nullable(),
  }),
  trust: z.object({
    rating: z.number(),
    reviewCount: z.number().int().nonnegative(),
    leadCount: z.number().int().nonnegative(),
    aiMatchScore: z.number().nullable(),
  }),
  recentLeads: z.array(
    z.object({
      id: z.string(),
      maskedClientLabel: z.string(),
      serviceRequested: z.string(),
      source: z.string(),
      aiScore: z.number().nullable(),
      createdAt: z.string(),
    }),
  ),
  insights: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["response", "growth", "verification", "portfolio"]),
      title: z.string(),
      body: z.string(),
      severity: z.enum(["info", "warning", "success"]),
    }),
  ),
});

/** GET /v1/provider/profile */
export const providerProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  businessName: z.string(),
  slug: z.string(),
  category: z.nativeEnum(ServiceCategory),
  description: z.string().nullable(),
  services: z.array(z.string()),
  address: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  logoUrl: z.string().nullable(),
  galleryImages: z.array(z.string()),
  socialLinks: z.record(z.string(), z.string()).nullable(),
  rating: z.number(),
  reviewCount: z.number().int(),
  isVerified: z.boolean(),
  viewCount: z.number().int(),
  leadCount: z.number().int(),
  updatedAt: z.string(),
});

/** PATCH /v1/provider/profile */
export const patchProviderProfileBodySchema = z.object({
  category: z.nativeEnum(ServiceCategory).optional(),
  businessName: z.string().min(2).max(160).optional(),
  description: z.string().max(2000).nullable().optional(),
  services: z.array(z.string().min(1).max(200)).max(40).optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(100).optional(),
  country: z.string().min(2).max(100).optional(),
  phone: z.string().max(32).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  socialLinks: z.record(z.string(), z.string().max(500)).nullable().optional(),
});

export type PatchProviderProfileBody = z.infer<typeof patchProviderProfileBodySchema>;

/** GET /v1/provider/leads */
export const listProviderLeadsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ServiceLeadStatus).optional(),
  source: z.nativeEnum(ServiceLeadSource).optional(),
});

/** PATCH /v1/provider/leads/:id */
export const providerLeadIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const patchProviderLeadBodySchema = z
  .object({
    status: z.nativeEnum(ServiceLeadStatus).optional(),
    quotedAmountKobo: z.string().regex(/^\d+$/).optional(),
  })
  .refine((b) => b.status !== undefined || b.quotedAmountKobo !== undefined, {
    message: "Provide status and/or quotedAmountKobo",
  });

/** Row returned by GET /v1/provider/leads (authenticated provider). */
export const providerLeadRowSchema = z.object({
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
  clientNameMasked: z.string(),
  clientPhone: z.string(),
  clientEmail: z.string().nullable(),
  aiScore: z.number().nullable(),
  aiSummary: z.string().nullable(),
  listingId: z.string().uuid().nullable(),
  projectId: z.string().uuid().nullable(),
  bundleId: z.string().uuid().nullable(),
  createdAt: z.string(),
  respondedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

/** POST /v1/provider/availability — upsert day row (UTC date). */
export const postProviderAvailabilityBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isAvailable: z.boolean(),
  note: z.string().max(500).nullable().optional(),
});
