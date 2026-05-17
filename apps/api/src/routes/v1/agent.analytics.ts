import { UserRole } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { agentAnalyticsSummaryQuerySchema } from "../../contracts/agent-analytics.js";
import { buildAgentAnalyticsSummary } from "../../lib/agent-analytics-summary.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAgentOrDeveloper, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const agentAnalyticsV1 = new Hono<ApiEnv>();

agentAnalyticsV1.use("*", requireAuth, requireAgentOrDeveloper);

agentAnalyticsV1.get("/summary", zValidator("query", agentAnalyticsSummaryQuerySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { period } = c.req.valid("query");

  const data = await buildAgentAnalyticsSummary(prisma, {
    userId: auth.id,
    role: auth.role as UserRole,
    period,
  });

  return c.json({ data });
});
