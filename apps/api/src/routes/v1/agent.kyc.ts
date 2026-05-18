import { KycStatus, type Prisma } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  agentKycDocumentEntrySchema,
  patchAgentKycBodySchema,
} from "../../contracts/agent-kyc.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAgentOrDeveloper, requireAuth } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const agentKycV1 = new Hono<ApiEnv>();

agentKycV1.use("*", requireAuth, requireAgentOrDeveloper);

function parseKycDocuments(raw: unknown) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const item of raw) {
    const parsed = agentKycDocumentEntrySchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out.length > 0 ? out : null;
}

function kycPayload(
  agent: {
    id: string;
    agencyName: string | null;
    licenseNumber: string | null;
    kycStatus: string;
    kycDocuments: unknown;
    kycSubmittedAt: Date | null;
    kycVerifiedAt: Date | null;
    kycRejectionReason: string | null;
    isVerified: boolean;
    verificationBadge: boolean;
    bvnHash: string | null;
    ninHash: string | null;
  },
  email: string,
) {
  const docs = parseKycDocuments(agent.kycDocuments);
  return {
    agentId: agent.id,
    agencyName: agent.agencyName,
    email,
    licenseNumber: agent.licenseNumber,
    kycStatus: agent.kycStatus,
    kycSubmittedAt: agent.kycSubmittedAt?.toISOString() ?? null,
    kycVerifiedAt: agent.kycVerifiedAt?.toISOString() ?? null,
    kycRejectionReason: agent.kycRejectionReason,
    isVerified: Boolean(agent.isVerified),
    verificationBadge: Boolean(agent.verificationBadge),
    bvnOnFile: Boolean(agent.bvnHash),
    ninOnFile: Boolean(agent.ninHash),
    kycDocuments: docs,
    checklist: [
      {
        id: "license",
        label: "Estate agent license number on file",
        complete: Boolean(agent.licenseNumber?.trim()),
      },
      {
        id: "documents",
        label: "At least one identity or license document uploaded",
        complete: Boolean(docs?.length),
      },
      {
        id: "submitted",
        label: "Submitted for admin review",
        complete: Boolean(agent.kycSubmittedAt),
      },
      {
        id: "verified",
        label: "Platform verification approved",
        complete: agent.kycStatus === KycStatus.verified || agent.isVerified,
      },
    ],
  };
}

async function agentForUser(userId: string) {
  const agent = await prisma.agent.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!agent) {
    throw new ApiError(404, "NOT_FOUND", "Agent profile not found for this account");
  }
  return agent;
}

agentKycV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const agent = await agentForUser(auth.id);
  return c.json({ data: kycPayload(agent, auth.email) });
});

agentKycV1.patch("/", zValidator("json", patchAgentKycBodySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");

  const agent = await agentForUser(auth.id);
  const body = c.req.valid("json");

  if (agent.kycStatus === KycStatus.verified && (body.kycDocuments || body.submitForReview)) {
    throw new ApiError(409, "CONFLICT", "KYC is already verified; contact support to update documents.");
  }

  const data: Prisma.AgentUpdateInput = {};

  if (body.licenseNumber !== undefined) {
    data.licenseNumber = body.licenseNumber;
  }

  if (body.kycDocuments !== undefined) {
    const stamped = body.kycDocuments.map((d) => ({
      ...d,
      uploadedAt: d.uploadedAt ?? new Date().toISOString(),
    }));
    data.kycDocuments = stamped as Prisma.InputJsonValue;
    if (agent.kycStatus === KycStatus.rejected) {
      data.kycRejectionReason = null;
    }
  }

  const shouldSubmit =
    body.submitForReview === true ||
    (body.kycDocuments !== undefined && body.kycDocuments.length > 0);

  if (shouldSubmit && agent.kycStatus !== KycStatus.verified) {
    data.kycStatus = KycStatus.submitted;
    data.kycSubmittedAt = new Date();
  }

  const updated = await prisma.agent.update({
    where: { id: agent.id },
    data,
  });

  return c.json({ data: kycPayload(updated, auth.email) });
});
