import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Platform settings</h1>
        <p className="text-muted-foreground">Feature flags, defaults, and infrastructure switches.</p>
      </div>
      <PortalEmpty
        title="Settings UI pending"
        description="Feature flag and platform configuration endpoints are scheduled for a later slice."
        primaryHref="/admin"
        primaryLabel="Back to admin"
      />
    </div>
  )
}
