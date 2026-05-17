import { UserRole } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  adminUserIdParamSchema,
  listAdminUsersQuerySchema,
  patchAdminUserBodySchema,
} from "../../contracts/admin-users.js";
import { writeAuditLog } from "../../lib/audit.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const adminUsersV1 = new Hono<ApiEnv>();

adminUsersV1.use("*", requireAuth, requireAdmin);

function userToJson(row: {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
  profile: {
    firstName: string | null;
    lastName: string | null;
    city: string | null;
  } | null;
}) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    isEmailVerified: row.isEmailVerified,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    profile: row.profile
      ? {
          firstName: row.profile.firstName,
          lastName: row.profile.lastName,
          city: row.profile.city,
        }
      : null,
    flags: { suspended: row.deletedAt !== null },
  };
}

adminUsersV1.get("/", zValidator("query", listAdminUsersQuerySchema), async (c) => {
  const { page, pageSize, role, q, status } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where = {
    ...(role !== undefined ? { role } : {}),
    ...(status === "suspended" ? { deletedAt: { not: null } } : {}),
    ...(status === "active" ? { deletedAt: null } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { profile: { firstName: { contains: q, mode: "insensitive" as const } } },
            { profile: { lastName: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { profile: { select: { firstName: true, lastName: true, city: true } } },
    }),
  ]);

  return c.json({
    data: rows.map(userToJson),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

adminUsersV1.patch(
  "/:id",
  zValidator("param", adminUserIdParamSchema),
  zValidator("json", patchAdminUserBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    if (body.role !== undefined && auth.role !== UserRole.super_admin) {
      throw new ApiError(403, "FORBIDDEN", "Only super admins can change user roles");
    }

    const existing = await prisma.user.findFirst({
      where: { id },
      include: { profile: { select: { firstName: true, lastName: true, city: true } } },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "User not found");

    const data: { deletedAt?: Date | null; role?: UserRole } = {};
    if (body.suspended !== undefined) {
      data.deletedAt = body.suspended ? new Date() : null;
    }
    if (body.role !== undefined) data.role = body.role;

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { profile: { select: { firstName: true, lastName: true, city: true } } },
    });

    await writeAuditLog({
      actorId: auth.id,
      actorEmail: auth.email,
      actorRole: auth.role as UserRole,
      action: body.suspended !== undefined ? "admin.user.suspend" : "admin.user.update",
      targetType: "user",
      targetId: id,
      changes: {
        before: { role: existing.role, suspended: existing.deletedAt !== null },
        after: { role: updated.role, suspended: updated.deletedAt !== null },
      },
      ipAddress: c.req.header("x-forwarded-for") ?? null,
    });

    return c.json({ data: userToJson(updated) });
  },
);
