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

describe("/v1/agent/subscription", () => {
  it("GET returns tier and usage", async () => {
    const reg = await registerAgent(`agt-sub-${Date.now()}`);
    expect(reg.status).toBe(201);
    const res = await call<{ data: { tier: string; usage: { activeListings: number } } }>(
      "/v1/agent/subscription",
      { token: reg.body.data?.accessToken },
    );
    expect(res.status).toBe(200);
    expect(res.body.data.tier).toBe("free");
    expect(typeof res.body.data.usage.activeListings).toBe("number");
  });
});
