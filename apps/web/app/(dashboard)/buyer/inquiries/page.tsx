"use client"

import Link from "next/link"
import { useState } from "react"
import { ExternalLink, MessageSquare, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import {
  fetchMyInquiries,
  updateInquiryStatus,
} from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"
import type { ApiInquiryStatus } from "@/lib/api/types"

const STATUS_TABS: Array<{ key: "all" | ApiInquiryStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "responded", label: "Responded" },
  { key: "touring", label: "Touring" },
  { key: "closed", label: "Closed" },
]

const STATUS_VARIANT: Record<ApiInquiryStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  responded: "secondary",
  touring: "secondary",
  closed: "outline",
  lost: "destructive",
}

export default function BuyerInquiriesPage() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]["key"]>("all")
  const [pending, setPending] = useState<string | null>(null)

  const inquiries = usePortalData(
    `buyer:inquiries:${tab}`,
    () =>
      fetchMyInquiries({
        pageSize: 50,
        status: tab === "all" ? undefined : tab,
      }),
  )

  if (inquiries.isUnauthenticated) return <PortalAuthRequired />

  const closeInquiry = async (id: string) => {
    setPending(id)
    try {
      await updateInquiryStatus(id, { status: "closed", closedReason: "Closed by buyer" })
      toast.success("Inquiry closed")
      inquiries.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close inquiry")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Inquiries</h1>
        <p className="text-muted-foreground">Messages you sent to agents and developers.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {inquiries.error && !inquiries.isForbidden && (
        <PortalError
          title="Couldn't load inquiries"
          description="The API returned an error. Please retry."
          onRetry={inquiries.refresh}
        />
      )}

      {inquiries.isLoading && <PortalLoading label="Loading inquiries…" />}

      {inquiries.data && inquiries.data.data.length === 0 && (
        <PortalEmpty
          title={tab === "all" ? "No inquiries yet" : `No ${tab} inquiries`}
          description="When you message an agent from a listing, your conversation will appear here."
          primaryHref="/listings"
          primaryLabel="Browse listings"
        />
      )}

      {inquiries.data && inquiries.data.data.length > 0 && (
        <Card>
          <CardContent className="divide-y p-0">
            {inquiries.data.data.map((inq) => {
              const slug = inq.listing?.property?.slug
              return (
                <div key={inq.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_VARIANT[inq.status]} className="capitalize">
                        {inq.status}
                      </Badge>
                      <p className="font-medium">
                        {inq.listing?.property?.title ?? "Project inquiry"}
                      </p>
                    </div>
                    {inq.message && (
                      <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">{inq.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Sent {formatRelativeTime(inq.createdAt)}
                      {inq.respondedAt ? ` · responded ${formatRelativeTime(inq.respondedAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {slug && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/listings/${slug}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Listing
                        </Link>
                      </Button>
                    )}
                    {inq.status !== "closed" && inq.status !== "lost" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => closeInquiry(inq.id)}
                        disabled={pending === inq.id}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Close
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link href={slug ? `/listings/${slug}#contact` : "#"}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Reply
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
