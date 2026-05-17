import { TourStatus, TourType } from "@landshoppers/db";
import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

const uuid = z.string().uuid();

export const listMeToursQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(TourStatus).optional(),
  upcoming: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const tourIdParamSchema = z.object({
  id: uuid,
});

export const createMeTourBodySchema = z
  .object({
    listingId: uuid,
    tourType: z.nativeEnum(TourType).default(TourType.in_person),
    preferredDate: z.string().datetime({ offset: true }).or(z.string().date()),
    preferredTime: z.string().max(32).optional(),
    notes: z.string().max(2000).optional(),
    buyerPhone: z.string().max(40).optional(),
  })
  .strict();

export const patchMeTourBodySchema = z
  .object({
    status: z.literal(TourStatus.cancelled).optional(),
    cancelReason: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });

export const cancelMeTourBodySchema = z
  .object({
    cancelReason: z.string().max(500).optional(),
  })
  .strict();
