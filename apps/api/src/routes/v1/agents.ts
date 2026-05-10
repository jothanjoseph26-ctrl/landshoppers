import { ListingStatus } from "@landshoppers/db";
import type { Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { agentIdParamSchema, listAgentsQuerySchema } from "../../contracts/agents.js";
import { offsetFromPage } from "../../contracts/common.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { listingToJson } from "../../lib/serialize/listing.js";
import type { ApiEnv } from "../../types/env.js";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80";

function displayName(
  profile: { firstName: string | null; lastName: string | null } | null,
  agencyName: string | null,
  email: string,
): string {
  const n = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  if (n.length > 0) return n;
  if (agencyName?.trim()) return agencyName.trim();
  return email.split("@")[0] ?? "Agent";
}

function whatsappDigits(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function parseSocial(raw: unknown): {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
} {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : undefined);
  return {
    facebook: str("facebook"),
    twitter: str("twitter"),
    instagram: str("instagram"),
    linkedin: str("linkedin"),
  };
}

function summarizeAgent(
  row: Prisma.AgentGetPayload<{ include: { user: { include: { profile: true } } } }>,
) {
  const p = row.user.profile;
  const name = displayName(p, row.agencyName, row.user.email);
  const phone = row.user.phone ?? "";
  const wa = whatsappDigits(row.user.phone);

  return {
    id: row.id,
    slug: row.id,
    name,
    company: row.agencyName ?? "",
    image: p?.avatarUrl ?? PLACEHOLDER_IMG,
    phone: phone || "—",
    whatsapp: wa || whatsappDigits(phone) || "",
    city: p?.city ?? "—",
    specializations: row.specializations ?? [],
    isVerified: row.isVerified,
    rating: row.rating,
    reviewCount: row.reviewCount,
    totalListings: row.totalListings,
    totalSales: row.totalSales,
    yearsOfExperience: row.yearsOfExperience,
  };
}

export const agentsV1 = new Hono<ApiEnv>();

agentsV1.get("/", zValidator("query", listAgentsQuerySchema), async (c) => {
  const { page, pageSize, city, q } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where: Prisma.AgentWhereInput = {
    deletedAt: null,
    user: {
      deletedAt: null,
      ...(city
        ? {
            profile: {
              city: { equals: city, mode: "insensitive" },
            },
          }
        : {}),
    },
    ...(q
      ? {
          OR: [
            { agencyName: { contains: q, mode: "insensitive" } },
            {
              user: {
                email: { contains: q, mode: "insensitive" },
              },
            },
            {
              user: {
                profile: {
                  OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.agent.count({ where }),
    prisma.agent.findMany({
      where,
      include: { user: { include: { profile: true } } },
      skip,
      take: pageSize,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    }),
  ]);

  return c.json({
    data: rows.map(summarizeAgent),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

agentsV1.get("/:id", zValidator("param", agentIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");

  const row = await prisma.agent.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { include: { profile: true } },
      listings: {
        where: {
          deletedAt: null,
          status: ListingStatus.active,
        },
        take: 24,
        orderBy: { createdAt: "desc" },
        include: { property: true },
      },
    },
  });

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Agent not found");
  }

  const p = row.user.profile;
  const name = displayName(p, row.agencyName, row.user.email);
  const phone = row.user.phone ?? "";
  const wa = whatsappDigits(row.user.phone);

  const reviews = await prisma.review.findMany({
    where: { agentId: row.id, isPublished: true },
    include: { author: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const socialLinks = parseSocial(row.socialLinks);

  return c.json({
    data: {
      ...summarizeAgent(row),
      email: row.user.email,
      state: p?.state ?? "",
      address:
        p?.address ??
        (([p?.city, p?.state].filter(Boolean).join(", ") || "—")),
      bio:
        p?.bio?.trim() ||
        "This agent has not added a bio yet.",
      joinedAt: row.user.createdAt.toISOString(),
      languages: [] as string[],
      certifications: [] as string[],
      socialLinks,
      listings: row.listings.map((l) => listingToJson(l)),
      reviews: reviews.map((r) => ({
        id: r.id,
        author: displayName(r.author.profile, null, r.author.email),
        avatar: r.author.profile?.avatarUrl ?? PLACEHOLDER_IMG,
        rating: r.rating,
        date: r.createdAt.toISOString(),
        content: r.content ?? "",
      })),
    },
  });
});
