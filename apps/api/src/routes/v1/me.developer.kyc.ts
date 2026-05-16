import { DeveloperKycDocumentStatus, type Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  createDeveloperKycDocumentBodySchema,
  kycDocumentIdParamSchema,
  listDeveloperKycDocumentsQuerySchema,
  patchDeveloperKycDocumentBodySchema,
} from "../../contracts/developer-kyc.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireDeveloper } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const meDeveloperKycV1 = new Hono<ApiEnv>();

meDeveloperKycV1.use("*", requireAuth, requireDeveloper);

async function developerForUser(userId: string) {
  const row = await prisma.developer.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Developer profile not found for this account");
  }
  return row;
}

function docToJson(row: {
  id: string;
  developerId: string;
  projectId: string | null;
  documentType: string;
  status: string;
  title: string | null;
  fileName: string;
  mimeType: string;
  byteSize: number;
  storageKey: string | null;
  externalUrl: string;
  rejectionReason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    developerId: row.developerId,
    projectId: row.projectId,
    documentType: row.documentType,
    status: row.status,
    title: row.title,
    fileName: row.fileName,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
    storageKey: row.storageKey,
    externalUrl: row.externalUrl,
    rejectionReason: row.rejectionReason,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

meDeveloperKycV1.post("/documents/presign", async () => {
  throw new ApiError(
    501,
    "NOT_IMPLEMENTED",
    "S3 presigned uploads are not configured yet. Register a document with externalUrl (HTTPS) in POST /v1/me/developer/kyc/documents.",
  );
});

meDeveloperKycV1.get(
  "/documents",
  zValidator("query", listDeveloperKycDocumentsQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { page, pageSize, projectId, status } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const where: Prisma.DeveloperKycDocumentWhereInput = {
      developerId: dev.id,
      ...(projectId !== undefined ? { projectId } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    const statuses = Object.values(DeveloperKycDocumentStatus);
    const [total, rows, counts] = await Promise.all([
      prisma.developerKycDocument.count({ where }),
      prisma.developerKycDocument.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, name: true, slug: true } },
        },
      }),
      Promise.all(
        statuses.map((s) =>
          prisma.developerKycDocument.count({
            where: { developerId: dev.id, status: s },
          }),
        ),
      ),
    ]);

    const countsByStatus = Object.fromEntries(statuses.map((s, i) => [s, counts[i] ?? 0])) as Record<
      string,
      number
    >;

    return c.json({
      data: rows.map((r) => ({
        ...docToJson(r),
        project: r.project,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        countsByStatus,
      },
    });
  },
);

meDeveloperKycV1.post(
  "/documents",
  zValidator("json", createDeveloperKycDocumentBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const body = c.req.valid("json");

    if (body.projectId !== undefined) {
      const proj = await prisma.developerProject.findFirst({
        where: { id: body.projectId, developerId: dev.id, deletedAt: null },
      });
      if (!proj) throw new ApiError(404, "NOT_FOUND", "Project not found");
    }

    const expiresAt =
      body.expiresAt === undefined
        ? undefined
        : body.expiresAt === null
          ? null
          : new Date(body.expiresAt);

    const created = await prisma.developerKycDocument.create({
      data: {
        developerId: dev.id,
        projectId: body.projectId,
        documentType: body.documentType,
        title: body.title,
        fileName: body.fileName,
        mimeType: body.mimeType,
        byteSize: body.byteSize,
        externalUrl: body.externalUrl,
        expiresAt: expiresAt ?? undefined,
      },
      include: {
        project: { select: { id: true, name: true, slug: true } },
      },
    });

    return c.json(
      {
        data: {
          ...docToJson(created),
          project: created.project,
          previewUrl: created.externalUrl,
        },
      },
      201,
    );
  },
);

meDeveloperKycV1.get(
  "/documents/:id",
  zValidator("param", kycDocumentIdParamSchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");

    const row = await prisma.developerKycDocument.findFirst({
      where: { id, developerId: dev.id },
      include: {
        project: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Document not found");

    return c.json({
      data: {
        ...docToJson(row),
        project: row.project,
        previewUrl: row.externalUrl,
      },
    });
  },
);

meDeveloperKycV1.patch(
  "/documents/:id",
  zValidator("param", kycDocumentIdParamSchema),
  zValidator("json", patchDeveloperKycDocumentBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const existing = await prisma.developerKycDocument.findFirst({
      where: { id, developerId: dev.id },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Document not found");
    if (existing.status !== DeveloperKycDocumentStatus.pending) {
      throw new ApiError(409, "CONFLICT", "Only pending documents can be edited by the developer");
    }

    const data: Prisma.DeveloperKycDocumentUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.externalUrl !== undefined) data.externalUrl = body.externalUrl;
    if (body.expiresAt !== undefined) {
      data.expiresAt = body.expiresAt === null ? null : new Date(body.expiresAt);
    }

    const updated = await prisma.developerKycDocument.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, slug: true } },
      },
    });

    return c.json({
      data: {
        ...docToJson(updated),
        project: updated.project,
        previewUrl: updated.externalUrl,
      },
    });
  },
);
