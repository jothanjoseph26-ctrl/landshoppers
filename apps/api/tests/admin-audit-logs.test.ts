import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

type Tokens = { accessToken: string; user: { id: string; role: string } };

async function registerUser(role: "buyer" | "agent" | "developer", email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/register", {
    method: "POST",
    body: { email, password: "Password123!", role },
  });
  expect(res.status).toBe(201);
  return res.body.data;
}

function promoteUserToAdmin(userId: string) {
  const user = fakeTables.users.find((u) => u.id === userId);
  if (user) user.role = "admin";
}

async function login(email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/login", {
    method: "POST",
    body: { email, password: "Password123!" },
  });
  expect(res.status).toBe(200);
  return res.body.data;
}

describe("admin automation (audit logs + settings)", () => {
  it("lists audit logs for admin", async () => {
    const reg = await registerUser("buyer", "audit-admin@example.test");
    promoteUserToAdmin(reg.user.id);
    const admin = await login("audit-admin@example.test");

    const logId = randomUUID();
    fakeTables.auditLogs.push({
      id: logId,
      actorId: reg.user.id,
      actorEmail: "audit-admin@example.test",
      actorRole: "admin",
      action: "admin.user.suspend",
      targetType: "user",
      targetId: randomUUID(),
      changes: { before: { suspended: false }, after: { suspended: true } },
      ipAddress: "127.0.0.1",
      userAgent: null,
      metadata: null,
      createdAt: new Date(),
    });

    const res = await call<{
      data: { id: string; action: string; changesPreview: string | null }[];
    }>("/v1/admin/audit-logs?page=1&pageSize=10", { token: admin.accessToken });

    expect(res.status).toBe(200);
    expect(res.body.data?.some((r) => r.id === logId && r.action === "admin.user.suspend")).toBe(true);
    expect(res.body.data?.find((r) => r.id === logId)?.changesPreview).toContain("suspended");
  });

  it("returns platform settings snapshot", async () => {
    const reg = await registerUser("buyer", "settings-admin@example.test");
    promoteUserToAdmin(reg.user.id);
    const admin = await login("settings-admin@example.test");

    const res = await call<{
      data: { maintenanceMode: boolean; patchSupported: boolean; featureFlags: Record<string, boolean> };
    }>("/v1/admin/settings", { token: admin.accessToken });

    expect(res.status).toBe(200);
    expect(res.body.data?.patchSupported).toBe(true);
    expect(typeof res.body.data?.maintenanceMode).toBe("boolean");
    expect(res.body.data?.featureFlags).toBeDefined();
    expect(res.body.data?.updatedAt).toBeDefined();
  });

  it("PATCH settings updates platform_settings and writes audit log", async () => {
    const reg = await registerUser("buyer", "settings-patch@example.test");
    promoteUserToAdmin(reg.user.id);
    const admin = await login("settings-patch@example.test");

    const patch = await call<{
      data: { maintenanceMode: boolean; whatsappAutoApproveMinScore: number | null };
    }>("/v1/admin/settings", {
      method: "PATCH",
      token: admin.accessToken,
      body: { maintenanceMode: true, whatsappAutoApproveMinScore: 0.85 },
    });

    expect(patch.status).toBe(200);
    expect(patch.body.data?.maintenanceMode).toBe(true);
    expect(patch.body.data?.whatsappAutoApproveMinScore).toBe(0.85);

    const row = fakeTables.platformSettings.find((r) => r.id === "default");
    expect(row?.maintenanceMode).toBe(true);
    expect(row?.whatsappAutoApproveMinScore).toBe(0.85);

    expect(
      fakeTables.auditLogs.some((l) => l.action === "admin.settings.update"),
    ).toBe(true);
  });
});
