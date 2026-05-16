"use client"

import Link from "next/link"
import { ArrowRight, Briefcase, Calendar, Clock, Heart, MessageSquare, Search } from "lucide-react"

import { BuyerServiceHubPanel } from "@/components/servicehub/dashboard-servicehub-widgets"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import {
  fetchMyInquiries,
  fetchRecentListings,
  fetchSavedListings,
  fetchSavedSearches,
} from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

type StatCard = {
  title: string
  value: string
  description: string
  icon: typeof Heart
  href: string
}

export default function BuyerDashboardPage() {
  const saved = usePortalData("buyer:saved", () => fetchSavedListings({ pageSize: 5 }))
  const searches = usePortalData("buyer:searches", fetchSavedSearches)
  const inquiries = usePortalData("buyer:inquiries", () => fetchMyInquiries({ pageSize: 5 }))
  const recent = usePortalData("buyer:recent", () => fetchRecentListings({ pageSize: 5 }))

  if (saved.isUnauthenticated) {
    return <PortalAuthRequired />
  }

  const isLoading = saved.isLoading || searches.isLoading || inquiries.isLoading || recent.isLoading
  const hasError = saved.error || searches.error || inquiries.error || recent.error

  const stats: StatCard[] = [
    {
      title: "Saved listings",
      value: saved.data ? String(saved.data.meta?.total ?? saved.data.data.length) : "—",
      description: "Homes you are watching",
      icon: Heart,
      href: "/buyer/saved",
    },
    {
      title: "Saved searches",
      value: searches.data ? String(searches.data.length) : "—",
      description: "Filters with email alerts",
      icon: Search,
      href: "/buyer/searches",
    },
    {
      title: "Inquiries",
      value: inquiries.data ? String(inquiries.data.meta?.total ?? inquiries.data.data.length) : "—",
      description: "Messages to agents",
      icon: MessageSquare,
      href: "/buyer/inquiries",
    },
    {
      title: "Recently viewed",
      value: recent.data ? String(recent.data.meta?.total ?? recent.data.data.length) : "—",
      description: "Listings you visited",
      icon: Clock,
      href: "/buyer/recent",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Buyer Dashboard</h1>
        <p className="text-muted-foreground">Track saved homes, inquiries, and saved searches.</p>
      </div>

      {hasError && (
        <PortalError
          title="Some sections failed to load"
          description="Check that the API is reachable and you are signed in."
          onRetry={() => {
            saved.refresh()
            searches.refresh()
            inquiries.refresh()
            recent.refresh()
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card className="h-full transition-colors hover:bg-muted">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium">{stat.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <BuyerServiceHubPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent inquiries</CardTitle>
              <CardDescription>Latest messages you sent to agents.</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/buyer/inquiries">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {inquiries.isLoading ? (
              <PortalLoading />
            ) : inquiries.data && inquiries.data.data.length > 0 ? (
              <ul className="divide-y">
                {inquiries.data.data.slice(0, 5).map((inq) => (
                  <li key={inq.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {inq.listing?.property?.title ?? "Project inquiry"}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {inq.message ?? "(no message)"}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-medium uppercase tracking-wide text-muted-foreground">
                        {inq.status}
                      </p>
                      <p className="mt-1 text-muted-foreground">{formatRelativeTime(inq.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <PortalEmpty
                title="No inquiries yet"
                description="When you message an agent from a listing, your conversation will appear here."
                primaryHref="/listings"
                primaryLabel="Browse listings"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Saved searches</CardTitle>
              <CardDescription>Get email alerts when new listings match.</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/buyer/searches">
                Manage
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {searches.isLoading ? (
              <PortalLoading />
            ) : searches.data && searches.data.length > 0 ? (
              <ul className="divide-y">
                {searches.data.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.name ?? "Untitled search"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.alertFrequency} alerts · {s.emailAlerts ? "email on" : "email off"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(s.updatedAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <PortalEmpty
                title="No saved searches"
                description="Run a search and save it to receive alerts when matching listings go live."
                primaryHref="/listings"
                primaryLabel="Search listings"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next actions</CardTitle>
          <CardDescription>Common entry points for buyers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <ActionTile href="/listings" title="Browse listings" description="Find active properties in the marketplace." />
          <ActionTile href="/agents" title="Find agents" description="Contact verified professionals." />
          <ActionTile href="/buyer/services" title="Property services" description="ServiceHub quotes, bundles, and specialists." icon={Briefcase} />
          <ActionTile href="/buyer/tours" title="Schedule a tour" description="Book in-person or virtual visits." icon={Calendar} />
        </CardContent>
      </Card>

      {isLoading && !hasError && (
        <p className="text-xs text-muted-foreground">Refreshing dashboard…</p>
      )}
    </div>
  )
}

function ActionTile({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string
  title: string
  description: string
  icon?: typeof Heart
}) {
  return (
    <Link href={href} className="rounded-lg border p-4 transition-colors hover:bg-muted">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </Link>
  )
}
