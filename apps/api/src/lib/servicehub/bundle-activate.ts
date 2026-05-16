import type { Prisma, PrismaClient, ServiceCategory } from "@landshoppers/db";
import {
  BundleActivationStatus,
  ListingStatus,
  NotificationType,
  ServiceLeadSource,
} from "@landshoppers/db";
import { scoreServiceLeadHeuristic } from "@landshoppers/servicehub-match";
import type { Redis } from "ioredis";

import { ApiError } from "../errors.js";
import { SERVICEHUB_CATEGORY_CATALOG } from "./category-catalog.js";
import { getListingServiceMatches } from "./contextual-match.js";

const CATEGORY_NAME = new Map(
  SERVICEHUB_CATEGORY_CATALOG.map((c) => [c.id, c.name] as const),
);

/** Coordination fee (spec §7) in basis points: 100 BPS = 1%. 500 BPS = 5%. Integer math only. */
export const BUNDLE_PLATFORM_FEE_BPS = 500n;

export function estimatedBundlePlatformFeeKobo(bundlePriceFromKobo: bigint): bigint {
  return (bundlePriceFromKobo * BUNDLE_PLATFORM_FEE_BPS) / 10000n;
}

export type BundleActivationResult = {
  activationId: string;
  bundleId: string;
  bundleName: string;
  leads: Array<{
    serviceCategory: string;
    providerId: string;
    status: string;
    leadId: string;
  }>;
  /** Bundle catalogue floor (kobo) — GMV estimate before any quotes. */
  estimatedGmvKobo: string;
  /** Fee stored on activation; idempotent replay returns this value, not a fresh fee from current BPS × bundle price. */
  estimatedPlatformFeeKobo: string;
};

type ResolvedSlot = {
  category: ServiceCategory;
  providerId: string;
  providerUserId: string;
  businessName: string;
  slug: string;
};

async function fallbackProvider(
  prisma: PrismaClient,
  category: ServiceCategory,
): Promise<ResolvedSlot | null> {
  const row = await prisma.serviceProvider.findFirst({
    where: { category, deletedAt: null },
    orderBy: [{ aiMatchScore: "desc" }, { rating: "desc" }],
    select: { id: true, userId: true, businessName: true, slug: true, category: true },
  });
  if (!row) return null;
  return {
    category: row.category,
    providerId: row.id,
    providerUserId: row.userId,
    businessName: row.businessName,
    slug: row.slug,
  };
}

export async function resolveProvidersForBundleCategories(
  prisma: PrismaClient,
  redis: Redis | null,
  listingId: string | undefined,
  categories: ServiceCategory[],
): Promise<ResolvedSlot[]> {
  const listingOk =
    listingId &&
    (await prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null, status: ListingStatus.active },
    }));

  const out: ResolvedSlot[] = [];

  if (listingOk) {
    const payload = await getListingServiceMatches(prisma, redis, {
      listingId: listingId!,
      categories,
      persistLogs: process.env["NODE_ENV"] !== "test",
    });
    for (const cat of categories) {
      const top = payload.categories[cat]?.providers?.[0];
      if (top) {
        const row = await prisma.serviceProvider.findFirst({
          where: { id: top.provider.id, deletedAt: null },
          select: { id: true, userId: true, businessName: true, slug: true, category: true },
        });
        if (row) {
          out.push({
            category: row.category,
            providerId: row.id,
            providerUserId: row.userId,
            businessName: row.businessName,
            slug: row.slug,
          });
          continue;
        }
      }
      const fb = await fallbackProvider(prisma, cat);
      if (fb) out.push(fb);
    }
  } else {
    for (const cat of categories) {
      const fb = await fallbackProvider(prisma, cat);
      if (fb) out.push(fb);
    }
  }

  return out;
}

