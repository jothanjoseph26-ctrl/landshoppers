import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const BULK_INVENTORY_FIELDS = [
  "unitName",
  "unitType",
  "bedrooms",
  "bathrooms",
  "toilets",
  "squareMeters",
  "priceKobo",
  "status",
] as const;

export type BulkInventoryField = (typeof BULK_INVENTORY_FIELDS)[number];

export const bulkUploadIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listBulkUploadsQuerySchema = paginationQuerySchema;

export const createBulkUploadBodySchema = z.object({
  projectId: z.string().uuid(),
  filename: z.string().min(1).max(255).default("inventory.csv"),
  csvText: z.string().min(1).max(5_000_000),
});

const columnMapFieldSchema = z.union([z.string().min(1).max(500), z.null()]);

export const patchBulkUploadMappingBodySchema = z
  .object({
    columnMap: z
      .object({
        unitName: columnMapFieldSchema.optional(),
        unitType: columnMapFieldSchema.optional(),
        bedrooms: columnMapFieldSchema.optional(),
        bathrooms: columnMapFieldSchema.optional(),
        toilets: columnMapFieldSchema.optional(),
        squareMeters: columnMapFieldSchema.optional(),
        priceKobo: columnMapFieldSchema.optional(),
        status: columnMapFieldSchema.optional(),
      })
      .strict(),
  })
  .strict();

export const bulkUploadRowsQuerySchema = paginationQuerySchema;

export const commitBulkUploadBodySchema = z.object({
  mode: z.enum(["draft", "publish"]),
});
