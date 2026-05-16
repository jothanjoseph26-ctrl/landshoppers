import type {
  ProviderTier,
  ProviderVerificationLevel,
  ServiceCategory,
} from "@landshoppers/db";

/** §3.3 adjacent categories — extend over time; empty means only exact primary category scores. */
export const ADJACENT_SERVICE_CATEGORIES: ReadonlyArray<
  readonly [ServiceCategory, ServiceCategory]
> = [];

function adjacentKey(a: ServiceCategory, b: ServiceCategory): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

const adjacentPairs = new Set(
  ADJACENT_SERVICE_CATEGORIES.map(([x, y]) => adjacentKey(x, y)),
);

export function areAdjacentCategories(a: ServiceCategory, b: ServiceCategory): boolean {
  return adjacentPairs.has(adjacentKey(a, b));
}

/** Proximity component (max 20 pts): full score ≤2km, linear decay to 0 by 50km (§3.3). */
export function proximityScoreFromDistanceMeters(
  distanceMeters: number | null | undefined,
): number {
  if (distanceMeters === null || distanceMeters === undefined || Number.isNaN(distanceMeters)) {
    return 0;
  }
  const d = Math.max(0, distanceMeters);
  if (d <= 2000) return 20;
  if (d >= 50_000) return 0;
  return (20 * (50_000 - d)) / (50_000 - 2000);
}

/** Trust component (max 20 pts): inner composite 0–100 scaled to 20 (§3.3). */
export function trustScoreComponent(input: {
  rating: number;
  completedJobCount: number;
  reviewCount: number;
}): number {
  const ratingPart = (Math.min(5, Math.max(0, input.rating)) / 5) * 40;
  const jobsPart = (Math.min(100, Math.max(0, input.completedJobCount)) / 100) * 30;
  const reviewsPart = (Math.min(50, Math.max(0, input.reviewCount)) / 50) * 30;
  const inner = ratingPart + jobsPart + reviewsPart;
  return 20 * (inner / 100);
}

/** Response component (max 15 pts). */
export function responseScoreComponent(responseRatePercent: number): number {
  const p = Math.min(100, Math.max(0, responseRatePercent));
  return p * 0.15;
}

/** Verification component (max 20 pts). */
export function verificationScoreComponent(level: ProviderVerificationLevel): number {
  switch (level) {
    case "elite":
      return 20;
    case "professional":
      return 16;
    case "standard":
      return 10;
    case "basic":
      return 4;
    default:
      return 0;
  }
}

/**
 * Category component (max 25 pts).
 * Exact sub-category overlap = 25; primary category only = 15; adjacent primary = 5; else 0.
 */
export function categoryScoreComponent(input: {
  providerCategory: ServiceCategory;
  providerSubCategories: readonly string[];
  requestedCategory: ServiceCategory;
  requestedSubCategories?: readonly string[] | undefined;
}): number {
  const { providerCategory, providerSubCategories, requestedCategory, requestedSubCategories } =
    input;

  if (providerCategory === requestedCategory) {
    const reqSubs = requestedSubCategories?.filter(Boolean) ?? [];
    if (
      reqSubs.length > 0 &&
      reqSubs.some((s) => providerSubCategories.some((p) => p === s))
    ) {
      return 25;
    }
    return 15;
  }

  if (areAdjacentCategories(providerCategory, requestedCategory)) {
    return 5;
  }

  return 0;
}

/** Subscription tier multiplier for directory / contextual ordering (§7.2). */
export function tierSortMultiplier(tier: ProviderTier): number {
  switch (tier) {
    case "elite":
      return 2;
    case "pro":
      return 1.5;
    default:
      return 1;
  }
}

export type MatchScoreFactors = {
  proximity: number;
  category: number;
  trust: number;
  response: number;
  verification: number;
};

export function compositeMatchScore(factors: MatchScoreFactors): number {
  const sum =
    factors.proximity +
    factors.category +
    factors.trust +
    factors.response +
    factors.verification;
  return Math.round(sum * 100) / 100;
}

export type BaselineProviderSignals = {
  rating: number;
  reviewCount: number;
  completedJobCount: number;
  responseRatePercent: number;
  verificationLevel: ProviderVerificationLevel;
  /** When true, proximity baseline earns full §3.3 weight (pin exists for geo matching). */
  hasGeom: boolean;
};

/**
 * Provider-level score refreshed by BullMQ when no listing context exists (§6.5).
 * Proximity uses participation proxy: geom pin → full 20pts; otherwise 0.
 * Category uses full primary weight (provider advertises that category).
 */
export function computeProviderBaselineAiScore(signals: BaselineProviderSignals): number {
  const factors: MatchScoreFactors = {
    proximity: signals.hasGeom ? 20 : 0,
    category: 25,
    trust: trustScoreComponent({
      rating: signals.rating,
      completedJobCount: signals.completedJobCount,
      reviewCount: signals.reviewCount,
    }),
    response: responseScoreComponent(signals.responseRatePercent),
    verification: verificationScoreComponent(signals.verificationLevel),
  };
  return compositeMatchScore(factors);
}

export type ContextualMatchSignals = {
  distanceMeters: number | null | undefined;
  providerCategory: ServiceCategory;
  providerSubCategories: readonly string[];
  requestedCategory: ServiceCategory;
  requestedSubCategories?: readonly string[] | undefined;
  rating: number;
  completedJobCount: number;
  reviewCount: number;
  responseRatePercent: number;
  verificationLevel: ProviderVerificationLevel;
  subscriptionTier: ProviderTier;
};

export function contextualMatchBreakdown(
  signals: ContextualMatchSignals,
): { factors: MatchScoreFactors; composite: number; effectiveScore: number } {
  const factors: MatchScoreFactors = {
    proximity: proximityScoreFromDistanceMeters(signals.distanceMeters),
    category: categoryScoreComponent({
      providerCategory: signals.providerCategory,
      providerSubCategories: signals.providerSubCategories,
      requestedCategory: signals.requestedCategory,
      requestedSubCategories: signals.requestedSubCategories,
    }),
    trust: trustScoreComponent({
      rating: signals.rating,
      completedJobCount: signals.completedJobCount,
      reviewCount: signals.reviewCount,
    }),
    response: responseScoreComponent(signals.responseRatePercent),
    verification: verificationScoreComponent(signals.verificationLevel),
  };
  const composite = compositeMatchScore(factors);
  const effectiveScore =
    Math.round(composite * tierSortMultiplier(signals.subscriptionTier) * 100) / 100;
  return { factors, composite, effectiveScore };
}
