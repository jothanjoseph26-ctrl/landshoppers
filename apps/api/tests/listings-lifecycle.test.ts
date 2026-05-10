import { describe, expect, it } from "vitest";

import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

type Tokens = { accessToken: string; user: { id: string; role: string } };

async function registerUser(role: "buyer" | "agent" | "developer", email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/register", {
    method: "POST",
    body: { email, password: "Password123!", role },
  });
  expect(res.status).toBe(201);
  return res.body.data;
}

function promoteUserToAdmin(userId: string) {
  const user = fakeTables.users.find((u) => u.id === userId);
  if (user) user.role = "admin";
}

async function loginAfterRoleChange(email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/login", {
    method: "POST",
    body: { email, password: "Password123!" },
  });
  expect(res.status).toBe(200);
  return res.body.data;
}

const baseListingBody = {
  title: "Test 3 Bedroom Flat",
  description: "Seed",
  propertyType: "apartment",
  city: "Lagos",
  state: "Lagos",
  priceKobo: "5000000000",
  isForSale: true,
  isForRent: false,
};

describe("listings lifecycle + RBAC", () => {
  it("buyer cannot create a listing (RBAC denial)", async () => {
    const buyer = await registerUser("buyer", "rbac-buyer@example.test");
    const res = await call("/v1/listings", {
      method: "POST",
      token: buyer.accessToken,
      body: baseListingBody,
    });
    expect(res.status).toBe(403);
  });

  it("agent can draft, submit, and admin can approve", async () => {
    const agent = await registerUser("agent", "agent-life@example.test");

    const draftRes = await call<{ data: { id: string; status: string } }>(
      "/v1/listings",
      { method: "POST", token: agent.accessToken, body: baseListingBody },
    );
    expect(draftRes.status).toBe(201);
    expect(draftRes.body.data.status).toBe("draft");
    const listingId = draftRes.body.data.id;

    const submit = await call<{ data: { status: string; submittedAt: string | null } }>(
      `/v1/listings/${listingId}/submit`,
      { method: "POST", token: agent.accessToken },
    );
    expect(submit.status).toBe(200);
    expect(submit.body.data.status).toBe("pending_review");
    expect(submit.body.data.submittedAt).toBeTruthy();

    // Promote a separate account to admin and exercise approval.
    const admin = await registerUser("buyer", "admin-flow@example.test");
    promoteUserToAdmin(admin.user.id);
    const adminTokens = await loginAfterRoleChange("admin-flow@example.test");

    const approve = await call<{ data: { status: string; approvedAt: string | null } }>(
      `/v1/admin/listings/${listingId}/approve`,
      { method: "POST", token: adminTokens.accessToken },
    );
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe("active");
    expect(approve.body.data.approvedAt).toBeTruthy();

    // Public list should now include the listing.
    const publicList = await call<{ data: Array<{ id: string }> }>("/v1/listings");
    expect(publicList.body.data.some((l) => l.id === listingId)).toBe(true);
  });

  it("admin can reject with a reason and owner edits reset to draft", async () => {
    const agent = await registerUser("agent", "agent-reject@example.test");
    const draft = await call<{ data: { id: string } }>("/v1/listings", {
      method: "POST",
      token: agent.accessToken,
      body: baseListingBody,
    });
    const listingId = draft.body.data.id;

    await call(`/v1/listings/${listingId}/submit`, {
      method: "POST",
      token: agent.accessToken,
    });

    const admin = await registerUser("buyer", "admin-reject@example.test");
    promoteUserToAdmin(admin.user.id);
    const adminTokens = await loginAfterRoleChange("admin-reject@example.test");

    const reject = await call<{ data: { status: string; rejectionReason: string | null } }>(
      `/v1/admin/listings/${listingId}/reject`,
      {
        method: "POST",
        token: adminTokens.accessToken,
        body: { reason: "Pricing looks off" },
      },
    );
    expect(reject.status).toBe(200);
    expect(reject.body.data.status).toBe("rejected");
    expect(reject.body.data.rejectionReason).toBe("Pricing looks off");

    // Editing a rejected listing reopens it as draft.
    const edit = await call<{ data: { status: string; rejectionReason: string | null } }>(
      `/v1/listings/${listingId}`,
      {
        method: "PATCH",
        token: agent.accessToken,
        body: { priceKobo: "4500000000" },
      },
    );
    expect(edit.status).toBe(200);
    expect(edit.body.data.status).toBe("draft");
    expect(edit.body.data.rejectionReason).toBeNull();
  });

  it("non-owner agent cannot edit another agent's listing", async () => {
    const a1 = await registerUser("agent", "agent-a@example.test");
    const a2 = await registerUser("agent", "agent-b@example.test");
    const draft = await call<{ data: { id: string } }>("/v1/listings", {
      method: "POST",
      token: a1.accessToken,
      body: baseListingBody,
    });
    const listingId = draft.body.data.id;

    const forbidden = await call(`/v1/listings/${listingId}`, {
      method: "PATCH",
      token: a2.accessToken,
      body: { priceKobo: "1" },
    });
    expect(forbidden.status).toBe(403);
  });

  it("owner soft-deletes a listing and it disappears from public list", async () => {
    const agent = await registerUser("agent", "agent-del@example.test");
    const draft = await call<{ data: { id: string } }>("/v1/listings", {
      method: "POST",
      token: agent.accessToken,
      body: baseListingBody,
    });
    const listingId = draft.body.data.id;

    const del = await call(`/v1/listings/${listingId}`, {
      method: "DELETE",
      token: agent.accessToken,
    });
    expect(del.status).toBe(200);

    const get = await call(`/v1/listings/${listingId}`);
    expect(get.status).toBe(404);
  });

  it("non-admin cannot directly mutate listing status via /status", async () => {
    const agent = await registerUser("agent", "agent-status@example.test");
    const draft = await call<{ data: { id: string } }>("/v1/listings", {
      method: "POST",
      token: agent.accessToken,
      body: baseListingBody,
    });
    const id = draft.body.data.id;

    const res = await call(`/v1/listings/${id}/status`, {
      method: "POST",
      token: agent.accessToken,
      body: { status: "active" },
    });
    expect(res.status).toBe(403);
  });
});
