import { Hono } from "hono";

import { ApiError } from "../../lib/errors.js";
import { meToJson } from "../../lib/serialize/me.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";
import { meDeveloperV1 } from "./me.developer.js";
import { savedListingsV1 } from "./me.saved-listings.js";
import { savedSearchesV1 } from "./me.saved-searches.js";
import { recentListingsV1 } from "./me.recent-listings.js";
import { meInquiriesV1 } from "./me.inquiries.js";
import { meRecommendationsV1 } from "./me.recommendations.js";
import { meServiceLeadsV1 } from "./me.service-leads.js";
import { meSettingsV1 } from "./me.settings.js";
import { meToursV1 } from "./me.tours.js";

export const meV1 = new Hono<ApiEnv>();

meV1.get("/", requireAuth, async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const user = await prisma.user.findFirst({
    where: { id: authUser.id, deletedAt: null },
    include: {
      profile: true,
      agent: true,
      developer: true,
      serviceProvider: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  return c.json({ data: meToJson(user) });
});

meV1.route("/saved-listings", savedListingsV1);
meV1.route("/saved-searches", savedSearchesV1);
meV1.route("/recent-listings", recentListingsV1);
meV1.route("/inquiries", meInquiriesV1);
meV1.route("/recommendations", meRecommendationsV1);
meV1.route("/developer", meDeveloperV1);
meV1.route("/service-leads", meServiceLeadsV1);
meV1.route("/settings", meSettingsV1);
meV1.route("/tours", meToursV1);
