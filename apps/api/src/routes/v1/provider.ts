import { NotificationType, Prisma, ServiceLeadStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  listProviderLeadsQuerySchema,
  patchProviderLeadBodySchema,
  patchProviderProfileBodySchema,
  postProviderAvailabilityBodySchema,
  providerLeadIdParamSchema,
} from "../../contracts/provider-portal.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { assertServiceLeadStatusTransition } from "../../lib/servicehub/lead-status-machine.js";
import { stubServiceReviewInviteNotify } from "../../lib/servicehub/review-invite-stub.js";
import { buildProviderPortalDashboard } from "../../lib/provider-portal-dashboard.js";
import { tierFromServiceProvider } from "../../lib/provider-portal-tier.js";
import {
  namesToServicesOfferedJson,
  serviceProviderProfileToJson,
} from "../../lib/serialize/provider-portal.js";
import { serviceLeadToProviderPortalJson } from "../../lib/serialize/service-lead-portal.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";
import { providerAnalyticsV1 } from "./provider.analytics.js";
import { providerContentV1 } from "./provider.content.js";
import { providerJobsV1 } from "./provider.jobs.js";
import { providerKycV1 } from "./provider.kyc.js";
import { providerReviewsV1 } from "./provider.reviews.js";
import { providerSettingsV1 } from "./provider.settings.js";
import { providerSubscriptionV1 } from "./provider.subscription.js";
import { providerWhatsappV1 } from "./provider.whatsapp.js";

export const providerScopedV1 = new Hono<ApiEnv>();

providerScopedV1.use("*", requireAuth, requireServiceProvider);

providerScopedV1.get("/context", async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const user = await prisma.user.findFirst({
    where: { id: authUser.id, deletedAt: null },
    include: { profile: true, serviceProvider: true },
  });
  if (!user?.serviceProvider || user.serviceProvider.deletedAt != null) {
    throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
  }

  const sp = user.serviceProvider;
  const displayName =
    [user.profile?.firstName?.trim(), user.profile?.lastName?.trim()].filter(Boolean).join(" ").trim() ||
    null;

  const tier = tierFromServiceProvider(sp);

  return c.json({
    data: {
      userId: user.id,
      email: user.email,
      displayName,
      businessName: sp.businessName,
      category: sp.category,
      city: sp.city,
      state: sp.state,
      logoUrl: sp.logoUrl?.trim() || null,
      avatarUrl: sp.logoUrl?.trim() || user.profile?.avatarUrl?.trim() || null,
      tier,
      verificationLevel: sp.verificationLevel,
      isVerified: sp.isVerified,
      featureFlags: {
        providerWhatsappEnabled: process.env["PROVIDER_WHATSAPP_ENABLED"]?.trim() === "true",
      },
    },
  });
});

providerScopedV1.get("/dashboard", async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const built = await buildProviderPortalDashboard(prisma, { userId: authUser.id });
  if (!built) {
    throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
  }

  return c.json({ data: built });
});

providerScopedV1.get("/profile", async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const sp = await prisma.serviceProvider.findFirst({
    where: { userId: authUser.id, deletedAt: null },
  });
  if (!sp) {
    throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
  }

  return c.json({ data: serviceProviderProfileToJson(sp) });
});

providerScopedV1.patch("/profile", zValidator("json", patchProviderProfileBodySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const body = c.req.valid("json");

  const existing = await prisma.serviceProvider.findFirst({
    where: { userId: authUser.id, deletedAt: null },
  });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
  }

  const updated = await prisma.serviceProvider.update({
    where: { id: existing.id },
    data: {
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.businessName !== undefined ? { businessName: body.businessName } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.services !== undefined
        ? { servicesOffered: namesToServicesOfferedJson(body.services) }
        : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.city !== undefined ? { city: body.city } : {}),
      ...(body.state !== undefined ? { state: body.state } : {}),
      ...(body.country !== undefined ? { country: body.country } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.website !== undefined ? { website: body.website } : {}),
      ...(body.socialLinks !== undefined
        ? {
            socialLinks:
              body.socialLinks === null
                ? Prisma.DbNull
                : (body.socialLinks as Prisma.InputJsonValue),
          }
        : {}),
    },
  });

  return c.json({ data: serviceProviderProfileToJson(updated) });
});

providerScopedV1.get("/availability", async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const provider = await prisma.serviceProvider.findFirst({
    where: { userId: authUser.id, deletedAt: null },
  });
  if (!provider) {
    throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
  }

  const rangeStart = new Date();
  rangeStart.setUTCHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 30);

  const rows = await prisma.providerAvailability.findMany({
    where: {
      serviceProviderId: provider.id,
      date: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { date: "asc" },
    take: 31,
  });

  return c.json({
    data: {
      days: rows.map((a) => ({
        date: a.date.toISOString().slice(0, 10),
        isAvailable: a.isAvailable,
        note: a.note ?? null,
      })),
    },
  });
});

