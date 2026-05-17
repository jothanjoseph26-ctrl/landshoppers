import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AdminSeoAuditPage() {
  return (
    <PortalRoutePlaceholder
      specId="SEO-07"
      title="SEO audit tool"
      description="Per-listing SEO score and recommendations."
      parentHref="/admin/seo"
      parentLabel="SEO panel"
    >
      Listing-level audit scores will call the AI service audit endpoint. Generate variants from the main
      panel to improve titles and meta descriptions today.
    </PortalRoutePlaceholder>
  )
}
