"use client"

import Link from "next/link"
import { ArrowRight, BadgeCheck, Eye, ListChecks, MessageSquare, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import {
  fetchAgentInquiries,
  fetchAgentListings,
  fetchMe,
} from "@/lib/api/portal"
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
  const me = usePortalData("agent:me", fetchMe)
  const allListings = usePortalData("agent:listings-summary", () => fetchAgentListings({ pageSize: 50 }))
  const newLeads = usePortalData("agent:leads-new", () => fetchAgentInquiries({ status: "new", pageSize: 5 }))
  const allLeads = usePortalData("agent:leads-summary", () => fetchAgentInquiries({ pageSize: 50 }))

  if (me.isUnauthenticated) return <PortalAuthRequired />

  const total = allListings.data?.meta?.total ?? allListings.data?.data.length
  const active = allListings.data?.data.filter((l) => l.status === "active").length ?? 0
  const draft = allListings.data?.data.filter((l) => l.status === "draft").length ?? 0
  const inReview = allListings.data?.data.filter((l) => l.status === "pending_review").length ?? 0
  const newLeadCount = newLeads.data?.meta?.total ?? newLeads.data?.data.length ?? 0
  const allLeadCount = allLeads.data?.meta?.total ?? allLeads.data?.data.length ?? 0
  const isVerified = me.data?.agent?.isVerified ?? false

  const stats = [
    {
      title: "Active listings",
      value: String(active),
      description: total !== undefined ? `${total} total · ${draft} draft · ${inReview} in review` : "",
      icon: ListChecks,
      href: "/agent/listings",
    },
    {
      title: "New leads",
      value: String(newLeadCount),
      description: `${allLeadCount} total in inbox`,
      icon: MessageSquare,
      href: "/agent/leads",
    },
    {
      title: "Profile views",
      value: "—",
      description: "Wired to analytics in the next slice",
      icon: Eye,
      href: "/agent/analytics",
    },
    {
      title: "KYC status",
      value: isVerified ? "Verified" : "Pending",
      description: isVerified ? "Submission approved" : "Open verification",
      icon: BadgeCheck,
      href: "/agent/kyc",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Agent Portal</h1>
          <p className="text-muted-foreground">Manage listings, leads, verification, and subscription status.</p>
        </div>
        <Button asChild>
          <Link href="/agent/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            New listing
          </Link>
        </Button>
      </div>

      {(allListings.error || newLeads.error) && !allListings.isForbidden && (
        <PortalError
          title="Some sections failed to load"
          description="Retry once the API is reachable."
          onRetry={() => {
            allListings.refresh()
            newLeads.refresh()
            allLeads.refresh()
            me.refresh()
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:bg-muted">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm font-medium">{s.title}</p>
                {s.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

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
    </div>
  )
}
