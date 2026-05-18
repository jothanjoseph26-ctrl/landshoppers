import { describe, expect, it } from "vitest";

import { agentKycSchema } from "../src/contracts/agent-kyc.js";
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

describe("/v1/agent/kyc", () => {
  it("GET returns KYC status for an agent", async () => {
    const token = await registerAgent(`agt-kyc-get-${Date.now()}`);
    const res = await call<{ data: unknown }>("/v1/agent/kyc", { token });
    expect(res.status).toBe(200);
    const parsed = agentKycSchema.safeParse(res.body.data);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.kycStatus).toBe("pending");
    }
  });

  it("PATCH submits documents for review", async () => {
    const token = await registerAgent(`agt-kyc-patch-${Date.now()}`);
    const res = await call<{ data: { kycStatus: string; kycDocuments: unknown[] | null } }>(
      "/v1/agent/kyc",
      {
        method: "PATCH",
        token,
        body: {
          licenseNumber: "LAG-12345",
          kycDocuments: [
            {
              type: "license",
              externalUrl: "https://example.com/license.pdf",
            },
          ],
          submitForReview: true,
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.body.data.kycStatus).toBe("submitted");
    expect(res.body.data.kycDocuments?.length).toBe(1);
  });
});
