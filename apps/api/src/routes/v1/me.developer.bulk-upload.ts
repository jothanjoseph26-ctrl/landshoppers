import { DeveloperBulkUploadStatus, UnitStatus, type Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { offsetFromPage } from "../../contracts/common.js";
import {
  bulkUploadIdParamSchema,
  bulkUploadRowsQuerySchema,
  commitBulkUploadBodySchema,
  createBulkUploadBodySchema,
  listBulkUploadsQuerySchema,
  patchBulkUploadMappingBodySchema,
  type BulkInventoryField,
} from "../../contracts/developer-bulk-upload.js";
import { ApiError } from "../../lib/errors.js";
import { mergeColumnMap, suggestColumnMap } from "../../lib/bulk-upload/inventory-columns.js";
import { parseCsv } from "../../lib/bulk-upload/parse-csv.js";
import {
  deriveUploadStatus,
  validateColumnMapHeaders,
  validateInventoryTable,
} from "../../lib/bulk-upload/validate-inventory-rows.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireDeveloper } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

const MAX_DATA_ROWS = 2000;

export const meDeveloperBulkUploadsV1 = new Hono<ApiEnv>();

meDeveloperBulkUploadsV1.use("*", requireAuth, requireDeveloper);

async function developerForUser(userId: string) {
  const row = await prisma.developer.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Developer profile not found for this account");
  }
  return row;
}

