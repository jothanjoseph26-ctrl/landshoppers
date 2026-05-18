import { z } from "zod";

export const postAgentContentGenerateBodySchema = z.object({
  listingId: z.string().uuid().optional(),
  kind: z.enum(["description", "captions", "media_brief"]).default("captions"),
  tone: z.enum(["professional", "friendly"]).default("professional"),
});

export const agentContentCaptionSchema = z.object({
  id: z.string(),
  platform: z.string(),
  text: z.string(),
});

export const agentContentGenerateResultSchema = z.object({
  description: z.string().nullable(),
  captions: z.array(agentContentCaptionSchema),
  mediaBrief: z.string().nullable(),
  disclaimer: z.string(),
});
