import { ServiceLeadStatus } from "@landshoppers/db";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { assertServiceLeadStatusTransition } from "../src/lib/servicehub/lead-status-machine.js";
import { ApiError } from "../src/lib/errors.js";
import { call } from "./helpers/app.js";
import { fakePrisma, fakeTables, resetFakePrisma } from "./helpers/fake-prisma.js";

type AuthEnvelope = {
  data?: { accessToken?: string; user?: { id: string; role: string } };
  error?: { code: string; message: string };
};

async function registerProvider(suffix: string) {
  const res = await call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `sh-c-pro-${suffix}@example.test`,
      password: "Password123!",
      role: "service_provider",
      providerBusinessName: `Provider ${suffix}`,
      providerCategory: "legal",
      providerCity: "Lagos",
      providerState: "Lagos",
    },
  });
  expect(res.status).toBe(201);
  expect(res.body.data?.accessToken).toBeTruthy();
  return res.body.data!.accessToken!;
}

async function registerBuyer(suffix: string) {
  const res = await call<AuthEnvelope>("/v1/auth/register", {
    method: "POST",
    body: {
      email: `sh-c-buy-${suffix}@example.test`,
      password: "Password123!",
      role: "buyer",
    },
  });
  expect(res.status).toBe(201);
  expect(res.body.data?.accessToken).toBeTruthy();
  expect(res.body.data?.user?.id).toBeTruthy();
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

describe("ServiceHub Phase C (lead workflow · buyer reviews)", () => {
  afterEach(() => {
    resetFakePrisma();
  });

  describe("assertServiceLeadStatusTransition", () => {
    it("allows accepted → completed", () => {
      expect(() =>
        assertServiceLeadStatusTransition(ServiceLeadStatus.accepted, ServiceLeadStatus.completed),
      ).not.toThrow();
    });

    it("rejects pending → completed", () => {
      expect(() =>
        assertServiceLeadStatusTransition(ServiceLeadStatus.pending, ServiceLeadStatus.completed),
      ).toThrow(ApiError);
    });
  });

  it("PATCH /v1/provider/leads rejects invalid status jump", async () => {
    const token = await registerProvider("bad-transition");
    const prof = await call<{ data: { id: string } }>("/v1/provider/profile", { token });
    const providerId = prof.body.data.id;

    const lead = await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientName: "Client",
        clientPhone: "+2348000000001",
        source: "directory",
        serviceRequested: "Legal",
        message: "Hi",
        location: "Lagos",
        status: ServiceLeadStatus.pending,
      },
    });

    const patch = await call<{ error?: { code: string } }>(`/v1/provider/leads/${lead.id}`, {
      method: "PATCH",
      token,
      body: { status: ServiceLeadStatus.completed },
    });
    expect(patch.status).toBe(409);
    expect(patch.body.error?.code).toBe("INVALID_LEAD_TRANSITION");
  });

  it("PATCH accepted → completed increments jobs and notifies client", async () => {
    const pToken = await registerProvider("complete-flow");
    const { userId: buyerId, token: bToken } = await registerBuyer("complete-flow");

    const prof = await call<{ data: { id: string; businessName: string } }>("/v1/provider/profile", {
      token: pToken,
    });
    const providerId = prof.body.data.id;

    const lead = await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientUserId: buyerId,
        clientName: "Buyer",
        clientPhone: "+2348000000002",
        source: "directory",
        serviceRequested: "Survey",
        message: "Boundary",
        location: "Ikeja",
        status: ServiceLeadStatus.accepted,
      },
    });

    const before = fakeTables.serviceProviders.find((s) => s.id === providerId)!;
    expect(before.completedJobCount).toBe(0);

    const patch = await call<{ data: { status: string } }>(`/v1/provider/leads/${lead.id}`, {
      method: "PATCH",
      token: pToken,
      body: { status: ServiceLeadStatus.completed },
    });
    expect(patch.status).toBe(200);
    expect(patch.body.data.status).toBe("completed");

    const afterSp = fakeTables.serviceProviders.find((s) => s.id === providerId)!;
    expect(afterSp.completedJobCount).toBe(1);

    const notif = fakeTables.notifications.find((n) => n.userId === buyerId);
    expect(notif).toBeTruthy();
    expect(String(notif!.body ?? "")).toMatch(/review/i);

    const list = await call<{ data: { id: string; status: string }[] }>("/v1/me/service-leads", {
      token: bToken,
    });
    expect(list.status).toBe(200);
    expect(list.body.data.some((r) => r.id === lead.id && r.status === "completed")).toBe(true);
  });

  it("POST /v1/me/service-leads/:id/review creates review and updates provider aggregates", async () => {
    const pToken = await registerProvider("review-flow");
    const { userId: buyerId, token: bToken } = await registerBuyer("review-flow");

    const prof = await call<{ data: { id: string } }>("/v1/provider/profile", { token: pToken });
    const providerId = prof.body.data.id;

    const lead = await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientUserId: buyerId,
        clientName: "Buyer",
        clientPhone: "+2348000000003",
        source: "directory",
        serviceRequested: "Legal",
        message: "Hi",
        location: "Lagos",
        status: ServiceLeadStatus.completed,
      },
    });

    fakeTables.serviceReviews.push({
      id: randomUUID(),
      serviceLeadId: crypto.randomUUID(),
      serviceProviderId: providerId,
      reviewerId: buyerId,
      overallRating: 4,
      qualityRating: 4,
      communicationRating: 4,
      timelinessRating: 4,
      valueRating: 4,
      title: "Prior",
      body: "Earlier review for aggregate",
      isJobVerified: true,
      providerResponse: null,
      createdAt: new Date(),
    });

    const post = await call(`/v1/me/service-leads/${lead.id}/review`, {
      method: "POST",
      token: bToken,
      body: reviewPayload,
    });
    expect(post.status).toBe(201);

    const sp = fakeTables.serviceProviders.find((s) => s.id === providerId)!;
    expect(sp.reviewCount).toBe(2);
    expect(sp.rating).toBe(4.5);

    const dup = await call<{ error?: { code: string } }>(`/v1/me/service-leads/${lead.id}/review`, {
      method: "POST",
      token: bToken,
      body: reviewPayload,
    });
    expect(dup.status).toBe(409);
    expect(dup.body.error?.code).toBe("REVIEW_EXISTS");
  });

  it("POST review rejects when lead is not completed", async () => {
    const pToken = await registerProvider("review-not-done");
    const { userId: buyerId, token: bToken } = await registerBuyer("review-not-done");

    const prof = await call<{ data: { id: string } }>("/v1/provider/profile", { token: pToken });
    const providerId = prof.body.data.id;

    const lead = await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientUserId: buyerId,
        clientName: "Buyer",
        clientPhone: "+2348000000004",
        source: "directory",
        serviceRequested: "Legal",
        message: "Hi",
        location: "Lagos",
        status: ServiceLeadStatus.accepted,
      },
    });

    const post = await call<{ error?: { code: string } }>(`/v1/me/service-leads/${lead.id}/review`, {
      method: "POST",
      token: bToken,
      body: reviewPayload,
    });
    expect(post.status).toBe(409);
    expect(post.body.error?.code).toBe("LEAD_NOT_COMPLETED");
  });
});
