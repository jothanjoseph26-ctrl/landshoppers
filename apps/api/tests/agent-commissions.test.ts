import { describe, expect, it } from "vitest";

import { agentCommissionsResponseSchema } from "../src/contracts/agent-commissions.js";
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

describe("/v1/agent/commissions", () => {
  it("GET returns commission summary for an agent", async () => {
    const token = await registerAgent(`agt-comm-${Date.now()}`);
    const res = await call<{ data: unknown }>("/v1/agent/commissions", { token });
    expect(res.status).toBe(200);
    const parsed = agentCommissionsResponseSchema.safeParse(res.body.data);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.summary.commissionEarnedKobo).toBe("0");
      expect(Array.isArray(parsed.data.transactions)).toBe(true);
    }
  });
});
