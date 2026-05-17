import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

type Tokens = { accessToken: string; user: { id: string; role: string } };

async function registerUser(role: "buyer" | "agent", email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/register", {
    method: "POST",
    body: {
      email,
      password: "Password123!",
      role,
      ...(role === "agent" ? { agencyName: "Test Agency" } : {}),
    },
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

describe("/v1/admin/users", () => {
  it("lists users for admin", async () => {
    const email = `adm-users-admin-${Date.now()}@example.test`;
    const reg = await registerUser("buyer", email);
    promoteUserToAdmin(reg.user.id);
    const admin = await login(email);

    const res = await call<{ data: unknown[]; meta: { total: number } }>(
      "/v1/admin/users?page=1&pageSize=10",
      { token: admin.accessToken },
    );
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it("returns 403 for buyer", async () => {
    const buyer = await registerUser("buyer", `adm-users-buyer-${Date.now()}@example.test`);
    const res = await call("/v1/admin/users", { token: buyer.accessToken });
    expect(res.status).toBe(403);
  });
});
