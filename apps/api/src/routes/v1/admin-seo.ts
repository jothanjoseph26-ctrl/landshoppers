import { SeoVariantStatus } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { offsetFromPage, paginationQuerySchema } from "../../contracts/common.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const adminSeoV1 = new Hono<ApiEnv>();

adminSeoV1.use("*", requireAuth, requireAdmin);

const variantsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(SeoVariantStatus).optional(),
});

const variantIdParamSchema = z.object({
  id: z.string().uuid(),
});

function variantToJson(row: {
  id: string;
  listingId: string;
  variantType: string;
  seoTitle: string | null;
  metaDescription: string | null;
  hashtags: string[];
  status: SeoVariantStatus;
  approvedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    listingId: row.listingId,
    variantType: row.variantType,
    seoTitle: row.seoTitle,
    metaDescription: row.metaDescription,
    hashtags: row.hashtags,
    status: row.status,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

adminSeoV1.get("/variants", zValidator("query", variantsQuerySchema), async (c) => {
  const { page, pageSize, status } = c.req.valid("query");
  const skip = offsetFromPage(page, pageSize);

  const where =
    status !== undefined ? { status } : { status: SeoVariantStatus.draft };

  const [total, rows] = await Promise.all([
    prisma.listingSeoVariant.count({ where }),
    prisma.listingSeoVariant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return c.json({
    data: rows.map(variantToJson),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

adminSeoV1.post(
  "/variants/:id/approve",
  zValidator("param", variantIdParamSchema),
  async (c) => {
    const authUser = c.get("authUser");
    if (!authUser) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

    const { id } = c.req.valid("param");

    const current = await prisma.listingSeoVariant.findFirst({ where: { id } });
    if (!current) throw new ApiError(404, "NOT_FOUND", "SEO variant not found");

    if (current.status !== SeoVariantStatus.draft) {
      throw new ApiError(
        409,
        "INVALID_STATE",
        `Cannot approve variant in status ${current.status}`,
      );
    }

    const now = new Date();
    const row = await prisma.listingSeoVariant.update({
      where: { id },
      data: {
        status: SeoVariantStatus.approved,
        approvedAt: now,
        approvedBy: authUser.id,
      },
    });

    return c.json({ data: variantToJson(row) });
  },
);
