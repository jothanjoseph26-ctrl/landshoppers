import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AdminWhatsappSettingsPage() {
  return (
    <PortalRoutePlaceholder
      specId="WA-06"
      title="WhatsApp automation settings"
      description="Confidence thresholds and auto-approve rules for the extraction pipeline."
      parentHref="/admin/whatsapp"
      parentLabel="WhatsApp panel"
    >
      Tune WHATSAPP_AUTO_APPROVE_MIN_CONFIDENCE and related env vars in deployment config. UI persistence
      ships when admin settings API is extended for Layer 2.
    </PortalRoutePlaceholder>
  )
}
