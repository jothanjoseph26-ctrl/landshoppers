import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AdminWhatsappGroupsPage() {
  return (
    <PortalRoutePlaceholder
      specId="WA-05"
      title="WhatsApp group management"
      description="Register Evolution/Baileys groups for listing ingestion. Production bridge runs behind WHATSAPP_BRIDGE_ENABLED."
      parentHref="/admin/whatsapp"
      parentLabel="WhatsApp panel"
    >
      Configure group allowlists in environment and workers when Evolution is enabled. Until then, use the
      main queue to approve extracted listings from forwarded messages.
    </PortalRoutePlaceholder>
  )
}
