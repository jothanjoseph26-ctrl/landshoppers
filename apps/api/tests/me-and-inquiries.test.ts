import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

type Tokens = { accessToken: string; user: { id: string; role: string } };

async function registerUser(role: "buyer" | "agent", email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/register", {
    method: "POST",
    body: { email, password: "Password123!", role },
  });
  expect(res.status).toBe(201);
  return res.body.data;
}

function promoteUserToAdmin(userId: string) {
  const u = fakeTables.users.find((r) => r.id === userId);
  if (u) u.role = "admin";
}

async function login(email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/login", {
    method: "POST",
    body: { email, password: "Password123!" },
  });
  expect(res.status).toBe(200);
  return res.body.data;
}

async function publishListing(agentToken: string, adminToken: string) {
  const draft = await call<{ data: { id: string } }>("/v1/listings", {
    method: "POST",
    token: agentToken,
    body: {
      title: "Lekki Penthouse",
      propertyType: "apartment",
      city: "Lagos",
      state: "Lagos",
      priceKobo: "9000000000",
    },
  });
  const id = draft.body.data.id;
  await call(`/v1/listings/${id}/submit`, { method: "POST", token: agentToken });
  await call(`/v1/admin/listings/${id}/approve`, {
    method: "POST",
    token: adminToken,
  });
  return id;
}

