import { PortalPlaceholder } from "@/components/dashboard/portal-dashboard"

export default function DeveloperSubRoutePage() {
  return (
    <PortalPlaceholder
      title="Developer workflow"
      description="This developer portal section is reserved for the next API-backed slice. The route is available so users no longer hit a 404."
      primaryHref="/developer"
      primaryLabel="Back to developer dashboard"
    />
  )
}
