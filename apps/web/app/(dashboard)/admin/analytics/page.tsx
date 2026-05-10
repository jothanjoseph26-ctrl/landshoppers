import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Analytics</h1>
        <p className="text-muted-foreground">Marketplace-wide funnel, retention, and listing health metrics.</p>
      </div>
      <PortalEmpty
        title="Analytics dashboard pending"
        description="Aggregate analytics ship after the analytics endpoints are exposed."
        primaryHref="/admin"
        primaryLabel="Back to admin"
      />
    </div>
  )
}
