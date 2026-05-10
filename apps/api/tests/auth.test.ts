import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";

type AuthEnvelope = {
  data?: { accessToken?: string; refreshToken?: string; user?: { id: string; role: string } };
  error?: { code: string; message: string };
};

async function registerUser(role: "buyer" | "agent" | "developer", suffix: string) {
  const res = await call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `${suffix}@example.test`,
      password: "Password123!",
      role,
    },
  });
  return res;
}

describe("auth", () => {
  it("registers a buyer and returns tokens", async () => {
    const res = await registerUser("buyer", "buyer-register");
    expect(res.status).toBe(201);
    expect(res.body.data?.accessToken).toBeTruthy();
    expect(res.body.data?.user?.role).toBe("buyer");
  });

  it("rejects duplicate email registration", async () => {
    await registerUser("buyer", "dup");
    const dup = await registerUser("buyer", "dup");
    expect(dup.status).toBe(409);
    expect(dup.body.error?.code).toBe("EMAIL_TAKEN");
  });

  it("logs in valid credentials and returns tokens", async () => {
    await registerUser("buyer", "buyer-login");
    const res = await call<AuthEnvelope>("/v1/auth/login", {
      method: "POST",
      body: { email: "buyer-login@example.test", password: "Password123!" },
    });
    expect(res.status).toBe(200);
    expect(res.body.data?.accessToken).toBeTruthy();
  });

  it("rejects invalid credentials", async () => {
    await registerUser("buyer", "buyer-bad");
    const res = await call<AuthEnvelope>("/v1/auth/login", {
      method: "POST",
      body: { email: "buyer-bad@example.test", password: "WrongPass1!" },
    });
    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns the current user via /v1/auth/me and /v1/me", async () => {
    const reg = await registerUser("agent", "agent-me");
    const token = reg.body.data?.accessToken!;

    const me1 = await call<{ data: { id: string; role: string } }>("/v1/auth/me", { token });
    expect(me1.status).toBe(200);
    expect(me1.body.data.role).toBe("agent");
    expect(me1.body.data.id).toBe(reg.body.data!.user!.id);

    const me2 = await call<{ data: { id: string; role: string } }>("/v1/me", { token });
    expect(me2.status).toBe(200);
    expect(me2.body.data.id).toBe(me1.body.data.id);
  });

  it("rejects unauthenticated /v1/auth/me", async () => {
    const res = await call("/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("issues a dev password-reset token and confirms it", async () => {
    await registerUser("buyer", "reset-flow");

    const reqRes = await call<{ data: { token?: string } }>(
      "/v1/auth/password-reset/request",
      {
        method: "POST",
        body: { email: "reset-flow@example.test" },
      },
    );
    expect(reqRes.status).toBe(200);
    const token = reqRes.body.data.token;
    expect(typeof token).toBe("string");

    const confirmRes = await call<{ data: { ok: boolean } }>(
      "/v1/auth/password-reset/confirm",
      {
        method: "POST",
        body: { token, password: "NewPass123!" },
      },
    );
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.ok).toBe(true);

    const login = await call<AuthEnvelope>("/v1/auth/login", {
      method: "POST",
      body: { email: "reset-flow@example.test", password: "NewPass123!" },
    });
    expect(login.status).toBe(200);
  });

  it("rejects invalid password-reset tokens", async () => {
    const res = await call<AuthEnvelope>("/v1/auth/password-reset/confirm", {
      method: "POST",
      body: { token: "definitely-not-a-real-token-string", password: "NewPass123!" },
    });
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("INVALID_RESET_TOKEN");
  });
});
