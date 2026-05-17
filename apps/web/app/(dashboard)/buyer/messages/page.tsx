import Link from "next/link"
import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"
import { Button } from "@/components/ui/button"

export default function BuyerMessagesPage() {
  return (
    <PortalRoutePlaceholder
      specId="BUY-04"
      title="Messages"
      description="In-app threads with agents about listings and tours."
      parentHref="/buyer"
      parentLabel="Buyer dashboard"
    >
      Agent messaging exists at REST <code className="rounded bg-muted px-1 text-xs">/v1/agent/messages</code>.
      Buyer thread endpoints (<code className="rounded bg-muted px-1 text-xs">/v1/me/messages</code>) ship with
      Socket.io (§6). Until then, use inquiries on saved listings.
      <div className="mt-4">
        <Button asChild size="sm">
          <Link href="/buyer/inquiries">View inquiries</Link>
        </Button>
      </div>
    </PortalRoutePlaceholder>
  )
}
