import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

type AuthEnvelope = {
  data?: { accessToken?: string };
};

async function registerDeveloper(suffix: string) {
  return call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `${suffix}@example.test`,
      password: "Password123!",
      role: "developer",
      companyName: `Co ${suffix}`,
    },
  });
}

async function registerBuyer(suffix: string) {
  return call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `${suffix}@example.test`,
      password: "Password123!",
      role: "buyer",
    },
  });
}

describe("/v1/me/developer/team", () => {
  it("lists owner as admin, creates invite + activity, revokes invite", async () => {
    const reg = await registerDeveloper(`team-owner-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    expect(token).toBeTruthy();

    const members = await call<{
      data: Array<{ userId: string; role: string; isOwner: boolean }>;
      meta: { portalAdmin: boolean };
    }>("/v1/me/developer/team/members", { token });
    expect(members.status).toBe(200);
    expect(members.body.meta.portalAdmin).toBe(true);
    expect(members.body.data).toHaveLength(1);
    expect(members.body.data[0]?.isOwner).toBe(true);
    expect(members.body.data[0]?.role).toBe("admin");

    const invite = await call<{ data: { id: string; acceptToken: string } }>("/v1/me/developer/team/invites", {
      method: "POST",
      token,
      body: { email: "new-hire@example.test", role: "sales" },
    });
    expect(invite.status).toBe(201);
    expect(invite.body.data.acceptToken).toBeTruthy();
    const inviteId = invite.body.data.id;

    const listInv = await call<{ data: { id: string }[] }>("/v1/me/developer/team/invites", { token });
    expect(listInv.status).toBe(200);
    expect(listInv.body.data.some((r) => r.id === inviteId)).toBe(true);

    const activity = await call<{ data: { action: string }[] }>(
      "/v1/me/developer/team/activity?page=1&pageSize=20",
      { token },
    );
    expect(activity.status).toBe(200);
    expect(activity.body.data.some((r) => r.action === "developer.team.invite_created")).toBe(true);

    const del = await call(`/v1/me/developer/team/invites/${inviteId}`, { method: "DELETE", token });
    expect(del.status).toBe(200);

    const activity2 = await call<{ data: { action: string }[] }>(
      "/v1/me/developer/team/activity?page=1&pageSize=20",
      { token },
    );
    expect(activity2.body.data.some((r) => r.action === "developer.team.invite_revoked")).toBe(true);
  });

  it("returns 403 for buyer", async () => {
    const reg = await registerBuyer(`team-buyer-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call("/v1/me/developer/team/members", { token });
    expect(res.status).toBe(403);
  });

  it("blocks non-admin from creating invites when using X-Portal-Developer-Id", async () => {
    const suffix = Date.now();
    const owner = await registerDeveloper(`team-org-${suffix}`);
    const staff = await registerDeveloper(`team-staff-${suffix}`);
    expect(owner.status).toBe(201);
    expect(staff.status).toBe(201);
    const ownerToken = owner.body.data?.accessToken;
    const staffToken = staff.body.data?.accessToken;
    expect(ownerToken).toBeTruthy();
    expect(staffToken).toBeTruthy();

    const dash = await call<{ data: { developerId: string } }>("/v1/me/developer/dashboard", {
      token: ownerToken,
    });
    expect(dash.status).toBe(200);
    const orgDeveloperId = dash.body.data.developerId;

    const staffUser = fakeTables.users.find((u) => u.email === `team-staff-${suffix}@example.test`);
    expect(staffUser).toBeTruthy();
    const now = new Date();
    fakeTables.developerMemberships.push({
      id: randomUUID(),
      developerId: orgDeveloperId,
      userId: staffUser!.id,
      role: "sales",
      isDisabled: false,
      projectIds: [],
      createdAt: now,
      updatedAt: now,
    });

    const forbidden = await call("/v1/me/developer/team/invites", {
      method: "POST",
      token: staffToken,
      headers: { "X-Portal-Developer-Id": orgDeveloperId },
      body: { email: "blocked-invite@example.test", role: "viewer" },
    });
    expect(forbidden.status).toBe(403);
  });

  it("owner cannot PATCH themselves; can PATCH a member role", async () => {
    const suffix = Date.now();
    const owner = await registerDeveloper(`team-patch-a-${suffix}`);
    const member = await registerDeveloper(`team-patch-b-${suffix}`);
    expect(owner.status).toBe(201);
    expect(member.status).toBe(201);
    const ownerToken = owner.body.data?.accessToken;
    expect(ownerToken).toBeTruthy();

    const dash = await call<{ data: { developerId: string } }>("/v1/me/developer/dashboard", {
      token: ownerToken,
    });
    const orgDeveloperId = dash.body.data.developerId;
    const ownerUser = fakeTables.developers.find((d) => d.id === orgDeveloperId);
    expect(ownerUser).toBeTruthy();

    const selfPatch = await call(`/v1/me/developer/team/members/${ownerUser!.userId}`, {
      method: "PATCH",
      token: ownerToken,
      body: { role: "viewer" },
    });
    expect(selfPatch.status).toBe(400);

    const memberUser = fakeTables.users.find((u) => u.email === `team-patch-b-${suffix}@example.test`);
    expect(memberUser).toBeTruthy();
    const now = new Date();
    fakeTables.developerMemberships.push({
      id: randomUUID(),
      developerId: orgDeveloperId,
      userId: memberUser!.id,
      role: "sales",
      isDisabled: false,
      projectIds: [],
      createdAt: now,
      updatedAt: now,
    });

    const ok = await call<{ data: { role: string } }>(
      `/v1/me/developer/team/members/${memberUser!.id}`,
      {
        method: "PATCH",
        token: ownerToken,
        body: { role: "marketing" },
      },
    );
    expect(ok.status).toBe(200);
    expect(ok.body.data.role).toBe("marketing");
  });
});
