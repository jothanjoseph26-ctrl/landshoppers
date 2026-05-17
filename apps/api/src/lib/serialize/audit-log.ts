import type { AuditLog, UserRole } from "@landshoppers/db";

const PREVIEW_MAX = 160;

function previewChanges(changes: unknown): string | null {
  if (changes == null) return null;
  try {
    const text = JSON.stringify(changes);
    if (text.length <= PREVIEW_MAX) return text;
    return `${text.slice(0, PREVIEW_MAX)}…`;
  } catch {
    return null;
  }
}

export function auditLogToJson(row: AuditLog) {
  return {
    id: row.id,
    action: row.action,
    actorEmail: row.actorEmail,
    actorRole: row.actorRole as UserRole | null,
    targetType: row.targetType,
    targetId: row.targetId,
    createdAt: row.createdAt.toISOString(),
    changesPreview: previewChanges(row.changes),
  };
}
