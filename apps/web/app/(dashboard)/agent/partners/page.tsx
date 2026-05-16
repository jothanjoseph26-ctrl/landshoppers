import Link from "next/link"

import { AgentPreferredPartnersPanel } from "@/components/servicehub/dashboard-servicehub-widgets"

export default function AgentServicePartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Service partners</h1>
        <p className="text-muted-foreground">
          Build your bench of photographers, solicitors, surveyors, and stylists — the pin list and
          referral ledger connect when ServiceHub exposes agent-preferred-partner mutations.
        </p>
      </div>

      <AgentPreferredPartnersPanel />

      <div className="max-w-3xl rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Coming from ServiceHub Sprint C/D</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Instant recommendations to WhatsApp/email with buyer consent.</li>
          <li>Referral attribution when a partner closes fees with your client.</li>
          <li>Sync pins across your team on LandShoppers Business.</li>
        </ul>
        <p className="mt-4">
          Until then, keep recommending via{" "}
          <Link href="/services" className="font-medium text-foreground underline underline-offset-4">
            shared directory links
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
