import { PaymentStatus, PaymentType } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

export const listAdminPaymentsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(PaymentStatus).optional(),
  type: z.nativeEnum(PaymentType).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export const adminPaymentsSummaryQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter", "all"]).default("month"),
});
