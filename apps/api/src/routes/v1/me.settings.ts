import { Prisma } from "@landshoppers/db";
import type { Prisma as PrismaTypes } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { patchMeSettingsBodySchema } from "../../contracts/me-settings.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meSettingsV1 = new Hono<ApiEnv>();

meSettingsV1.use("*", requireAuth);

function settingsToJson(
  user: {
    email: string;
    phone: string | null;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      notifyEmail: boolean;
      notifySms: boolean;
      notifyPush: boolean;
      preferences: PrismaTypes.JsonValue;
    } | null;
  },
) {
  const profile = user.profile;
  return {
    email: user.email,
    phone: user.phone,
    profile: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
          city: profile.city,
          state: profile.state,
          country: profile.country,
        }
      : null,
    notifications: {
      notifyEmail: profile?.notifyEmail ?? true,
      notifySms: profile?.notifySms ?? true,
      notifyPush: profile?.notifyPush ?? false,
    },
    preferences: profile?.preferences ?? null,
  };
}

meSettingsV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const user = await prisma.user.findFirst({
    where: { id: auth.id, deletedAt: null },
    include: { profile: true },
  });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");

  return c.json({ data: settingsToJson(user) });
});

meSettingsV1.patch("/", zValidator("json", patchMeSettingsBodySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const body = c.req.valid("json");

  const user = await prisma.user.findFirst({
    where: { id: auth.id, deletedAt: null },
    include: { profile: true },
  });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");

  if (body.phone !== undefined) {
    await prisma.user.update({
      where: { id: auth.id },
      data: { phone: body.phone },
    });
  }

  const profileData: PrismaTypes.UserProfileUpdateInput = {};
  if (body.firstName !== undefined) profileData.firstName = body.firstName;
  if (body.lastName !== undefined) profileData.lastName = body.lastName;
  if (body.city !== undefined) profileData.city = body.city;
  if (body.state !== undefined) profileData.state = body.state;
  if (body.country !== undefined) profileData.country = body.country;
  if (body.avatarUrl !== undefined) profileData.avatarUrl = body.avatarUrl;
  if (body.notifyEmail !== undefined) profileData.notifyEmail = body.notifyEmail;
  if (body.notifySms !== undefined) profileData.notifySms = body.notifySms;
  if (body.notifyPush !== undefined) profileData.notifyPush = body.notifyPush;
  if (body.preferences !== undefined) {
    profileData.preferences =
      body.preferences === null ? Prisma.JsonNull : (body.preferences as Prisma.InputJsonValue);
  }

  if (Object.keys(profileData).length > 0) {
    if (user.profile) {
      await prisma.userProfile.update({ where: { userId: auth.id }, data: profileData });
    } else {
      await prisma.userProfile.create({
        data: {
          userId: auth.id,
          ...profileData,
        },
      });
    }
  }

  const updated = await prisma.user.findFirst({
    where: { id: auth.id, deletedAt: null },
    include: { profile: true },
  });
  if (!updated) throw new ApiError(404, "NOT_FOUND", "User not found");

  return c.json({ data: settingsToJson(updated) });
});
