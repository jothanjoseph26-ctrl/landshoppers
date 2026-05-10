"use client"

import Link from "next/link"
import { useState } from "react"
import { ExternalLink, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  fetchAgentInquiries,
  updateInquiryStatus,
} from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"
import type { ApiInquiryStatus } from "@/lib/api/types"

const STATUS_OPTIONS: ApiInquiryStatus[] = ["new", "responded", "touring", "closed", "lost"]

const STATUS_TABS: Array<{ key: "all" | ApiInquiryStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "responded", label: "Responded" },
  { key: "touring", label: "Touring" },
  { key: "closed", label: "Closed" },
  { key: "lost", label: "Lost" },
]

const STATUS_VARIANT: Record<ApiInquiryStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  responded: "secondary",
  touring: "secondary",
  closed: "outline",
  lost: "destructive",
}

export default function AgentLeadsPage() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]["key"]>("all")
  const [pending, setPending] = useState<string | null>(null)

  const inquiries = usePortalData(
    `agent:inquiries:${tab}`,
    () =>
      fetchAgentInquiries({
        pageSize: 50,
        status: tab === "all" ? undefined : tab,
      }),
  )

  if (inquiries.isUnauthenticated) return <PortalAuthRequired />

  const updateStatus = async (id: string, status: ApiInquiryStatus) => {
    setPending(id)
    try {
      await updateInquiryStatus(id, { status })
      toast.success(`Marked ${status}`)
      inquiries.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Lead inbox</h1>
        <p className="text-muted-foreground">Inquiries from buyers across your active listings.</p>
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
          title="Couldn't load leads"
          description="The API returned an error. Please retry."
          onRetry={inquiries.refresh}
        />
      )}

      {inquiries.isLoading && <PortalLoading label="Loading leads…" />}

      {inquiries.data && inquiries.data.data.length === 0 && (
        <PortalEmpty
          title={tab === "all" ? "No leads yet" : `No ${tab} leads`}
          description="Inquiries from buyers will appear here once your listings are live."
          primaryHref="/agent/listings"
          primaryLabel="Manage listings"
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
                      <p className="font-medium">{inq.buyerName ?? "Anonymous buyer"}</p>
                      <span className="text-xs text-muted-foreground">
                        on {inq.listing?.property?.title ?? "(project)"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {inq.buyerEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {inq.buyerEmail}
                        </span>
                      )}
                      {inq.buyerPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {inq.buyerPhone}
                        </span>
                      )}
                      <span>{formatRelativeTime(inq.createdAt)}</span>
                    </div>
                    {inq.message && (
                      <p className="line-clamp-3 max-w-2xl text-sm text-muted-foreground">{inq.message}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={inq.status}
                      onValueChange={(v) => updateStatus(inq.id, v as ApiInquiryStatus)}
                      disabled={pending === inq.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {slug && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/listings/${slug}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Listing
                        </Link>
                      </Button>
                    )}
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
