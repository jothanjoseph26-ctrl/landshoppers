"use client"

import Link from "next/link"
import {
  ArrowRight,
  Briefcase,
  Handshake,
  Layers,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

/** BUY-01 — buyer dashboard ServiceHub strip (Phase C: stub until buyer service-lead API exists). */
export function BuyerServiceHubPanel({
  variant = "card",
}: {
  variant?: "card" | "page"
}) {
  const wrap =
    variant === "page" ? "mx-auto max-w-3xl space-y-8" : ""

  const inner = (
    <Card className={variant === "page" ? "border-muted" : "border-primary/15 bg-primary/[0.03]"}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-lg">Your property services</CardTitle>
            <CardDescription>
              Quotes and jobs you start from ServiceHub appear here with status and next steps — the
              ledger API is wired in a later slice.
            </CardDescription>
          </div>
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link href="/buyer/services">
            Open hub
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No active service requests yet</p>
          <p className="mx-auto mt-2 max-w-md">
            Request a quote from listing recommendations or the public directory — when lead
            syncing is enabled for buyers, your pipeline will render here automatically.
          </p>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="default">
            <Link href="/services">ServiceHub directory</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/listings">Browse listings</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/services/bundles">
              <Layers className="mr-1.5 h-4 w-4" />
              Bundles
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <section className={wrap} aria-labelledby="buyer-servicehub-heading">
      <h2 id="buyer-servicehub-heading" className="sr-only">
        ServiceHub
      </h2>
      {inner}
    </section>
  )
}

/** AGT-01 preferred partners strip (Phase C: shell before `agent_preferred_partners` APIs). */
export function AgentPreferredPartnersPanel() {
  return (
    <Card className="border-primary/15 bg-primary/[0.03]">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Handshake className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-lg">Preferred service partners</CardTitle>
            <CardDescription>
              Pin surveyors, lawyers, and media partners you trust — refer clients in one tap once
              referrals are connected to ServiceHub.
            </CardDescription>
          </div>
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link href="/agent/partners">
            Manage partners
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickStat icon={Users} label="Pinned partners" value="0" />
          <QuickStat icon={Sparkles} label="Referral credits" value="₦0" />
          <QuickStat icon={MapPin} label="Directory coverage" value="Nationwide" />
        </div>
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No pinned providers yet</p>
          <p className="mx-auto mt-2 max-w-xl">
            Search ServiceHub for professionals in your sellers&apos; neighbourhoods, then favourite
            them here when the pin API lands.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/services">Browse ServiceHub</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/agent/listings">Back to listings</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}
