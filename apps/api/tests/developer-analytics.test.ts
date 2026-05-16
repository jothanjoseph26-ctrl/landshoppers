import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";

type AuthEnvelope = {
  data?: { accessToken?: string; user?: { id: string; role: string } };
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

describe("/v1/me/developer/analytics/summary", () => {
  it("returns zeros when developer has no projects", async () => {
    const reg = await registerDeveloper(`analytics-empty-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    expect(token).toBeTruthy();

    const res = await call<{
      data: { kpis: { projectCount: number; inquiriesInPeriod: number }; byProject: unknown[] };
    }>(`/v1/me/developer/analytics/summary?period=all`, { token });
    expect(res.status).toBe(200);
    expect(res.body.data.kpis.projectCount).toBe(0);
    expect(res.body.data.kpis.inquiriesInPeriod).toBe(0);
    expect(res.body.data.byProject).toEqual([]);
  });

  it("aggregates inquiries in window and respects projectIds filter", async () => {
    const devReg = await registerDeveloper(`analytics-dev-${Date.now()}`);
    expect(devReg.status).toBe(201);
    const devToken = devReg.body.data?.accessToken;
    expect(devToken).toBeTruthy();

    const p1 = await call<{ data: { id: string } }>("/v1/me/developer/projects", {
      method: "POST",
      token: devToken,
      body: {
        name: "Analytics Estate A",
        propertyType: "estate_unit",
        city: "Lagos",
        state: "Lagos",
        totalUnits: 10,
      },
    });
    const p2 = await call<{ data: { id: string } }>("/v1/me/developer/projects", {
      method: "POST",
      token: devToken,
      body: {
        name: "Analytics Estate B",
        propertyType: "estate_unit",
        city: "Abuja",
        state: "FCT",
        totalUnits: 5,
      },
    });
    expect(p1.status).toBe(201);
    expect(p2.status).toBe(201);
    const id1 = p1.body.data.id;
    const id2 = p2.body.data.id;

    const buyer = await call<AuthEnvelope>("/v1/auth/register", {
      method: "POST",
      body: {
        email: `analytics-buyer-${Date.now()}@example.test`,
        password: "Password123!",
        role: "buyer",
      },
    });
    expect(buyer.status).toBe(201);
    const buyerToken = buyer.body.data?.accessToken;
    expect(buyerToken).toBeTruthy();

    await call("/v1/inquiries", {
      method: "POST",
      token: buyerToken,
      body: { projectId: id1, message: "Interested A" },
    });
    await call("/v1/inquiries", {
      method: "POST",
      token: buyerToken,
      body: { projectId: id1, message: "Interested A2" },
    });
    await call("/v1/inquiries", {
      method: "POST",
      token: buyerToken,
      body: { projectId: id2, message: "Interested B" },
    });

    const all = await call<{
      data: { kpis: { projectCount: number; inquiriesInPeriod: number }; byProject: { projectId: string; inquiryCount: number }[] };
    }>(`/v1/me/developer/analytics/summary?period=all`, { token: devToken });
    expect(all.status).toBe(200);
    expect(all.body.data.kpis.projectCount).toBe(2);
    expect(all.body.data.kpis.inquiriesInPeriod).toBe(3);
    expect(all.body.data.byProject.find((x) => x.projectId === id1)?.inquiryCount).toBe(2);

    const filtered = await call<{
      data: { kpis: { projectCount: number; inquiriesInPeriod: number } };
    }>(`/v1/me/developer/analytics/summary?period=all&projectIds=${id1}`, { token: devToken });
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.kpis.projectCount).toBe(1);
    expect(filtered.body.data.kpis.inquiriesInPeriod).toBe(2);
  });

  it("returns 403 for buyer", async () => {
    const buyer = await call<AuthEnvelope>("/v1/auth/register", {
      method: "POST",
      body: {
        email: `analytics-buyer403-${Date.now()}@example.test`,
        password: "Password123!",
        role: "buyer",
      },
    });
    expect(buyer.status).toBe(201);
    const t = buyer.body.data?.accessToken;
    const res = await call("/v1/me/developer/analytics/summary", { token: t });
    expect(res.status).toBe(403);
  });
});
