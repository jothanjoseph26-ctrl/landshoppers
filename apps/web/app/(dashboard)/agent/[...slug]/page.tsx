import { PortalPlaceholder } from "@/components/dashboard/portal-dashboard"

export default function AgentSubRoutePage() {
  return (
    <PortalPlaceholder
      title="Agent workflow"
      description="This agent portal section is reserved for the next API-backed implementation slice. The route is available so users no longer hit a 404."
      primaryHref="/agent"
      primaryLabel="Back to agent portal"
    />
  )
}
