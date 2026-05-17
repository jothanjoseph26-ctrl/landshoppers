import type { ServiceProvider } from "@landshoppers/db";

import { serviceLabelsFromServicesOffered } from "../service-provider-offerings.js";

function isPaidTier(tier: string): boolean {
  return tier === "pro" || tier === "elite";
}

export type ServiceProviderListCoords = {
  latitude: number | null;
  longitude: number | null;
};

/** Public directory row — includes legacy `services` / `isPremium` for existing web components. */
export function serviceProviderPublicListItem(
  p: ServiceProvider,
  coords?: ServiceProviderListCoords,
) {
  const services = serviceLabelsFromServicesOffered(p.servicesOffered);
  const tier = p.subscriptionTier;
  return {
    id: p.id,
    businessName: p.businessName,
    slug: p.slug,
    category: p.category,
    subCategories: [...p.subCategories],
    description: p.description ?? null,
    city: p.city,
    state: p.state,
    serviceAreas: [...p.serviceAreas],
    phone: p.phone ?? null,
    email: p.email ?? null,
    website: p.website ?? null,
    logoUrl: p.logoUrl ?? null,
    rating: p.rating,
    reviewCount: p.reviewCount,
    completedJobCount: p.completedJobCount,
    isVerified: p.isVerified,
    verificationLevel: p.verificationLevel,
    aiMatchScore: p.aiMatchScore,
    isFeatured: p.isFeatured,
    subscriptionTier: tier,
    isPremium: isPaidTier(tier),
    featuredUntil: p.featuredUntil?.toISOString() ?? null,
    services,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
  };
}

/** GET /v1/services/:slug — full public profile (listing embed + directory). */
export function serviceProviderPublicDetail(p: ServiceProvider) {
  return {
    ...serviceProviderPublicListItem(p),
    country: p.country,
    address: p.address ?? null,
    galleryImages: [...p.galleryImages],
    whatsappPhone: p.whatsappPhone ?? null,
    teamSize: p.teamSize,
    foundedYear: p.foundedYear,
    portfolioItems: p.portfolioItems,
    responseRatePercent: p.responseRatePercent,
    avgResponseHours: p.avgResponseHours,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export type ServiceReviewPublicJson = {
  id: string;
  overallRating: number;
  title: string;
  body: string;
  isJobVerified: boolean;
  providerResponse: string | null;
  createdAt: string;
  reviewerLabel: "verified_client";
};

export function serviceReviewPublicSummary(r: {
  id: string;
  overallRating: number;
  title: string;
  body: string;
  isJobVerified: boolean;
  providerResponse: string | null;
  createdAt: Date;
}): ServiceReviewPublicJson {
  return {
    id: r.id,
    overallRating: r.overallRating,
    title: r.title,
    body: r.body,
    isJobVerified: r.isJobVerified,
    providerResponse: r.providerResponse ?? null,
    createdAt: r.createdAt.toISOString(),
    reviewerLabel: "verified_client",
  };
}
