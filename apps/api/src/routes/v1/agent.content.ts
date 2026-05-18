import { randomUUID } from "node:crypto";

import { UserRole } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { postAgentContentGenerateBodySchema } from "../../contracts/agent-content.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAgentOrDeveloper, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const agentContentV1 = new Hono<ApiEnv>();

agentContentV1.use("*", requireAuth, requireAgentOrDeveloper);

function agentAiEnabled(): boolean {
  return process.env["AGENT_AI_INSIGHTS_ENABLED"]?.trim() !== "false";
}

function formatNairaFromKobo(kobo: bigint | number): string {
  const naira = Number(kobo) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

function buildListingContext(input: {
  title: string;
  city: string;
  state: string;
  propertyType: string;
  priceKobo: bigint;
  bedrooms: number | null;
  bathrooms: number | null;
}) {
  const beds =
    input.bedrooms != null ? `${input.bedrooms} bed` : null;
  const baths =
    input.bathrooms != null ? `${input.bathrooms} bath` : null;
  const specs = [beds, baths].filter(Boolean).join(" · ");
  const price = formatNairaFromKobo(input.priceKobo);
  return {
    headline: input.title,
    location: `${input.city}, ${input.state}`,
    typeLabel: input.propertyType.replace(/_/g, " "),
    specs,
    price,
  };
}

agentContentV1.post(
  "/generate",
  zValidator("json", postAgentContentGenerateBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    if (!agentAiEnabled()) {
      throw new ApiError(
        403,
        "FEATURE_DISABLED",
        "Agent content studio is disabled. Set AGENT_AI_INSIGHTS_ENABLED=true on the API.",
      );
    }

    const body = c.req.valid("json");

    let headline = "your next listing";
    let location = "Nigeria";
    let typeLabel = "property";
    let specs = "";
    let price = "";

    if (body.listingId) {
      const listing = await prisma.listing.findFirst({
        where: { id: body.listingId, userId: auth.id, deletedAt: null },
        include: { property: true },
      });
      if (!listing) {
        throw new ApiError(404, "NOT_FOUND", "Listing not found");
      }
      const p = listing.property;
      const ctx = buildListingContext({
        title: p.title,
        city: p.city,
        state: p.state,
        propertyType: p.propertyType,
        priceKobo: listing.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
      });
      headline = ctx.headline;
      location = ctx.location;
      typeLabel = ctx.typeLabel;
      specs = ctx.specs;
      price = ctx.price;
    } else if (auth.role === UserRole.agent) {
      const agent = await prisma.agent.findFirst({
        where: { userId: auth.id, deletedAt: null },
      });
      if (agent) {
        headline = agent.agencyName ?? "your agency listing";
      }
    }

    const tone = body.tone === "friendly" ? "friendly" : "professional";
    const intro =
      tone === "friendly"
        ? `Discover ${headline} — a ${typeLabel} in ${location}${specs ? ` (${specs})` : ""}${price ? ` from ${price}` : ""}.`
        : `Presenting ${headline}: ${typeLabel} in ${location}${specs ? ` · ${specs}` : ""}${price ? ` · ${price}` : ""}.`;

    let description: string | null = null;
    let captions: Array<{ id: string; platform: string; text: string }> = [];
    let mediaBrief: string | null = null;

    if (body.kind === "description") {
      description = `${intro}\n\nKey highlights: prime ${location} location, verified on LandShoppers, and ready for serious buyers. Schedule a tour to experience the space in person or virtually.`;
    }

    if (body.kind === "captions") {
      captions = [
        {
          id: randomUUID(),
          platform: "instagram",
          text: `${intro} DM us to book a viewing on LandShoppers.`,
        },
        {
          id: randomUUID(),
          platform: "linkedin",
          text: `${intro} Listed on LandShoppers — message for details.`,
        },
        {
          id: randomUUID(),
          platform: "whatsapp",
          text: `${intro} Reply to schedule a tour this week.`,
        },
      ];
    }

    if (body.kind === "media_brief") {
      mediaBrief = [
        `Shot list for ${headline}`,
        `• Exterior / street context — ${location}`,
        specs ? `• Living areas — emphasize ${specs}` : "• Living areas — natural light, wide angles",
        price ? `• Overlay end card with ${price} and LandShoppers badge` : "• End card with LandShoppers badge",
        "• 15s vertical cut for Reels; 45s walkthrough for YouTube",
      ].join("\n");
    }

    return c.json({
      data: {
        description,
        captions,
        mediaBrief,
        disclaimer:
          "Template drafts only — full LLM + SEO variant pipeline ships when the AI service is wired in production.",
      },
    });
  },
);
