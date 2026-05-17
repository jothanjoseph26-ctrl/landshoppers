import { randomUUID } from "node:crypto";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { postProviderContentGenerateBodySchema } from "../../contracts/provider-content.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { providerForUser } from "../../lib/provider-for-user.js";
import { tierFromServiceProvider } from "../../lib/provider-portal-tier.js";
import { assertProviderFeature } from "../../lib/provider-tier-gate.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const providerContentV1 = new Hono<ApiEnv>();

providerContentV1.use("*", requireAuth, requireServiceProvider);

providerContentV1.post(
  "/generate",
  zValidator("json", postProviderContentGenerateBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const provider = await providerForUser(auth.id);
    const tier = tierFromServiceProvider(provider);
    assertProviderFeature(tier, "content_ai");

    const body = c.req.valid("json");
    let serviceLabel = body.category ?? provider.category;
    if (body.leadId) {
      const lead = await prisma.serviceLead.findFirst({
        where: { id: body.leadId, serviceProviderId: provider.id },
      });
      if (lead) serviceLabel = lead.serviceRequested;
    }

    const tone = body.tone === "friendly" ? "friendly" : "professional";
    const intro =
      tone === "friendly"
        ? `Hi! ${provider.businessName} here — we help with ${serviceLabel} across ${provider.city}.`
        : `${provider.businessName} delivers trusted ${serviceLabel} services in ${provider.city}, ${provider.state}.`;

    const captions = [
      {
        id: randomUUID(),
        platform: "instagram",
        text: `${intro} Message us for a quote this week.`,
      },
      {
        id: randomUUID(),
        platform: "linkedin",
        text: `${intro} Verified on LandShoppers ServiceHub.`,
      },
    ];

    return c.json({
      data: {
        captions,
        disclaimer: "Template captions only — AI generation ships in a later sprint.",
      },
    });
  },
);
