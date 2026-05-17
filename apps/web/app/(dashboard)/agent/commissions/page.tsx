import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AgentCommissionsPage() {
  return (
    <PortalRoutePlaceholder
      specId="AGT-08"
      title="Commission tracker"
      description="Track earned commissions and payout status from closed deals."
      parentHref="/agent"
      parentLabel="Agent dashboard"
    >
      Commission ledger APIs are not exposed yet. Subscription and listing performance are available under
      Analytics until payments webhooks (§6) land.
    </PortalRoutePlaceholder>
  )
}