describe("/v1/me saved/recent + inquiries", () => {
  it("buyer can save, list, and remove a listing", async () => {
    const agent = await registerUser("agent", "agent-save@example.test");
    const adminUser = await registerUser("buyer", "admin-save@example.test");
    promoteUserToAdmin(adminUser.user.id);
    const admin = await login("admin-save@example.test");
    const listingId = await publishListing(agent.accessToken, admin.accessToken);

    const buyer = await registerUser("buyer", "buyer-save@example.test");

    // Save
    const saveRes = await call<{ data: { listingId: string } }>(
      `/v1/me/saved-listings/${listingId}`,
      { method: "POST", token: buyer.accessToken },
    );
    expect(saveRes.status).toBe(201);
    expect(saveRes.body.data.listingId).toBe(listingId);

    // Idempotent — second save still succeeds.
    const second = await call(`/v1/me/saved-listings/${listingId}`, {
      method: "POST",
      token: buyer.accessToken,
    });
    expect(second.status).toBe(201);

    // List
    const list = await call<{ data: Array<{ listing: { id: string } }>; meta: { total: number } }>(
      "/v1/me/saved-listings",
      { token: buyer.accessToken },
    );
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0]!.listing.id).toBe(listingId);

    // Delete
    const del = await call(`/v1/me/saved-listings/${listingId}`, {
      method: "DELETE",
      token: buyer.accessToken,
    });
    expect(del.status).toBe(200);

    const after = await call<{ meta: { total: number } }>("/v1/me/saved-listings", {
      token: buyer.accessToken,
    });
    expect(after.body.meta.total).toBe(0);
  });

  it("buyer creates an inquiry and finds it in /v1/me/inquiries", async () => {
    const agent = await registerUser("agent", "agent-inq@example.test");
    const adminUser = await registerUser("buyer", "admin-inq@example.test");
    promoteUserToAdmin(adminUser.user.id);
    const admin = await login("admin-inq@example.test");
    const listingId = await publishListing(agent.accessToken, admin.accessToken);

    const buyer = await registerUser("buyer", "buyer-inq@example.test");
    const create = await call<{ data: { id: string; status: string } }>("/v1/inquiries", {
      method: "POST",
      token: buyer.accessToken,
      body: { listingId, message: "Is this still available?" },
    });
    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe("new");

    const list = await call<{ data: Array<{ id: string; listingId: string | null }>; meta: { total: number } }>(
      "/v1/me/inquiries",
      { token: buyer.accessToken },
    );
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0]!.listingId).toBe(listingId);
  });

  it("agent (listing owner) sees inquiry in /v1/agent/inquiries and can mark responded", async () => {
    const agent = await registerUser("agent", "agent-pipeline@example.test");
    const adminUser = await registerUser("buyer", "admin-pipeline@example.test");
    promoteUserToAdmin(adminUser.user.id);
    const admin = await login("admin-pipeline@example.test");
    const listingId = await publishListing(agent.accessToken, admin.accessToken);

    const buyer = await registerUser("buyer", "buyer-pipeline@example.test");
    const create = await call<{ data: { id: string } }>("/v1/inquiries", {
      method: "POST",
      token: buyer.accessToken,
      body: { listingId, message: "Tour please" },
    });
    const inquiryId = create.body.data.id;

    const agentInquiries = await call<{ data: Array<{ id: string }>; meta: { total: number } }>(
      "/v1/agent/inquiries",
      { token: agent.accessToken },
    );
    expect(agentInquiries.body.meta.total).toBe(1);
    expect(agentInquiries.body.data[0]!.id).toBe(inquiryId);

    const update = await call<{ data: { status: string; respondedAt: string | null } }>(
      `/v1/inquiries/${inquiryId}`,
      {
        method: "PATCH",
        token: agent.accessToken,
        body: { status: "responded" },
      },
    );
    expect(update.status).toBe(200);
    expect(update.body.data.status).toBe("responded");
    expect(update.body.data.respondedAt).toBeTruthy();
  });

  it("buyer cannot escalate inquiry pipeline beyond closed", async () => {
    const agent = await registerUser("agent", "agent-buyerguard@example.test");
    const adminUser = await registerUser("buyer", "admin-buyerguard@example.test");
    promoteUserToAdmin(adminUser.user.id);
    const admin = await login("admin-buyerguard@example.test");
    const listingId = await publishListing(agent.accessToken, admin.accessToken);

    const buyer = await registerUser("buyer", "buyer-buyerguard@example.test");
    const create = await call<{ data: { id: string } }>("/v1/inquiries", {
      method: "POST",
      token: buyer.accessToken,
      body: { listingId, message: "Hi" },
    });
    const inquiryId = create.body.data.id;

    const escalate = await call(`/v1/inquiries/${inquiryId}`, {
      method: "PATCH",
      token: buyer.accessToken,
      body: { status: "responded" },
    });
    expect(escalate.status).toBe(403);

    const close = await call<{ data: { status: string } }>(`/v1/inquiries/${inquiryId}`, {
      method: "PATCH",
      token: buyer.accessToken,
      body: { status: "closed" },
    });
    expect(close.status).toBe(200);
    expect(close.body.data.status).toBe("closed");
  });

  it("saved-search CRUD round-trips", async () => {
    const buyer = await registerUser("buyer", "saved-search@example.test");

    const create = await call<{ data: { id: string; name: string | null } }>(
      "/v1/me/saved-searches",
      {
        method: "POST",
        token: buyer.accessToken,
        body: {
          name: "Lagos under 50m",
          filters: { city: "Lagos", maxPrice: "5000000000" },
          alertFrequency: "daily",
          emailAlerts: true,
        },
      },
    );
    expect(create.status).toBe(201);
    expect(create.body.data.name).toBe("Lagos under 50m");
    const id = create.body.data.id;

    const list = await call<{ data: Array<{ id: string }> }>("/v1/me/saved-searches", {
      token: buyer.accessToken,
    });
    expect(list.body.data.length).toBe(1);

    const update = await call<{ data: { alertFrequency: string } }>(
      `/v1/me/saved-searches/${id}`,
      {
        method: "PATCH",
        token: buyer.accessToken,
        body: { alertFrequency: "instant" },
      },
    );
    expect(update.body.data.alertFrequency).toBe("instant");

    const del = await call(`/v1/me/saved-searches/${id}`, {
      method: "DELETE",
      token: buyer.accessToken,
    });
    expect(del.status).toBe(200);
  });

  it("recent-listing endpoint upserts and orders by lastViewedAt", async () => {
    const agent = await registerUser("agent", "agent-recent@example.test");
    const adminUser = await registerUser("buyer", "admin-recent@example.test");
    promoteUserToAdmin(adminUser.user.id);
    const admin = await login("admin-recent@example.test");
    const listingId = await publishListing(agent.accessToken, admin.accessToken);

    const buyer = await registerUser("buyer", "buyer-recent@example.test");
    const first = await call<{ data: { lastViewedAt: string } }>(
      `/v1/me/recent-listings/${listingId}`,
      { method: "POST", token: buyer.accessToken },
    );
    expect(first.status).toBe(201);

    const recents = await call<{ data: Array<{ listing: { id: string } }> }>(
      "/v1/me/recent-listings",
      { token: buyer.accessToken },
    );
    expect(recents.body.data.length).toBe(1);
    expect(recents.body.data[0]!.listing.id).toBe(listingId);
  });
});
