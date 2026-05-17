import { ServiceLeadStatus } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";
import { providerLeadRowSchema } from "./provider-portal.js";

export const PROVIDER_JOB_STATUSES = [
  ServiceLeadStatus.quoted,
  ServiceLeadStatus.negotiating,
  ServiceLeadStatus.accepted,
  ServiceLeadStatus.completed,
  ServiceLeadStatus.cancelled,
] as const;

export const listProviderJobsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PROVIDER_JOB_STATUSES).optional(),
});

export const providerJobRowSchema = providerLeadRowSchema;

export const patchProviderJobBodySchema = z.object({
  status: z.nativeEnum(ServiceLeadStatus),
});

export const providerJobIdParamSchema = z.object({
  id: z.string().uuid(),
});
