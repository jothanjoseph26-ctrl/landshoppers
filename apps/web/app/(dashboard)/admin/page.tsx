"use client"

import Link from "next/link"
import { ArrowRight, CreditCard, FileText, ListChecks, MessageCircle, Search, Shield, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { fetchAdminPendingListings } from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatKoboNaira, formatRelativeTime } from "@/lib/format"

const QUICK_LINKS = [
  { title: "User management", href: "/admin/users", description: "Roles, KYC, account status", icon: Users },
  { title: "Listing review", href: "/admin/listings", description: "Approve, reject, publish", icon: ListChecks },
  { title: "Payments", href: "/admin/payments", description: "Subscriptions and payouts", icon: CreditCard },
  { title: "WhatsApp", href: "/admin/whatsapp", description: "Bot routing and rules", icon: MessageCircle },
  { title: "SEO", href: "/admin/seo", description: "Sitemaps and meta", icon: Search },
  { title: "Audit logs", href: "/admin/audit-logs", description: "Operational evidence", icon: FileText },
]

export default function AdminDashboardPage() {
  const queue = usePortalData("admin:dashboard-queue", () => fetchAdminPendingListings({ pageSize: 5 }))

  if (queue.isUnauthenticated) return <PortalAuthRequired />

  const pendingCount = queue.data?.meta?.total ?? queue.data?.data.length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Admin Panel</h1>
        <p className="text-muted-foreground">Moderate users, listings, payments, reports, and audit evidence.</p>
      </div>

      {queue.error && !queue.isForbidden && (
        <PortalError
          title="Couldn't load moderation queue"
          description="The API returned an error. Please retry."
          onRetry={queue.refresh}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-sm font-medium">Awaiting review</p>
            <p className="mt-1 text-sm text-muted-foreground">Listings in `pending_review`</p>
            <Button asChild size="sm" variant="ghost" className="mt-2 -ml-2">
              <Link href="/admin/listings">
                Open queue
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <StatPlaceholder title="Users" description="Wired in user-mgmt slice" icon={Users} />
        <StatPlaceholder title="Payments" description="Wired in billing slice" icon={CreditCard} />
        <StatPlaceholder title="Security" description="Audit log review" icon={Shield} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Latest submissions</CardTitle>
            <CardDescription>Top of the moderation queue.</CardDescription>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/listings">
              Open queue <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {queue.isLoading ? (
            <PortalLoading />
          ) : queue.data && queue.data.data.length > 0 ? (
            <ul className="divide-y">
              {queue.data.data.map((listing) => (
                <li key={listing.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{listing.property.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {listing.property.city}, {listing.property.state}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium">{formatKoboNaira(listing.price)}</p>
                    <p className="mt-1 text-muted-foreground">
                      {formatRelativeTime(listing.submittedAt ?? listing.updatedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmpty
              title="Inbox zero"
              description="No listings are awaiting review right now."
              primaryHref="/admin/listings"
              primaryLabel="Refresh queue"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
          <CardDescription>Pin operational workflows that admins reach for daily.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{link.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                </div>
                <link.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function StatPlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: typeof Users
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold">—</p>
          <Badge variant="outline" className="text-xs">
            Pending API
          </Badge>
        </div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
