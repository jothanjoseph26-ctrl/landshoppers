import Link from "next/link"
import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"
import { Button } from "@/components/ui/button"

export default function AgentReferralsPage() {
  return (
    <PortalRoutePlaceholder
      specId="AGT-12"
      title="Referral programme"
      description="Earn rewards for referring buyers and listing agents to LandShoppers."
      parentHref="/agent"
      parentLabel="Agent dashboard"
    >
      ServiceHub preferred partners live under{" "}
      <Link href="/agent/partners" className="font-medium text-primary underline">
        Partners
      </Link>
      . Referral ledger and payout tracking require a dedicated referral API slice.
      <div className="mt-4">
        <Button asChild size="sm" variant="secondary">
          <Link href="/agent/partners">ServiceHub partners</Link>
        </Button>
      </div>
    </PortalRoutePlaceholder>
  )
}
