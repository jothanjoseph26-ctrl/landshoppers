import type { PlatformSettings } from "@landshoppers/db";

import { prisma } from "./prisma.js";

export const PLATFORM_SETTINGS_ID = "default";

function envFeatureFlags() {
  return {
    agentWhatsappEnabled: process.env.AGENT_WHATSAPP_ENABLED === "true",
    agentAiInsightsEnabled: process.env.AGENT_AI_INSIGHTS_ENABLED === "true",
    providerWhatsappEnabled: process.env.PROVIDER_WHATSAPP_ENABLED === "true",
  };
}

function envWhatsappAutoApproveMinScore(): number | null {
  const raw = process.env.WHATSAPP_AUTO_APPROVE_MIN_SCORE?.trim();
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

export async function ensurePlatformSettings(): Promise<PlatformSettings> {
  return prisma.platformSettings.upsert({
    where: { id: PLATFORM_SETTINGS_ID },
    create: {
      id: PLATFORM_SETTINGS_ID,
      maintenanceMode: process.env.PLATFORM_MAINTENANCE_MODE === "true",
      whatsappAutoApproveMinScore: envWhatsappAutoApproveMinScore(),
    },
    update: {},
  });
}

export function platformSettingsToJson(row: PlatformSettings) {
  return {
    maintenanceMode: row.maintenanceMode,
    whatsappAutoApproveMinScore: row.whatsappAutoApproveMinScore,
    paystackConfigured: Boolean(
      process.env.PAYSTACK_SECRET_KEY?.trim() && process.env.PAYSTACK_PUBLIC_KEY?.trim(),
    ),
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    whatsappDefaultListingUserId:
      process.env.WHATSAPP_DEFAULT_LISTING_USER_ID?.trim() || null,
    featureFlags: envFeatureFlags(),
    patchSupported: true,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}
