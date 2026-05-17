import { Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  patchProviderSettingsBodySchema,
  providerServicePreferencesSchema,
} from "../../contracts/provider-settings.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { providerForUser } from "../../lib/provider-for-user.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const providerSettingsV1 = new Hono<ApiEnv>();

providerSettingsV1.use("*", requireAuth, requireServiceProvider);

function readServicePrefs(preferences: unknown) {
  if (!preferences || typeof preferences !== "object") return null;
  const sp = (preferences as Record<string, unknown>)["serviceProvider"];
  const parsed = providerServicePreferencesSchema.safeParse(sp);
  return parsed.success ? parsed.data : null;
}

function settingsJson(
  provider: { id: string; businessName: string },
  user: { id: string; email: string },
  profile: {
    notifyEmail: boolean;
    notifySms: boolean;
    notifyPush: boolean;
    preferences: unknown;
  } | null,
) {
  const prefs = profile?.preferences ?? null;
  const serviceProvider = readServicePrefs(prefs);
  return {
    userId: user.id,
    email: user.email,
    businessName: provider.businessName,
    notifyEmail: profile?.notifyEmail ?? true,
    notifySms: profile?.notifySms ?? true,
    notifyPush: profile?.notifyPush ?? false,
    preferences: serviceProvider ? { serviceProvider } : prefs ? { serviceProvider: null } : null,
  };
}

providerSettingsV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const row = await providerForUser(auth.id);
  return c.json({
    data: settingsJson(row, row.user, row.user.profile),
  });
});

providerSettingsV1.patch("/", zValidator("json", patchProviderSettingsBodySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const row = await providerForUser(auth.id);
  const body = c.req.valid("json");

  const existingPrefs =
    row.user.profile?.preferences && typeof row.user.profile.preferences === "object"
      ? ({ ...(row.user.profile.preferences as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  if (body.preferences?.serviceProvider !== undefined) {
    existingPrefs["serviceProvider"] = body.preferences.serviceProvider;
  }

  const profileData: Prisma.UserProfileUpdateInput = {};
  if (body.notifyEmail !== undefined) profileData.notifyEmail = body.notifyEmail;
  if (body.notifySms !== undefined) profileData.notifySms = body.notifySms;
  if (body.notifyPush !== undefined) profileData.notifyPush = body.notifyPush;
  if (body.preferences !== undefined) {
    profileData.preferences =
      body.preferences === null ? Prisma.DbNull : (existingPrefs as Prisma.InputJsonValue);
  }

  const profile = row.user.profile
    ? await prisma.userProfile.update({
        where: { userId: auth.id },
        data: profileData,
      })
    : await prisma.userProfile.create({
        data: {
          userId: auth.id,
          ...profileData,
          preferences: (profileData.preferences ?? Prisma.DbNull) as Prisma.InputJsonValue,
        },
      });

  return c.json({
    data: settingsJson(row, row.user, profile),
  });
});
