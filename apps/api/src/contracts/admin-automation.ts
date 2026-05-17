import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const adminAuditLogsQuerySchema = paginationQuerySchema.extend({
  action: z.string().min(1).max(200).optional(),
  actorId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const adminSettingsPatchSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  whatsappAutoApproveMinScore: z.number().min(0).max(1).nullable().optional(),
});

export const adminWhatsappSummarySchema = z.object({
  pending: z.number().int().nonnegative(),
  processed: z.number().int().nonnegative(),
  approvedToday: z.number().int().nonnegative(),
});

export const adminSeoSummarySchema = z.object({
  draft: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
  pendingPost: z.number().int().nonnegative(),
});

export const adminAuditLogItemSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  actorEmail: z.string().nullable(),
  actorRole: z.string().nullable(),
  targetType: z.string().nullable(),
  targetId: z.string().uuid().nullable(),
  createdAt: z.string(),
  changesPreview: z.string().nullable(),
});

export const adminSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  whatsappAutoApproveMinScore: z.number().nullable(),
  paystackConfigured: z.boolean(),
  resendConfigured: z.boolean(),
  whatsappDefaultListingUserId: z.string().nullable(),
  featureFlags: z.object({
    agentWhatsappEnabled: z.boolean(),
    agentAiInsightsEnabled: z.boolean(),
    providerWhatsappEnabled: z.boolean(),
  }),
  patchSupported: z.boolean(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().uuid().nullable(),
});
