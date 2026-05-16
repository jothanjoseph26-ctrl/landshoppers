import { InquiryStatus, type Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import { inquiryIdParamSchema } from "../../contracts/inquiries.js";
import {
  createDeveloperProjectBodySchema,
  developerProjectIdParamSchema,
  leadsDigestEmailBodySchema,
  leadsDigestQuerySchema,
  listDeveloperInquiriesQuerySchema,
  listDeveloperProjectsQuerySchema,
  patchDeveloperProjectBodySchema,
} from "../../contracts/developer-portal.js";
import { formatDigestEmail, sendDigestEmail } from "../../lib/developer-digest-email.js";
import { buildLeadsDigestForDeveloper } from "../../lib/developer-leads-digest.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { developerProjectToJson } from "../../lib/serialize/developer-project.js";
import { inquiryToJson } from "../../lib/serialize/inquiry.js";
import { slugifyUnique } from "../../lib/slug.js";
import { requireAuth, requireDeveloper } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import type { ApiEnv } from "../../types/env.js";
import { meDeveloperAnalyticsV1 } from "./me.developer.analytics.js";
import { meDeveloperBulkUploadsV1 } from "./me.developer.bulk-upload.js";
import { meDeveloperKycV1 } from "./me.developer.kyc.js";
import { meDeveloperSettingsV1 } from "./me.developer.settings.js";
import { meDeveloperSubscriptionV1 } from "./me.developer.subscription.js";
import { meDeveloperTeamV1 } from "./me.developer.team.js";

export const meDeveloperV1 = new Hono<ApiEnv>();

meDeveloperV1.use("*", requireAuth, requireDeveloper);

const leadsDigestEmailRateLimit = rateLimit({
  bucket: "developer:leads-digest-email",
  limit: 8,
  windowSeconds: 3600,
  keyFromContext: async (c) => c.get("authUser")?.id ?? "anonymous",
});

async function developerForUser(userId: string) {
  const row = await prisma.developer.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Developer profile not found for this account");
  }
  return row;
}

function pitchDraftCopy(input: {
  buyerName: string | null;
  projectName: string;
  city: string;
  state: string;
  message: string | null;
}): { subject: string; body: string } {
  const who = input.buyerName?.trim() || "there";
  const snippet = input.message?.trim().slice(0, 280) ?? "";
  const subject = `${input.projectName} — thank you for your inquiry`;
  const body = `Hi ${who},

Thank you for reaching out about **${input.projectName}** (${input.city}, ${input.state}).

${snippet ? `You wrote:\n> ${snippet}${input.message && input.message.length > 280 ? "…" : ""}\n\n` : ""}We would be glad to walk you through availability, pricing bands, and next steps (site visit or virtual walkthrough).

Reply to this thread or ask for a brochure and we will send it within one business day.

— ${input.projectName} sales desk
(LandShoppers developer portal — template draft)`;
  return { subject, body };
}

meDeveloperV1.get("/dashboard", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const dev = await developerForUser(auth.id);

  const projects = await prisma.developerProject.findMany({
    where: { developerId: dev.id, deletedAt: null },
    select: { id: true, soldUnits: true },
  });
  const projectIds = projects.map((p) => p.id);
  const totalUnitsSold = projects.reduce((sum, p) => sum + p.soldUnits, 0);

  const inquiryStatuses = Object.values(InquiryStatus);
  const byStatus: Record<string, number> = Object.fromEntries(inquiryStatuses.map((s) => [s, 0]));

  let totalInquiries = 0;
  if (projectIds.length > 0) {
    const counts = await Promise.all(
      inquiryStatuses.map((status) =>
        prisma.inquiry.count({
          where: { projectId: { in: projectIds }, status },
        }),
      ),
    );
    for (let i = 0; i < inquiryStatuses.length; i++) {
      const s = inquiryStatuses[i]!;
      byStatus[s] = counts[i] ?? 0;
      totalInquiries += counts[i] ?? 0;
    }
  }

  const recentProjects =
    projectIds.length === 0
      ? []
      : await prisma.developerProject.findMany({
          where: { developerId: dev.id, deletedAt: null },
          orderBy: { updatedAt: "desc" },
          take: 5,
        });

  const profile = await prisma.userProfile.findUnique({
    where: { userId: auth.id },
    select: { firstName: true, lastName: true },
  });
  const displayName =
    [profile?.firstName?.trim(), profile?.lastName?.trim()].filter(Boolean).join(" ").trim() || null;

  return c.json({
    data: {
      developerId: dev.id,
      companyName: dev.companyName,
      userEmail: auth.email,
      displayName,
      projectCount: projects.length,
      totalUnitsSold,
      inquiries: { total: totalInquiries, byStatus },
      recentProjects: recentProjects.map(developerProjectToJson),
    },
  });
});

