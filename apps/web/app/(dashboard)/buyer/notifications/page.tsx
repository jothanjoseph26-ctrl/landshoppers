import { PortalRoutePlaceholder } from "@/components/dashboard/portal-route-placeholder"

export default function BuyerNotificationsPage() {
  return (
    <PortalRoutePlaceholder
      specId="BUY-08"
      title="Notifications"
      description="In-app alerts for tours, inquiries, and ServiceHub lead updates."
      parentHref="/buyer"
      parentLabel="Buyer dashboard"
    >
      Notification feed requires <code className="rounded bg-muted px-1 text-xs">GET /v1/me/notifications</code>{" "}
      and read-state PATCH. Email/SMS toggles are available under Settings today.
    </PortalRoutePlaceholder>
  )
}
