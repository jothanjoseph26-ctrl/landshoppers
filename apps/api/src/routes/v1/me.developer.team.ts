import { createHash, randomBytes } from "node:crypto";

import { UserRole, type Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  createDeveloperInviteBodySchema,
  developerInviteIdParamSchema,
  listTeamActivityQuerySchema,
  patchTeamMemberBodySchema,
  teamMemberUserIdParamSchema,
} from "../../contracts/developer-team.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireDeveloper } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

const TEAM_AUDIT_ACTIONS = [
  "developer.team.invite_created",
  "developer.team.invite_revoked",
  "developer.team.member_updated",
] as const;

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export const meDeveloperTeamV1 = new Hono<ApiEnv>();

meDeveloperTeamV1.use("*", requireAuth, requireDeveloper);

type PortalCtx = {
  developer: { id: string; userId: string; companyName: string; deletedAt: Date | null };
  portalAdmin: boolean;
};

async function resolvePortalDeveloper(c: Context<ApiEnv>): Promise<PortalCtx> {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const headerId = c.req.header("X-Portal-Developer-Id")?.trim();

  const owned = await prisma.developer.findFirst({
    where: { userId: auth.id, deletedAt: null },
  });

  const resolveByDeveloperId = async (developerId: string): Promise<PortalCtx> => {
    const target = await prisma.developer.findFirst({
      where: { id: developerId, deletedAt: null },
    });
    if (!target) throw new ApiError(404, "NOT_FOUND", "Developer not found");
    if (target.userId === auth.id) {
      return { developer: target, portalAdmin: true };
    }
    const mem = await prisma.developerMembership.findFirst({
      where: { developerId, userId: auth.id, isDisabled: false },
    });
    if (!mem) {
      throw new ApiError(403, "FORBIDDEN", "Not a member of this developer account");
    }
    return {
      developer: target,
      portalAdmin: mem.role === "admin",
    };
  };

  if (headerId) {
    return resolveByDeveloperId(headerId);
  }
  if (owned) {
    return { developer: owned, portalAdmin: true };
  }
  const mem = await prisma.developerMembership.findFirst({
    where: { userId: auth.id, isDisabled: false },
    orderBy: { createdAt: "asc" },
    include: { developer: true },
  });
  if (!mem?.developer || mem.developer.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Developer profile not found for this account");
  }
  return {
    developer: mem.developer,
    portalAdmin: mem.role === "admin",
  };
}

function displayName(profile: { firstName: string | null; lastName: string | null } | null, email: string): string {
  if (!profile) return email;
  const parts = [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : email;
}

meDeveloperTeamV1.get("/members", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { developer, portalAdmin } = await resolvePortalDeveloper(c);

  const ownerUser = await prisma.user.findUnique({
    where: { id: developer.userId },
    include: { profile: true },
  });
  if (!ownerUser) throw new ApiError(500, "INTERNAL", "Owner user missing for developer account");

  const memberships = await prisma.developerMembership.findMany({
    where: { developerId: developer.id },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });

  type MemberJson = {
    userId: string;
    email: string;
    displayName: string;
    role: string;
    status: "active" | "disabled";
    isOwner: boolean;
    projectIds: string[];
    lastActiveAt: string | null;
  };

  const members: MemberJson[] = [];
  const seen = new Set<string>();

  members.push({
    userId: ownerUser.id,
    email: ownerUser.email,
    displayName: displayName(ownerUser.profile, ownerUser.email),
    role: "admin",
    status: "active",
    isOwner: true,
    projectIds: [],
    lastActiveAt: ownerUser.lastLoginAt?.toISOString() ?? null,
  });
  seen.add(ownerUser.id);

  for (const m of memberships) {
    if (seen.has(m.userId)) continue;
    seen.add(m.userId);
    members.push({
      userId: m.userId,
      email: m.user.email,
      displayName: displayName(m.user.profile, m.user.email),
      role: m.role,
      status: m.isDisabled ? "disabled" : "active",
      isOwner: false,
      projectIds: m.projectIds,
      lastActiveAt: m.user.lastLoginAt?.toISOString() ?? null,
    });
  }

  return c.json({
    data: members,
    meta: { portalAdmin, developerId: developer.id },
  });
});