meDeveloperV1.get(
  "/projects",
  zValidator("query", listDeveloperProjectsQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { page, pageSize, status } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const where = {
      developerId: dev.id,
      deletedAt: null,
      ...(status !== undefined ? { status } : {}),
    } as const;

    const [total, rows] = await Promise.all([
      prisma.developerProject.count({ where }),
      prisma.developerProject.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return c.json({
      data: rows.map(developerProjectToJson),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);

meDeveloperV1.post(
  "/projects",
  zValidator("json", createDeveloperProjectBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const body = c.req.valid("json");

    const priceRangeMin =
      body.priceRangeMinKobo !== undefined ? BigInt(body.priceRangeMinKobo) : null;
    const priceRangeMax =
      body.priceRangeMaxKobo !== undefined ? BigInt(body.priceRangeMaxKobo) : null;

    const created = await prisma.developerProject.create({
      data: {
        developerId: dev.id,
        name: body.name,
        slug: slugifyUnique(body.name),
        propertyType: body.propertyType,
        city: body.city,
        state: body.state,
        country: body.country,
        address: body.address,
        description: body.description,
        shortDescription: body.shortDescription,
        latitude: body.latitude,
        longitude: body.longitude,
        totalUnits: body.totalUnits,
        availableUnits: body.totalUnits,
        soldUnits: 0,
        priceRangeMin,
        priceRangeMax,
        ...(body.status !== undefined ? { status: body.status } : {}),
        amenities: [],
        features: [],
        images: [],
        floorPlans: [],
      },
    });

    return c.json({ data: developerProjectToJson(created) }, 201);
  },
);

meDeveloperV1.get(
  "/projects/:id",
  zValidator("param", developerProjectIdParamSchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");

    const row = await prisma.developerProject.findFirst({
      where: { id, developerId: dev.id, deletedAt: null },
    });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Project not found");

    return c.json({ data: developerProjectToJson(row) });
  },
);

meDeveloperV1.patch(
  "/projects/:id",
  zValidator("param", developerProjectIdParamSchema),
  zValidator("json", patchDeveloperProjectBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const existing = await prisma.developerProject.findFirst({
      where: { id, developerId: dev.id, deletedAt: null },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Project not found");

    const data: Prisma.DeveloperProjectUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.propertyType !== undefined) data.propertyType = body.propertyType;
    if (body.city !== undefined) data.city = body.city;
    if (body.state !== undefined) data.state = body.state;
    if (body.country !== undefined) data.country = body.country;
    if (body.address !== undefined) data.address = body.address;
    if (body.description !== undefined) data.description = body.description;
    if (body.shortDescription !== undefined) data.shortDescription = body.shortDescription;
    if (body.latitude !== undefined) data.latitude = body.latitude;
    if (body.longitude !== undefined) data.longitude = body.longitude;
    if (body.totalUnits !== undefined) data.totalUnits = body.totalUnits;
    if (body.availableUnits !== undefined) data.availableUnits = body.availableUnits;
    if (body.soldUnits !== undefined) data.soldUnits = body.soldUnits;
    if (body.priceRangeMinKobo !== undefined) {
      data.priceRangeMin =
        body.priceRangeMinKobo === null ? null : BigInt(body.priceRangeMinKobo);
    }
    if (body.priceRangeMaxKobo !== undefined) {
      data.priceRangeMax =
        body.priceRangeMaxKobo === null ? null : BigInt(body.priceRangeMaxKobo);
    }
    if (body.status !== undefined) data.status = body.status;
    if (body.virtualTourUrl !== undefined) data.virtualTourUrl = body.virtualTourUrl;
    if (body.brochureUrl !== undefined) data.brochureUrl = body.brochureUrl;
    if (body.completionDate !== undefined) {
      data.completionDate =
        body.completionDate === null ? null : new Date(body.completionDate);
    }

    const updated = await prisma.developerProject.update({
      where: { id },
      data,
    });

    return c.json({ data: developerProjectToJson(updated) });
  },
);

meDeveloperV1.get(
  "/inquiries",
  zValidator("query", listDeveloperInquiriesQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { page, pageSize, status } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const mine = await prisma.developerProject.findMany({
      where: { developerId: dev.id, deletedAt: null },
      select: { id: true },
    });
    const ids = mine.map((p) => p.id);
    if (ids.length === 0) {
      return c.json({
        data: [],
        meta: { page, pageSize, total: 0, totalPages: 0 },
      });
    }

    const where = {
      projectId: { in: ids },
      ...(status !== undefined ? { status } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.inquiry.count({ where }),
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    return c.json({
      data: rows.map((row) => ({
        ...inquiryToJson(row),
        project: row.project
          ? { id: row.project.id, name: row.project.name, slug: row.project.slug }
          : null,
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

meDeveloperV1.get(
  "/leads/digest",
  zValidator("query", leadsDigestQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { period } = c.req.valid("query");
    const data = await buildLeadsDigestForDeveloper(dev.id, period);
    return c.json({ data });
  },
);

meDeveloperV1.post(
  "/leads/digest/email",
  leadsDigestEmailRateLimit,
  zValidator("json", leadsDigestEmailBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { period } = c.req.valid("json");
    const digest = await buildLeadsDigestForDeveloper(dev.id, period);
    const { subject, text, html } = formatDigestEmail({ companyName: dev.companyName, digest });
    try {
      const result = await sendDigestEmail({ to: auth.email, subject, text, html });
      return c.json({
        data: {
          emailed: result.mode === "resend",
          mode: result.mode,
          ...(result.mode === "resend" ? { providerId: result.id } : {}),
          period: digest.period,
          totals: digest.totals,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Email provider rejected the send";
      throw new ApiError(502, "EMAIL_SEND_FAILED", message);
    }
  },
);

meDeveloperV1.post(
  "/inquiries/:id/pitch-draft",
  zValidator("param", inquiryIdParamSchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");

    const mine = await prisma.developerProject.findMany({
      where: { developerId: dev.id, deletedAt: null },
      select: { id: true },
    });
    const projectIds = mine.map((p) => p.id);
    if (projectIds.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "Inquiry not found");
    }

    const inq = await prisma.inquiry.findFirst({
      where: { id, projectId: { in: projectIds } },
      include: {
        project: {
          select: { id: true, name: true, slug: true, city: true, state: true },
        },
      },
    });
    if (!inq || !inq.project) {
      throw new ApiError(404, "NOT_FOUND", "Inquiry not found");
    }

    const draft = pitchDraftCopy({
      buyerName: inq.buyerName,
      projectName: inq.project.name,
      city: inq.project.city,
      state: inq.project.state,
      message: inq.message,
    });

    return c.json({
      data: {
        inquiryId: inq.id,
        projectId: inq.projectId,
        status: "pending_review" as const,
        confidence: 0.42,
        model: "template-v1",
        disclaimer:
          "Template draft only. AI generation, BullMQ workers, and AiRequestLog persistence are the next increment.",
        draft,
      },
    });
  },
);

meDeveloperV1.route("/analytics", meDeveloperAnalyticsV1);
meDeveloperV1.route("/bulk-uploads", meDeveloperBulkUploadsV1);
meDeveloperV1.route("/kyc", meDeveloperKycV1);
meDeveloperV1.route("/team", meDeveloperTeamV1);
meDeveloperV1.route("/subscription", meDeveloperSubscriptionV1);
meDeveloperV1.route("/settings", meDeveloperSettingsV1);
