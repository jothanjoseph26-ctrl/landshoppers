import type { Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  patchProviderKycBodySchema,
  providerKycDocumentEntrySchema,
} from "../../contracts/provider-kyc.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { providerForUser } from "../../lib/provider-for-user.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const providerKycV1 = new Hono<ApiEnv>();

providerKycV1.use("*", requireAuth, requireServiceProvider);

function parseKycDocuments(raw: unknown) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const item of raw) {
    const parsed = providerKycDocumentEntrySchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out.length > 0 ? out : null;
}

function kycPayload(provider: {
  id: string;
  verificationLevel: string;
  isVerified: boolean;
  licenseNumber: string | null;
  licenseBody: string | null;
  kycDocuments: unknown;
}) {
  const docs = parseKycDocuments(provider.kycDocuments);
  return {
    serviceProviderId: provider.id,
    verificationLevel: provider.verificationLevel,
    isVerified: provider.isVerified,
    licenseNumber: provider.licenseNumber,
    licenseBody: provider.licenseBody,
    kycDocuments: docs,
    checklist: [
      { id: "license", label: "Professional license on file", complete: Boolean(provider.licenseNumber?.trim()) },
      { id: "documents", label: "At least one KYC document uploaded", complete: Boolean(docs?.length) },
      { id: "verified", label: "Platform verification badge", complete: provider.isVerified },
    ],
  };
}

providerKycV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const row = await providerForUser(auth.id);
  return c.json({ data: kycPayload(row) });
});

providerKycV1.patch("/", zValidator("json", patchProviderKycBodySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const row = await providerForUser(auth.id);
  const body = c.req.valid("json");

  const data: Prisma.ServiceProviderUpdateInput = {};
  if (body.licenseNumber !== undefined) data.licenseNumber = body.licenseNumber;
  if (body.licenseBody !== undefined) data.licenseBody = body.licenseBody;
  if (body.kycDocuments !== undefined) {
    data.kycDocuments = body.kycDocuments as Prisma.InputJsonValue;
  }

  const updated = await prisma.serviceProvider.update({
    where: { id: row.id },
    data,
  });

  return c.json({ data: kycPayload(updated) });
});
