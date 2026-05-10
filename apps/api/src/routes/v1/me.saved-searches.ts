import type { Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  createSavedSearchBodySchema,
  savedSearchIdParamSchema,
  updateSavedSearchBodySchema,
} from "../../contracts/me.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { enqueueSavedSearchAlertRegistered } from "../../lib/search/enqueue-saved-search-alert.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const savedSearchesV1 = new Hono<ApiEnv>();

savedSearchesV1.use("*", requireAuth);

function rowToJson(row: {
  id: string;
  name: string | null;
  filters: Prisma.JsonValue;
  emailAlerts: boolean;
  alertFrequency: string;
  lastAlertSent: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    filters: row.filters,
    emailAlerts: row.emailAlerts,
    alertFrequency: row.alertFrequency,
    lastAlertSent: row.lastAlertSent?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

savedSearchesV1.get("/", async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const rows = await prisma.savedSearch.findMany({
    where: { userId: authUser.id },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: rows.map(rowToJson) });
});

savedSearchesV1.post("/", zValidator("json", createSavedSearchBodySchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const body = c.req.valid("json");

  const row = await prisma.savedSearch.create({
    data: {
      userId: authUser.id,
      name: body.name ?? null,
      filters: body.filters as Prisma.InputJsonValue,
      emailAlerts: body.emailAlerts,
      alertFrequency: body.alertFrequency,
    },
  });

  if (body.emailAlerts) {
    void enqueueSavedSearchAlertRegistered({ savedSearchId: row.id, userId: authUser.id }).catch(() => {});
  }

  return c.json({ data: rowToJson(row) }, 201);
});

savedSearchesV1.patch(
  "/:id",
  zValidator("param", savedSearchIdParamSchema),
  zValidator("json", updateSavedSearchBodySchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId: authUser.id },
    });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Saved search not found");
    }

    const data: Prisma.SavedSearchUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.filters !== undefined) data.filters = body.filters as Prisma.InputJsonValue;
    if (body.emailAlerts !== undefined) data.emailAlerts = body.emailAlerts;
    if (body.alertFrequency !== undefined) data.alertFrequency = body.alertFrequency;

    const row = await prisma.savedSearch.update({ where: { id }, data });
    return c.json({ data: rowToJson(row) });
  },
);

savedSearchesV1.delete("/:id", zValidator("param", savedSearchIdParamSchema), async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { id } = c.req.valid("param");

  const existing = await prisma.savedSearch.findFirst({
    where: { id, userId: authUser.id },
  });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Saved search not found");
  }

  await prisma.savedSearch.delete({ where: { id } });
  return c.json({ data: { ok: true } });
});
