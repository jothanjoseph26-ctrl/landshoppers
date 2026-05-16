import type { ApiServicesMatchGroup, ApiServicesMatchPayload } from "@/lib/api/services-marketplace"
import { DEMO_SERVICE_PROVIDERS } from "@/lib/api/services-marketplace"
import { getServiceHubCategoryMeta, type ServiceHubCategorySlug } from "@/lib/servicehub/categories"

const TAB_CATEGORIES: ServiceHubCategorySlug[] = [
  "legal",
  "survey",
  "photography",
  "mortgage",
  "architecture",
]

/** Heuristic demo when `GET /v1/services/match` is unavailable (Phase B UI). */
export function buildDemoContextualMatch(payload: {
  listingId: string
  city: string
  state: string
}): ApiServicesMatchPayload {
  const areaPieces = [payload.city, payload.state].filter(Boolean)
  const areaLabel = areaPieces.join(", ")
  const locality = payload.city.toLowerCase()

  const groups: ApiServicesMatchGroup[] = TAB_CATEGORIES.map((cat) => {
    const inArea = DEMO_SERVICE_PROVIDERS.filter(
      (p) =>
        p.category === cat &&
        (p.city.toLowerCase().includes(locality) ||
          p.state.toLowerCase().includes(locality) ||
          (p.serviceAreas ?? []).some((a) => a.toLowerCase().includes(locality))),
    )
    const pool = inArea.length ? inArea : DEMO_SERVICE_PROVIDERS.filter((p) => p.category === cat)
    const providers = pool.slice(0, 3).map((p) => ({
      ...p,
      matchHint:
        p.isVerified && p.rating >= 4.5
          ? `Verified · Strong rating · Serves ${payload.city}`
          : `Category match · Active in ${payload.state || "Nigeria"}`,
    }))
    const meta = getServiceHubCategoryMeta(cat)
    return {
      category: cat,
      label: meta?.label ?? cat,
      providers,
    }
  })

  return {
    listingId: payload.listingId,
    areaLabel,
    groups,
    bundleUpsell: {
      slug: "lagos-title-perfection",
      name: "Lagos Title Perfection Package",
      priceFromLabel: "From ₦350,000",
    },
  }
}
