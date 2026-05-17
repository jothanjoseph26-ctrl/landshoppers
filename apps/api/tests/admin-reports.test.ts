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
      ...(role === "agent" ? { agencyName: "Report Test Agency" } : {}),
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

describe("/v1/admin/reports", () => {
  it("exports users CSV for admin", async () => {
    const email = `adm-reports-users-${Date.now()}@example.test`;
    const reg = await registerUser("buyer", email);
    promoteUserToAdmin(reg.user.id);
    const admin = await login(email);

    const res = await call<string>("/v1/admin/reports/users?format=csv", {
      token: admin.accessToken,
    });
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("string");
    expect(res.body).toContain("email");
    expect(res.body).toContain("role");
  });

  it("exports listings CSV for admin", async () => {
    const email = `adm-reports-listings-${Date.now()}@example.test`;
    const reg = await registerUser("buyer", email);
    promoteUserToAdmin(reg.user.id);
    const admin = await login(email);

    const res = await call<string>("/v1/admin/reports/listings?format=csv", {
      token: admin.accessToken,
    });
    expect(res.status).toBe(200);
    expect(res.body).toContain("status");
    expect(res.body).toContain("price");
  });

  it("returns 400 for unsupported format", async () => {
    const email = `adm-reports-fmt-${Date.now()}@example.test`;
    const reg = await registerUser("buyer", email);
    promoteUserToAdmin(reg.user.id);
    const admin = await login(email);

    const res = await call("/v1/admin/reports/users?format=json", {
      token: admin.accessToken,
    });
    expect(res.status).toBe(400);
  });

  it("returns 403 for buyer", async () => {
    const buyer = await registerUser("buyer", `adm-reports-buyer-${Date.now()}@example.test`);
    const res = await call("/v1/admin/reports/users?format=csv", {
      token: buyer.accessToken,
    });
    expect(res.status).toBe(403);
  });
});
