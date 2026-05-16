import { ListingStatus, Prisma, UserRole } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  agentMessageThreadIdParamSchema,
  listAgentToursQuerySchema,
  sendAgentMessageBodySchema,
} from "../../contracts/agent-portal.js";
import { offsetFromPage, paginationQuerySchema } from "../../contracts/common.js";
import { listAgentInquiriesQuerySchema } from "../../contracts/inquiries.js";
import { buildAgentInsights, paginateInsights } from "../../lib/agent-insights.js";
import {
  listMessageThreadsForPortal,
  listMessagesInThreadForPortal,
  sendAgentPortalMessage,
} from "../../lib/agent-messaging.js";
import { buildAgentPortalDashboard, listAgentPortalTours } from "../../lib/agent-portal-dashboard.js";
import {
  paystackConfigured,
  tierFromAgentSubscription,
  tierFromDeveloperSubscription,
} from "../../lib/agent-portal-tier.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { inquiryToJson } from "../../lib/serialize/inquiry.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import { requireAgentOrDeveloper, requireAuth } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import type { ApiEnv } from "../../types/env.js";
import { z } from "zod";

export const agentScopedV1 = new Hono<ApiEnv>();

agentScopedV1.use("*", requireAuth, requireAgentOrDeveloper);

const agentMessageSendRateLimit = rateLimit({
  bucket: "agent:message-send",
  limit: 120,
  windowSeconds: 3600,
  keyFromContext: async (c) => c.get("authUser")?.id ?? "anonymous",
});

agentScopedV1.get("/context", async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const user = await prisma.user.findFirst({
    where: { id: authUser.id, deletedAt: null },
    include: { profile: true, agent: true, developer: true },
  });
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  const agentRow = user.agent?.deletedAt == null ? user.agent : null;
  const developerRow = user.developer?.deletedAt == null ? user.developer : null;

  const [agentSub, developerSub] = await Promise.all([
    agentRow ? prisma.subscription.findUnique({ where: { agentId: agentRow.id } }) : null,
    developerRow ? prisma.subscription.findUnique({ where: { developerId: developerRow.id } }) : null,
  ]);

  const persona = authUser.role === UserRole.agent ? "agent" : "developer";
  const tier =
    authUser.role === UserRole.agent
      ? tierFromAgentSubscription(agentSub)
      : tierFromDeveloperSubscription(developerSub);

  const activeSub = authUser.role === UserRole.agent ? agentSub : developerSub;

  const displayName =
    [user.profile?.firstName?.trim(), user.profile?.lastName?.trim()].filter(Boolean).join(" ").trim() ||
    null;

  const agencyName =
    persona === "agent" ? agentRow?.agencyName?.trim() || null : developerRow?.companyName?.trim() || null;

  const kycStatus =
    persona === "agent" ? agentRow?.kycStatus ?? "pending" : developerRow?.kycStatus ?? "pending";

  return c.json({
    data: {
      persona,
      userId: user.id,
      email: user.email,
      displayName,
      agencyName,
      city: user.profile?.city?.trim() || null,
      state: user.profile?.state?.trim() || null,
      avatarUrl: user.profile?.avatarUrl?.trim() || null,
      tier,
      subscriptionPlan: activeSub?.plan ?? null,
      subscriptionStatus: activeSub?.status ?? null,
      rating: persona === "agent" && agentRow ? agentRow.rating : null,
      reviewCount: persona === "agent" && agentRow ? agentRow.reviewCount : null,
      verification: {
        emailVerified: user.isEmailVerified,
        phoneVerified: user.isPhoneVerified,
        bvnOnFile: Boolean(agentRow?.bvnHash),
        agentVerifiedBadge: Boolean(agentRow?.verificationBadge),
        kycStatus,
      },
      paystackConfigured: paystackConfigured(),
      featureFlags: {
        agentWhatsappEnabled: process.env["AGENT_WHATSAPP_ENABLED"]?.trim() === "true",
        agentAiInsightsEnabled: process.env["AGENT_AI_INSIGHTS_ENABLED"]?.trim() !== "false",
      },
    },
  });
});

agentScopedV1.get("/dashboard", async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const data = await buildAgentPortalDashboard(prisma, {
    userId: authUser.id,
    role: authUser.role as UserRole,
  });
  return c.json({ data });
});

agentScopedV1.get("/tours", zValidator("query", listAgentToursQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { upcoming } = c.req.valid("query");
  const data = await listAgentPortalTours(prisma, {
    userId: authUser.id,
    upcomingOnly: upcoming === true,
  });
  return c.json({ data });
});

const listAgentListingsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ListingStatus).optional(),
});

agentScopedV1.get(
  "/listings",
  zValidator("query", listAgentListingsQuerySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { page, pageSize, status } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const where = {
      userId: authUser.id,
      deletedAt: null,
      ...(status !== undefined ? { status } : {}),
    } as const;

    const [total, rows] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        include: { property: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return c.json({
      data: rows.map(listingToJson),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);

agentScopedV1.get(
  "/inquiries",
  zValidator("query", listAgentInquiriesQuerySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { page, pageSize, status } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const agentRow =
      authUser.role === UserRole.agent
        ? await prisma.agent.findUnique({ where: { userId: authUser.id } })
        : null;

    const where: Prisma.InquiryWhereInput = {
      AND: [
        ...(status !== undefined ? [{ status }] : []),
        {
          OR: [
            agentRow ? { agentId: agentRow.id } : { agentId: "00000000-0000-0000-0000-000000000000" },
            { listing: { userId: authUser.id, deletedAt: null } },
          ],
        },
      ],
    };

    const [total, rows] = await Promise.all([
      prisma.inquiry.count({ where }),
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { listing: { include: { property: true } } },
      }),
    ]);

    return c.json({
      data: rows.map((row) => ({
        ...inquiryToJson(row),
        listing:
          row.listing && row.listing.deletedAt === null ? listingToJson(row.listing) : null,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);

agentScopedV1.get("/insights", zValidator("query", paginationQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { page, pageSize } = c.req.valid("query");
  const raw = await buildAgentInsights(prisma, {
    userId: authUser.id,
    role: authUser.role as UserRole,
  });
  const { items, total, totalPages } = paginateInsights(raw, page, pageSize);
  return c.json({
    data: { items },
    meta: { page, pageSize, total, totalPages },
  });
});

agentScopedV1.get("/messages/threads", zValidator("query", paginationQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { page, pageSize } = c.req.valid("query");
  const { threads, total } = await listMessageThreadsForPortal(prisma, authUser.id, page, pageSize);
  return c.json({
    data: threads,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

agentScopedV1.get(
  "/messages/threads/:threadId",
  zValidator("param", agentMessageThreadIdParamSchema),
  zValidator("query", paginationQuerySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { threadId } = c.req.valid("param");
    const { page, pageSize } = c.req.valid("query");
    const { messages, meta } = await listMessagesInThreadForPortal(
      prisma,
      authUser.id,
      threadId,
      page,
      pageSize,
    );
    return c.json({ data: messages, meta });
  },
);

agentScopedV1.post(
  "/messages",
  agentMessageSendRateLimit,
  zValidator("json", sendAgentMessageBodySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const body = c.req.valid("json");
    const result = await sendAgentPortalMessage(prisma, {
      senderId: authUser.id,
      threadId: body.threadId,
      receiverId: body.receiverId,
      content: body.content,
    });
    return c.json({ data: result }, 201);
  },
);
