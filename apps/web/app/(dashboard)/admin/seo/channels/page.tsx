import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AdminSeoChannelsPage() {
  return (
    <PortalRoutePlaceholder
      specId="SEO-04"
      title="Channel manager"
      description="OAuth tokens per social channel for OutcomeLabs posting."
      parentHref="/admin/seo"
      parentLabel="SEO panel"
    >
      Channel OAuth and token refresh ship with Layer 3 production credentials. Use variant approval
      queue until channels are connected.
    </PortalRoutePlaceholder>
  )
}
