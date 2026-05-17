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

describe("/v1/admin/payments", () => {
  it("lists payments and summary for admin", async () => {
    const email = `adm-pay-${Date.now()}@example.test`;
    const reg = await registerBuyer(email);
    promoteUserToAdmin(reg.user.id);
    const admin = await login(email);

    const list = await call<{ data: unknown[]; meta: { total: number } }>(
      "/v1/admin/payments?page=1&pageSize=10",
      { token: admin.accessToken },
    );
    expect(list.status).toBe(200);

    const summary = await call<{ data: { paymentCount: number; period: string } }>(
      "/v1/admin/payments/summary?period=month",
      { token: admin.accessToken },
    );
    expect(summary.status).toBe(200);
    expect(summary.body.data.period).toBe("month");
    expect(typeof summary.body.data.paymentCount).toBe("number");
  });
});
