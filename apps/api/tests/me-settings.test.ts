import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";

type AuthEnvelope = { data?: { accessToken?: string } };

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

describe("/v1/me/settings", () => {
  it("GET returns profile and notification prefs", async () => {
    const reg = await registerBuyer(`buyer-set-get-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call<{ data: { email: string; notifications: { notifyEmail: boolean } } }>(
      "/v1/me/settings",
      { token },
    );
    expect(res.status).toBe(200);
    expect(res.body.data.email).toMatch(/@example\.test$/);
    expect(res.body.data.notifications.notifyEmail).toBe(true);
  });

  it("PATCH toggles notifyEmail", async () => {
    const reg = await registerBuyer(`buyer-set-patch-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call<{ data: { notifications: { notifyEmail: boolean } } }>("/v1/me/settings", {
      method: "PATCH",
      token,
      body: { notifyEmail: false },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.notifications.notifyEmail).toBe(false);
  });
});
