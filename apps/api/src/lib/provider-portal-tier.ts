import type { ServiceProvider } from "@landshoppers/db";

import type { ProviderPortalTier } from "../contracts/provider-portal.js";

/** Mirrors Prisma `ProviderTier` for portal contracts (§7 — Free / Pro / Elite). */
export function tierFromServiceProvider(provider: ServiceProvider): ProviderPortalTier {
  return provider.subscriptionTier as ProviderPortalTier;
}
