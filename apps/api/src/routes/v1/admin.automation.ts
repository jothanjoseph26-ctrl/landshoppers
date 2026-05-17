import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  adminAuditLogsQuerySchema,
  adminSettingsPatchSchema,
  adminSettingsSchema,
} from "../../contracts/admin-automation.js";
import { offsetFromPage } from "../../contracts/common.js";
import { writeAuditLog } from "../../lib/audit.js";
import { ApiError } from "../../lib/errors.js";
import {
  ensurePlatformSettings,
  platformSettingsToJson,
  PLATFORM_SETTINGS_ID,
} from "../../lib/platform-settings.js";
import { prisma } from "../../lib/prisma.js";
import { auditLogToJson } from "../../lib/serialize/audit-log.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const adminAutomationV1 = new Hono<ApiEnv>();

adminAutomationV1.use("*", requireAuth, requireAdmin);

adminAutomationV1.get(
  "/audit-logs",
  zValidator("query", adminAuditLogsQuerySchema),
  async (c) => {
    const { page, pageSize, action, actorId, from, to } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (from) createdAt.gte = new Date(from);
    if (to) createdAt.lte = new Date(to);

    const where = {
      ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
      ...(actorId ? { actorId } : {}),
      ...(from || to ? { createdAt } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return c.json({
      data: rows.map(auditLogToJson),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);

adminAutomationV1.get("/settings", async (c) => {
  const row = await ensurePlatformSettings();
  const snapshot = platformSettingsToJson(row);
  const parsed = adminSettingsSchema.safeParse(snapshot);
  if (!parsed.success) {
    throw new ApiError(500, "INTERNAL_ERROR", "Invalid platform settings snapshot");
  }
  return c.json({ data: parsed.data });
});

adminAutomationV1.patch(
  "/settings",
  zValidator("json", adminSettingsPatchSchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const body = c.req.valid("json");
    if (body.maintenanceMode === undefined && body.whatsappAutoApproveMinScore === undefined) {
      throw new ApiError(400, "VALIDATION_ERROR", "Provide at least one setting to update");
    }

    const before = await ensurePlatformSettings();
    const beforeJson = platformSettingsToJson(before);

    const updated = await prisma.platformSettings.update({
      where: { id: PLATFORM_SETTINGS_ID },
      data: {
        ...(body.maintenanceMode !== undefined
          ? { maintenanceMode: body.maintenanceMode }
          : {}),
        ...(body.whatsappAutoApproveMinScore !== undefined
          ? { whatsappAutoApproveMinScore: body.whatsappAutoApproveMinScore }
          : {}),
        updatedBy: authUser.id,
      },
    });

    const afterJson = platformSettingsToJson(updated);

    await writeAuditLog({
      actorId: authUser.id,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      action: "admin.settings.update",
      targetType: "platform_settings",
      targetId: null,
      changes: { before: beforeJson, after: afterJson },
      ipAddress: c.req.header("x-forwarded-for") ?? null,
      userAgent: c.req.header("user-agent") ?? null,
    });

    const parsed = adminSettingsSchema.safeParse(afterJson);
    if (!parsed.success) {
      throw new ApiError(500, "INTERNAL_ERROR", "Invalid platform settings snapshot");
    }
    return c.json({ data: parsed.data });
  },
);
