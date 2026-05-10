import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function BuyerSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage notification, privacy, and login preferences.</p>
      </div>
      <PortalEmpty
        title="Settings UI in progress"
        description="Notification and password preferences will be wired to the user-profile API in the next slice."
        primaryHref="/buyer"
        primaryLabel="Back to dashboard"
      />
    </div>
  )
}
