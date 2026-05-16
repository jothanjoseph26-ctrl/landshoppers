import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const developerSubscriptionCheckoutBodySchema = z
  .object({
    plan: z.enum(["developer_basic", "developer_pro"]),
  })
  .strict();

export const listDeveloperSubscriptionInvoicesQuerySchema = paginationQuerySchema;
