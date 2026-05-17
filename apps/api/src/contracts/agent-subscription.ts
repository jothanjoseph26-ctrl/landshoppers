import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const agentSubscriptionCheckoutBodySchema = z
  .object({
    plan: z.enum(["agent_basic", "agent_pro"]),
  })
  .strict();

export const listAgentSubscriptionInvoicesQuerySchema = paginationQuerySchema;
