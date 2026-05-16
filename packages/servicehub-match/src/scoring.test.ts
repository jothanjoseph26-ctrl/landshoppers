import { describe, expect, it } from "vitest";

import {
  proximityScoreFromDistanceMeters,
  tierSortMultiplier,
  trustScoreComponent,
  contextualMatchBreakdown,
} from "./scoring.js";
import {
  ProviderTier,
  ProviderVerificationLevel,
  ServiceCategory,
} from "@landshoppers/db";

describe("proximityScoreFromDistanceMeters", () => {
  it("is full points inside 2km", () => {
    expect(proximityScoreFromDistanceMeters(0)).toBe(20);
    expect(proximityScoreFromDistanceMeters(2000)).toBe(20);
  });

  it("decays to zero by 50km", () => {
    expect(proximityScoreFromDistanceMeters(50_000)).toBe(0);
    expect(proximityScoreFromDistanceMeters(26_000)).toBeCloseTo(10, 5);
  });

  it("returns 0 when distance unknown", () => {
    expect(proximityScoreFromDistanceMeters(null)).toBe(0);
    expect(proximityScoreFromDistanceMeters(undefined)).toBe(0);
  });
});

describe("trustScoreComponent", () => {
  it("hits 20 at perfect inner composite", () => {
    expect(
      trustScoreComponent({
        rating: 5,
        completedJobCount: 100,
        reviewCount: 50,
      }),
    ).toBe(20);
  });
});

describe("tierSortMultiplier", () => {
  it("maps tiers", () => {
    expect(tierSortMultiplier(ProviderTier.free)).toBe(1);
    expect(tierSortMultiplier(ProviderTier.pro)).toBe(1.5);
    expect(tierSortMultiplier(ProviderTier.elite)).toBe(2);
  });
});

describe("contextualMatchBreakdown", () => {
  it("applies tier multiplier to composite", () => {
    const r = contextualMatchBreakdown({
      distanceMeters: 1000,
      providerCategory: ServiceCategory.legal,
      providerSubCategories: [],
      requestedCategory: ServiceCategory.legal,
      rating: 5,
      completedJobCount: 100,
      reviewCount: 50,
      responseRatePercent: 100,
      verificationLevel: ProviderVerificationLevel.elite,
      subscriptionTier: ProviderTier.free,
    });
    expect(r.composite).toBe(90);
    expect(r.effectiveScore).toBe(90);
    const elite = contextualMatchBreakdown({
      distanceMeters: 1000,
      providerCategory: ServiceCategory.legal,
      providerSubCategories: [],
      requestedCategory: ServiceCategory.legal,
      rating: 5,
      completedJobCount: 100,
      reviewCount: 50,
      responseRatePercent: 100,
      verificationLevel: ProviderVerificationLevel.elite,
      subscriptionTier: ProviderTier.elite,
    });
    expect(elite.effectiveScore).toBe(180);
  });
});
