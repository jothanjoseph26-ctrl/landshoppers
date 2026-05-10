import { PropertyType } from "@landshoppers/db";
import { z } from "zod";

/** Shape persisted on `raw_whatsapp_messages.extractedData` after AI extraction (`ExtractListingResponse` JSON). */
export const storedExtractListingResponseSchema = z.object({
  confidence: z.number(),
  requiresHumanReview: z.boolean().optional(),
  duplicateOfMessageId: z.string().nullable().optional(),
  property: z.object({
    title: z.string(),
    slug: z.string().optional(),
    description: z.string().nullable().optional(),
    propertyType: z.string(),
    address: z.string().nullable().optional(),
    city: z.string(),
    state: z.string(),
    country: z.string().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    bedrooms: z.number().nullable().optional(),
    bathrooms: z.number().nullable().optional(),
    toilets: z.number().nullable().optional(),
    squareMeters: z.number().nullable().optional(),
  }),
  listing: z.object({
    price: z.number().int().nonnegative(),
    priceNegotiable: z.boolean().optional(),
    isForSale: z.boolean().optional(),
    isForRent: z.boolean().optional(),
    rentPeriod: z.string().nullable().optional(),
    status: z.string().optional(),
  }),
});

export type StoredExtractListingResponse = z.infer<typeof storedExtractListingResponseSchema>;

export function coercePropertyType(raw: string): PropertyType {
  const v = raw.toLowerCase().trim();
  if (v === "apartment") return PropertyType.apartment;
  if (v === "house") return PropertyType.house;
  if (v === "land") return PropertyType.land;
  if (v === "commercial") return PropertyType.commercial;
  if (v === "estate_unit") return PropertyType.estate_unit;
  return PropertyType.apartment;
}
