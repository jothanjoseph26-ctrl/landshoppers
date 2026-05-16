import { describe, expect, it } from "vitest";

import {
  providerPortalContextSchema,
  providerPortalDashboardSchema,
  providerProfileSchema,
} from "../src/contracts/provider-portal.js";
import { call } from "./helpers/app.js";

type AuthEnvelope = {
  data?: { accessToken?: string; user?: { id: string; role: string } };
  error?: { code: string; message: string };
};

async function registerProvider(suffix: string) {
  const res = await call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `${suffix}@example.test`,
      password: "Password123!",
      role: "service_provider",
      providerBusinessName: `Provider ${suffix}`,
      providerCategory: "legal",
      providerCity: "Lagos",
      providerState: "Lagos",
    },
  });
  expect(res.status).toBe(201);
  const token = res.body.data?.accessToken;
  expect(token).toBeTruthy();
  return { accessToken: token!, user: res.body.data?.user };
}

describe("/v1/provider (ServiceHub PRV shell — contract + RBAC)", () => {
  it("returns 401 for /v1/provider/context without Authorization", async () => {
    const res = await call("/v1/provider/context");
    expect(res.status).toBe(401);
  });

  it("GET context, dashboard, and profile match contracts; PATCH profile round-trip", async () => {
    const { accessToken } = await registerProvider("prv-contract-1");

    const ctx = await call<{ data: unknown }>("/v1/provider/context", { token: accessToken });
    expect(ctx.status).toBe(200);
    const ctxParse = providerPortalContextSchema.safeParse(ctx.body.data);
    expect(ctxParse.success, ctxParse.success ? "" : JSON.stringify(ctxParse.error.format())).toBe(true);

    const dash = await call<{ data: unknown }>("/v1/provider/dashboard", { token: accessToken });
    expect(dash.status).toBe(200);
    const dashParse = providerPortalDashboardSchema.safeParse(dash.body.data);
    expect(dashParse.success, dashParse.success ? "" : JSON.stringify(dashParse.error.format())).toBe(true);

    const prof = await call<{ data: unknown }>("/v1/provider/profile", { token: accessToken });
    expect(prof.status).toBe(200);
    const profParse = providerProfileSchema.safeParse(prof.body.data);
    expect(profParse.success, profParse.success ? "" : JSON.stringify(profParse.error.format())).toBe(true);

    const patch = await call<{ data: unknown }>("/v1/provider/profile", {
      method: "PATCH",
      token: accessToken,
      body: {
        description: "End-to-end conveyancing and perfection services in Lagos.",
        services: ["Title search", "Perfection", "Consent"],
      },
    });
    expect(patch.status).toBe(200);
    const patchParse = providerProfileSchema.safeParse(patch.body.data);
    expect(patchParse.success, patchParse.success ? "" : JSON.stringify(patchParse.error.format())).toBe(true);
    expect(patchParse.success && patchParse.data.services.length).toBe(3);
  });

  it("PATCH accepts socialLinks: null (clears JSON column)", async () => {
    const { accessToken } = await registerProvider("prv-social-null");

    const patch = await call("/v1/provider/profile", {
      method: "PATCH",
      token: accessToken,
      body: { socialLinks: null },
    });
    expect(patch.status).toBe(200);
    const parsed = providerProfileSchema.safeParse((patch.body as { data: unknown }).data);
    expect(parsed.success).toBe(true);
    expect(parsed.success ? parsed.data.socialLinks : undefined).toBeNull();
  });

  it("returns 403 for non–service_provider roles", async () => {
    const buyer = await call<AuthEnvelope>("/v1/auth/register", {
      method: "POST",
      body: {
        email: "buyer-no-provider@example.test",
        password: "Password123!",
        role: "buyer",
      },
    });
    expect(buyer.status).toBe(201);
    const token = buyer.body.data?.accessToken;
    expect(token).toBeTruthy();

    const res = await call("/v1/provider/dashboard", { token: token! });
    expect(res.status).toBe(403);
  });

  it("GET /availability and POST /availability upsert day", async () => {
    const { accessToken } = await registerProvider("prv-avail-1");

    const get0 = await call<{ data: { days: unknown[] } }>("/v1/provider/availability", {
      token: accessToken,
    });
    expect(get0.status).toBe(200);
    expect(Array.isArray(get0.body.data.days)).toBe(true);

    const res = await call<{ data: { date: string; isAvailable: boolean } }>(
      "/v1/provider/availability",
      {
        method: "POST",
        token: accessToken,
        body: { date: "2030-06-15", isAvailable: false, note: "Travel" },
      },
    );
    expect(res.status).toBe(200);
    expect(res.body.data.date).toBe("2030-06-15");
    expect(res.body.data.isAvailable).toBe(false);
  });
});
