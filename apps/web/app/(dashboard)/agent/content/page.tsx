import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AgentContentPage() {
  return (
    <PortalRoutePlaceholder
      title="Content studio"
      description="AI-assisted listing copy, social captions, and media briefs."
      parentHref="/agent"
      parentLabel="Agent dashboard"
    >
      Listing creation supports descriptions today. Full content studio ties to SEO variant generation and
      agent AI insights when <code className="rounded bg-muted px-1 text-xs">agentAiInsightsEnabled</code> is on.
    </PortalRoutePlaceholder>
  )
}
