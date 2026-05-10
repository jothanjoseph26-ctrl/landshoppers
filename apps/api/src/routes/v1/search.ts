import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  autocompleteQuerySchema,
  listingsSearchQuerySchema,
  mapSearchQuerySchema,
} from "../../contracts/search.js";
import type { ApiEnv } from "../../types/env.js";
import {
  handleAutocomplete,
  handleListingsSearch,
  handleMapSearch,
} from "./search.handlers.js";

export const searchV1 = new Hono<ApiEnv>();

/** @deprecated Prefer GET /listings — kept for backwards compatibility (`apps/web` listings page). */
searchV1.get("/", zValidator("query", listingsSearchQuerySchema), async (c) =>
  handleListingsSearch(c, c.req.valid("query")),
);

searchV1.get("/listings", zValidator("query", listingsSearchQuerySchema), async (c) =>
  handleListingsSearch(c, c.req.valid("query")),
);

searchV1.get("/map", zValidator("query", mapSearchQuerySchema), async (c) =>
  handleMapSearch(c, c.req.valid("query")),
);

searchV1.get(
  "/autocomplete",
  zValidator("query", autocompleteQuerySchema),
  async (c) => handleAutocomplete(c, c.req.valid("query")),
);
