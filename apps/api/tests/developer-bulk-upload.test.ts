import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";

type AuthEnvelope = {
  data?: { accessToken?: string; user?: { id: string; role: string } };
  error?: { code: string; message: string };
};

async function registerDeveloper(suffix: string) {
  const body = {
    email: `${suffix}@example.test`,
    password: "Password123!",
    role: "developer" as const,
    companyName: `Co ${suffix}`,
  };
  return call<AuthEnvelope>("/v1/auth/register", { method: "POST", body });
}

describe("/v1/me/developer/bulk-uploads", () => {
  it("creates upload, lists rows, publishes units, and rejects other developer project", async () => {
    const devReg = await registerDeveloper(`bulk-a-${Date.now()}`);
    expect(devReg.status).toBe(201);
    const token = devReg.body.data?.accessToken;
    expect(token).toBeTruthy();

    const create = await call<{ data: { id: string } }>("/v1/me/developer/projects", {
      method: "POST",
      token,
      body: {
        name: "Bulk Test Estate",
        propertyType: "estate_unit",
        city: "Lagos",
        state: "Lagos",
        totalUnits: 0,
      },
    });
    expect(create.status).toBe(201);
    const projectId = create.body.data.id;

    const csvText = [
      "unitName,squareMeters,priceKobo",
      "Plot A-1,500,1500000000",
      "Plot A-2,502,1500000000",
    ].join("\n");

    const up = await call<{ data: { id: string; status: string; stats?: { rowCount: number } } }>(
      "/v1/me/developer/bulk-uploads",
      {
        method: "POST",
        token,
        body: { projectId, filename: "plots.csv", csvText },
      },
    );
    expect(up.status).toBe(201);
    expect(up.body.data.status).toBe("ready");
    expect(up.body.data.stats?.rowCount).toBe(2);
    const uploadId = up.body.data.id;

    const rows = await call<{ data: Array<{ rowIndex: number; errors: string[] }> }>(
      `/v1/me/developer/bulk-uploads/${uploadId}/rows?page=1&pageSize=20`,
      { token },
    );
    expect(rows.status).toBe(200);
    expect(rows.body.data).toHaveLength(2);
    expect(rows.body.data.every((r) => r.errors.length === 0)).toBe(true);

    const commit = await call<{
      data: { insertedUnits?: number; counters?: { totalAdded: number } };
    }>(`/v1/me/developer/bulk-uploads/${uploadId}/commit`, {
      method: "POST",
      token,
      body: { mode: "publish" },
    });
    expect(commit.status).toBe(200);
    expect(commit.body.data.insertedUnits).toBe(2);

    const proj = await call<{ data: { totalUnits: number; availableUnits: number } }>(
      `/v1/me/developer/projects/${projectId}`,
      { token },
    );
    expect(proj.status).toBe(200);
    expect(proj.body.data.totalUnits).toBe(2);
    expect(proj.body.data.availableUnits).toBe(2);

    const other = await registerDeveloper(`bulk-b-${Date.now()}`);
    expect(other.status).toBe(201);
    const otherToken = other.body.data?.accessToken;
    expect(otherToken).toBeTruthy();

    const hijack = await call("/v1/me/developer/bulk-uploads", {
      method: "POST",
      token: otherToken,
      body: {
        projectId,
        filename: "evil.csv",
        csvText: "unitName,priceKobo\nX,1\n",
      },
    });
    expect(hijack.status).toBe(404);
  });

  it("returns 403 for buyer on bulk-uploads", async () => {
    const buyer = await call<AuthEnvelope>("/v1/auth/register", {
      method: "POST",
      body: {
        email: `bulk-buyer-${Date.now()}@example.test`,
        password: "Password123!",
        role: "buyer",
      },
    });
    expect(buyer.status).toBe(201);
    const t = buyer.body.data?.accessToken;
    const res = await call("/v1/me/developer/bulk-uploads", { token: t });
    expect(res.status).toBe(403);
  });
});
