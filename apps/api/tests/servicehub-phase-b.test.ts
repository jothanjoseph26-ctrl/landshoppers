import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables, resetFakePrisma } from "./helpers/fake-prisma.js";

function seedProvider(slug: string) {
  const now = new Date();
  const userId = randomUUID();
  const providerId = randomUUID();
  fakeTables.users.push({
    id: userId,
    email: `seed-${slug}@example.test`,
    passwordHash: "x",
    role: "service_provider",
    isEmailVerified: true,
    isPhoneVerified: false,
    phone: null,
    googleId: null,
    lastLoginAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
    refreshTokenHash: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  fakeTables.serviceProviders.push({
    id: providerId,
    userId,
    businessName: "Phase B Test Co",
    slug,
    category: "legal",
    description: "Test",
    servicesOffered: [],
    address: null,
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    phone: "+2348000000001",
    email: `seed-${slug}@example.test`,
    website: null,
    logoUrl: null,
    galleryImages: [],
    rating: 4.5,
    reviewCount: 2,
    isVerified: true,
    verificationLevel: "standard",
    subscriptionTier: "free",
    viewCount: 1,
    leadCount: 0,
    subCategories: [],
    serviceAreas: [],
    completedJobCount: 0,
    responseRatePercent: 80,
    aiMatchScore: 70,
    isFeatured: false,
    featuredUntil: null,
    whatsappPhone: null,
    portfolioItems: [],
    socialLinks: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  fakeTables.serviceReviews.push({
    id: randomUUID(),
    serviceLeadId: randomUUID(),
    serviceProviderId: providerId,
    reviewerId: randomUUID(),
    overallRating: 5,
    qualityRating: 5,
    communicationRating: 5,
    timelinessRating: 5,
    valueRating: 5,
    title: "Excellent",
    body: "Great work",
    isJobVerified: true,
    providerResponse: null,
    createdAt: now,
  });
  fakeTables.serviceReviews.push({
    id: randomUUID(),
    serviceLeadId: randomUUID(),
    serviceProviderId: providerId,
    reviewerId: randomUUID(),
    overallRating: 3,
    qualityRating: 3,
    communicationRating: 3,
    timelinessRating: 3,
    valueRating: 3,
    title: "OK",
    body: "Average",
    isJobVerified: false,
    providerResponse: null,
    createdAt: new Date(now.getTime() - 86_400_000),
  });

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  fakeTables.providerAvailability.push({
    id: randomUUID(),
    serviceProviderId: providerId,
    date: new Date(dayStart.getTime() + 86400000),
    isAvailable: true,
    slots: null,
    note: null,
  });

  return { providerId, userId };
}

describe("ServiceHub Phase B (profile · quote · reviews)", () => {
  afterEach(() => {
    resetFakePrisma();
  });

  it("GET /v1/services/:slug returns detail and availabilitySnippet", async () => {
    seedProvider("phase-b-provider");
    const res = await call<{ data: { slug: string; availabilitySnippet: unknown[] } }>(
      "/v1/services/phase-b-provider",
    );
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe("phase-b-provider");
    expect(Array.isArray(res.body.data.availabilitySnippet)).toBe(true);
    expect(res.body.data.availabilitySnippet.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /v1/services/:slug/quote creates lead and notification", async () => {
    const { userId } = seedProvider("phase-b-quote");
    const res = await call<{ data: { leadId: string } }>("/v1/services/phase-b-quote/quote", {
      method: "POST",
      body: {
        clientName: "Amina",
        clientPhone: "+2348012345678",
        serviceRequested: "Title search",
        message: "Need due diligence on a Lekki plot.",
        location: "Lekki, Lagos",
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.leadId).toBeTruthy();
    expect(fakeTables.serviceLeads.length).toBe(1);
    expect(fakeTables.notifications.some((n) => n.userId === userId)).toBe(true);
  });

  it("GET /v1/services/:slug/reviews supports rating + verified_only", async () => {
    seedProvider("phase-b-reviews");
    const all = await call<{ data: { items: unknown[]; total: number } }>(
      "/v1/services/phase-b-reviews/reviews",
    );
    expect(all.status).toBe(200);
    expect(all.body.data.total).toBe(2);

    const hi = await call<{ data: { total: number } }>(
      "/v1/services/phase-b-reviews/reviews?rating=4",
    );
    expect(hi.status).toBe(200);
    expect(hi.body.data.total).toBe(1);

    const ver = await call<{ data: { total: number } }>(
      "/v1/services/phase-b-reviews/reviews?verified_only=true",
    );
    expect(ver.status).toBe(200);
    expect(ver.body.data.total).toBe(1);
  });
});
