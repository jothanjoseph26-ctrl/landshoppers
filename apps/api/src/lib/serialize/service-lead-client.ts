import type { ServiceCategory, ServiceLead } from "@landshoppers/db";

export function serviceLeadToClientJson(
  lead: ServiceLead,
  provider: { id: string; businessName: string; slug: string; category: ServiceCategory },
) {
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
    createdAt: lead.createdAt.toISOString(),
    respondedAt: lead.respondedAt?.toISOString() ?? null,
    completedAt: lead.completedAt?.toISOString() ?? null,
    provider: {
      id: provider.id,
      businessName: provider.businessName,
      slug: provider.slug,
      category: provider.category,
    },
  };
}
