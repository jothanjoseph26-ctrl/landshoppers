import { z } from "zod";

export const agentAnalyticsSummaryQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter", "all"]).default("month"),
});
