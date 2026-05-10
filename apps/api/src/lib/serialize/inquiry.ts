import type { Inquiry } from "@landshoppers/db";

export function inquiryToJson(row: Inquiry) {
  return {
    id: row.id,
    listingId: row.listingId,
    projectId: row.projectId,
    buyerId: row.buyerId,
    agentId: row.agentId,
    source: row.source,
    status: row.status,
    message: row.message,
    buyerName: row.buyerName,
    buyerEmail: row.buyerEmail,
    buyerPhone: row.buyerPhone,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    closedAt: row.closedAt?.toISOString() ?? null,
    closedReason: row.closedReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
