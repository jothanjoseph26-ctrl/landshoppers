import { z } from "zod";

export const postProviderContentGenerateBodySchema = z.object({
  leadId: z.string().uuid().optional(),
  category: z.string().max(64).optional(),
  tone: z.enum(["professional", "friendly"]).default("professional"),
});

export const providerContentGenerateResultSchema = z.object({
  captions: z.array(
    z.object({
      id: z.string(),
      platform: z.string(),
      text: z.string(),
    }),
  ),
  disclaimer: z.string(),
});
