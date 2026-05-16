"use client"

import Link from "next/link"
import { ArrowRight, Plus, TrendingDown, TrendingUp, Minus } from "lucide-react"

import { AgentPreferredPartnersPanel } from "@/components/servicehub/dashboard-servicehub-widgets"
import { TierGate } from "@/components/dashboard/tier-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { fetchAgentContext, fetchAgentDashboard } from "@/lib/api/agent-portal"
import { fetchAgentInquiries, fetchAgentListings } from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatKoboNaira, formatRelativeTime } from "@/lib/format"
import type { ApiInquiryStatus } from "@/lib/api/types"

const STATUS_VARIANT: Record<ApiInquiryStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  responded: "secondary",
  touring: "secondary",
  closed: "outline",
  lost: "destructive",
}

export default function AgentDashboardPage() {
  const ctx = usePortalData("agent-portal:context", fetchAgentContext)
  const dash = usePortalData("agent-portal:dashboard", fetchAgentDashboard)
  const allListings = usePortalData("agent:listings-summary", () => fetchAgentListings({ pageSize: 50 }))
  const newLeads = usePortalData("agent:leads-new", () => fetchAgentInquiries({ status: "new", pageSize: 5 }))

  if (ctx.isUnauthenticated) return <PortalAuthRequired />

  const total = allListings.data?.meta?.total ?? allListings.data?.data.length
  const draft = allListings.data?.data.filter((l) => l.status === "draft").length ?? 0
  const inReview = allListings.data?.data.filter((l) => l.status === "pending_review").length ?? 0

  function trendIconFn(changePercent: number | null | undefined) {
    if (changePercent == null) return Minus
    if (changePercent > 0) return TrendingUp
    if (changePercent < 0) return TrendingDown
    return Minus
  }

  function trendTextFn(changePercent: number | null | undefined): string {
    if (changePercent == null) return "—"
    if (changePercent > 0) return `+${changePercent}%`
    if (changePercent < 0) return `${changePercent}%`
    return "0%"
  }

  const kpis = dash.data?.kpis

  type StatTile = {
    title: string
    value: string
    description: string
    href: string
    changePercent: number | null | undefined
  }

  const stats: StatTile[] = kpis && dash.data
    ? [
        {
          title: "Active listings",
          value: String(kpis.activeListings.value),
          description:
            dash.data.limits.maxActiveListings != null
              ? `${dash.data.usage.activeListings} / ${dash.data.limits.maxActiveListings} on plan`
              : total !== undefined
                ? `${total} total · ${draft} draft · ${inReview} in review`
                : "",
          href: "/agent/listings",
          changePercent: kpis.activeListings.changePercent,
        },
        {
          title: "Hot leads",
          value: kpis.hotLeads.leadScoringAvailable ? String(kpis.hotLeads.count) : "0",
          description: kpis.hotLeads.leadScoringAvailable
            ? "AI-scored (≥70)"
            : "Lead scoring rolls out in a later slice",
          href: "/agent/leads",
          changePercent: null,
        },
        {
          title: "WhatsApp today",
          value: String(kpis.whatsappMessagesToday.count),
          description: kpis.whatsappMessagesToday.bridgeConnected
            ? "Messages scanned today"
            : "Bridge not connected — upgrade on Subscription",
          href: "/agent/subscription",
          changePercent: null,
        },
        {
          title: "Views this week",
          value: String(kpis.viewsThisWeek.value),
          description: `Buyer views (7d) · vs prior week ${trendTextFn(kpis.viewsThisWeek.changePercent)}`,
          href: "/agent/analytics",
          changePercent: kpis.viewsThisWeek.changePercent,
        },
        {
          title: "Conversion (30d)",
          value:
            kpis.conversionLast30d.ratePercent != null ? `${kpis.conversionLast30d.ratePercent}%` : "—",
          description: `${kpis.conversionLast30d.responded} / ${kpis.conversionLast30d.total} inquiries`,
          href: "/agent/leads",
          changePercent: null,
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Command Center</h1>
          <p className="text-muted-foreground">
            Listings, leads, and KPIs — synced from your LandShoppers agent account.
          </p>
        </div>
        <Button asChild>
          <Link href="/agent/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            New listing
          </Link>
        </Button>
      </div>

      {(ctx.error || dash.error || allListings.error || newLeads.error) &&
        !ctx.isForbidden &&
        !dash.isForbidden && (
        <PortalError
          title="Some sections failed to load"
          description="Retry once the API is reachable."
          onRetry={() => {
            ctx.refresh()
            dash.refresh()
            allListings.refresh()
            newLeads.refresh()
          }}
        />
      )}

      {dash.isLoading && !dash.data ? (
        <PortalLoading />
      ) : dash.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {stats.map((s) => {
            const Ticon = trendIconFn(s.changePercent)
            const tw = trendTextFn(s.changePercent)
            return (
            <Link key={s.title} href={s.href}>
              <Card className="h-full transition-colors hover:bg-muted">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                    {s.changePercent != null ? (
                      <Ticon
                        className={`mt-1 h-4 w-4 shrink-0 ${
                          tw.startsWith("+")
                            ? "text-emerald-600"
                            : tw.startsWith("-")
                              ? "text-red-600"
                              : "text-muted-foreground"
                        }`}
                        aria-hidden
                      />
                    ) : s.title === "Views this week" ? (
                      <Ticon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    ) : null}
                  </div>
                  <p className="text-sm font-medium">{s.title}</p>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
            )
          })}
          <div className="min-h-[120px] sm:col-span-2 xl:col-span-1 2xl:col-span-1">
            <TierGate minTier="pro" currentTier={dash.data.tier}>
              <Card className="h-full border-primary/20 bg-primary/5">
                <CardContent className="p-5">
                  <p className="text-2xl font-bold tabular-nums">
                    {kpis?.estimatedMonthlyEarningsNgKobo != null
                      ? formatKoboNaira(kpis.estimatedMonthlyEarningsNgKobo)
                      : "—"}
                  </p>
                  <p className="text-sm font-medium">Est. monthly earnings</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Heuristic from lifetime commission ÷ 12 (refine with billing data later).
                  </p>
                </CardContent>
              </Card>
            </TierGate>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent listings</CardTitle>
              <CardDescription>Most recently updated inventory.</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/agent/listings">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {allListings.isLoading ? (
              <PortalLoading />
            ) : allListings.data && allListings.data.data.length > 0 ? (
              <ul className="divide-y">
                {allListings.data.data.slice(0, 5).map((listing) => (
                  <li key={listing.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{listing.property.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {listing.property.city}, {listing.property.state}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-medium">{formatKoboNaira(listing.price)}</p>
                      <p className="mt-1 text-muted-foreground">{listing.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <PortalEmpty
                title="No listings yet"
                description="Create your first listing to start receiving leads."
                primaryHref="/agent/listings/new"
                primaryLabel="Create listing"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>New leads</CardTitle>
              <CardDescription>Buyers awaiting a first response.</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/agent/leads">
                Open inbox <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {newLeads.isLoading ? (
              <PortalLoading />
            ) : newLeads.data && newLeads.data.data.length > 0 ? (
              <ul className="divide-y">
                {newLeads.data.data.map((inq) => (
                  <li key={inq.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {inq.buyerName ?? "Anonymous"}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {inq.message ?? "(no message)"}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <Badge variant={STATUS_VARIANT[inq.status]} className="capitalize">
                        {inq.status}
                      </Badge>
                      <p className="mt-1 text-muted-foreground">{formatRelativeTime(inq.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <PortalEmpty
                title="No new leads"
                description="When a buyer messages you, the lead will appear here."
                primaryHref="/agent/leads"
                primaryLabel="Open inbox"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <AgentPreferredPartnersPanel />
    </div>
  )
