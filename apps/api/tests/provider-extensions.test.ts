import { describe, expect, it } from "vitest";

import { providerAnalyticsSummarySchema } from "../src/contracts/provider-analytics.js";
import { providerJobRowSchema } from "../src/contracts/provider-jobs.js";
import { providerSettingsSchema } from "../src/contracts/provider-settings.js";
import { providerSubscriptionSchema } from "../src/contracts/provider-subscription.js";
import { call } from "./helpers/app.js";
import { fakePrisma, fakeTables } from "./helpers/fake-prisma.js";

type AuthEnvelope = {
  data?: { accessToken?: string };
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
  return res.body.data!.accessToken!;
}

describe("Provider PRV extensions (jobs, settings, subscription, analytics)", () => {
  it("GET /provider/jobs lists job-pipeline leads only", async () => {
    const token = await registerProvider("prv-jobs");
    const prof = await call<{ data: { id: string } }>("/v1/provider/profile", { token });
    const providerId = prof.body.data.id;

    await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientName: "Job Client",
        clientPhone: "+2348000000099",
        source: "directory",
        serviceRequested: "Survey",
        message: "Job pipeline",
        location: "Lekki",
        status: "quoted",
      },
    });
    await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientName: "Inbox Only",
        clientPhone: "+2348000000100",
        source: "directory",
        serviceRequested: "Title",
        message: "Still pending",
        location: "Ikeja",
        status: "pending",
      },
    });

    const list = await call<{ data: unknown[]; meta: { total: number } }>(
      "/v1/provider/jobs?page=1&pageSize=20",
      { token },
    );
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(1);
    const parsed = providerJobRowSchema.safeParse(list.body.data[0]);
    expect(parsed.success).toBe(true);
  });

  it("PATCH /provider/settings toggles notifyEmail", async () => {
    const token = await registerProvider("prv-settings");

    const get0 = await call<{ data: unknown }>("/v1/provider/settings", { token });
    expect(get0.status).toBe(200);
    expect(providerSettingsSchema.safeParse(get0.body.data).success).toBe(true);

    const patch = await call<{ data: { notifyEmail: boolean } }>("/v1/provider/settings", {
      method: "PATCH",
      token,
      body: { notifyEmail: false },
    });
    expect(patch.status).toBe(200);
    expect(patch.body.data.notifyEmail).toBe(false);
  });

  it("GET /provider/subscription returns tier + usage", async () => {
    const token = await registerProvider("prv-sub");
    const res = await call<{ data: unknown }>("/v1/provider/subscription", { token });
    expect(res.status).toBe(200);
    const parsed = providerSubscriptionSchema.safeParse(res.body.data);
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.format())).toBe(true);
    expect(parsed.data?.tier).toBe("free");
  });

  it("POST /provider/subscription/checkout upgrades tier when Paystack unset", async () => {
    const token = await registerProvider("prv-sub-checkout");
    const res = await call<{ data: { mode: string; tier: string } }>("/v1/provider/subscription/checkout", {
      method: "POST",
      token,
      body: { tier: "pro" },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe("stub_direct");
    expect(res.body.data.tier).toBe("pro");
  });

  it("GET /provider/analytics/summary matches contract", async () => {
    const token = await registerProvider("prv-analytics");
    const res = await call<{ data: unknown }>("/v1/provider/analytics/summary?period=month", { token });
    expect(res.status).toBe(200);
    const parsed = providerAnalyticsSummarySchema.safeParse(res.body.data);
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.format())).toBe(true);
    expect(parsed.data?.analyticsDepth).toBe("basic");
  });

  it("PATCH /provider/whatsapp returns 403 on free tier", async () => {
    const token = await registerProvider("prv-wa-gate");
    const res = await call<{ error: { code: string } }>("/v1/provider/whatsapp", {
      method: "PATCH",
      token,
      body: { connected: true, phoneNumber: "+2348012345678" },
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FEATURE_GATED");
  });

  it("PATCH /provider/reviews/:id sets providerResponse", async () => {
    const token = await registerProvider("prv-reviews");
    const prof = await call<{ data: { id: string } }>("/v1/provider/profile", { token });
    const providerId = prof.body.data.id;
    const user = fakeTables.users.find((u) => u.email === "prv-reviews@example.test");
    expect(user).toBeTruthy();

    const lead = await fakePrisma.serviceLead.create({
      data: {
        serviceProviderId: providerId,
        clientUserId: user!.id,
        clientName: "Reviewer",
        clientPhone: "+2348000000200",
        source: "directory",
        serviceRequested: "Legal",
        message: "Done",
        location: "Abuja",
        status: "completed",
      },
    });

    const review = await fakePrisma.serviceReview.create({
      data: {
        serviceLeadId: lead.id,
        serviceProviderId: providerId,
        reviewerId: user!.id,
        overallRating: 5,
        qualityRating: 5,
        communicationRating: 5,
        timelinessRating: 5,
        valueRating: 5,
        title: "Great work",
        body: "Highly recommend.",
        isJobVerified: true,
      },
    });

    const patch = await call<{ data: { providerResponse: string } }>(
      `/v1/provider/reviews/${review.id}`,
      {
        method: "PATCH",
        token,
        body: { providerResponse: "Thank you for the kind review!" },
      },
    );
    expect(patch.status).toBe(200);
    expect(patch.body.data.providerResponse).toContain("Thank you");
  });
});
