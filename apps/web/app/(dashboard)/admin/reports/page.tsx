import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Reports</h1>
        <p className="text-muted-foreground">User reports against listings, agents, and content.</p>
      </div>
      <PortalEmpty
        title="Reports inbox pending"
        description="Once the report API exposes the moderation queue, this page will surface it."
        primaryHref="/admin"
        primaryLabel="Back to admin"
      />
    </div>
  )
}
