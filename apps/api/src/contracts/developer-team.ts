import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const developerTeamRoleSchema = z.enum(["admin", "sales", "marketing", "viewer"]);

export type DeveloperTeamRole = z.infer<typeof developerTeamRoleSchema>;

export const teamMemberUserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const patchTeamMemberBodySchema = z
  .object({
    role: developerTeamRoleSchema.optional(),
    isDisabled: z.boolean().optional(),
  })
  .strict()
  .refine((b) => b.role !== undefined || b.isDisabled !== undefined, {
    message: "At least one of role, isDisabled is required",
  });

export const createDeveloperInviteBodySchema = z
  .object({
    email: z.string().trim().email().max(320),
    role: developerTeamRoleSchema,
    projectIds: z.array(z.string().uuid()).max(64).optional(),
  })
  .strict();

export const developerInviteIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listTeamActivityQuerySchema = paginationQuerySchema;
