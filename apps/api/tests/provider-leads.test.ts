import { describe, expect, it } from "vitest";

import {
  providerLeadRowSchema,
  listProviderLeadsQuerySchema,
} from "../src/contracts/provider-portal.js";
import { call } from "./helpers/app.js";
import { fakePrisma } from "./helpers/fake-prisma.js";

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
  return token!;
}

describe("/v1/provider/leads (PRV-02 Phase B)", () => {
  it("lists leads scoped to provider + validates row contract", async () => {
    const token = await registerProvider("prv-leads-a");

    const prof = await call<{ data: { id: string } }>("/v1/provider/profile", { token });
    expect(prof.status).toBe(200);
    const providerId = prof.body.data.id;

    const created = await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientName: "Ada Buyer",
        clientPhone: "+2348000000001",
        clientEmail: "ada@example.test",
        source: "listing_page",
        serviceRequested: "Title perfection",
        message: "Need support closing in Lekki.",
        location: "Lekki, Lagos",
        timeline: "Within 2 weeks",
        budget: 35000000n,
        aiScore: 72,
        aiSummary: "High intent · budget stated · urgent timeline.",
      },
    });

    const list = await call<{ data: unknown[]; meta: { total: number } }>(
      `/v1/provider/leads?page=1&pageSize=10`,
      { token },
    );
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(1);
    const rowParse = providerLeadRowSchema.safeParse(list.body.data[0]);
    expect(rowParse.success, rowParse.success ? "" : JSON.stringify(rowParse.error.format())).toBe(true);

    const qParse = listProviderLeadsQuerySchema.safeParse({
      page: "1",
      pageSize: "10",
      status: "pending",
    });
    expect(qParse.success).toBe(true);
  });

  it("PATCH lead status sets respondedAt", async () => {
    const token = await registerProvider("prv-leads-patch");

    const prof = await call<{ data: { id: string } }>("/v1/provider/profile", { token });
    const providerId = prof.body.data.id;

    const created = await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientName: "Bob Client",
        clientPhone: "+2348000000002",
        source: "directory",
        serviceRequested: "Survey plan",
        message: "Boundary dispute.",
        location: "Ikeja",
      },
    });

    const patch = await call<{ data: { status: string; respondedAt: string | null } }>(
      `/v1/provider/leads/${created.id}`,
      {
        method: "PATCH",
        token,
        body: { status: "responded" },
      },
    );
    expect(patch.status).toBe(200);
    expect(patch.body.data.status).toBe("responded");
    expect(patch.body.data.respondedAt).toBeTruthy();

    const dash = await call<{ data: { kpis: { newLeadsToday: number } } }>("/v1/provider/dashboard", {
      token,
    });
    expect(dash.status).toBe(200);
    expect(dash.body.data.kpis.newLeadsToday).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 patching another provider lead", async () => {
    const t1 = await registerProvider("prv-leads-own");
    const t2 = await registerProvider("prv-leads-other");

    const p2 = await call<{ data: { id: string } }>("/v1/provider/profile", { token: t2 });
    const provider2Id = p2.body.data.id;

    const victim = await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: provider2Id,
        clientName: "Victim",
        clientPhone: "+2348000000003",
        source: "directory",
        serviceRequested: "Legal review",
        message: "Hi",
        location: "Abuja",
      },
    });

    const hack = await call(`/v1/provider/leads/${victim.id}`, {
      method: "PATCH",
      token: t1,
      body: { status: "lost" },
    });
    expect(hack.status).toBe(404);
  });
});
