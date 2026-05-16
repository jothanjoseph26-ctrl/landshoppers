import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";

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

describe("/v1/me/developer/kyc/documents", () => {
  it("lists empty, creates document with https URL, patches while pending, blocks other developer", async () => {
    const reg = await registerDeveloper(`kyc-a-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    expect(token).toBeTruthy();

    const empty = await call<{ meta: { countsByStatus: Record<string, number> } }>(
      "/v1/me/developer/kyc/documents?page=1&pageSize=20",
      { token },
    );
    expect(empty.status).toBe(200);
    expect(empty.body.meta.countsByStatus["pending"]).toBe(0);

    const proj = await call<{ data: { id: string } }>("/v1/me/developer/projects", {
      method: "POST",
      token,
      body: {
        name: "KYC Test Project",
        propertyType: "estate_unit",
        city: "Lagos",
        state: "Lagos",
      },
    });
    expect(proj.status).toBe(201);
    const projectId = proj.body.data.id;

    const create = await call<{ data: { id: string; status: string; previewUrl: string } }>(
      "/v1/me/developer/kyc/documents",
      {
        method: "POST",
        token,
        body: {
          documentType: "c_of_o",
          projectId,
          title: "Phase 1 C of O",
          fileName: "co.pdf",
          mimeType: "application/pdf",
          byteSize: 1200,
          externalUrl: "https://example.com/co-phase-1.pdf",
        },
      },
    );
    expect(create.status).toBe(201);
    const docId = create.body.data.id;
    expect(create.body.data.status).toBe("pending");
    expect(create.body.data.previewUrl).toContain("https://");

    const list = await call<{ data: { id: string }[]; meta: { countsByStatus: Record<string, number> } }>(
      "/v1/me/developer/kyc/documents",
      { token },
    );
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.meta.countsByStatus["pending"]).toBe(1);

    const patch = await call<{ data: { title: string | null } }>(
      `/v1/me/developer/kyc/documents/${docId}`,
      {
        method: "PATCH",
        token,
        body: { title: "Updated title" },
      },
    );
    expect(patch.status).toBe(200);
    expect(patch.body.data.title).toBe("Updated title");

    const other = await registerDeveloper(`kyc-b-${Date.now()}`);
    expect(other.status).toBe(201);
    const otherToken = other.body.data?.accessToken;
    expect(otherToken).toBeTruthy();

    const hijack = await call(`/v1/me/developer/kyc/documents/${docId}`, { token: otherToken });
    expect(hijack.status).toBe(404);
  });

  it("rejects non-https externalUrl", async () => {
    const reg = await registerDeveloper(`kyc-http-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call("/v1/me/developer/kyc/documents", {
      method: "POST",
      token,
      body: {
        documentType: "other",
        fileName: "x.pdf",
        mimeType: "application/pdf",
        externalUrl: "http://insecure.example.com/x.pdf",
      },
    });
    expect(res.status).toBe(400);
  });

  it("presign returns 501", async () => {
    const reg = await registerDeveloper(`kyc-pre-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call("/v1/me/developer/kyc/documents/presign", { method: "POST", token });
    expect(res.status).toBe(501);
  });

  it("returns 403 for buyer", async () => {
    const buyer = await call<AuthEnvelope>("/v1/auth/register", {
      method: "POST",
      body: {
        email: `kyc-buyer-${Date.now()}@example.test`,
        password: "Password123!",
        role: "buyer",
      },
    });
    expect(buyer.status).toBe(201);
    const t = buyer.body.data?.accessToken;
    const res = await call("/v1/me/developer/kyc/documents", { token: t });
    expect(res.status).toBe(403);
  });
});
