"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Check, Loader2, X } from "lucide-react"
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
  approveAdminSeoVariant,
  fetchAdminSeoSummary,
  fetchAdminSeoVariants,
  rejectAdminSeoVariant,
} from "@/lib/api/admin-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

export default function AdminSeoPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
      <AdminSeoPageInner />
    </Suspense>
  )
}

function AdminSeoPageInner() {
  const searchParams = useSearchParams()
  const summary = useSWR("admin:seo-summary", fetchAdminSeoSummary)
  const [statusFilter, setStatusFilter] = useState<string>("draft")
  const queue = usePortalData(`admin:seo-variants:${statusFilter}`, () =>
    fetchAdminSeoVariants({ pageSize: 50, status: statusFilter }),
  )
  const [pending, setPending] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    const status = searchParams.get("status")
    if (status) setStatusFilter(status)
  }, [searchParams])

  if (queue.isUnauthenticated) return <PortalAuthRequired />

  const approve = async (id: string) => {
    setPending(id)
    try {
      await approveAdminSeoVariant(id)
      toast.success("SEO variant approved")
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
      await rejectAdminSeoVariant(rejectTarget.id, rejectReason.trim())
      toast.success("Variant rejected")
      setRejectTarget(null)
      setRejectReason("")
      queue.refresh()
      summary.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">SEO variants</h1>
        <p className="text-muted-foreground">Approve AI-generated copy before publishing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Draft" value={summary.data?.draft} loading={summary.isLoading} />
        <SummaryCard title="Approved" value={summary.data?.approved} loading={summary.isLoading} />
        <SummaryCard
          title="Scheduled"
          value={summary.data?.pendingPost}
          loading={summary.isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["draft", "approved", "scheduled", "rejected"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {queue.error && !queue.isForbidden && (
        <PortalError
          title="Couldn't load SEO queue"
          description="The API returned an error. Please retry."
          onRetry={queue.refresh}
        />
      )}

      {queue.isLoading && <PortalLoading label="Loading variants…" />}

      {queue.data && queue.data.data.length === 0 && (
        <PortalEmpty
          title="No variants"
          description="No SEO variants match this filter."
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
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.data.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[280px]">
                      <p className="font-medium truncate">{row.seoTitle ?? "Untitled"}</p>
                      {row.metaDescription && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {row.metaDescription}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.variantType}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(row.createdAt)}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      {row.status === "draft" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Approve"
                            disabled={pending === row.id}
                            onClick={() => approve(row.id)}
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
                            onClick={() =>
                              setRejectTarget({
                                id: row.id,
                                title: row.seoTitle ?? "Untitled variant",
                              })
                            }
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

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject SEO variant</DialogTitle>
            <DialogDescription>{rejectTarget?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="seoRejectReason">Reason</Label>
            <Textarea
              id="seoRejectReason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tone mismatch or inaccurate property details."
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
}: {
  title: string
  value?: number
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{loading ? "—" : (value ?? 0)}</p>
      </CardContent>
    </Card>
  )
}
