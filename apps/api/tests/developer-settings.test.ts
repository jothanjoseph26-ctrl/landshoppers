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

async function registerBuyer(suffix: string) {
  return call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `${suffix}@example.test`,
      password: "Password123!",
      role: "buyer",
    },
  });
}

describe("/v1/me/developer/settings", () => {
  it("GET returns organisation profile", async () => {
    const suffix = `set-get-${Date.now()}`;
    const reg = await registerDeveloper(suffix);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call<{ data: { companyName: string; email: string } }>("/v1/me/developer/settings", {
      token,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.companyName).toBe(`Co ${suffix}`);
    expect(res.body.data.email).toMatch(/@example\.test$/);
  });

  it("PATCH updates company fields", async () => {
    const reg = await registerDeveloper(`set-patch-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call<{ data: { companyCity: string | null; companyWebsite: string | null } }>(
      "/v1/me/developer/settings",
      {
        method: "PATCH",
        token,
        body: {
          companyCity: "Abuja",
          companyWebsite: "https://example.com/portfolio",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.body.data.companyCity).toBe("Abuja");
    expect(res.body.data.companyWebsite).toBe("https://example.com/portfolio");
  });

  it("returns 403 for buyer", async () => {
    const reg = await registerBuyer(`set-buyer-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call("/v1/me/developer/settings", { token });
    expect(res.status).toBe(403);
  });
});
