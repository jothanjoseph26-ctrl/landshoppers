import Link from "next/link"
import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"
import { Button } from "@/components/ui/button"

export default function AdminKycPage() {
  return (
    <PortalRoutePlaceholder
      specId="ADM-04"
      title="KYC review queue"
      description="Review identity documents for agents, developers, and service providers."
      parentHref="/admin"
      parentLabel="Admin home"
    >
      <p className="mb-4">
        User-level moderation (suspend, role) lives on{" "}
        <Link href="/admin/users" className="font-medium text-primary underline">
          User management
        </Link>
        . Dedicated KYC document queues per persona ship with Dojah integration (§6 cross-cutting).
      </p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/admin/users?role=agent">Filter agents</Link>
      </Button>
    </PortalRoutePlaceholder>
  )
}
