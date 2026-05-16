import { PortalPlaceholder } from "@/components/dashboard/portal-dashboard"

export default function DeveloperSubRoutePage() {
  return (
    <PortalPlaceholder
      title="Unknown developer route"
      description="This path is not part of the developer portal. Use the sidebar for Bulk upload, Analytics, KYC, Team, Subscription, and Settings — or go back to the dashboard."
      primaryHref="/developer"
      primaryLabel="Back to developer dashboard"
    />
  )
}
