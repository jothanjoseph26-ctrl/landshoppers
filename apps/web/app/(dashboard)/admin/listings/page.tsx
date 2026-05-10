"use client"

import Link from "next/link"
import { useState } from "react"
import { Check, ExternalLink, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import {
  adminApproveListing,
  adminRejectListing,
  fetchAdminPendingListings,
} from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatKoboNaira, formatRelativeTime } from "@/lib/format"

export default function AdminListingsPage() {
  const queue = usePortalData("admin:pending-listings", () => fetchAdminPendingListings({ pageSize: 50 }))
  const [pending, setPending] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  if (queue.isUnauthenticated) return <PortalAuthRequired />

  const approve = async (id: string) => {
    setPending(id)
    try {
      await adminApproveListing(id)
      toast.success("Listing approved")
      queue.refresh()
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
      await adminRejectListing(rejectTarget.id, rejectReason.trim())
      toast.success("Listing rejected")
      setRejectTarget(null)
      setRejectReason("")
      queue.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Listing moderation</h1>
        <p className="text-muted-foreground">Review listings submitted by agents and developers.</p>
      </div>

      {queue.error && !queue.isForbidden && (
        <PortalError
          title="Couldn't load moderation queue"
          description="The API returned an error. Please retry."
          onRetry={queue.refresh}
        />
      )}

      {queue.isLoading && <PortalLoading label="Loading queue…" />}

      {queue.data && queue.data.data.length === 0 && (
        <PortalEmpty
          title="Inbox zero"
          description="There are no listings awaiting review right now."
          primaryHref="/admin"
          primaryLabel="Back to admin home"
        />
      )}

      {queue.data && queue.data.data.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.data.data.map((listing) => {
                  const property = listing.property
                  const slug = property.slug ?? listing.id
                  return (
                    <TableRow key={listing.id}>
                      <TableCell className="max-w-[300px]">
                        <div className="flex flex-col gap-1">
                          <Link href={`/listings/${slug}`} className="font-medium hover:text-primary">
                            {property.title}
                          </Link>
                          <Badge variant="secondary" className="w-fit text-xs">
                            {listing.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {property.city}, {property.state}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatKoboNaira(listing.price)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRelativeTime(listing.submittedAt ?? listing.updatedAt)}
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" aria-label="Open listing">
                          <Link href={`/listings/${slug}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Approve"
                          disabled={pending === listing.id}
                          onClick={() => approve(listing.id)}
                        >
                          {pending === listing.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Reject"
                          disabled={pending === listing.id}
                          onClick={() => setRejectTarget({ id: listing.id, title: property.title })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
            <DialogDescription>
              {rejectTarget?.title}
              <span className="mt-1 block text-xs">
                The reason will be visible to the listing owner so they can revise their submission.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectReason">Reason</Label>
            <Textarea
              id="rejectReason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Listing photos are incomplete; please add more interior shots."
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
