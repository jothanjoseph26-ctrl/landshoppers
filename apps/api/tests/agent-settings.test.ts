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

describe("/v1/agent/settings", () => {
  it("GET returns agency and notifications", async () => {
    const reg = await registerAgent(`agt-set-get-${Date.now()}`);
    expect(reg.status).toBe(201);
    const res = await call<{ data: { agency: { agencyName: string | null } } }>("/v1/agent/settings", {
      token: reg.body.data?.accessToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.persona).toBe("agent");
    expect(res.body.data.notifications.notifyEmail).toBe(true);
  });

  it("PATCH updates agency name", async () => {
    const reg = await registerAgent(`agt-set-patch-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call<{ data: { agency: { agencyName: string | null } } }>("/v1/agent/settings", {
      method: "PATCH",
      token,
      body: { agencyName: "Updated Agency Ltd" },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.agency.agencyName).toBe("Updated Agency Ltd");
  });
});
