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

describe("/v1/me/developer/subscription", () => {
  it("returns subscription summary with usage and paystack flag", async () => {
    const reg = await registerDeveloper(`sub-sum-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    expect(token).toBeTruthy();

    const res = await call<{
      data: {
        subscription: { plan: string | null };
        usage: { projectCount: number; listedUnits: number; inquiriesThisMonth: number; aiCreditsRemaining: null };
        paystackConfigured: boolean;
      };
    }>("/v1/me/developer/subscription", { token });
    expect(res.status).toBe(200);
    expect(res.body.data.subscription.plan).toBeNull();
    expect(res.body.data.usage.aiCreditsRemaining).toBeNull();
    expect(typeof res.body.data.paystackConfigured).toBe("boolean");
  });

  it("returns empty invoices without fabricating rows", async () => {
    const reg = await registerDeveloper(`sub-inv-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call<{ data: unknown[]; meta: { total: number } }>(
      "/v1/me/developer/subscription/invoices?page=1&pageSize=20",
      { token },
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it("checkout returns 503 when Paystack env is missing", async () => {
    const reg = await registerDeveloper(`sub-co-${Date.now()}`);
    const token = reg.body.data?.accessToken;
    expect(token).toBeTruthy();

    const prevPub = process.env["PAYSTACK_PUBLIC_KEY"];
    const prevSec = process.env["PAYSTACK_SECRET_KEY"];
    try {
      delete process.env["PAYSTACK_PUBLIC_KEY"];
      delete process.env["PAYSTACK_SECRET_KEY"];
      const res = await call("/v1/me/developer/subscription/checkout", {
        method: "POST",
        token,
        body: { plan: "developer_basic" },
      });
      expect(res.status).toBe(503);
    } finally {
      if (prevPub !== undefined) process.env["PAYSTACK_PUBLIC_KEY"] = prevPub;
      else delete process.env["PAYSTACK_PUBLIC_KEY"];
      if (prevSec !== undefined) process.env["PAYSTACK_SECRET_KEY"] = prevSec;
      else delete process.env["PAYSTACK_SECRET_KEY"];
    }
  });

  it("checkout returns stub payload when both Paystack keys are set", async () => {
    const reg = await registerDeveloper(`sub-co-ok-${Date.now()}`);
    const token = reg.body.data?.accessToken;
    expect(token).toBeTruthy();

    const prevPub = process.env["PAYSTACK_PUBLIC_KEY"];
    const prevSec = process.env["PAYSTACK_SECRET_KEY"];
    try {
      process.env["PAYSTACK_PUBLIC_KEY"] = "pk_test_dummy";
      process.env["PAYSTACK_SECRET_KEY"] = "sk_test_dummy";
      const res = await call<{ data: { authorizationUrl: string; reference: string } }>(
        "/v1/me/developer/subscription/checkout",
        {
          method: "POST",
          token,
          body: { plan: "developer_pro" },
        },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.authorizationUrl).toContain("paystack.com");
      expect(res.body.data.reference).toMatch(/^dev_sub_/);
    } finally {
      if (prevPub !== undefined) process.env["PAYSTACK_PUBLIC_KEY"] = prevPub;
      else delete process.env["PAYSTACK_PUBLIC_KEY"];
      if (prevSec !== undefined) process.env["PAYSTACK_SECRET_KEY"] = prevSec;
      else delete process.env["PAYSTACK_SECRET_KEY"];
    }
  });

  it("returns 403 for buyer", async () => {
    const reg = await registerBuyer(`sub-buyer-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call("/v1/me/developer/subscription", { token });
    expect(res.status).toBe(403);
  });
});
