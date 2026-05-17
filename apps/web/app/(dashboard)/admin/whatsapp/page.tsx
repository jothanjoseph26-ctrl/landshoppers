"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Check, Loader2, MessageCircle, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import {
  approveAdminWhatsappReview,
  fetchAdminWhatsappReviews,
  fetchAdminWhatsappSummary,
  rejectAdminWhatsappReview,
  type AdminWhatsappReview,
} from "@/lib/api/admin-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

const STATUS_TABS = [
  { label: "Queue", value: undefined },
  { label: "Processed", value: "PROCESSED" },
  { label: "Pending", value: "PENDING" },
] as const

export default function AdminWhatsappPage() {
  const searchParams = useSearchParams()
  const summary = useSWR("admin:whatsapp-summary", fetchAdminWhatsappSummary)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const queue = usePortalData(`admin:whatsapp-reviews:${statusFilter ?? "queue"}`, () =>
    fetchAdminWhatsappReviews({ pageSize: 50, status: statusFilter }),
  )
  const [pending, setPending] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminWhatsappReview | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminWhatsappReview | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    const status = searchParams.get("status")
    if (status) setStatusFilter(status)
  }, [searchParams])

  useEffect(() => {
    const id = searchParams.get("id")
    if (!id || !queue.data?.data?.length) return
    const row = queue.data.data.find((r) => r.id === id)
    if (row) setDetail(row)
  }, [searchParams, queue.data])

  if (queue.isUnauthenticated) return <PortalAuthRequired />

  const approve = async (row: AdminWhatsappReview) => {
    setPending(row.id)
    try {
      const result = await approveAdminWhatsappReview(row.id)
      toast.success(`Listing created (${result.listing.status})`)
      setDetail(null)
      queue.refresh()
      summary.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed")
    } finally {
      setPending(null)
    }
  }

  const submitReject = async () => {
    if (!rejectTarget) return
    if (rejectReason.trim().length < 4) {
      toast.error("Reason must be at least 4 characters")
      return
    }
    setPending(rejectTarget.id)
    try {
      await rejectAdminWhatsappReview(rejectTarget.id, rejectReason.trim())
      toast.success("Message rejected")
      setRejectTarget(null)
      setRejectReason("")
      setDetail(null)
      queue.refresh()
      summary.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed")
    } finally {
      setPending(null)
    }
  }

  const canModerate = (row: AdminWhatsappReview) =>
    row.status === "PROCESSED" || row.status === "PENDING"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">WhatsApp intake</h1>
        <p className="text-muted-foreground">
          Review AI-extracted listings from inbound WhatsApp messages.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Pending"
          value={summary.data?.pending}
          loading={summary.isLoading}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          title="Ready to review"
          value={summary.data?.processed}
          loading={summary.isLoading}
        />
        <SummaryCard
          title="Approved today"
          value={summary.data?.approvedToday}
          loading={summary.isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.label}
            size="sm"
            variant={statusFilter === tab.value ? "default" : "outline"}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {queue.error && !queue.isForbidden && (
        <PortalError
          title="Couldn't load WhatsApp queue"
          description="The API returned an error. Please retry."
          onRetry={queue.refresh}
        />
      )}

      {queue.isLoading && <PortalLoading label="Loading messages…" />}

      {queue.data && queue.data.data.length === 0 && (
        <PortalEmpty
          title="Queue empty"
          description="No WhatsApp messages match this filter."
          primaryHref="/admin"
          primaryLabel="Back to admin"
        />
      )}

      {queue.data && queue.data.data.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.data.data.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setDetail(row)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{row.senderName ?? row.senderPhone}</span>
                        <Badge variant="secondary" className="w-fit text-xs">
                          {row.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                      {row.textContent ?? row.messageType}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.confidenceScore != null
                        ? `${Math.round(row.confidenceScore * 100)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(row.receivedAt)}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {canModerate(row) && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Approve"
                            disabled={pending === row.id}
                            onClick={() => approve(row)}
                          >
                            {pending === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Reject"
                            disabled={pending === row.id}
                            onClick={() => setRejectTarget(row)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Sheet open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.senderName ?? detail.senderPhone}</SheetTitle>
                <SheetDescription>
                  {detail.status} · {formatRelativeTime(detail.receivedAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                {detail.textContent && (
                  <div>
                    <p className="font-medium">Message</p>
                    <p className="mt-1 text-muted-foreground">{detail.textContent}</p>
                  </div>
                )}
                {detail.mediaUrls.length > 0 && (
                  <div>
                    <p className="font-medium">Media</p>
                    <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                      {detail.mediaUrls.map((url) => (
                        <li key={url} className="truncate">
                          {url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.extractedData != null && (
                  <div>
                    <p className="font-medium">Extracted data</p>
                    <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(detail.extractedData, null, 2)}
                    </pre>
                  </div>
                )}
                {detail.extractionError && (
                  <p className="text-destructive">{detail.extractionError}</p>
                )}
                {canModerate(detail) && (
                  <div className="flex gap-2 pt-2">
                    <Button disabled={pending === detail.id} onClick={() => approve(detail)}>
                      Approve & create listing
                    </Button>
                    <Button
                      variant="outline"
                      disabled={pending === detail.id}
                      onClick={() => setRejectTarget(detail)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject WhatsApp message</DialogTitle>
            <DialogDescription>
              {rejectTarget?.senderName ?? rejectTarget?.senderPhone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="waRejectReason">Reason</Label>
            <Textarea
              id="waRejectReason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Duplicate listing or insufficient property details."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitReject} disabled={pending === rejectTarget?.id}>
              {pending === rejectTarget?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  loading,
  icon,
}: {
  title: string
  value?: number
  loading?: boolean
  icon?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{loading ? "—" : (value ?? 0)}</p>
      </CardContent>
    </Card>
  )
}
