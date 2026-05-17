import { Prisma, ServiceLeadStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  listProviderJobsQuerySchema,
  patchProviderJobBodySchema,
  PROVIDER_JOB_STATUSES,
  providerJobIdParamSchema,
} from "../../contracts/provider-jobs.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { providerForUser } from "../../lib/provider-for-user.js";
import { assertServiceLeadStatusTransition } from "../../lib/servicehub/lead-status-machine.js";
import { serviceLeadToProviderPortalJson } from "../../lib/serialize/service-lead-portal.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const providerJobsV1 = new Hono<ApiEnv>();

providerJobsV1.use("*", requireAuth, requireServiceProvider);

providerJobsV1.get("/", zValidator("query", listProviderJobsQuerySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const query = c.req.valid("query");
  const provider = await providerForUser(auth.id);

  const statusFilter = query.status ? [query.status] : [...PROVIDER_JOB_STATUSES];
  const where: Prisma.ServiceLeadWhereInput = {
    serviceProviderId: provider.id,
    status: { in: statusFilter },
  };

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

  return c.json({
    data: rows.map(serviceLeadToProviderPortalJson),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
});

providerJobsV1.patch(
  "/:id",
  zValidator("param", providerJobIdParamSchema),
  zValidator("json", patchProviderJobBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id: leadId } = c.req.valid("param");
    const body = c.req.valid("json");
    const provider = await providerForUser(auth.id);

    const lead = await prisma.serviceLead.findFirst({
      where: { id: leadId, serviceProviderId: provider.id },
    });
    if (!lead) throw new ApiError(404, "NOT_FOUND", "Job not found");
    if (!PROVIDER_JOB_STATUSES.includes(lead.status as (typeof PROVIDER_JOB_STATUSES)[number])) {
      throw new ApiError(409, "INVALID_JOB", "Lead is not in the jobs pipeline");
    }

    assertServiceLeadStatusTransition(lead.status, body.status);

    const data: Prisma.ServiceLeadUpdateInput = { status: body.status };
    if (body.status === ServiceLeadStatus.completed && lead.completedAt == null) {
      data.completedAt = new Date();
    }

    const updated = await prisma.serviceLead.update({
      where: { id: lead.id },
      data,
    });

    return c.json({ data: serviceLeadToProviderPortalJson(updated) });
  },
);
