import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AgentSubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Subscription</h1>
        <p className="text-muted-foreground">Manage your plan, invoices, and payment methods.</p>
      </div>
      <PortalEmpty
        title="Billing UI in progress"
        description="The subscription page will hook into the billing API once Paystack/Stripe integration ships."
        primaryHref="/agent"
        primaryLabel="Back to portal"
      />
    </div>
  )
}
