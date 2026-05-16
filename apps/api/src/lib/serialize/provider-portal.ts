import type { Prisma, ServiceProvider } from "@landshoppers/db";

import { serviceLabelsFromServicesOffered } from "../service-provider-offerings.js";

export function namesToServicesOfferedJson(names: string[]): Prisma.InputJsonValue {
  return names.map((name) => ({ name }));
}

function socialLinksJson(value: unknown): Record<string, string> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim().length > 0) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function serviceProviderProfileToJson(p: ServiceProvider) {
  return {
    id: p.id,
    userId: p.userId,
    businessName: p.businessName,
    slug: p.slug,
    category: p.category,
    description: p.description ?? null,
    services: serviceLabelsFromServicesOffered(p.servicesOffered),
    address: p.address ?? null,
    city: p.city,
    state: p.state,
    country: p.country,
    phone: p.phone ?? null,
    email: p.email ?? null,
    website: p.website ?? null,
    logoUrl: p.logoUrl ?? null,
    galleryImages: [...p.galleryImages],
    socialLinks: socialLinksJson(p.socialLinks),
    rating: p.rating,
    reviewCount: p.reviewCount,
    isVerified: p.isVerified,
    viewCount: p.viewCount,
    leadCount: p.leadCount,
    updatedAt: p.updatedAt.toISOString(),
  };
}
