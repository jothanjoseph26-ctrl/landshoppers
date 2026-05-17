import { UserRole } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

const uuid = z.string().uuid();

export const listAdminUsersQuerySchema = paginationQuerySchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  q: z.string().max(200).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export const adminUserIdParamSchema = z.object({
  id: uuid,
});

export const patchAdminUserBodySchema = z
  .object({
    suspended: z.boolean().optional(),
    role: z.nativeEnum(UserRole).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });
