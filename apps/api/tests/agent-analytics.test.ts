import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";

type AuthEnvelope = { data?: { accessToken?: string } };

async function registerAgent(suffix: string) {
  return call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `${suffix}@example.test`,
      password: "Password123!",
      role: "agent",
      agencyName: `Agency ${suffix}`,
    },
  });
}

describe("/v1/agent/analytics/summary", () => {
  it("returns KPI shape for agent", async () => {
    const reg = await registerAgent(`agt-analytics-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call<{
      data: { period: string; tier: string; kpis: { views: { total: number } } };
    }>("/v1/agent/analytics/summary?period=month", { token });
    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe("month");
    expect(typeof res.body.data.kpis.views.total).toBe("number");
  });

  it("returns 403 for buyer", async () => {
    const reg = await call<AuthEnvelope>("/v1/auth/register", {
      method: "POST",
      body: {
        email: `buyer-agt-analytics-${Date.now()}@example.test`,
        password: "Password123!",
        role: "buyer",
      },
    });
    const res = await call("/v1/agent/analytics/summary", { token: reg.body.data?.accessToken });
    expect(res.status).toBe(403);
  });
});
