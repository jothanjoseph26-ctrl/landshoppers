import { randomUUID } from "node:crypto";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  developerSubscriptionCheckoutBodySchema,
  listDeveloperSubscriptionInvoicesQuerySchema,
} from "../../contracts/developer-subscription.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireDeveloper } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meDeveloperSubscriptionV1 = new Hono<ApiEnv>();

meDeveloperSubscriptionV1.use("*", requireAuth, requireDeveloper);

function paystackConfigured(): boolean {
  const pub = process.env["PAYSTACK_PUBLIC_KEY"]?.trim();
  const sec = process.env["PAYSTACK_SECRET_KEY"]?.trim();
  return Boolean(pub && sec);
}

async function developerForUser(userId: string) {
  const row = await prisma.developer.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Developer profile not found for this account");
  }
  return row;
}

function monthStartUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

meDeveloperSubscriptionV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const dev = await developerForUser(auth.id);

  const [sub, projects] = await Promise.all([
    prisma.subscription.findUnique({ where: { developerId: dev.id } }),
    prisma.developerProject.findMany({
      where: { developerId: dev.id, deletedAt: null },
      select: { id: true, totalUnits: true },
    }),
  ]);

  const projectIds = projects.map((p) => p.id);
  const projectCount = projects.length;
  const listedUnits = projects.reduce((sum, p) => sum + p.totalUnits, 0);

  const since = monthStartUtc();
  const inquiriesThisMonth =
    projectIds.length === 0
      ? 0
      : await prisma.inquiry.count({
          where: { projectId: { in: projectIds }, createdAt: { gte: since } },
        });

  return c.json({
    data: {
      developerId: dev.id,
      companyName: dev.companyName,
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            renewsAt: sub.currentPeriodEnd.toISOString(),
            currentPeriodStart: sub.currentPeriodStart.toISOString(),
            currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
            cancelledAt: sub.cancelledAt?.toISOString() ?? null,
            paystackCustomerId: sub.paystackCustomerId,
          }
        : {
            plan: null,
            status: null,
            renewsAt: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelledAt: null,
            paystackCustomerId: null,
          },
      usage: {
        projectCount,
        listedUnits,
        inquiriesThisMonth,
        aiCreditsRemaining: null,
      },
      limits: {
        maxActiveProjects: null,
        maxMonthlyLeads: null,
      },
      paystackConfigured: paystackConfigured(),
    },
  });
});

meDeveloperSubscriptionV1.get(
  "/invoices",
  zValidator("query", listDeveloperSubscriptionInvoicesQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    await developerForUser(auth.id);
    const { page, pageSize } = c.req.valid("query");

    // Payments are not yet linked to `developerId` in schema; return an honest empty list (no fake rows).
    const total = 0;
    const rows: never[] = [];

    return c.json({
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        paystackConfigured: paystackConfigured(),
      },
    });
  },
);

meDeveloperSubscriptionV1.post(
  "/checkout",
  zValidator("json", developerSubscriptionCheckoutBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    await developerForUser(auth.id);
    const body = c.req.valid("json");

    if (!paystackConfigured()) {
      throw new ApiError(
        503,
        "CHECKOUT_UNAVAILABLE",
        "Paystack is not configured (set PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY).",
      );
    }

    const reference = `dev_sub_${randomUUID().replace(/-/g, "")}`;
    return c.json({
      data: {
        mode: "stub" as const,
        plan: body.plan,
        reference,
        authorizationUrl: `https://paystack.com/pay/${encodeURIComponent(reference)}`,
        disclaimer:
          "Stub checkout URL until Paystack initialize transaction is wired; do not treat as a live charge.",
      },
    });
  },
);
