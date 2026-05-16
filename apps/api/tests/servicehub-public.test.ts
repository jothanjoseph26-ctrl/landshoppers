import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

function seedUser(id: string, email: string) {
  fakeTables.users.push({
    id,
    email,
    passwordHash: "x",
    role: "buyer",
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
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

function seedProperty(id: string) {
  fakeTables.properties.push({
    id,
    title: "Svc seed",
    slug: `svc-seed-${id.slice(0, 8)}`,
    description: null,
    propertyType: "land",
    address: null,
    street: null,
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    postalCode: null,
    latitude: null,
    longitude: null,
    bedrooms: null,
    bathrooms: null,
    toilets: null,
    squareMeters: null,
    yearBuilt: null,
    parkingSpaces: null,
    isFurnished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

function seedListing(id: string, propertyId: string, userId: string) {
  fakeTables.listings.push({
    id,
    propertyId,
    agentId: null,
    userId,
    price: 1n,
    priceNegotiable: false,
    status: "active",
    isForSale: true,
    isForRent: false,
    rentPeriod: null,
    isFeatured: false,
    featuredUntil: null,
    viewCount: 0,
    inquiryCount: 0,
    virtualTourUrl: null,
    videoUrl: null,
    publishedAt: null,
    expiresAt: null,
    sourceType: null,
    sourceMessageId: null,
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

function seedServiceProvider(opts: { id: string; userId: string; slug: string; category?: string }) {
  const now = new Date();
  fakeTables.serviceProviders.push({
    id: opts.id,
    userId: opts.userId,
    businessName: "Seed Co",
    slug: opts.slug,
    category: opts.category ?? "legal",
    description: "Test",
    servicesOffered: [],
    address: null,
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    phone: "+2348000000000",
    email: null,
    website: null,
    logoUrl: null,
    galleryImages: [],
    rating: 4.5,
    reviewCount: 3,
    isVerified: true,
    verificationLevel: "professional",
    subscriptionTier: "pro",
    viewCount: 2,
    leadCount: 0,
    subCategories: [],
    serviceAreas: ["Lekki"],
    completedJobCount: 12,
    responseRatePercent: 88,
    aiMatchScore: 90,
    isFeatured: false,
    featuredUntil: null,
    whatsappPhone: null,
    portfolioItems: [],
    socialLinks: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

describe("ServiceHub public API (Stream 1 · Phase A)", () => {
  it("GET /v1/services returns pagination meta and provider rows", async () => {
    const res = await call<{
      data: Array<{ slug: string; category: string }>;
      meta: { total: number; page: number };
    }>("/v1/services?pageSize=5");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(0);
    expect(res.body.meta.page).toBe(1);
  });

  it("GET /v1/services/categories returns 12 categories with sub-categories", async () => {
    const res = await call<{ data: Array<{ id: string; subCategories: unknown[] }> }>(
      "/v1/services/categories",
    );
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(12);
    for (const row of res.body.data) {
      expect(row.subCategories.length).toBeGreaterThan(0);
    }
  });

  it("GET /v1/services/match ranks providers per category (§3.3) — groups payload", async () => {
    const listingId = "22222222-2222-2222-2222-222222222224";
    const userId = randomUUID();
    const propertyId = randomUUID();
    const providerId = randomUUID();
    seedUser(userId, "match-seed@example.test");
    seedProperty(propertyId);
    seedListing(listingId, propertyId, userId);
    seedServiceProvider({ id: providerId, userId, slug: "match-legal-co" });

    const res = await call<{
      data: {
        listingId: string;
        cached: boolean;
        computedAt: string;
        groups: Array<{ category: string; providers: Array<{ slug: string; matchHint?: string }> }>;
      };
    }>(`/v1/services/match?listingId=${listingId}&categories=legal`);
    expect(res.status).toBe(200);
    expect(res.body.data.listingId).toBe(listingId);
    const legal = res.body.data.groups.find((g) => g.category === "legal");
    expect(legal).toBeTruthy();
    expect(legal!.providers.length).toBeGreaterThan(0);
    expect(legal!.providers[0]?.slug).toBe("match-legal-co");
    expect(String(legal!.providers[0]?.matchHint ?? "")).toContain("km");
  });

  it("GET /v1/services/match 404 when listing missing", async () => {
    const res = await call<{ error: { code: string } }>(
      "/v1/services/match?listingId=00000000-0000-0000-0000-000000000099&categories=legal",
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("ServiceHub public API (Phase B — profile, reviews, quotes)", () => {
  it("GET /v1/services/:slug returns public profile and increments viewCount", async () => {
    const userId = randomUUID();
    seedUser(userId, "profile-seed@example.test");
    seedServiceProvider({ id: randomUUID(), userId, slug: "phase-b-profile" });

    const before = fakeTables.serviceProviders.find((s) => s.slug === "phase-b-profile")!.viewCount;

    const res = await call<{
      data: {
        slug: string;
        galleryImages: string[];
        availabilitySnippet: Array<{ date: string; isAvailable: boolean }>;
      };
    }>("/v1/services/phase-b-profile");
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe("phase-b-profile");
    expect(Array.isArray(res.body.data.galleryImages)).toBe(true);
    expect(Array.isArray(res.body.data.availabilitySnippet)).toBe(true);

    const after = fakeTables.serviceProviders.find((s) => s.slug === "phase-b-profile")!.viewCount;
    expect(after).toBe(before + 1);
  });

  it("GET /v1/services/:slug/reviews returns paginated items", async () => {
    const userId = randomUUID();
    const reviewerId = randomUUID();
    seedUser(userId, "rev-owner@example.test");
    seedUser(reviewerId, "rev-reviewer@example.test");
    const providerId = randomUUID();
    seedServiceProvider({ id: providerId, userId, slug: "phase-b-reviews" });

    fakeTables.serviceReviews.push({
      id: randomUUID(),
      serviceLeadId: randomUUID(),
      serviceProviderId: providerId,
      reviewerId,
      overallRating: 5,
      qualityRating: 5,
      communicationRating: 5,
      timelinessRating: 5,
      valueRating: 5,
      title: "Solid work",
      body: "Professional and on time.",
      isJobVerified: true,
      providerResponse: null,
      createdAt: new Date(),
    });

    const res = await call<{
      data: { items: Array<{ id: string; body: string; rating: number }>; total: number };
    }>("/v1/services/phase-b-reviews/reviews?page=1&limit=10");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0]?.rating).toBe(5);
    expect(res.body.data.items[0]?.body.length).toBeGreaterThan(0);
  });

  it("POST /v1/services/:slug/quote creates lead, bumps leadCount, notifies provider", async () => {
    const ownerId = randomUUID();
    seedUser(ownerId, "quote-owner@example.test");
    const providerId = randomUUID();
    seedServiceProvider({ id: providerId, userId: ownerId, slug: "phase-b-quote" });

    const beforeLead = fakeTables.serviceLeads.length;
    const beforeNote = fakeTables.notifications.length;
    const row = fakeTables.serviceProviders.find((s) => s.slug === "phase-b-quote")!;
    const beforeLeadCount = row.leadCount;

    const res = await call<{ data: { leadId: string; status: string } }>("/v1/services/phase-b-quote/quote", {
      method: "POST",
      body: {
        clientName: "Ada Okafor",
        clientPhone: "+2348012345678",
        message: "Need a boundary survey — land in Ikeja.",
        serviceRequested: "Survey",
        location: "Ikeja, Lagos",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");

    expect(fakeTables.serviceLeads.length).toBe(beforeLead + 1);
    expect(fakeTables.notifications.length).toBe(beforeNote + 1);

    expect(fakeTables.serviceProviders.find((s) => s.slug === "phase-b-quote")!.leadCount).toBe(
      beforeLeadCount + 1,
    );
  });

  it("GET /v1/services/:slug/availability returns next-window days", async () => {
    const userId = randomUUID();
    seedUser(userId, "avail-pub@example.test");
    const providerId = randomUUID();
    seedServiceProvider({ id: providerId, userId, slug: "phase-b-availability" });

    const res = await call<{
      data: { slug: string; days: Array<{ date: string; isAvailable: boolean }> };
    }>("/v1/services/phase-b-availability/availability");
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe("phase-b-availability");
    expect(Array.isArray(res.body.data.days)).toBe(true);
  });
});

describe("ServiceHub bundles API (Phase D slice)", () => {
  async function registerBuyer(suffix: string) {
    const res = await call<{ data: { accessToken: string; user: { id: string } } }>(
      "/v1/auth/register",
      {
        method: "POST",
        body: { email: `${suffix}@example.test`, password: "Password123!", role: "buyer" },
      },
    );
    expect(res.status).toBe(201);
    return res.body.data!;
  }

  it("GET /v1/services/bundles lists active bundles", async () => {
    const id = randomUUID();
    fakeTables.serviceBundles.push({
      id,
      name: "Test Bundle",
      slug: "test-bundle-row",
      description: "Demo",
      categories: ["photography"],
      priceFromKobo: 1n,
      priceToKobo: 2n,
      triggerContext: "post_purchase",
      isActive: true,
      activationCount: 0,
    });

    const res = await call<{ data: Array<{ id: string; slug: string }> }>("/v1/services/bundles");
    expect(res.status).toBe(200);
    const row = res.body.data.find((b) => b.id === id);
    expect(row?.slug).toBe("test-bundle-row");
  });

  it("POST /v1/services/bundles/:id/activate creates leads (auth)", async () => {
    const bundleId = randomUUID();
    fakeTables.serviceBundles.push({
      id: bundleId,
      name: "Single Category Bundle",
      slug: "single-cat-bun",
      description: "One category for test",
      categories: ["photography"],
      priceFromKobo: 100n,
      priceToKobo: 200n,
      triggerContext: "listing_create",
      isActive: true,
      activationCount: 0,
    });

    const providerOwner = randomUUID();
    seedUser(providerOwner, "bun-prov@example.test");
    const providerId = randomUUID();
    seedServiceProvider({
      id: providerId,
      userId: providerOwner,
      slug: "bun-photo-co",
      category: "photography",
    });

    const buyer = await registerBuyer("bun-buyer");

    const res = await call<{
      data: {
        activationId: string;
        leads: Array<{ leadId: string }>;
        estimatedGmvKobo: string;
        estimatedPlatformFeeKobo: string;
      };
    }>(`/v1/services/bundles/${bundleId}/activate`, {
      method: "POST",
      token: buyer.accessToken,
      body: {
        clientName: "Buyer Test",
        clientPhone: "+2348099999999",
        location: "Lekki, Lagos",
        message: "Please send quotes",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.estimatedGmvKobo).toBe("100");
    expect(res.body.data.estimatedPlatformFeeKobo).toBe("5");
    expect(res.body.data.leads.length).toBe(1);
    expect(fakeTables.bundleActivations.length).toBeGreaterThanOrEqual(1);
    const lead = fakeTables.serviceLeads.find((l) => l.id === res.body.data.leads[0]!.leadId);
    expect(lead?.source).toBe("bundle");
    expect(lead?.bundleId).toBe(bundleId);

    const bundle = fakeTables.serviceBundles.find((b) => b.id === bundleId);
    expect(bundle?.activationCount).toBe(1);
    const activation = fakeTables.bundleActivations.find((a) => a.id === res.body.data.activationId);
    expect(activation?.platformFeeKobo).toBe(5n);
  });

  it("POST bundle activate replays same activation within 60s (no duplicate leads)", async () => {
    const bundleId = randomUUID();
    fakeTables.serviceBundles.push({
      id: bundleId,
      name: "Idempotent Bundle",
      slug: "idem-bun",
      description: "Idempotency test",
      categories: ["photography"],
      priceFromKobo: 100n,
      priceToKobo: 200n,
      triggerContext: "listing_create",
      isActive: true,
      activationCount: 0,
    });

    const providerOwner = randomUUID();
    seedUser(providerOwner, "bun-idem-prov@example.test");
    seedServiceProvider({
      id: randomUUID(),
      userId: providerOwner,
      slug: "bun-idem-photo",
      category: "photography",
    });

    const buyer = await registerBuyer("bun-idem-buyer");
    const path = `/v1/services/bundles/${bundleId}/activate`;
    const body = {
      clientName: "Idem User",
      clientPhone: "+2348077777777",
      location: "VI, Lagos",
    };

    const r1 = await call<{
      data: { activationId: string; estimatedPlatformFeeKobo: string };
    }>(path, {
      method: "POST",
      token: buyer.accessToken,
      body,
    });
    expect(r1.status).toBe(201);
    expect(r1.body.data.estimatedPlatformFeeKobo).toBe("5");
    const nLeads = fakeTables.serviceLeads.length;
    const nActivations = fakeTables.bundleActivations.length;
    const actCount = fakeTables.serviceBundles.find((b) => b.id === bundleId)!.activationCount;

    const r2 = await call<{
      data: { activationId: string; estimatedPlatformFeeKobo: string };
    }>(path, {
      method: "POST",
      token: buyer.accessToken,
      body,
    });
    expect(r2.status).toBe(201);
    expect(r2.body.data.activationId).toBe(r1.body.data.activationId);
    expect(r2.body.data.estimatedPlatformFeeKobo).toBe(r1.body.data.estimatedPlatformFeeKobo);
    expect(fakeTables.serviceLeads.length).toBe(nLeads);
    expect(fakeTables.bundleActivations.length).toBe(nActivations);
    expect(fakeTables.serviceBundles.find((b) => b.id === bundleId)!.activationCount).toBe(actCount);
  });

  it("POST bundle activate idempotent replay returns stored platformFeeKobo (not recomputed from bundle price)", async () => {
    const bundleId = randomUUID();
    fakeTables.serviceBundles.push({
      id: bundleId,
      name: "Fee integrity bundle",
      slug: "fee-integ-bun",
      description: "Stored fee wins on replay",
      categories: ["photography"],
      priceFromKobo: 100n,
      priceToKobo: 200n,
      triggerContext: "listing_create",
      isActive: true,
      activationCount: 0,
    });

    const providerOwner = randomUUID();
    seedUser(providerOwner, "bun-fee-integ-prov@example.test");
    seedServiceProvider({
      id: randomUUID(),
      userId: providerOwner,
      slug: "bun-fee-integ-photo",
      category: "photography",
    });

    const buyer = await registerBuyer("bun-fee-integ-buyer");
    const path = `/v1/services/bundles/${bundleId}/activate`;
    const body = {
      clientName: "Fee Integ User",
      clientPhone: "+2348066666666",
      location: "Surulere, Lagos",
    };

    const r1 = await call<{ data: { activationId: string; estimatedPlatformFeeKobo: string } }>(
      path,
      { method: "POST", token: buyer.accessToken, body },
    );
    expect(r1.status).toBe(201);
    expect(r1.body.data.estimatedPlatformFeeKobo).toBe("5");

    const act = fakeTables.bundleActivations.find((a) => a.id === r1.body.data.activationId)!;
    act.platformFeeKobo = 49999n;

    const r2 = await call<{ data: { estimatedPlatformFeeKobo: string } }>(path, {
      method: "POST",
      token: buyer.accessToken,
      body,
    });
    expect(r2.status).toBe(201);
    expect(r2.body.data.estimatedPlatformFeeKobo).toBe("49999");
  });
});

describe("ServiceHub admin verification patch", () => {
  function promoteUserToAdmin(userId: string) {
    const user = fakeTables.users.find((u) => u.id === userId);
    if (user) user.role = "admin";
  }

  it("PATCH /v1/admin/services/providers/:id updates verification", async () => {
    const reg = await call<{ data: { accessToken: string; user: { id: string } } }>(
      "/v1/auth/register",
      {
        method: "POST",
        body: {
          email: "adm-svc-hub@example.test",
          password: "Password123!",
          role: "buyer",
        },
      },
    );
    expect(reg.status).toBe(201);
    promoteUserToAdmin(reg.body.data!.user.id);

    const login = await call<{ data: { accessToken: string } }>("/v1/auth/login", {
      method: "POST",
      body: { email: "adm-svc-hub@example.test", password: "Password123!" },
    });
    expect(login.status).toBe(200);
    const adminToken = login.body.data.accessToken;

    const ownerId = randomUUID();
    seedUser(ownerId, "vfy-prov-owner@example.test");
    const providerId = randomUUID();
    seedServiceProvider({ id: providerId, userId: ownerId, slug: "vfy-target-co" });

    const patch = await call<{ data: { isVerified: boolean; verificationLevel: string } }>(
      `/v1/admin/services/providers/${providerId}`,
      {
        method: "PATCH",
        token: adminToken,
        body: { verificationLevel: "professional", isVerified: true },
      },
    );
    expect(patch.status).toBe(200);
    expect(patch.body.data.isVerified).toBe(true);
    expect(patch.body.data.verificationLevel).toBe("professional");
  });
});
