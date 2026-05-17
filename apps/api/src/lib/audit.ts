import type { Prisma, UserRole } from "@landshoppers/db";

import { prisma } from "./prisma.js";

export type WriteAuditLogInput = {
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  changes?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      changes: input.changes,
      metadata: input.metadata,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
