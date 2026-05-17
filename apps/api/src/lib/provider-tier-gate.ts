import type { ProviderPortalTier } from "../contracts/provider-portal.js";
import { ApiError } from "./errors.js";

export type ProviderGatedFeature = "analytics_full" | "whatsapp" | "content_ai";

export function assertProviderFeature(tier: ProviderPortalTier, feature: ProviderGatedFeature): void {
  if (tier === "free") {
    const labels: Record<ProviderGatedFeature, string> = {
      analytics_full: "Advanced analytics",
      whatsapp: "WhatsApp bridge",
      content_ai: "Content studio",
    };
    throw new ApiError(
      403,
      "FEATURE_GATED",
      `${labels[feature]} requires a Pro or Elite subscription.`,
    );
  }
}
