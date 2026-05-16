import type { PrismaClient, ServiceCategory } from "@landshoppers/db";
import type { Redis } from "ioredis";

import {
  contextualMatchBreakdown,
  tierSortMultiplier,
  type MatchScoreFactors,
} from "@landshoppers/servicehub-match";

import {
  buildServicehubMatchCacheKey,
  readServicehubMatchCache,
  writeServicehubMatchCache,
} from "./match-cache.js";
import { serviceProviderPublicListItem } from "../serialize/service-provider-public.js";

const TOP_N = 5;

export type ServicehubMatchedProvider = {
  provider: ReturnType<typeof serviceProviderPublicListItem>;
  matchScore: number;
  effectiveScore: number;
  distanceMeters: number | null;
  factors: MatchScoreFactors & {
    requestedCategory: ServiceCategory;
    tierMultiplier: number;
    compositeBeforeTier: number;
  };
};

export type ServicehubListingMatchPayload = {
  listingId: string;
  categories: Record<string, { providers: ServicehubMatchedProvider[] }>;
  cached: boolean;
  computedAt: string;
};

type CandidateRow = { id: string; distance_m: number | null };

export async function getListingServiceMatches(
  prisma: PrismaClient,
  redis: Redis | null,
  input: {
    listingId: string;
    categories: ServiceCategory[];
    requestedSubCategories?: string[];
    persistLogs?: boolean;
  },
): Promise<ServicehubListingMatchPayload> {
  const sortedCats = [...new Set(input.categories)].sort();
  const persistLogs = input.persistLogs ?? true;
  const cacheKey = buildServicehubMatchCacheKey({
    listingId: input.listingId,
    categories: sortedCats,
    subCategories: input.requestedSubCategories,
  });

  if (redis) {
    try {
      const hit = await readServicehubMatchCache(redis, cacheKey);
      if (hit) {
        const parsed = JSON.parse(hit) as Omit<ServicehubListingMatchPayload, "cached">;
        return {
          ...parsed,
          cached: true,
        };
      }
    } catch {
      /* stale cache — recompute */
    }
  }

  const listing = await prisma.listing.findFirst({
    where: { id: input.listingId, deletedAt: null },
    select: { id: true },
  });
  if (!listing) {
    throw new Error("LISTING_NOT_FOUND");
  }

  const categoriesOut: ServicehubListingMatchPayload["categories"] = {};

  for (const category of sortedCats) {
    const candidates = await prisma.$queryRaw<CandidateRow[]>`
      SELECT sp.id::text AS id,
        CASE
          WHEN sp.geom IS NOT NULL AND p.geom IS NOT NULL THEN ST_Distance(
            sp.geom::geography,
            p.geom::geography
          )::double precision
          ELSE NULL
        END AS distance_m
      FROM service_providers sp
      INNER JOIN listings l ON l.id = ${input.listingId}::uuid
      INNER JOIN properties p ON p.id = l."propertyId"
      WHERE sp."deletedAt" IS NULL
        AND l."deletedAt" IS NULL
        AND p."deletedAt" IS NULL
        AND sp.category = CAST(${category} AS "ServiceCategory")
      ORDER BY distance_m ASC NULLS LAST
      LIMIT 120
    `;

    const ids = candidates.map((c) => c.id);
    const distanceById = new Map(
      candidates.map((c) => [c.id, c.distance_m] as const),
    );

    if (ids.length === 0) {
      categoriesOut[category] = { providers: [] };
      continue;
    }

    const providers = await prisma.serviceProvider.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    const byId = new Map(providers.map((p) => [p.id, p]));

    const ranked: ServicehubMatchedProvider[] = [];

    for (const cid of ids) {
      const p = byId.get(cid);
      if (!p) continue;

      const { factors, composite, effectiveScore } = contextualMatchBreakdown({
        distanceMeters: distanceById.get(cid) ?? null,
        providerCategory: p.category,
        providerSubCategories: p.subCategories,
        requestedCategory: category,
        requestedSubCategories: input.requestedSubCategories,
        rating: p.rating,
        completedJobCount: p.completedJobCount,
        reviewCount: p.reviewCount,
        responseRatePercent: p.responseRatePercent,
        verificationLevel: p.verificationLevel,
        subscriptionTier: p.subscriptionTier,
      });

      ranked.push({
        provider: serviceProviderPublicListItem(p),
        matchScore: composite,
        effectiveScore,
        distanceMeters: distanceById.get(cid) ?? null,
        factors: {
          ...factors,
          requestedCategory: category,
          tierMultiplier: tierSortMultiplier(p.subscriptionTier),
          compositeBeforeTier: composite,
        },
      });
    }

    ranked.sort((a, b) => b.effectiveScore - a.effectiveScore);
    const top = ranked.slice(0, TOP_N);

    categoriesOut[category] = { providers: top };

    if (persistLogs && top.length > 0) {
      await prisma.providerAiMatchLog.createMany({
        data: top.map((row, idx) => ({
          serviceProviderId: row.provider.id,
          listingId: input.listingId,
          matchScore: row.effectiveScore,
          scoreFactors: {
            ...row.factors,
            distanceMeters: row.distanceMeters,
            rank: idx + 1,
          },
          rankPosition: idx + 1,
        })),
      });
    }
  }

  const payload: Omit<ServicehubListingMatchPayload, "cached"> = {
    listingId: input.listingId,
    categories: categoriesOut,
    computedAt: new Date().toISOString(),
  };

  if (redis) {
    try {
      await writeServicehubMatchCache(redis, cacheKey, JSON.stringify(payload));
    } catch {
      /* Redis optional */
    }
  }

  return { ...payload, cached: false };
}
