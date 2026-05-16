import type { Prisma } from "@landshoppers/db";
import {
  ListingStatus,
  NotificationType,
  ServiceCategory,
  ServiceLeadSource,
} from "@landshoppers/db";
import { scoreServiceLeadHeuristic } from "@landshoppers/servicehub-match";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  adminListServiceProvidersQuerySchema,
  adminPatchServiceProviderBodySchema,
  adminPatchServiceProviderParamSchema,
  listPublicServicesQuerySchema,
  postActivateBundleBodySchema,
  postActivateBundleParamSchema,
  postServiceQuoteBodySchema,
  serviceMatchQuerySchema,
  serviceProviderReviewsQuerySchema,
} from "../../contracts/servicehub-public.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { activateServiceBundleTransaction } from "../../lib/servicehub/bundle-activate.js";
import {
  getListingServiceMatches,
  type ServicehubMatchedProvider,
} from "../../lib/servicehub/contextual-match.js";
import { getServicehubMatchRedis } from "../../lib/servicehub/match-redis.js";
import { stubServiceLeadEmailNotify } from "../../lib/servicehub/lead-notify-stub.js";
import { SERVICEHUB_CATEGORY_CATALOG } from "../../lib/servicehub/category-catalog.js";
import {
  serviceProviderPublicDetail,
  serviceProviderPublicListItem,
} from "../../lib/serialize/service-provider-public.js";
import { optionalAttachAuthUser, requireAdmin, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

const DEFAULT_SERVICE_MATCH_CATEGORIES: ServiceCategory[] = [
  ServiceCategory.legal,
  ServiceCategory.survey,
  ServiceCategory.architecture,
  ServiceCategory.inspection,
];

/** Paths that must not capture as `/:slug` for provider profiles. */
/** Block these as provider `slug` values so they never shadow marketplace routes or marketing paths. */
const RESERVED_SERVICE_SLUGS = new Set([
  "about",
  "blog",
  "bundles",
  "categories",
  "contact",
  "directory",
  "featured",
  "insights",
  "join",
  "map",
  "match",
  "pricing",
  "providers",
  "search",
  "team",
]);

const CATEGORY_LABEL = new Map<ServiceCategory, string>(
  SERVICEHUB_CATEGORY_CATALOG.map((c) => [c.id, c.name]),
);

function flattenMatchCard(row: ServicehubMatchedProvider): Record<string, unknown> {
  const p = row.provider;
  const dist = row.distanceMeters;
  const hint =
    typeof dist === "number" && dist >= 0
      ? `${Math.round(dist / 100) / 10}km · fit ${Math.round(row.effectiveScore)}`
      : `Score ${Math.round(row.effectiveScore)} · ${p.verificationLevel ?? "basic"}`;
  return {
    ...p,
    matchHint: hint,
    coverImageUrl: p.logoUrl ?? null,
  };
}

export const servicesPublicV1 = new Hono<ApiEnv>();

servicesPublicV1.get("/", zValidator("query", listPublicServicesQuerySchema), async (c) => {
  const qRaw = c.req.valid("query");
  const pageSize = qRaw.limit ?? qRaw.pageSize;
  const page = qRaw.page;
  const skip = offsetFromPage(page, pageSize);
  const sort = qRaw.sort;

  const where: Prisma.ServiceProviderWhereInput = {
    deletedAt: null,
    ...(qRaw.category !== undefined ? { category: qRaw.category } : {}),
    ...(qRaw.state !== undefined
      ? {
          state: {
            equals: qRaw.state,
            mode: "insensitive",
          },
        }
      : {}),
    ...(qRaw.verified === true ? { isVerified: true } : {}),
    ...(qRaw.rating_min !== undefined ? { rating: { gte: qRaw.rating_min } } : {}),
    ...(qRaw.keyword !== undefined
      ? {
          OR: [
            { businessName: { contains: qRaw.keyword, mode: "insensitive" } },
            { description: { contains: qRaw.keyword, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(qRaw.lga !== undefined
      ? {
          OR: [
            { serviceAreas: { has: qRaw.lga } },
            { city: { contains: qRaw.lga, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  if (qRaw.lat !== undefined && qRaw.lng !== undefined) {
    const radiusKm = qRaw.radius_km ?? 50;
    const meters = radiusKm * 1000;
    const idRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM service_providers
      WHERE "deletedAt" IS NULL
        AND geom IS NOT NULL
        AND ST_DWithin(
          geom,
          ST_SetSRID(ST_MakePoint(${qRaw.lng}, ${qRaw.lat}), 4326)::geography,
          ${meters}
        )
    `;
    const ids = idRows.map((r) => r.id);
    if (ids.length === 0) {
      return c.json({
        data: [],
        meta: { page, pageSize, total: 0, totalPages: 0, sort },
      });
    }
    where.id = { in: ids };
  }

  let orderBy: Prisma.ServiceProviderOrderByWithRelationInput[] = [{ aiMatchScore: "desc" }];
  if (sort === "rating") {
    orderBy = [{ rating: "desc" }];
  } else if (sort === "jobs") {
    orderBy = [{ completedJobCount: "desc" }];
  } else if (sort === "newest") {
    orderBy = [{ createdAt: "desc" }];
  } else if (sort === "response") {
    orderBy = [{ responseRatePercent: "desc" }];
  }

  const [total, rows] = await Promise.all([
    prisma.serviceProvider.count({ where }),
    prisma.serviceProvider.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
  ]);

  return c.json({
    data: rows.map(serviceProviderPublicListItem),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      sort,
    },
  });
});

servicesPublicV1.get("/match", zValidator("query", serviceMatchQuerySchema), async (c) => {
  const q = c.req.valid("query");
  const categories =
    q.categories && q.categories.length > 0 ? q.categories : DEFAULT_SERVICE_MATCH_CATEGORIES;

  const listingArea = await prisma.listing.findFirst({
    where: { id: q.listingId, deletedAt: null },
    include: { property: { select: { city: true, state: true } } },
  });
  const areaLabel = listingArea?.property
    ? `${listingArea.property.city}, ${listingArea.property.state}`.trim()
    : undefined;

  try {
    const payload = await getListingServiceMatches(prisma, getServicehubMatchRedis(), {
      listingId: q.listingId,
      categories,
      requestedSubCategories: q.sub_categories,
      persistLogs: process.env["NODE_ENV"] !== "test",
    });

    const groups = categories.map((cat) => ({
      category: cat,
      label: CATEGORY_LABEL.get(cat) ?? cat,
      providers: (payload.categories[cat]?.providers ?? []).map(flattenMatchCard),
    }));

    return c.json({
      data: {
        listingId: payload.listingId,
        areaLabel,
        groups,
        computedAt: payload.computedAt,
        cached: payload.cached,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "LISTING_NOT_FOUND") {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }
    throw err;
  }
});

servicesPublicV1.get("/categories", async (c) => {
  const counts = await prisma.serviceProvider.groupBy({
    by: ["category"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const countByCategory = new Map<ServiceCategory, number>();
  for (const row of counts) {
    countByCategory.set(row.category, row._count._all);
  }

  const data = SERVICEHUB_CATEGORY_CATALOG.map((cat) => ({
    id: cat.id,
    name: cat.name,
    iconTag: cat.iconTag,
    providerCount: countByCategory.get(cat.id) ?? 0,
    subCategories: cat.subCategories,
  }));

  return c.json({ data });
});

servicesPublicV1.get("/bundles", async (c) => {
  const rows = await prisma.serviceBundle.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return c.json({
    data: rows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      categories: b.categories,
      priceFromKobo: b.priceFromKobo.toString(),
      priceToKobo: b.priceToKobo.toString(),
      triggerContext: b.triggerContext,
      activationCount: b.activationCount,
    })),
  });
});

servicesPublicV1.post(
  "/bundles/:id/activate",
  requireAuth,
  zValidator("param", postActivateBundleParamSchema),
  zValidator("json", postActivateBundleBodySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    const { id: bundleId } = c.req.valid("param");
    const body = c.req.valid("json");

    let listingId: string | null = body.listingId ?? null;
    let locationText = body.location?.trim();

    if (listingId) {
      const listing = await prisma.listing.findFirst({
        where: { id: listingId, deletedAt: null, status: ListingStatus.active },
        include: { property: true },
      });
      if (!listing?.property) {
        throw new ApiError(404, "NOT_FOUND", "Listing not found");
      }
      locationText =
        `${listing.property.city}, ${listing.property.state}`.trim() || listing.property.country;
    }

    const locationFinal = locationText && locationText.length > 0 ? locationText : "Nigeria";

    const result = await activateServiceBundleTransaction(prisma, getServicehubMatchRedis(), {
      bundleId,
      clientUserId: authUser.id,
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      clientEmail: body.clientEmail ?? null,
      listingId,
      locationText: locationFinal,
      messagePrefix: body.message ?? null,
    });

    return c.json(
      {
        data: {
          activationId: result.activationId,
          bundleId: result.bundleId,
          bundleName: result.bundleName,
          leads: result.leads,
          estimatedGmvKobo: result.estimatedGmvKobo,
          estimatedPlatformFeeKobo: result.estimatedPlatformFeeKobo,
        },
      },
      201,
    );
  },
);

servicesPublicV1.get(
  "/:slug/reviews",
  zValidator("query", serviceProviderReviewsQuerySchema),
  async (c) => {
    const slug = c.req.param("slug");
    if (RESERVED_SERVICE_SLUGS.has(slug)) {
      throw new ApiError(404, "NOT_FOUND", "Not found");
    }

    const q = c.req.valid("query");
    const skip = offsetFromPage(q.page, q.pageSize);

    const providerRow = await prisma.serviceProvider.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!providerRow) {
      throw new ApiError(404, "NOT_FOUND", "Provider not found");
    }

    const [total, rows] = await Promise.all([
      prisma.serviceReview.count({
        where: {
          serviceProviderId: providerRow.id,
          ...(q.rating !== undefined ? { overallRating: { gte: q.rating } } : {}),
          ...(q.verified_only === true ? { isJobVerified: true } : {}),
        },
      }),
      prisma.serviceReview.findMany({
        where: {
          serviceProviderId: providerRow.id,
          ...(q.rating !== undefined ? { overallRating: { gte: q.rating } } : {}),
          ...(q.verified_only === true ? { isJobVerified: true } : {}),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: q.pageSize,
      }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      authorName: "Verified client",
      rating: r.overallRating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      jobVerified: r.isJobVerified,
    }));

    return c.json({
      data: {
        items,
        total,
        page: q.page,
        pageSize: q.pageSize,
        totalPages: Math.ceil(total / q.pageSize),
      },
    });
  },
);

servicesPublicV1.get("/:slug/availability", async (c) => {
  const slug = c.req.param("slug");
  if (RESERVED_SERVICE_SLUGS.has(slug)) {
    throw new ApiError(404, "NOT_FOUND", "Not found");
  }

  const providerRow = await prisma.serviceProvider.findFirst({
    where: { slug, deletedAt: null },
  });
  if (!providerRow) {
    throw new ApiError(404, "NOT_FOUND", "Provider not found");
  }

  const rangeStart = new Date();
  rangeStart.setUTCHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 30);

  const availabilityRows = await prisma.providerAvailability.findMany({
    where: {
      serviceProviderId: providerRow.id,
      date: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { date: "asc" },
    take: 31,
  });

  return c.json({
    data: {
      slug,
      days: availabilityRows.map((a) => ({
        date: a.date.toISOString().slice(0, 10),
        isAvailable: a.isAvailable,
        note: a.note ?? null,
      })),
    },
  });
});

servicesPublicV1.post(
  "/:slug/quote",
  optionalAttachAuthUser,
  zValidator("json", postServiceQuoteBodySchema),
  async (c) => {
    const slug = c.req.param("slug");
    if (RESERVED_SERVICE_SLUGS.has(slug)) {
      throw new ApiError(404, "NOT_FOUND", "Not found");
    }

    const body = c.req.valid("json");
    const authUser = c.get("authUser");

    const providerRow = await prisma.serviceProvider.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!providerRow) {
      throw new ApiError(404, "NOT_FOUND", "Provider not found");
    }

    let listingId: string | null = body.listingId ?? null;
    let locationText = body.location?.trim();

    if (listingId) {
      const listing = await prisma.listing.findFirst({
        where: { id: listingId, deletedAt: null, status: ListingStatus.active },
        include: { property: true },
      });
      if (!listing?.property) {
        throw new ApiError(404, "NOT_FOUND", "Listing not found");
      }
      locationText =
        `${listing.property.city}, ${listing.property.state}`.trim() || listing.property.country;
    }

    const locationFinal = locationText && locationText.length > 0 ? locationText : "Nigeria";

    const lead = await prisma.$transaction(async (tx) => {
      const scoring = scoreServiceLeadHeuristic({
        message: body.message,
        serviceRequested: body.serviceRequested,
        budgetKobo: body.budgetKobo ? BigInt(body.budgetKobo) : null,
        timeline: body.timeline ?? null,
        location: locationFinal,
        source: listingId ? ServiceLeadSource.listing_page : ServiceLeadSource.directory,
        clientPhone: body.clientPhone,
        clientEmail: body.clientEmail ?? null,
      });

      const row = await tx.serviceLead.create({
        data: {
          serviceProviderId: providerRow.id,
          clientUserId: authUser?.id ?? null,
          clientName: body.clientName,
          clientPhone: body.clientPhone,
          clientEmail: body.clientEmail ?? null,
          source: listingId ? ServiceLeadSource.listing_page : ServiceLeadSource.directory,
          listingId,
          serviceRequested: body.serviceRequested,
          message: body.message,
          budget: body.budgetKobo ? BigInt(body.budgetKobo) : null,
          timeline: body.timeline ?? null,
          location: locationFinal,
          aiScore: scoring.aiScore,
          aiSummary: scoring.aiSummary,
        },
      });

      await tx.serviceProvider.update({
        where: { id: providerRow.id },
        data: { leadCount: { increment: 1 } },
      });

      await tx.notification.create({
        data: {
          userId: providerRow.userId,
          type: NotificationType.system,
          title: "New ServiceHub lead",
          body: `${body.clientName} requested “${body.serviceRequested}”.`,
          metadata: { leadId: row.id, providerSlug: slug } as Prisma.InputJsonValue,
        },
      });

      return row;
    });

    stubServiceLeadEmailNotify({
      providerUserId: providerRow.userId,
      leadId: lead.id,
      clientName: body.clientName,
      serviceRequested: body.serviceRequested,
    });

    return c.json(
      {
        data: {
          leadId: lead.id,
          status: lead.status,
        },
      },
      201,
    );
  },
);

servicesPublicV1.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  if (RESERVED_SERVICE_SLUGS.has(slug)) {
    throw new ApiError(404, "NOT_FOUND", "Not found");
  }

  const existing = await prisma.serviceProvider.findFirst({
    where: { slug, deletedAt: null },
  });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Provider not found");
  }

  const updated = await prisma.serviceProvider.update({
    where: { id: existing.id },
    data: { viewCount: { increment: 1 } },
  });

  const rangeStart = new Date();
  rangeStart.setUTCHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 30);

  const availabilityRows = await prisma.providerAvailability.findMany({
    where: {
      serviceProviderId: updated.id,
      date: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { date: "asc" },
    take: 31,
  });

  return c.json({
    data: {
      ...serviceProviderPublicDetail(updated),
      availabilitySnippet: availabilityRows.map((a) => ({
        date: a.date.toISOString().slice(0, 10),
        isAvailable: a.isAvailable,
        note: a.note ?? null,
      })),
    },
  });
});

export const adminServicehubV1 = new Hono<ApiEnv>();

adminServicehubV1.use("*", requireAuth, requireAdmin);

adminServicehubV1.get(
  "/providers",
  zValidator("query", adminListServiceProvidersQuerySchema),
  async (c) => {
    const { page, pageSize, tier, verification, category, city } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const where: Prisma.ServiceProviderWhereInput = {
      deletedAt: null,
      ...(tier !== undefined ? { subscriptionTier: tier } : {}),
      ...(verification !== undefined ? { verificationLevel: verification } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(city !== undefined
        ? {
            city: {
              contains: city,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.serviceProvider.count({ where }),
      prisma.serviceProvider.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return c.json({
      data: rows.map(serviceProviderPublicListItem),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);

adminServicehubV1.patch(
  "/providers/:id",
  zValidator("param", adminPatchServiceProviderParamSchema),
  zValidator("json", adminPatchServiceProviderBodySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const existing = await prisma.serviceProvider.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Service provider not found");
    }

    const updated = await prisma.serviceProvider.update({
      where: { id },
      data: {
        ...(body.verificationLevel !== undefined ? { verificationLevel: body.verificationLevel } : {}),
        ...(body.isVerified !== undefined ? { isVerified: body.isVerified } : {}),
      },
    });

    return c.json({ data: serviceProviderPublicListItem(updated) });
  },
);
