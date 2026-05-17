import { ServiceLeadStatus } from "@landshoppers/db";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { meServiceLeadsListResponseSchema } from "../src/contracts/me-service-leads.js";
import { call } from "./helpers/app.js";
import { fakeTables, resetFakePrisma } from "./helpers/fake-prisma.js";

type AuthEnvelope = {
  data?: { accessToken?: string; user?: { id: string; role: string } };
};

async function registerProvider(suffix: string) {
  const res = await call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `sh-bl-prov-${suffix}@example.test`,
      password: "Password123!",
      role: "service_provider",
      providerBusinessName: `Provider ${suffix}`,
      providerCategory: "legal",
      providerCity: "Lagos",
      providerState: "Lagos",
    },
  });
  expect(res.status).toBe(201);
  return res.body.data!.accessToken!;
}

async function registerBuyer(suffix: string) {
  const res = await call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `sh-bl-buy-${suffix}@example.test`,
      password: "Password123!",
      role: "buyer",
    },
  });
  expect(res.status).toBe(201);
  return { token: res.body.data!.accessToken!, userId: res.body.data!.user!.id };
}

const reviewPayload = {
  overallRating: 5,
  qualityRating: 5,
  communicationRating: 5,
  timelinessRating: 5,
  valueRating: 5,
  title: "Excellent work",
  body: "Professional, on time, and clear communication throughout the job.",
};

describe("ServiceHub buyer service leads (BUY-01 · Stream 1)", () => {
  afterEach(() => {
    resetFakePrisma();
  });

  it("GET /v1/me/service-leads returns 401 without token", async () => {
    const res = await call("/v1/me/service-leads");
    expect(res.status).toBe(401);
  });

  it("GET /v1/me/service-leads returns only the authenticated buyer's leads with provider.category", async () => {
    const pToken = await registerProvider("own-leads");
    const buyerA = await registerBuyer("own-leads-a");
    const buyerB = await registerBuyer("own-leads-b");

    const prof = await call<{ data: { id: string; category: string } }>("/v1/provider/profile", {
      token: pToken,
    });
    const providerId = prof.body.data!.id;

    const leadAId = randomUUID();
    fakeTables.serviceLeads.push({
      id: leadAId,
      serviceProviderId: providerId,
      clientUserId: buyerA.userId,
      clientName: "Buyer A",
      clientPhone: "+2348000000101",
      clientEmail: null,
      source: "directory",
      listingId: null,
      projectId: null,
      bundleId: null,
      serviceRequested: "Legal",
      message: "For A",
      budget: null,
      timeline: null,
      location: "Lagos",
      status: ServiceLeadStatus.pending,
      aiScore: null,
      aiSummary: null,
      quotedAmountKobo: null,
      finalAmountKobo: null,
      respondedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    fakeTables.serviceLeads.push({
      id: randomUUID(),
      serviceProviderId: providerId,
      clientUserId: buyerB.userId,
      clientName: "Buyer B",
      clientPhone: "+2348000000102",
      clientEmail: null,
      source: "directory",
      listingId: null,
      projectId: null,
      bundleId: null,
      serviceRequested: "Legal",
      message: "For B",
      budget: null,
      timeline: null,
      location: "Lagos",
      status: ServiceLeadStatus.pending,
      aiScore: null,
      aiSummary: null,
      quotedAmountKobo: null,
      finalAmountKobo: null,
      respondedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const list = await call("/v1/me/service-leads", { token: buyerA.token });
    expect(list.status).toBe(200);
    const parsed = meServiceLeadsListResponseSchema.safeParse(list.body);
    expect(parsed.success).toBe(true);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]!.id).toBe(leadAId);
    expect(list.body.data[0]!.provider.category).toBe("legal");
    expect(list.body.data[0]!.provider.slug).toBeTruthy();
  });

  it("POST /v1/me/service-leads/:id/review returns 409 when lead is not completed", async () => {
    const pToken = await registerProvider("review-409");
    const buyer = await registerBuyer("review-409");

    const prof = await call<{ data: { id: string } }>("/v1/provider/profile", { token: pToken });
    const providerId = prof.body.data!.id;
    const leadId = randomUUID();

    fakeTables.serviceLeads.push({
      id: leadId,
      serviceProviderId: providerId,
      clientUserId: buyer.userId,
      clientName: "Buyer",
      clientPhone: "+2348000000200",
      clientEmail: null,
      source: "directory",
      listingId: null,
      projectId: null,
      bundleId: null,
      serviceRequested: "Legal",
      message: "Hi",
      budget: null,
      timeline: null,
      location: "Lagos",
      status: ServiceLeadStatus.accepted,
      aiScore: null,
      aiSummary: null,
      quotedAmountKobo: null,
      finalAmountKobo: null,
      respondedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const post = await call<{ error?: { code: string } }>(
      `/v1/me/service-leads/${leadId}/review`,
      {
        method: "POST",
        token: buyer.token,
        body: reviewPayload,
      },
    );
    expect(post.status).toBe(409);
    expect(post.body.error?.code).toBe("LEAD_NOT_COMPLETED");
  });
});
