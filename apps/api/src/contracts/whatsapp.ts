import { z } from "zod";

/** POST /v1/whatsapp/webhook — Evolution-style ingestion payload. */
export const whatsappWebhookBodySchema = z.object({
  messageId: z.string().min(1),
  senderPhone: z.string().min(3),
  messageType: z.string().min(1),
  textContent: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  senderName: z.string().optional(),
  groupId: z.string().optional(),
  groupName: z.string().optional(),
});

export type WhatsAppWebhookBody = z.infer<typeof whatsappWebhookBodySchema>;
