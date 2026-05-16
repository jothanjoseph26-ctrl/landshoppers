import { Hono } from "hono";

import { whatsappWebhookBodySchema } from "../../contracts/whatsapp.js";
import { ApiError } from "../../lib/errors.js";
import { enqueueWhatsAppExtraction } from "../../lib/jobs/enqueue-whatsapp-extraction.js";
import { enqueueServicehubWhatsAppLead } from "../../lib/jobs/enqueue-servicehub-whatsapp-lead.js";
import { prisma } from "../../lib/prisma.js";
import { verifyWebhookSignature } from "../../lib/whatsapp-signature.js";
import type { ApiEnv } from "../../types/env.js";

export const whatsappPublicV1 = new Hono<ApiEnv>();

whatsappPublicV1.post("/webhook", async (c) => {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const raw = await c.req.text();
  const sig = c.req.header("X-Landshoppers-Signature") ?? c.req.header("x-landshoppers-signature");
  if (!verifyWebhookSignature(raw, sig, secret)) {
    throw new ApiError(401, "INVALID_SIGNATURE", "Webhook signature verification failed");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be JSON");
  }

  const body = whatsappWebhookBodySchema.parse(parsed);

  const row = await prisma.rawWhatsAppMessage.upsert({
    where: { messageId: body.messageId },
    create: {
      messageId: body.messageId,
      groupId: body.groupId ?? null,
      groupName: body.groupName ?? null,
      senderPhone: body.senderPhone,
      senderName: body.senderName ?? null,
      messageType: body.messageType,
      textContent: body.textContent ?? null,
      mediaUrls: body.mediaUrls ?? [],
    },
    update: {
      groupId: body.groupId ?? null,
      groupName: body.groupName ?? null,
      senderName: body.senderName ?? null,
      messageType: body.messageType,
      textContent: body.textContent ?? null,
      mediaUrls: body.mediaUrls ?? [],
    },
  });

  await enqueueWhatsAppExtraction({
    rawMessageId: row.id,
    messageId: body.messageId,
    textContent: body.textContent,
    mediaUrls: body.mediaUrls ?? [],
    senderPhone: body.senderPhone,
    senderName: body.senderName,
    groupId: body.groupId,
    groupName: body.groupName,
  });

  if (process.env["SERVICEHUB_WHATSAPP_AUTO_LEAD"] === "true") {
    await enqueueServicehubWhatsAppLead({
      rawMessageId: row.id,
      messageId: body.messageId,
      textContent: body.textContent,
      mediaUrls: body.mediaUrls ?? [],
      senderPhone: body.senderPhone,
      senderName: body.senderName,
      groupId: body.groupId,
      groupName: body.groupName,
    });
  }

  return c.json(
    {
      data: {
        id: row.id,
        messageId: row.messageId,
        status: row.status,
      },
    },
    201,
  );
});
