import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Payments</h1>
        <p className="text-muted-foreground">Subscriptions, payouts, and refund tooling.</p>
      </div>
      <PortalEmpty
        title="Payments tooling pending"
        description="Subscription and payout APIs land alongside the billing slice."
        primaryHref="/admin"
        primaryLabel="Back to admin"
      />
    </div>
  )
}
