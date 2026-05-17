import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { providerAnalyticsSummaryQuerySchema } from "../../contracts/provider-analytics.js";
import { ApiError } from "../../lib/errors.js";
import { buildProviderAnalyticsSummary } from "../../lib/provider-analytics-summary.js";
import { providerForUser } from "../../lib/provider-for-user.js";
import { prisma } from "../../lib/prisma.js";
import { tierFromServiceProvider } from "../../lib/provider-portal-tier.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const providerAnalyticsV1 = new Hono<ApiEnv>();

providerAnalyticsV1.use("*", requireAuth, requireServiceProvider);

providerAnalyticsV1.get(
  "/summary",
  zValidator("query", providerAnalyticsSummaryQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const provider = await providerForUser(auth.id);
    const query = c.req.valid("query");

    const summary = await buildProviderAnalyticsSummary(prisma, {
      serviceProviderId: provider.id,
      period: query.period,
    });
    if (!summary) throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");

    return c.json({
      data: {
        ...summary,
        tier: tierFromServiceProvider(provider),
      },
    });
  },
);
