import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function BuyerToursPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Tours</h1>
        <p className="text-muted-foreground">In-person and virtual visits scheduled with agents.</p>
      </div>
      <PortalEmpty
        title="Tour scheduling coming soon"
        description="Tour requests will hook into the tour-requests API once Agent 2 ships the contract. You can still send inquiries today."
        primaryHref="/buyer/inquiries"
        primaryLabel="View inquiries"
      />
    </div>
  )
}
