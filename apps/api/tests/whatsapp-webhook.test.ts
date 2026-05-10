import { createHmac, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

async function postRaw(
  path: string,
  rawBody: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: unknown }> {
  const res = await app.fetch(
    new Request(`http://test.local${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: rawBody,
    }),
  );
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

describe("whatsapp webhook", () => {
  beforeEach(() => {
    process.env.WHATSAPP_WEBHOOK_SECRET = "webhook-test-secret";
  });

  afterEach(() => {
    delete process.env.WHATSAPP_WEBHOOK_SECRET;
  });

  it("rejects requests when HMAC is wrong", async () => {
    const raw = JSON.stringify({
      messageId: "wa-invalid-sig",
      senderPhone: "+2348011111111",
      messageType: "text",
      textContent: "hello",
    });
    const res = await postRaw("/v1/whatsapp/webhook", raw, {
      "X-Landshoppers-Signature": "sha256=deadbeef",
    });
    expect(res.status).toBe(401);
    expect(fakeTables.rawWhatsAppMessages.length).toBe(0);
  });

  it("persists a raw message when signature matches", async () => {
    const raw = JSON.stringify({
      messageId: `wa-valid-${randomUUID()}`,
      senderPhone: "+2348022222222",
      messageType: "text",
      textContent: "4 bed duplex Ikoyi",
    });
    const sig =
      "sha256=" +
      createHmac("sha256", process.env.WHATSAPP_WEBHOOK_SECRET!).update(raw).digest("hex");
    const res = await postRaw("/v1/whatsapp/webhook", raw, {
      "X-Landshoppers-Signature": sig,
    });
    expect(res.status).toBe(201);
    expect(fakeTables.rawWhatsAppMessages.length).toBe(1);
    expect(fakeTables.rawWhatsAppMessages[0]?.messageId).toContain("wa-valid-");
  });
});
