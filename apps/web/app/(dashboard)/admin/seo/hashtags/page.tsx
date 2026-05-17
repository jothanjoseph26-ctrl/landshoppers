import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function AdminSeoHashtagsPage() {
  return (
    <PortalRoutePlaceholder
      specId="SEO-08"
      title="Hashtag manager"
      description="City and property-type hashtag sets for social posts."
      parentHref="/admin/seo"
      parentLabel="SEO panel"
    >
      Hashtag sets are embedded on generated variants today. Dedicated CRUD for hashtag libraries ships
      with channel manager (SEO-04).
    </PortalRoutePlaceholder>
  )
}
