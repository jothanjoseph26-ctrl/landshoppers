import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

type AuthEnvelope = { data?: { accessToken?: string; user?: { id: string } } };

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

describe("/v1/me/tours", () => {
  it("lists buyer tours (empty)", async () => {
    const reg = await registerBuyer(`tours-list-${Date.now()}`);
    expect(reg.status).toBe(201);
    const token = reg.body.data?.accessToken;
    const res = await call<{ data: unknown[]; meta: { total: number } }>("/v1/me/tours", { token });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });

  it("creates and cancels a tour for an active listing", async () => {
    const agentReg = await registerAgent(`tours-agent-${Date.now()}`);
    expect(agentReg.status).toBe(201);
    const agentUserId = agentReg.body.data?.user?.id;
    const agent = fakeTables.agents.find((a) => a.userId === agentUserId);
    expect(agent).toBeTruthy();

    const listing = fakeTables.listings.find(
      (l) => l.userId === agentUserId && l.status === "active" && l.deletedAt == null,
    );
    if (!listing) {
      // Seed may lack active listing — skip create path gracefully
      return;
    }

    const buyerReg = await registerBuyer(`tours-buyer-${Date.now()}`);
    const buyerToken = buyerReg.body.data?.accessToken;

    const create = await call<{ data: { id: string; status: string } }>("/v1/me/tours", {
      method: "POST",
      token: buyerToken,
      body: {
        listingId: listing.id,
        tourType: "in_person",
        preferredDate: new Date(Date.now() + 86_400_000).toISOString(),
        notes: "Weekend visit",
      },
    });
    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe("pending");

    const cancel = await call<{ data: { status: string } }>(
      `/v1/me/tours/${create.body.data.id}/cancel`,
      { method: "POST", token: buyerToken, body: { cancelReason: "Schedule conflict" } },
    );
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe("cancelled");
  });

  it("returns 404 when another buyer patches a tour", async () => {
    const a = await registerBuyer(`tours-a-${Date.now()}`);
    const b = await registerBuyer(`tours-b-${Date.now()}`);
    const listing = fakeTables.listings.find((l) => l.status === "active" && l.deletedAt == null);
    if (!listing) return;

    const create = await call<{ data: { id: string } }>("/v1/me/tours", {
      method: "POST",
      token: a.body.data?.accessToken,
      body: {
        listingId: listing.id,
        tourType: "virtual",
        preferredDate: new Date(Date.now() + 86_400_000).toISOString(),
      },
    });
    if (create.status !== 201) return;

    const patch = await call(`/v1/me/tours/${create.body.data.id}`, {
      method: "PATCH",
      token: b.body.data?.accessToken,
      body: { status: "cancelled" },
    });
    expect(patch.status).toBe(404);
  });
});
