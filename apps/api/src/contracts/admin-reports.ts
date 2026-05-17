import { z } from "zod";

export const adminReportKindParamSchema = z.object({
  kind: z.enum(["listings", "users", "payments"]),
});

export const adminReportQuerySchema = z.object({
  format: z.literal("csv").default("csv"),
});
