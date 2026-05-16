import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";

type AuthEnvelope = {
  data?: { accessToken?: string; user?: { id: string; role: string } };
  error?: { code: string; message: string };
};

async function register(role: "buyer" | "developer", suffix: string) {
  const body: Record<string, unknown> = {
    email: `${suffix}@example.test`,
    password: "Password123!",
    role,
  };
  if (role === "developer") {
    body["companyName"] = `DevCo ${suffix}`;
  }
  return call<AuthEnvelope>("/v1/auth/register", { method: "POST", body });
}

describe("/v1/me/developer", () => {
  it("dashboard, project CRUD, and scoped inquiries", async () => {
    const devReg = await register("developer", "dev-portal-1");
    expect(devReg.status).toBe(201);
    const devToken = devReg.body.data?.accessToken;
    expect(devToken).toBeTruthy();

    const dash = await call<{
      data: { projectCount: number; inquiries: { total: number }; userEmail: string; displayName: string | null }
    }>("/v1/me/developer/dashboard", { token: devToken });
    expect(dash.status).toBe(200);
    expect(dash.body.data.projectCount).toBe(0);
    expect(dash.body.data.inquiries.total).toBe(0);
    expect(dash.body.data.userEmail).toContain("@");

    const create = await call<{ data: { id: string; name: string } }>("/v1/me/developer/projects", {
      method: "POST",
      token: devToken,
      body: {
        name: "Lekki Phase 9",
        propertyType: "estate_unit",
        city: "Lekki",
        state: "Lagos",
        totalUnits: 12,
      },
    });
    expect(create.status).toBe(201);
    const projectId = create.body.data.id;

    const list = await call<{ meta: { total: number } }>("/v1/me/developer/projects", {
      token: devToken,
    });
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(1);

    const one = await call<{ data: { id: string; name: string } }>(
      `/v1/me/developer/projects/${projectId}`,
      { token: devToken },
    );
    expect(one.status).toBe(200);
    expect(one.body.data.name).toBe("Lekki Phase 9");

    const patch = await call<{ data: { shortDescription: string | null } }>(
      `/v1/me/developer/projects/${projectId}`,
      {
        method: "PATCH",
        token: devToken,
        body: { shortDescription: "Premium plots" },
      },
    );
    expect(patch.status).toBe(200);
    expect(patch.body.data.shortDescription).toBe("Premium plots");

    const buyerReg = await register("buyer", "buyer-dev-inq-1");
    expect(buyerReg.status).toBe(201);
    const buyerToken = buyerReg.body.data?.accessToken;
    expect(buyerToken).toBeTruthy();

    const inq = await call("/v1/inquiries", {
      method: "POST",
      token: buyerToken,
      body: { projectId, message: "Interested in two units" },
    });
    expect(inq.status).toBe(201);

    const devInq = await call<{ meta: { total: number }; data: Array<{ projectId: string | null }> }>(
      "/v1/me/developer/inquiries",
      { token: devToken },
    );
    expect(devInq.status).toBe(200);
    expect(devInq.body.meta.total).toBe(1);
    expect(devInq.body.data[0]?.projectId).toBe(projectId);
  });

  it("returns 403 for non-developer roles", async () => {
    const buyerReg = await register("buyer", "buyer-no-dev");
    expect(buyerReg.status).toBe(201);
    const buyerToken = buyerReg.body.data?.accessToken;
    const res = await call("/v1/me/developer/dashboard", { token: buyerToken });
    expect(res.status).toBe(403);
  });

  it("leads digest and pitch-draft for owned project inquiry", async () => {
    const devReg = await register("developer", "dev-digest-1");
    expect(devReg.status).toBe(201);
    const devToken = devReg.body.data?.accessToken;
    expect(devToken).toBeTruthy();

    const create = await call<{ data: { id: string } }>("/v1/me/developer/projects", {
      method: "POST",
      token: devToken,
      body: {
        name: "Digest Tower",
        propertyType: "estate_unit",
        city: "Lagos",
        state: "Lagos",
        totalUnits: 10,
      },
    });
    expect(create.status).toBe(201);
    const projectId = create.body.data.id;

    const buyerReg = await register("buyer", "buyer-digest-1");
    expect(buyerReg.status).toBe(201);
    const buyerToken = buyerReg.body.data?.accessToken;
    expect(buyerToken).toBeTruthy();

    const inqRes = await call<{ data: { id: string } }>("/v1/inquiries", {
      method: "POST",
      token: buyerToken,
      body: { projectId, message: "Need pricing for two units" },
    });
    expect(inqRes.status).toBe(201);
    const inquiryId = inqRes.body.data.id;

    const digest = await call<{
      data: { totals: { inquiriesInPeriod: number }; hotLeads: Array<{ inquiryId: string }> };
    }>(`/v1/me/developer/leads/digest?period=all`, { token: devToken });
    expect(digest.status).toBe(200);
    expect(digest.body.data.totals.inquiriesInPeriod).toBeGreaterThanOrEqual(1);
    expect(digest.body.data.hotLeads.some((h) => h.inquiryId === inquiryId)).toBe(true);

    const pitch = await call<{ data: { draft: { subject: string; body: string } } }>(
      `/v1/me/developer/inquiries/${inquiryId}/pitch-draft`,
      { method: "POST", token: devToken },
    );
    expect(pitch.status).toBe(200);
    expect(pitch.body.data.draft.subject).toContain("Digest Tower");
    expect(pitch.body.data.draft.body.length).toBeGreaterThan(20);

    const bad = await call(`/v1/me/developer/inquiries/00000000-0000-0000-0000-000000000099/pitch-draft`, {
      method: "POST",
      token: devToken,
    });
    expect(bad.status).toBe(404);

    const emailed = await call<{
      data: { emailed: boolean; mode: string; totals: { inquiriesInPeriod: number } };
    }>("/v1/me/developer/leads/digest/email", {
      method: "POST",
      token: devToken,
      body: { period: "all" },
    });
    expect(emailed.status).toBe(200);
    expect(emailed.body.data.emailed).toBe(false);
    expect(emailed.body.data.mode).toBe("log_only");
    expect(emailed.body.data.totals.inquiriesInPeriod).toBeGreaterThanOrEqual(1);
  });
});
