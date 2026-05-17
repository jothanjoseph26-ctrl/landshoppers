import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AgentWhatsappPage() {
  return (
    <PortalRoutePlaceholder
      title="WhatsApp (AgentOS)"
      description="Connect WhatsApp to capture listing leads from groups."
      parentHref="/agent"
      parentLabel="Agent dashboard"
    >
      Bridge is gated by <code className="rounded bg-muted px-1 text-xs">agentWhatsappEnabled</code> on your
      context. When Evolution is live, connection flows mirror the provider portal WhatsApp page.
    </PortalRoutePlaceholder>
  )
}
