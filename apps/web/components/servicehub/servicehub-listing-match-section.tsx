import { tryFetchServicesMatch } from "@/lib/api/services-marketplace"
import { buildDemoContextualMatch } from "@/lib/servicehub/demo-contextual-match"
import { ServiceHubListingMatchClient } from "@/components/servicehub/servicehub-listing-match-client"

type Props = {
  listingId: string
  city: string
  state: string
}

/** SVC-PUB-05 — contextual ServiceHub block for listing detail (SSR + stable client island). */
export async function ServiceHubListingMatchSection({ listingId, city, state }: Props) {
  const api = await tryFetchServicesMatch({ listingId })
  const data = api ?? buildDemoContextualMatch({ listingId, city, state })
  return <ServiceHubListingMatchClient data={data} />
}
