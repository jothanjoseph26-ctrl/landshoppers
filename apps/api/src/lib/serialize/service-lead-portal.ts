import type { ServiceLead } from "@landshoppers/db";

import { maskPersonName } from "../mask-person-name.js";

function shortLocation(loc: string): string {
  const s = loc.trim();
  const seg = s.split(",")[0]?.trim();
  const raw = seg && seg.length > 0 ? seg : s;
  return raw.length > 48 ? `${raw.slice(0, 45)}…` : raw;
}

export function serviceLeadToProviderPortalJson(lead: ServiceLead) {
  return {
    id: lead.id,
    status: lead.status,
    source: lead.source,
    serviceRequested: lead.serviceRequested,
    message: lead.message,
    location: lead.location,
    timeline: lead.timeline ?? null,
    budgetKobo: lead.budget != null ? lead.budget.toString() : null,
    quotedAmountKobo: lead.quotedAmountKobo != null ? lead.quotedAmountKobo.toString() : null,
    finalAmountKobo: lead.finalAmountKobo != null ? lead.finalAmountKobo.toString() : null,
    clientNameMasked: maskPersonName(lead.clientName),
    clientPhone: lead.clientPhone,
    clientEmail: lead.clientEmail ?? null,
    aiScore: lead.aiScore ?? null,
    aiSummary: lead.aiSummary ?? null,
    listingId: lead.listingId ?? null,
    projectId: lead.projectId ?? null,
    bundleId: lead.bundleId ?? null,
    createdAt: lead.createdAt.toISOString(),
    respondedAt: lead.respondedAt?.toISOString() ?? null,
    completedAt: lead.completedAt?.toISOString() ?? null,
  };
}

export function serviceLeadToDashboardRecent(lead: ServiceLead) {
  return {
    id: lead.id,
    maskedClientLabel: `${maskPersonName(lead.clientName)} · ${shortLocation(lead.location)}`,
    serviceRequested: lead.serviceRequested,
    source: lead.source,
    aiScore: lead.aiScore ?? null,
    createdAt: lead.createdAt.toISOString(),
  };
}
