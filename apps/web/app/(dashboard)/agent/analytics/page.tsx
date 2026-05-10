import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AgentAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Analytics</h1>
        <p className="text-muted-foreground">Listing impressions, lead funnel, and performance metrics.</p>
      </div>
      <PortalEmpty
        title="Analytics dashboard pending"
        description="View counts, lead conversions, and listing performance will land once the analytics endpoints ship."
        primaryHref="/agent/listings"
        primaryLabel="Manage listings"
      />
    </div>
  )
}
