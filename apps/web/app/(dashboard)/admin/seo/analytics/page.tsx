import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AdminSeoAnalyticsPage() {
  return (
    <PortalRoutePlaceholder
      specId="SEO-06"
      title="SEO performance analytics"
      description="Channel metrics and variant performance after publish."
      parentHref="/admin/seo"
      parentLabel="SEO panel"
    >
      Metrics ingestion depends on channel webhooks. Summary KPIs on the main SEO panel reflect draft and
      approved counts until publish analytics are wired.
    </PortalRoutePlaceholder>
  )
}
