import Link from "next/link"
import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"
import { Button } from "@/components/ui/button"

export default function AdminDevelopersPage() {
  return (
    <PortalRoutePlaceholder
      specId="ADM-05"
      title="Developer management"
      description="Cross-developer governance, projects, and subscription oversight."
      parentHref="/admin"
      parentLabel="Admin home"
    >
      <p className="mb-4">
        Public developer directory is live at{" "}
        <Link href="/developers" className="font-medium text-primary underline">
          /developers
        </Link>
        . Admin aggregates (suspend org, bulk project review) require{" "}
        <code className="rounded bg-muted px-1 text-xs">GET /v1/admin/developers</code> in a follow-up API
        slice.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href="/developers">Public directory</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/users?role=developer">Users: developers</Link>
        </Button>
      </div>
    </PortalRoutePlaceholder>
  )
}
