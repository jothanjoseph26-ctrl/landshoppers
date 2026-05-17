import Link from "next/link"

import { BuyerServiceLeadsList } from "@/components/servicehub/buyer-service-leads-list"

export default function BuyerServicesHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Property services</h1>
        <p className="text-muted-foreground">
          Track lawyers, surveyors, and other specialists you engage through LandShoppers ServiceHub.
        </p>
      </div>

      <BuyerServiceLeadsList />

      <div className="mx-auto max-w-3xl text-sm text-muted-foreground">
        <p>
          Need something now? Jump to{" "}
          <Link href="/services" className="font-medium text-foreground underline underline-offset-4">
            ServiceHub directory
          </Link>{" "}
          — every contextual match block on listings also deep-links quotes with your property
          context.
        </p>
      </div>
    </div>
  )
}
