import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  listProviderReviewsQuerySchema,
  patchProviderReviewBodySchema,
  providerReviewIdParamSchema,
} from "../../contracts/provider-reviews.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { maskPersonName } from "../../lib/mask-person-name.js";
import { providerForUser } from "../../lib/provider-for-user.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const providerReviewsV1 = new Hono<ApiEnv>();

providerReviewsV1.use("*", requireAuth, requireServiceProvider);

function reviewToJson(row: {
  id: string;
  serviceLeadId: string;
  overallRating: number;
  title: string;
  body: string;
  isJobVerified: boolean;
  providerResponse: string | null;
  createdAt: Date;
  reviewer: { profile: { firstName: string | null; lastName: string | null } | null; email: string };
}) {
  const name = [row.reviewer.profile?.firstName, row.reviewer.profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    id: row.id,
    serviceLeadId: row.serviceLeadId,
    overallRating: row.overallRating,
    title: row.title,
    body: row.body,
    isJobVerified: row.isJobVerified,
    providerResponse: row.providerResponse,
    reviewerLabel: name ? maskPersonName(name) : maskPersonName(row.reviewer.email.split("@")[0] ?? "Client"),
    createdAt: row.createdAt.toISOString(),
  };
}

providerReviewsV1.get("/", zValidator("query", listProviderReviewsQuerySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const query = c.req.valid("query");
  const provider = await providerForUser(auth.id);

  const where = { serviceProviderId: provider.id };
  const skip = offsetFromPage(query.page, query.pageSize);
  const [total, rows] = await Promise.all([
    prisma.serviceReview.count({ where }),
    prisma.serviceReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      include: {
        reviewer: { include: { profile: true } },
      },
    }),
  ]);

  return c.json({
    data: rows.map(reviewToJson),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
});

providerReviewsV1.patch(
  "/:id",
  zValidator("param", providerReviewIdParamSchema),
  zValidator("json", patchProviderReviewBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const provider = await providerForUser(auth.id);

    const existing = await prisma.serviceReview.findFirst({
      where: { id, serviceProviderId: provider.id },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Review not found");

    const updated = await prisma.serviceReview.update({
      where: { id },
      data: { providerResponse: body.providerResponse },
      include: {
        reviewer: { include: { profile: true } },
      },
    });

    return c.json({ data: reviewToJson(updated) });
  },
);
