import { z } from "zod";

export const adminAnalyticsSummaryQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter", "all"]).default("month"),
});
