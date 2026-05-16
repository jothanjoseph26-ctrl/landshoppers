import type { Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { patchDeveloperSettingsBodySchema } from "../../contracts/developer-settings.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireDeveloper } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meDeveloperSettingsV1 = new Hono<ApiEnv>();

meDeveloperSettingsV1.use("*", requireAuth, requireDeveloper);

async function developerForUser(userId: string) {
  const row = await prisma.developer.findFirst({
    where: { userId, deletedAt: null },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Developer profile not found for this account");
  }
  return row;
}

function settingsToJson(
  row: {
    id: string;
    userId: string;
    companyName: string;
    rcNumber: string | null;
    companyAddress: string | null;
    companyCity: string | null;
    companyState: string | null;
    companyPhone: string | null;
    companyEmail: string | null;
    companyWebsite: string | null;
    description: string | null;
    isVerified: boolean;
    kycStatus: string;
    createdAt: Date;
    updatedAt: Date;
  },
  userEmail: string,
) {
  return {
    developerId: row.id,
    userId: row.userId,
    email: userEmail,
    companyName: row.companyName,
    rcNumber: row.rcNumber,
    companyAddress: row.companyAddress,
    companyCity: row.companyCity,
    companyState: row.companyState,
    companyPhone: row.companyPhone,
    companyEmail: row.companyEmail,
    companyWebsite: row.companyWebsite,
    description: row.description,
    isVerified: row.isVerified,
    kycStatus: row.kycStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

meDeveloperSettingsV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const row = await developerForUser(auth.id);
  const email = row.user?.email ?? auth.email;
  return c.json({ data: settingsToJson(row, email) });
});

meDeveloperSettingsV1.patch(
  "/",
  zValidator("json", patchDeveloperSettingsBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const row = await developerForUser(auth.id);
    const body = c.req.valid("json");

    const data: Prisma.DeveloperUpdateInput = {};
    if (body.companyName !== undefined) data.companyName = body.companyName;
    if (body.rcNumber !== undefined) data.rcNumber = body.rcNumber;
    if (body.companyAddress !== undefined) data.companyAddress = body.companyAddress;
    if (body.companyCity !== undefined) data.companyCity = body.companyCity;
    if (body.companyState !== undefined) data.companyState = body.companyState;
    if (body.companyPhone !== undefined) data.companyPhone = body.companyPhone;
    if (body.companyEmail !== undefined) data.companyEmail = body.companyEmail;
    if (body.companyWebsite !== undefined) {
      data.companyWebsite = body.companyWebsite === "" ? null : body.companyWebsite;
    }
    if (body.description !== undefined) data.description = body.description;

    const updated = await prisma.developer.update({
      where: { id: row.id },
      data,
      include: { user: { select: { id: true, email: true } } },
    });
    const email = updated.user?.email ?? auth.email;
    return c.json({ data: settingsToJson(updated, email) });
  },
);
