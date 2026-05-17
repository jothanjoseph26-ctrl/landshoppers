import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

type Tokens = { accessToken: string; user: { id: string } };

async function registerBuyer(email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/register", {
    method: "POST",
    body: { email, password: "Password123!", role: "buyer" },
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

describe("/v1/admin/analytics/summary", () => {
  it("returns platform KPIs", async () => {
    const email = `adm-analytics-${Date.now()}@example.test`;
    const reg = await registerBuyer(email);
    promoteUserToAdmin(reg.user.id);
    const admin = await login(email);

    const res = await call<{
      data: { kpis: { totalUsers: number; inquiriesInPeriod: number } };
    }>("/v1/admin/analytics/summary?period=month", { token: admin.accessToken });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.kpis.totalUsers).toBe("number");
    expect(typeof res.body.data.kpis.inquiriesInPeriod).toBe("number");
  });
});
