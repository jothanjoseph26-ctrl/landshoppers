import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const listAgentsQuerySchema = paginationQuerySchema.extend({
  city: z.string().min(1).max(120).optional(),
  q: z.string().min(1).max(120).optional(),
});

export const agentIdParamSchema = z.object({
  id: z.string().uuid(),
});
