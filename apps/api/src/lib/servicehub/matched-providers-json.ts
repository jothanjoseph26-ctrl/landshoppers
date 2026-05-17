export type BundleMatchedSlot = {
  serviceCategory: string;
  providerId: string;
  status: string;
  leadId: string;
};

export type BundleMatchedProvidersPayload = {
  developerProjectId?: string;
  slots: BundleMatchedSlot[];
};

/** Supports legacy array-only JSON and wrapped `{ slots, developerProjectId? }`. */
export function parseBundleMatchedSlots(raw: unknown): BundleMatchedSlot[] {
  if (Array.isArray(raw)) {
    return raw as BundleMatchedSlot[];
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as BundleMatchedProvidersPayload).slots)) {
    return (raw as BundleMatchedProvidersPayload).slots;
  }
  return [];
}

export function bundleMatchedProvidersJson(
  slots: BundleMatchedSlot[],
  developerProjectId: string | null,
): BundleMatchedProvidersPayload | BundleMatchedSlot[] {
  if (developerProjectId) {
    return { developerProjectId, slots };
  }
  return slots;
}