meDeveloperTeamV1.patch(
  "/members/:userId",
  zValidator("param", teamMemberUserIdParamSchema),
  zValidator("json", patchTeamMemberBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { developer, portalAdmin } = await resolvePortalDeveloper(c);
    if (!portalAdmin) {
      throw new ApiError(403, "FORBIDDEN", "Only portal admins can change team members");
    }
    const { userId: targetUserId } = c.req.valid("param");
    const body = c.req.valid("json");

    if (targetUserId === developer.userId) {
      throw new ApiError(400, "OWNER_PROTECTED", "The organisation owner cannot be updated from this endpoint");
    }

    const existing = await prisma.developerMembership.findUnique({
      where: {
        developerId_userId: { developerId: developer.id, userId: targetUserId },
      },
    });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Team member not found");
    }

    const data: Prisma.DeveloperMembershipUpdateInput = {};
    if (body.role !== undefined) data.role = body.role;
    if (body.isDisabled !== undefined) data.isDisabled = body.isDisabled;

    const updated = await prisma.developerMembership.update({
      where: { id: existing.id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.id,
        actorEmail: auth.email,
        actorRole: auth.role as UserRole,
        action: "developer.team.member_updated",
        targetType: "developer",
        targetId: developer.id,
        metadata: { membershipId: updated.id, userId: targetUserId, patch: body } as Prisma.InputJsonValue,
      },
    });

    return c.json({
      data: {
        userId: updated.userId,
        role: updated.role,
        isDisabled: updated.isDisabled,
        projectIds: updated.projectIds,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  },
);

meDeveloperTeamV1.get("/invites", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const { developer, portalAdmin } = await resolvePortalDeveloper(c);

  const now = new Date();
  const rows = await prisma.developerInvite.findMany({
    where: {
      developerId: developer.id,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({
    data: rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      projectIds: r.projectIds,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
    meta: { portalAdmin, developerId: developer.id },
  });
});

meDeveloperTeamV1.post(
  "/invites",
  zValidator("json", createDeveloperInviteBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { developer, portalAdmin } = await resolvePortalDeveloper(c);
    if (!portalAdmin) {
      throw new ApiError(403, "FORBIDDEN", "Only portal admins can manage invites");
    }
    const body = c.req.valid("json");
    const email = body.email.toLowerCase();

    if (email === auth.email.toLowerCase()) {
      throw new ApiError(400, "INVALID_INVITE", "You cannot invite your own account email");
    }

    const owner = await prisma.user.findUnique({ where: { id: developer.userId } });
    if (owner && email === owner.email.toLowerCase()) {
      throw new ApiError(400, "INVALID_INVITE", "That email already belongs to the organisation owner");
    }

    const existingUser = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (existingUser) {
      const dupMembership = await prisma.developerMembership.findUnique({
        where: {
          developerId_userId: { developerId: developer.id, userId: existingUser.id },
        },
      });
      if (dupMembership && !dupMembership.isDisabled) {
        throw new ApiError(409, "ALREADY_MEMBER", "That user is already an active member of this team");
      }
    }

    const now = new Date();
    const pendingSameEmail = await prisma.developerInvite.findFirst({
      where: {
        developerId: developer.id,
        email,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });
    if (pendingSameEmail) {
      throw new ApiError(409, "INVITE_PENDING", "An active invite already exists for that email");
    }

    const projectIds = body.projectIds ?? [];
    if (projectIds.length > 0) {
      const count = await prisma.developerProject.count({
        where: { developerId: developer.id, id: { in: projectIds }, deletedAt: null },
      });
      if (count !== projectIds.length) {
        throw new ApiError(400, "INVALID_PROJECT", "One or more projectIds are not part of this developer account");
      }
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const created = await prisma.developerInvite.create({
      data: {
        developerId: developer.id,
        email,
        role: body.role,
        projectIds,
        tokenHash,
        expiresAt,
        createdByUserId: auth.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.id,
        actorEmail: auth.email,
        actorRole: auth.role as UserRole,
        action: "developer.team.invite_created",
        targetType: "developer",
        targetId: developer.id,
        metadata: { inviteId: created.id, email } as Prisma.InputJsonValue,
      },
    });

    return c.json(
      {
        data: {
          id: created.id,
          email: created.email,
          role: created.role,
          projectIds: created.projectIds,
          expiresAt: created.expiresAt.toISOString(),
          acceptToken: rawToken,
          acceptPath: `/invite/accept?token=${encodeURIComponent(rawToken)}`,
        },
      },
      201,
    );
  },
);

meDeveloperTeamV1.delete(
  "/invites/:id",
  zValidator("param", developerInviteIdParamSchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { developer, portalAdmin } = await resolvePortalDeveloper(c);
    if (!portalAdmin) {
      throw new ApiError(403, "FORBIDDEN", "Only portal admins can revoke invites");
    }
    const { id } = c.req.valid("param");

    const row = await prisma.developerInvite.findFirst({
      where: { id, developerId: developer.id },
    });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Invite not found");
    if (row.revokedAt) {
      return c.json({ data: { id: row.id, revokedAt: row.revokedAt.toISOString() } });
    }

    const updated = await prisma.developerInvite.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.id,
        actorEmail: auth.email,
        actorRole: auth.role as UserRole,
        action: "developer.team.invite_revoked",
        targetType: "developer",
        targetId: developer.id,
        metadata: { inviteId: updated.id, email: updated.email } as Prisma.InputJsonValue,
      },
    });

    return c.json({ data: { id: updated.id, revokedAt: updated.revokedAt!.toISOString() } });
  },
);

meDeveloperTeamV1.get(
  "/activity",
  zValidator("query", listTeamActivityQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { developer, portalAdmin } = await resolvePortalDeveloper(c);
    const { page, pageSize } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const where: Prisma.AuditLogWhereInput = {
      targetType: "developer",
      targetId: developer.id,
      action: { in: [...TEAM_AUDIT_ACTIONS] },
    };

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return c.json({
      data: rows.map((r) => ({
        id: r.id,
        action: r.action,
        actorEmail: r.actorEmail,
        createdAt: r.createdAt.toISOString(),
        metadata: r.metadata,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        portalAdmin,
        developerId: developer.id,
      },
    });
  },
);
