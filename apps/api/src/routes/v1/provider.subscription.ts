import { randomUUID } from "node:crypto";

import { ProviderTier, ServiceLeadStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { providerSubscriptionCheckoutBodySchema } from "../../contracts/provider-subscription.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { providerForUser } from "../../lib/provider-for-user.js";
import { tierFromServiceProvider } from "../../lib/provider-portal-tier.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const providerSubscriptionV1 = new Hono<ApiEnv>();

providerSubscriptionV1.use("*", requireAuth, requireServiceProvider);

function paystackConfigured(): boolean {
  const pub = process.env["PAYSTACK_PUBLIC_KEY"]?.trim();
  const sec = process.env["PAYSTACK_SECRET_KEY"]?.trim();
  return Boolean(pub && sec);
}

function limitsForTier(tier: ReturnType<typeof tierFromServiceProvider>) {
  const isPaid = tier !== "free";
  return {
    analyticsDepth: isPaid ? ("full" as const) : ("basic" as const),
    whatsappBridge: isPaid,
    contentStudio: isPaid,
  };
}

async function subscriptionPayload(providerId: string) {
  const provider = await prisma.serviceProvider.findFirst({
    where: { id: providerId, deletedAt: null },
  });
  if (!provider) throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");

  const tier = tierFromServiceProvider(provider);
  const [activeJobs, completedJobs] = await Promise.all([
    prisma.serviceLead.count({
      where: {
        serviceProviderId: provider.id,
        status: { in: [ServiceLeadStatus.negotiating, ServiceLeadStatus.accepted] },
      },
    }),
    prisma.serviceLead.count({
      where: { serviceProviderId: provider.id, status: ServiceLeadStatus.completed },
    }),
  ]);

  return {
    serviceProviderId: provider.id,
    businessName: provider.businessName,
    tier,
    usage: {
      activeJobs,
      completedJobs,
      leadCount: provider.leadCount,
      reviewCount: provider.reviewCount,
    },
    limits: limitsForTier(tier),
    paystackConfigured: paystackConfigured(),
  };
}

providerSubscriptionV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const row = await providerForUser(auth.id);
  return c.json({ data: await subscriptionPayload(row.id) });
});

providerSubscriptionV1.post(
  "/checkout",
  zValidator("json", providerSubscriptionCheckoutBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const row = await providerForUser(auth.id);
    const body = c.req.valid("json");

    if (!paystackConfigured()) {
      const updated = await prisma.serviceProvider.update({
        where: { id: row.id },
        data: {
          subscriptionTier: body.tier === "elite" ? ProviderTier.elite : ProviderTier.pro,
        },
      });
      return c.json({
        data: {
          mode: "stub_direct" as const,
          tier: body.tier,
          subscription: await subscriptionPayload(updated.id),
          disclaimer:
            "Paystack is not configured; tier was updated locally for development. Do not use in production.",
        },
      });
    }

    const reference = `prv_sub_${randomUUID().replace(/-/g, "")}`;
    return c.json({
      data: {
        mode: "stub" as const,
        tier: body.tier,
        reference,
        authorizationUrl: `https://paystack.com/pay/${encodeURIComponent(reference)}`,
        disclaimer:
          "Stub checkout URL until Paystack initialize transaction is wired; tier updates on webhook.",
      },
    });
  },
);
