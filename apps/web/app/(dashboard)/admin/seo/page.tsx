import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AdminSeoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">SEO</h1>
        <p className="text-muted-foreground">Sitemaps, meta overrides, and structured data audits.</p>
      </div>
      <PortalEmpty
        title="SEO tooling pending"
        description="The metadata + sitemap admin endpoints ship in the SEO slice."
        primaryHref="/admin"
        primaryLabel="Back to admin"
      />
    </div>
  )
}
