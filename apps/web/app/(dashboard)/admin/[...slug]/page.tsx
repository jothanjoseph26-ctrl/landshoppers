import { PortalPlaceholder } from "@/components/dashboard/portal-dashboard"

export default function AdminSubRoutePage() {
  return (
    <PortalPlaceholder
      title="Admin workflow"
      description="This admin section is reserved for the next moderation and operations slice. The route is available so users no longer hit a 404."
      primaryHref="/admin"
      primaryLabel="Back to admin panel"
    />
  )
}
