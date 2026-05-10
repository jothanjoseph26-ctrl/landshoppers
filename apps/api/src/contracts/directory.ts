import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

/** GET /v1/developers — public verified developer directory. */
export const listDevelopersCatalogQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(120).optional(),
  city: z.string().min(1).max(120).optional(),
});

export const developerIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const projectIdParamSchema = z.object({
  id: z.string().uuid(),
});