providerScopedV1.post(
  "/availability",
  zValidator("json", postProviderAvailabilityBodySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const body = c.req.valid("json");
    const provider = await prisma.serviceProvider.findFirst({
      where: { userId: authUser.id, deletedAt: null },
    });
    if (!provider) {
      throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
    }

    const day = new Date(`${body.date}T00:00:00.000Z`);

    const existing = await prisma.providerAvailability.findFirst({
      where: { serviceProviderId: provider.id, date: day },
    });

    const row = existing
      ? await prisma.providerAvailability.update({
          where: { id: existing.id },
          data: {
            isAvailable: body.isAvailable,
            note: body.note === undefined ? undefined : body.note,
          },
        })
      : await prisma.providerAvailability.create({
          data: {
            serviceProviderId: provider.id,
            date: day,
            isAvailable: body.isAvailable,
            note: body.note ?? null,
          },
        });

    return c.json({
      data: {
        date: row.date.toISOString().slice(0, 10),
        isAvailable: row.isAvailable,
        note: row.note ?? null,
      },
    });
  },
);

providerScopedV1.get("/leads", zValidator("query", listProviderLeadsQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const query = c.req.valid("query");

  const provider = await prisma.serviceProvider.findFirst({
    where: { userId: authUser.id, deletedAt: null },
  });
  if (!provider) {
    throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
  }

  const where: Prisma.ServiceLeadWhereInput = {
    serviceProviderId: provider.id,
  };
  if (query.status) where.status = query.status;
  if (query.source) where.source = query.source;

  const skip = offsetFromPage(query.page, query.pageSize);

  const [total, rows] = await Promise.all([
    prisma.serviceLead.count({ where }),
    prisma.serviceLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return c.json({
    data: rows.map(serviceLeadToProviderPortalJson),
    meta: { page: query.page, pageSize: query.pageSize, total, totalPages },
  });
});

providerScopedV1.patch(
  "/leads/:id",
  zValidator("param", providerLeadIdParamSchema),
  zValidator("json", patchProviderLeadBodySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const { id: leadId } = c.req.valid("param");
    const body = c.req.valid("json");

    const provider = await prisma.serviceProvider.findFirst({
      where: { userId: authUser.id, deletedAt: null },
    });
    if (!provider) {
      throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
    }

    const lead = await prisma.serviceLead.findFirst({
      where: { id: leadId, serviceProviderId: provider.id },
    });
    if (!lead) {
      throw new ApiError(404, "NOT_FOUND", "Lead not found");
    }

    if (body.status !== undefined && body.status !== lead.status) {
      assertServiceLeadStatusTransition(lead.status, body.status);
    }

    const data: Prisma.ServiceLeadUpdateInput = {};
    const becameCompleted =
      body.status === ServiceLeadStatus.completed && lead.status !== ServiceLeadStatus.completed;

    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === ServiceLeadStatus.responded && lead.respondedAt == null) {
        data.respondedAt = new Date();
      }
      if (body.status === ServiceLeadStatus.completed && lead.completedAt == null) {
        data.completedAt = new Date();
      }
    }

    if (body.quotedAmountKobo !== undefined) {
      data.quotedAmountKobo = BigInt(body.quotedAmountKobo);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.serviceLead.update({
        where: { id: lead.id },
        data,
      });

      if (becameCompleted) {
        await tx.serviceProvider.update({
          where: { id: provider.id },
          data: { completedJobCount: { increment: 1 } },
        });
        if (lead.clientUserId) {
          await tx.notification.create({
            data: {
              userId: lead.clientUserId,
              type: NotificationType.system,
              title: "How was your service?",
              body: `Please leave a review for ${provider.businessName}.`,
              metadata: {
                leadId: lead.id,
                serviceProviderId: provider.id,
                kind: "service_review_invite",
              } as Prisma.InputJsonValue,
            },
          });
        }
      }

      return row;
    });

    if (becameCompleted && lead.clientUserId) {
      stubServiceReviewInviteNotify({
        clientUserId: lead.clientUserId,
        leadId: lead.id,
        providerBusinessName: provider.businessName,
      });
    }

    return c.json({ data: serviceLeadToProviderPortalJson(updated) });
  },
);

providerScopedV1.route("/jobs", providerJobsV1);
providerScopedV1.route("/analytics", providerAnalyticsV1);
providerScopedV1.route("/reviews", providerReviewsV1);
providerScopedV1.route("/kyc", providerKycV1);
providerScopedV1.route("/subscription", providerSubscriptionV1);
providerScopedV1.route("/settings", providerSettingsV1);
providerScopedV1.route("/whatsapp", providerWhatsappV1);
providerScopedV1.route("/content", providerContentV1);
