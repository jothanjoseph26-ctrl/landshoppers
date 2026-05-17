import { UserRole, type Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { patchAgentSettingsBodySchema } from "../../contracts/agent-settings.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import {
  patchUserProfileScalars,
  type UserProfileScalarPatch,
} from "../../lib/user-profile-patch.js";
import { requireAgentOrDeveloper, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const agentSettingsV1 = new Hono<ApiEnv>();

agentSettingsV1.use("*", requireAuth, requireAgentOrDeveloper);

function settingsToJson(input: {
  email: string;
  persona: "agent" | "developer";
  agencyName: string | null;
  licenseNumber: string | null;
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
  } | null;
}) {
  const profile = input.profile;
  return {
    email: input.email,
    persona: input.persona,
    agency: {
      agencyName: input.agencyName,
      licenseNumber: input.licenseNumber,
    },
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
  };
}

agentSettingsV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const [user, agentRow, developerRow] = await Promise.all([
    prisma.user.findFirst({
      where: { id: auth.id, deletedAt: null },
      include: { profile: true },
    }),
    auth.role === UserRole.agent
      ? prisma.agent.findFirst({ where: { userId: auth.id, deletedAt: null } })
      : null,
    auth.role === UserRole.developer
      ? prisma.developer.findFirst({ where: { userId: auth.id, deletedAt: null } })
      : null,
  ]);

  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");

  const persona = auth.role === UserRole.agent ? "agent" : "developer";
  const agencyName =
    persona === "agent" ? agentRow?.agencyName ?? null : developerRow?.companyName ?? null;
  const licenseNumber = persona === "agent" ? agentRow?.licenseNumber ?? null : null;

  return c.json({
    data: settingsToJson({
      email: user.email,
      persona,
      agencyName,
      licenseNumber,
      profile: user.profile,
    }),
  });
});

agentSettingsV1.patch("/", zValidator("json", patchAgentSettingsBodySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const body = c.req.valid("json");

  const user = await prisma.user.findFirst({
    where: { id: auth.id, deletedAt: null },
    include: { profile: true },
  });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");

  if (auth.role === UserRole.agent && (body.agencyName !== undefined || body.licenseNumber !== undefined)) {
    const agentRow = await prisma.agent.findFirst({ where: { userId: auth.id, deletedAt: null } });
    if (!agentRow) throw new ApiError(404, "NOT_FOUND", "Agent profile not found");
    const agentData: Prisma.AgentUpdateInput = {};
    if (body.agencyName !== undefined) agentData.agencyName = body.agencyName;
    if (body.licenseNumber !== undefined) agentData.licenseNumber = body.licenseNumber;
    await prisma.agent.update({ where: { id: agentRow.id }, data: agentData });
  }

  const profileData: UserProfileScalarPatch = {};
  if (body.firstName !== undefined) profileData.firstName = body.firstName;
  if (body.lastName !== undefined) profileData.lastName = body.lastName;
  if (body.city !== undefined) profileData.city = body.city;
  if (body.state !== undefined) profileData.state = body.state;
  if (body.country !== undefined) profileData.country = body.country;
  if (body.avatarUrl !== undefined) profileData.avatarUrl = body.avatarUrl;
  if (body.notifyEmail !== undefined) profileData.notifyEmail = body.notifyEmail;
  if (body.notifySms !== undefined) profileData.notifySms = body.notifySms;
  if (body.notifyPush !== undefined) profileData.notifyPush = body.notifyPush;

  await patchUserProfileScalars(auth.id, Boolean(user.profile), profileData);

  const [updatedUser, agentRow, developerRow] = await Promise.all([
    prisma.user.findFirst({
      where: { id: auth.id, deletedAt: null },
      include: { profile: true },
    }),
    auth.role === UserRole.agent
      ? prisma.agent.findFirst({ where: { userId: auth.id, deletedAt: null } })
      : null,
    auth.role === UserRole.developer
      ? prisma.developer.findFirst({ where: { userId: auth.id, deletedAt: null } })
      : null,
  ]);

  if (!updatedUser) throw new ApiError(404, "NOT_FOUND", "User not found");

  const persona = auth.role === UserRole.agent ? "agent" : "developer";
  return c.json({
    data: settingsToJson({
      email: updatedUser.email,
      persona,
      agencyName:
        persona === "agent" ? agentRow?.agencyName ?? null : developerRow?.companyName ?? null,
      licenseNumber: persona === "agent" ? agentRow?.licenseNumber ?? null : null,
      profile: updatedUser.profile,
    }),
  });
});