export async function activateServiceBundleTransaction(
  prisma: PrismaClient,
  redis: Redis | null,
  input: {
    bundleId: string;
    clientUserId: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string | null;
    listingId: string | null;
    locationText: string;
    messagePrefix: string | null;
  },
) {
  const bundle = await prisma.serviceBundle.findFirst({
    where: { id: input.bundleId, isActive: true },
  });
  if (!bundle) {
    throw new ApiError(404, "NOT_FOUND", "Bundle not found");
  }

  const categories = [...new Set(bundle.categories)] as ServiceCategory[];
  const resolved = await resolveProvidersForBundleCategories(
    prisma,
    redis,
    input.listingId ?? undefined,
    categories,
  );

  if (resolved.length !== categories.length) {
    throw new ApiError(
      422,
      "BUNDLE_MATCH_INCOMPLETE",
      "One or more bundle categories have no available providers yet",
    );
  }

  /** Double-click / retry safety: same buyer + bundle + listing within 60s replays the first activation (no duplicate leads or notifications). */
  const IDEMPOTENCY_WINDOW_MS = 60_000;

  // Note: two concurrent requests can still race before either row exists; for production consider
  // `Idempotency-Key` + dedicated column, or a DB uniqueness strategy, in addition to this window.

  const estimatedGmvKobo = bundle.priceFromKobo;
  const estimatedPlatformFeeKobo = estimatedBundlePlatformFeeKobo(estimatedGmvKobo);

  return prisma.$transaction(async (tx) => {
    const since = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
    const existing = await tx.bundleActivation.findFirst({
      where: {
        bundleId: input.bundleId,
        clientUserId: input.clientUserId,
        listingId: input.listingId,
        createdAt: { gte: since },
        status: BundleActivationStatus.providers_matched,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const raw = existing.matchedProviders;
      const slots = Array.isArray(raw)
        ? (raw as Array<{
            leadId?: string;
            serviceCategory?: string;
            providerId?: string;
            status?: string;
          }>)
        : [];
      if (
        slots.length > 0 &&
        slots.every((s) => typeof s.leadId === "string" && s.leadId.length > 0)
      ) {
        const gmv = estimatedGmvKobo.toString();
        const fee =
          existing.platformFeeKobo !== null && existing.platformFeeKobo !== undefined
            ? existing.platformFeeKobo.toString()
            : estimatedBundlePlatformFeeKobo(estimatedGmvKobo).toString();
        return {
          activationId: existing.id,
          bundleId: bundle.id,
          bundleName: bundle.name,
          leads: slots.map((s) => ({
            serviceCategory: String(s.serviceCategory ?? ""),
            providerId: String(s.providerId ?? ""),
            status: String(s.status ?? "pending"),
            leadId: String(s.leadId),
          })),
          estimatedGmvKobo: gmv,
          estimatedPlatformFeeKobo: fee,
        };
      }
    }

    const baseMessage =
      input.messagePrefix?.trim() ||
      `Bundle request: ${bundle.name}. Please review and respond with a quote.`;

    const matchedSlots: Array<{
      serviceCategory: string;
      providerId: string;
      status: string;
      leadId: string;
    }> = [];

    for (const slot of resolved) {
      const catLabel = CATEGORY_NAME.get(slot.category) ?? slot.category;
      const serviceRequested = `${bundle.name} — ${catLabel}`;

      const scoring = scoreServiceLeadHeuristic({
        message: baseMessage,
        serviceRequested,
        budgetKobo: null,
        timeline: null,
        location: input.locationText,
        source: ServiceLeadSource.bundle,
        clientPhone: input.clientPhone,
        clientEmail: input.clientEmail,
      });

      const lead = await tx.serviceLead.create({
        data: {
          serviceProviderId: slot.providerId,
          clientUserId: input.clientUserId,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientEmail: input.clientEmail,
          source: ServiceLeadSource.bundle,
          listingId: input.listingId,
          bundleId: bundle.id,
          serviceRequested,
          message: baseMessage,
          budget: null,
          timeline: null,
          location: input.locationText,
          aiScore: scoring.aiScore,
          aiSummary: scoring.aiSummary,
        },
      });

      await tx.serviceProvider.update({
        where: { id: slot.providerId },
        data: { leadCount: { increment: 1 } },
      });

      await tx.notification.create({
        data: {
          userId: slot.providerUserId,
          type: NotificationType.system,
          title: "New bundle lead",
          body: `${input.clientName} activated “${bundle.name}” — ${catLabel}.`,
          metadata: {
            leadId: lead.id,
            bundleId: bundle.id,
          } as Prisma.InputJsonValue,
        },
      });

      matchedSlots.push({
        serviceCategory: slot.category,
        providerId: slot.providerId,
        status: "pending",
        leadId: lead.id,
      });
    }

    const activation = await tx.bundleActivation.create({
      data: {
        bundleId: bundle.id,
        clientUserId: input.clientUserId,
        listingId: input.listingId,
        status: BundleActivationStatus.providers_matched,
        matchedProviders: matchedSlots as unknown as Prisma.InputJsonValue,
        platformFeeKobo: estimatedPlatformFeeKobo,
      },
    });

    await tx.serviceBundle.update({
      where: { id: bundle.id },
      data: { activationCount: { increment: 1 } },
    });

    return {
      activationId: activation.id,
      bundleId: bundle.id,
      bundleName: bundle.name,
      leads: matchedSlots,
      estimatedGmvKobo: estimatedGmvKobo.toString(),
      estimatedPlatformFeeKobo: estimatedPlatformFeeKobo.toString(),
    };
  });
}
