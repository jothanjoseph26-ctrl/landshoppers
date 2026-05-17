import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { patchProviderWhatsappBodySchema } from "../../contracts/provider-whatsapp.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { providerForUser } from "../../lib/provider-for-user.js";
import { tierFromServiceProvider } from "../../lib/provider-portal-tier.js";
import { assertProviderFeature } from "../../lib/provider-tier-gate.js";
import { requireAuth, requireServiceProvider } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";

export const providerWhatsappV1 = new Hono<ApiEnv>();

providerWhatsappV1.use("*", requireAuth, requireServiceProvider);

function evolutionEnabled(): boolean {
  return process.env["PROVIDER_WHATSAPP_ENABLED"]?.trim() === "true";
}

async function whatsappPayload(serviceProviderId: string) {
  const provider = await prisma.serviceProvider.findFirst({
    where: { id: serviceProviderId, deletedAt: null },
  });
  if (!provider) throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");

  const connection = await prisma.providerWhatsAppConnection.findFirst({
    where: { serviceProviderId: provider.id },
    orderBy: { connectedAt: "desc" },
  });

  const monitoredGroups = Array.isArray(connection?.monitoredGroups)
    ? (connection.monitoredGroups as string[])
    : [];

  return {
    connected: provider.whatsappConnected,
    phoneNumber: provider.whatsappPhone ?? connection?.phoneNumber ?? null,
    evolutionEnabled: evolutionEnabled(),
    monitoredGroups,
    extractedLeadsCount: connection?.extractedLeadsCount ?? 0,
    status: connection?.status ?? (provider.whatsappConnected ? ("connected" as const) : null),
    lastActiveAt: connection?.lastActiveAt?.toISOString() ?? null,
  };
}

providerWhatsappV1.get("/", async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const provider = await providerForUser(auth.id);
  return c.json({ data: await whatsappPayload(provider.id) });
});

providerWhatsappV1.patch("/", zValidator("json", patchProviderWhatsappBodySchema), async (c) => {
  const auth = c.get("authUser");
  if (!auth) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const provider = await providerForUser(auth.id);
  const tier = tierFromServiceProvider(provider);
  assertProviderFeature(tier, "whatsapp");

  const body = c.req.valid("json");
  const updated = await prisma.serviceProvider.update({
    where: { id: provider.id },
    data: {
      ...(body.connected !== undefined ? { whatsappConnected: body.connected } : {}),
      ...(body.phoneNumber !== undefined ? { whatsappPhone: body.phoneNumber } : {}),
    },
  });

  return c.json({ data: await whatsappPayload(updated.id) });
});
