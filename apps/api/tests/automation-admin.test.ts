import { randomUUID } from "node:crypto";
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

async function login(email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/login", {
    method: "POST",
    body: { email, password: "Password123!" },
  });
  expect(res.status).toBe(200);
  return res.body.data;
}

const extractionFixture = {
  confidence: 0.91,
  property: {
    title: "Automation duplex — whatsapp fixture",
    description: "Seeded extraction payload for Vitest.",
    propertyType: "apartment",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    latitude: 6.43,
    longitude: 3.42,
    bedrooms: 3,
    bathrooms: 3,
    toilets: null,
    squareMeters: 120,
  },
  listing: {
    price: 5_000_000_000,
    priceNegotiable: false,
    isForSale: true,
    isForRent: false,
    rentPeriod: null,
    status: "draft",
  },
};

describe("admin automation (WhatsApp + SEO)", () => {
  it("buyer cannot access WhatsApp review queue (RBAC)", async () => {
    const buyer = await registerUser("buyer", "auto-buyer-rbac@example.test");
    const res = await call("/v1/admin/whatsapp/reviews?page=1&pageSize=10", {
      token: buyer.accessToken,
    });
    expect(res.status).toBe(403);
  });

  it("approves a processed WhatsApp message and creates an active listing", async () => {
    const reg = await registerUser("buyer", "auto-owner@example.test");
    promoteUserToAdmin(reg.user.id);
    const admin = await login("auto-owner@example.test");

    const msgId = randomUUID();
    fakeTables.rawWhatsAppMessages.push({
      id: msgId,
      messageId: `wamid.${msgId.slice(0, 8)}`,
      groupId: null,
      groupName: null,
      senderPhone: "+2348033333333",
      senderName: "Tester",
      messageType: "text",
      textContent: "Seed message",
      mediaUrls: [],
      status: "PROCESSED",
      extractedData: extractionFixture,
      confidenceScore: 0.91,
      extractionError: null,
      processedAt: new Date(),
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      createdListingId: null,
      receivedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const approve = await call<{ data: { listing: { id: string; status: string } } }>(
      `/v1/admin/whatsapp/reviews/${msgId}/approve`,
      { method: "POST", token: admin.accessToken },
    );
    expect(approve.status).toBe(200);
    expect(approve.body.data?.listing.status).toBe("active");
    expect(fakeTables.listings.some((l) => l.id === approve.body.data?.listing.id)).toBe(true);
  });

  it("returns WhatsApp and SEO summaries", async () => {
    const reg = await registerUser("buyer", "summary-admin@example.test");
    promoteUserToAdmin(reg.user.id);
    const admin = await login("summary-admin@example.test");

    fakeTables.rawWhatsAppMessages.push({
      id: randomUUID(),
      messageId: "wamid.summary",
      groupId: null,
      groupName: null,
      senderPhone: "+2348011111111",
      senderName: null,
      messageType: "text",
      textContent: "Hi",
      mediaUrls: [],
      status: "PENDING",
      extractedData: null,
      confidenceScore: null,
      extractionError: null,
      processedAt: null,
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      createdListingId: null,
      receivedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const wa = await call<{ data: { pending: number } }>("/v1/admin/whatsapp/summary", {
      token: admin.accessToken,
    });
    expect(wa.status).toBe(200);
    expect(wa.body.data?.pending).toBeGreaterThanOrEqual(1);

    const seo = await call<{ data: { draft: number } }>("/v1/admin/seo/summary", {
      token: admin.accessToken,
    });
    expect(seo.status).toBe(200);
    expect(typeof seo.body.data?.draft).toBe("number");
  });

  it("approves an SEO variant draft", async () => {
    const reg = await registerUser("buyer", "seo-admin@example.test");
    promoteUserToAdmin(reg.user.id);
    const admin = await login("seo-admin@example.test");

    const listingId = randomUUID();
    const variantId = randomUUID();
    fakeTables.listingSeoVariants.push({
      id: variantId,
      listingId,
      variantType: "luxury",
      seoTitle: "Title",
      metaDescription: "Desc",
      hashtags: [],
      fullCopy: null,
      socialCaption: null,
      tone: null,
      targetAudience: null,
      status: "draft",
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      scheduledAt: null,
      postedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await call<{ data: { status: string } }>(
      `/v1/admin/seo/variants/${variantId}/approve`,
      { method: "POST", token: admin.accessToken },
    );
    expect(res.status).toBe(200);
    expect(res.body.data?.status).toBe("approved");
  });

  it("rejects an SEO variant draft", async () => {
    const reg = await registerUser("buyer", "seo-reject@example.test");
    promoteUserToAdmin(reg.user.id);
    const admin = await login("seo-reject@example.test");

    const variantId = randomUUID();
    fakeTables.listingSeoVariants.push({
      id: variantId,
      listingId: randomUUID(),
      variantType: "standard",
      seoTitle: "Reject me",
      metaDescription: "Desc",
      hashtags: [],
      fullCopy: null,
      socialCaption: null,
      tone: null,
      targetAudience: null,
      status: "draft",
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      scheduledAt: null,
      postedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await call<{ data: { status: string } }>(
      `/v1/admin/seo/variants/${variantId}/reject`,
      { method: "POST", token: admin.accessToken, body: { reason: "Off-brand tone" } },
    );
    expect(res.status).toBe(200);
    expect(res.body.data?.status).toBe("rejected");
  });
});
