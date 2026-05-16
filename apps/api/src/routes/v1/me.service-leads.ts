import { ServiceLeadStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  meServiceLeadReviewParamSchema,
  postMeServiceLeadReviewBodySchema,
} from "../../contracts/me-service-leads.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { serviceLeadToClientJson } from "../../lib/serialize/service-lead-client.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meServiceLeadsV1 = new Hono<ApiEnv>();

meServiceLeadsV1.get("/", requireAuth, async (c) => {
  const authUser = c.get("authUser")!;
  const rows = await prisma.serviceLead.findMany({
    where: { clientUserId: authUser.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  if (rows.length === 0) {
    return c.json({ data: [] });
  }
  const providerIds = [...new Set(rows.map((r) => r.serviceProviderId))];
  const providers = await prisma.serviceProvider.findMany({
    where: { id: { in: providerIds }, deletedAt: null },
    select: { id: true, businessName: true, slug: true },
  });
  const byId = new Map(providers.map((p) => [p.id, p]));
  const data = rows
    .map((lead) => {
      const p = byId.get(lead.serviceProviderId);
      if (!p) return null;
      return serviceLeadToClientJson(lead, p);
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  return c.json({ data });
});

meServiceLeadsV1.post(
  "/:leadId/review",
  requireAuth,
  zValidator("param", meServiceLeadReviewParamSchema),
  zValidator("json", postMeServiceLeadReviewBodySchema),
  async (c) => {
    const authUser = c.get("authUser")!;
    const { leadId } = c.req.valid("param");
    const body = c.req.valid("json");

    const lead = await prisma.serviceLead.findFirst({
      where: { id: leadId, clientUserId: authUser.id },
    });
    if (!lead) {
      throw new ApiError(404, "NOT_FOUND", "Lead not found");
    }
    if (lead.status !== ServiceLeadStatus.completed) {
      throw new ApiError(
        409,
        "LEAD_NOT_COMPLETED",
        "Reviews are only allowed after the job is marked complete",
      );
    }

    const existing = await prisma.serviceReview.findUnique({
      where: { serviceLeadId: leadId },
    });
    if (existing) {
      throw new ApiError(409, "REVIEW_EXISTS", "A review for this job already exists");
    }

    await prisma.$transaction(async (tx) => {
      await tx.serviceReview.create({
        data: {
          serviceLeadId: lead.id,
          serviceProviderId: lead.serviceProviderId,
          reviewerId: authUser.id,
          overallRating: body.overallRating,
          qualityRating: body.qualityRating,
          communicationRating: body.communicationRating,
          timelinessRating: body.timelinessRating,
          valueRating: body.valueRating,
          title: body.title,
          body: body.body,
          isJobVerified: true,
        },
      });

      const reviews = await tx.serviceReview.findMany({
        where: { serviceProviderId: lead.serviceProviderId },
        select: { overallRating: true },
      });
      const n = reviews.length;
      const avg = n === 0 ? 0 : reviews.reduce((s, r) => s + r.overallRating, 0) / n;

      await tx.serviceProvider.update({
        where: { id: lead.serviceProviderId },
        data: {
          rating: avg,
          reviewCount: n,
        },
      });
    });

    return c.json({ data: { ok: true } }, 201);
  },
);