function uploadToJson(
  row: {
    id: string;
    projectId: string;
    filename: string;
    status: DeveloperBulkUploadStatus;
    errorMessage: string | null;
    headers: unknown;
    columnMap: unknown;
    commitMode: string | null;
    committedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  stats?: { rowCount: number; validCount: number; invalidCount: number },
) {
  return {
    id: row.id,
    projectId: row.projectId,
    filename: row.filename,
    status: row.status,
    errorMessage: row.errorMessage,
    headers: row.headers,
    columnMap: row.columnMap,
    commitMode: row.commitMode,
    committedAt: row.committedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(stats !== undefined ? { stats } : {}),
  };
}

meDeveloperBulkUploadsV1.get(
  "/",
  zValidator("query", listBulkUploadsQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { page, pageSize } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const where = { developerId: dev.id };
    const [total, rows] = await Promise.all([
      prisma.developerBulkUpload.count({ where }),
      prisma.developerBulkUpload.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    const withStats = await Promise.all(
      rows.map(async (u) => {
        const [rowCount, invalidCount] = await Promise.all([
          prisma.developerBulkUploadRow.count({ where: { uploadId: u.id } }),
          prisma.developerBulkUploadRow.count({
            where: { uploadId: u.id, NOT: { errors: { equals: [] } } },
          }),
        ]);
        return uploadToJson(u, {
          rowCount,
          validCount: rowCount - invalidCount,
          invalidCount,
        });
      }),
    );

    return c.json({
      data: withStats,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);

meDeveloperBulkUploadsV1.post("/presign", async () => {
  throw new ApiError(
    501,
    "NOT_IMPLEMENTED",
    "S3 presigned uploads are not configured yet. Send csvText in POST /v1/me/developer/bulk-uploads.",
  );
});

meDeveloperBulkUploadsV1.post(
  "/",
  zValidator("json", createBulkUploadBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const body = c.req.valid("json");

    const csvText = body.csvText.replace(/^\uFEFF/, "");

    if (csvText.includes("\0")) {
      throw new ApiError(400, "VALIDATION_ERROR", "CSV must be plain text (binary content rejected)", {
        details: [{ code: "UNSUPPORTED_TYPE" }],
      });
    }

    const project = await prisma.developerProject.findFirst({
      where: { id: body.projectId, developerId: dev.id, deletedAt: null },
    });
    if (!project) throw new ApiError(404, "NOT_FOUND", "Project not found");

    const grid = parseCsv(csvText);
    if (grid.length < 2) {
      throw new ApiError(400, "VALIDATION_ERROR", "CSV must include a header row and at least one data row");
    }
    const headerRow = grid[0]!;
    const dataRows = grid.slice(1);
    if (dataRows.length > MAX_DATA_ROWS) {
      throw new ApiError(400, "VALIDATION_ERROR", `At most ${MAX_DATA_ROWS} data rows per upload`);
    }

    const columnMap = suggestColumnMap(headerRow);
    const mapHeaderErrors = validateColumnMapHeaders(headerRow, columnMap);
    const validated = validateInventoryTable({ headerRow, dataRows, columnMap });
    const status = deriveUploadStatus(columnMap, validated, mapHeaderErrors);

    const parsedGrid = [headerRow, ...dataRows] as Prisma.InputJsonValue;

    const created = await prisma.$transaction(async (tx) => {
      const upload = await tx.developerBulkUpload.create({
        data: {
          developerId: dev.id,
          projectId: project.id,
          filename: body.filename,
          status,
          headers: headerRow as unknown as Prisma.InputJsonValue,
          parsedGrid,
          columnMap: columnMap as unknown as Prisma.InputJsonValue,
        },
      });
      if (validated.length > 0) {
        await tx.developerBulkUploadRow.createMany({
          data: validated.map((r) => ({
            uploadId: upload.id,
            rowIndex: r.rowIndex,
            payload: r.payload as Prisma.InputJsonValue,
            errors: r.errors,
            warnings: r.warnings,
          })),
        });
      }
      return upload;
    });

    const stats = {
      rowCount: validated.length,
      validCount: validated.filter((r) => r.errors.length === 0).length,
      invalidCount: validated.filter((r) => r.errors.length > 0).length,
    };

    return c.json({ data: uploadToJson(created, stats) }, 201);
  },
);

meDeveloperBulkUploadsV1.patch(
  "/:id/mapping",
  zValidator("param", bulkUploadIdParamSchema),
  zValidator("json", patchBulkUploadMappingBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");
    const { columnMap: patchMap } = c.req.valid("json");

    const existing = await prisma.developerBulkUpload.findFirst({
      where: { id, developerId: dev.id },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Bulk upload not found");
    if (existing.status === DeveloperBulkUploadStatus.committed) {
      throw new ApiError(409, "CONFLICT", "Upload already committed");
    }

    const headers = existing.headers as string[];
    if (!Array.isArray(headers) || headers.length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid stored headers");
    }

    const parsed = existing.parsedGrid as unknown;
    if (!Array.isArray(parsed) || parsed.length < 2) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid stored CSV grid");
    }
    const headerRow = parsed[0] as string[];
    const dataRows = parsed.slice(1) as string[][];

    const prevMap = (existing.columnMap ?? suggestColumnMap(headerRow)) as Record<
      BulkInventoryField,
      string | null
    >;
    const merged = mergeColumnMap(prevMap, patchMap as Partial<Record<BulkInventoryField, string | null>>);
    const mapHeaderErrors = validateColumnMapHeaders(headerRow, merged);

    const validated = validateInventoryTable({
      headerRow,
      dataRows,
      columnMap: merged,
    });
    const status = deriveUploadStatus(merged, validated, mapHeaderErrors);

    await prisma.$transaction(async (tx) => {
      await tx.developerBulkUploadRow.deleteMany({ where: { uploadId: id } });
      if (validated.length > 0) {
        await tx.developerBulkUploadRow.createMany({
          data: validated.map((r) => ({
            uploadId: id,
            rowIndex: r.rowIndex,
            payload: r.payload as Prisma.InputJsonValue,
            errors: r.errors,
            warnings: r.warnings,
          })),
        });
      }
      await tx.developerBulkUpload.update({
        where: { id },
        data: {
          columnMap: merged as unknown as Prisma.InputJsonValue,
          status,
        },
      });
    });

    const updated = await prisma.developerBulkUpload.findFirstOrThrow({ where: { id } });
    const rowCount = validated.length;
    const invalidCount = validated.filter((r) => r.errors.length > 0).length;
    return c.json({
      data: uploadToJson(updated, {
        rowCount,
        validCount: rowCount - invalidCount,
        invalidCount,
      }),
    });
  },
);

meDeveloperBulkUploadsV1.get(
  "/:id/rows",
  zValidator("param", bulkUploadIdParamSchema),
  zValidator("query", bulkUploadRowsQuerySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");
    const { page, pageSize } = c.req.valid("query");
    const skip = offsetFromPage(page, pageSize);

    const upload = await prisma.developerBulkUpload.findFirst({
      where: { id, developerId: dev.id },
    });
    if (!upload) throw new ApiError(404, "NOT_FOUND", "Bulk upload not found");

    const where = { uploadId: id };
    const [total, rows] = await Promise.all([
      prisma.developerBulkUploadRow.count({ where }),
      prisma.developerBulkUploadRow.findMany({
        where,
        orderBy: { rowIndex: "asc" },
        skip,
        take: pageSize,
      }),
    ]);

    return c.json({
      data: rows.map((r) => ({
        rowIndex: r.rowIndex,
        payload: r.payload,
        errors: r.errors,
        warnings: r.warnings,
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  },
);

meDeveloperBulkUploadsV1.post(
  "/:id/commit",
  zValidator("param", bulkUploadIdParamSchema),
  zValidator("json", commitBulkUploadBodySchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");
    const { mode } = c.req.valid("json");

    const upload = await prisma.developerBulkUpload.findFirst({
      where: { id, developerId: dev.id },
    });
    if (!upload) throw new ApiError(404, "NOT_FOUND", "Bulk upload not found");
    if (upload.status === DeveloperBulkUploadStatus.committed) {
      throw new ApiError(409, "CONFLICT", "Upload already committed");
    }

    const rows = await prisma.developerBulkUploadRow.findMany({
      where: { uploadId: id },
      orderBy: { rowIndex: "asc" },
    });

    if (mode === "publish") {
      if (upload.status !== DeveloperBulkUploadStatus.ready) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Publish requires all rows to validate (status must be ready). Fix mapping or row data.",
        );
      }
      const bad = rows.filter((r) => r.errors.length > 0);
      if (bad.length > 0) {
        throw new ApiError(400, "VALIDATION_ERROR", "Cannot publish while rows have validation errors");
      }
    }

    const now = new Date();

    if (mode === "draft") {
      const updated = await prisma.developerBulkUpload.update({
        where: { id },
        data: {
          status: DeveloperBulkUploadStatus.committed,
          commitMode: "draft",
          committedAt: now,
        },
      });
      return c.json({ data: uploadToJson(updated) });
    }

    let nAvail = 0;
    let nSold = 0;
    let nRes = 0;
    const unitRows: Prisma.ProjectUnitCreateManyInput[] = [];
    for (const r of rows) {
      if (r.errors.length > 0) continue;
      const p = r.payload as Record<string, unknown>;
      const unitName = String(p["unitName"] ?? "").trim();
      const priceKobo = p["priceKobo"];
      if (!unitName || typeof priceKobo !== "string") continue;
      const price = BigInt(priceKobo);
      const statusRaw = String(p["status"] ?? "available");
      const st =
        statusRaw === UnitStatus.sold
          ? UnitStatus.sold
          : statusRaw === UnitStatus.reserved
            ? UnitStatus.reserved
            : UnitStatus.available;
      if (st === UnitStatus.available) nAvail += 1;
      else if (st === UnitStatus.sold) nSold += 1;
      else nRes += 1;

      unitRows.push({
        projectId: upload.projectId,
        unitName,
        unitType: String(p["unitType"] ?? "Plot").slice(0, 200),
        bedrooms: p["bedrooms"] === null || p["bedrooms"] === undefined ? null : Number(p["bedrooms"]),
        bathrooms: p["bathrooms"] === null || p["bathrooms"] === undefined ? null : Number(p["bathrooms"]),
        toilets: p["toilets"] === null || p["toilets"] === undefined ? null : Number(p["toilets"]),
        squareMeters:
          p["squareMeters"] === null || p["squareMeters"] === undefined ? null : Number(p["squareMeters"]),
        price,
        status: st,
        features: [],
      });
    }

    const nTotal = unitRows.length;

    await prisma.$transaction(async (tx) => {
      if (unitRows.length > 0) {
        await tx.projectUnit.createMany({ data: unitRows });
      }
      await tx.developerProject.update({
        where: { id: upload.projectId },
        data: {
          totalUnits: { increment: nTotal },
          availableUnits: { increment: nAvail },
          soldUnits: { increment: nSold },
        },
      });
      await tx.developerBulkUpload.update({
        where: { id },
        data: {
          status: DeveloperBulkUploadStatus.committed,
          commitMode: "publish",
          committedAt: now,
        },
      });
    });

    const updated = await prisma.developerBulkUpload.findFirstOrThrow({ where: { id } });
    return c.json({
      data: {
        ...uploadToJson(updated),
        insertedUnits: nTotal,
        counters: { totalAdded: nTotal, availableAdded: nAvail, soldAdded: nSold, reservedAdded: nRes },
      },
    });
  },
);

meDeveloperBulkUploadsV1.get(
  "/:id",
  zValidator("param", bulkUploadIdParamSchema),
  async (c) => {
    const auth = c.get("authUser");
    if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const dev = await developerForUser(auth.id);
    const { id } = c.req.valid("param");

    const row = await prisma.developerBulkUpload.findFirst({
      where: { id, developerId: dev.id },
    });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Bulk upload not found");

    const [rowCount, invalidCount] = await Promise.all([
      prisma.developerBulkUploadRow.count({ where: { uploadId: row.id } }),
      prisma.developerBulkUploadRow.count({
        where: { uploadId: row.id, NOT: { errors: { equals: [] } } },
      }),
    ]);

    return c.json({
      data: uploadToJson(row, {
        rowCount,
        validCount: rowCount - invalidCount,
        invalidCount,
      }),
    });
  },
);
