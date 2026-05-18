import { describe, expect, it } from "vitest";

import { agentContentGenerateResultSchema } from "../src/contracts/agent-content.js";
import { call } from "./helpers/app.js";

type AuthEnvelope = { data?: { accessToken?: string } };

async function registerAgent(suffix: string) {
  const res = await call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `${suffix}@example.test`,
      password: "Password123!",
      role: "agent",
    },
  });
  expect(res.status).toBe(201);
  return res.body.data?.accessToken!;
}

describe("/v1/agent/content/generate", () => {
  it("POST returns captions for an agent", async () => {
    const token = await registerAgent(`agt-content-${Date.now()}`);
    const res = await call<{ data: unknown }>("/v1/agent/content/generate", {
      method: "POST",
      token,
      body: { kind: "captions", tone: "professional" },
    });
    expect(res.status).toBe(200);
    const parsed = agentContentGenerateResultSchema.safeParse(res.body.data);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.captions.length).toBeGreaterThan(0);
    }
  });

  it("POST returns description draft", async () => {
    const token = await registerAgent(`agt-content-desc-${Date.now()}`);
    const res = await call<{ data: { description: string | null } }>("/v1/agent/content/generate", {
      method: "POST",
      token,
      body: { kind: "description", tone: "friendly" },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toMatch(/LandShoppers/);
  });
});
