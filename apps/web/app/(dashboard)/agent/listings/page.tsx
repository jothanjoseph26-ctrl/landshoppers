"use client"

import Link from "next/link"
import { useState } from "react"
import { Eye, Plus, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  fetchAgentListings,
  softDeleteListing,
  submitListing,
} from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatKoboNaira, formatRelativeTime } from "@/lib/format"
import type { ApiListingStatus } from "@/lib/api/types"

const STATUS_VARIANT: Record<ApiListingStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  pending_review: "secondary",
  active: "default",
  paused: "outline",
  rejected: "destructive",
  sold: "outline",
  expired: "outline",
}

const STATUS_LABEL: Record<ApiListingStatus, string> = {
  draft: "Draft",
  pending_review: "In review",
  active: "Active",
  paused: "Paused",
  rejected: "Rejected",
  sold: "Sold",
  expired: "Expired",
}

export default function AgentListingsPage() {
  const listings = usePortalData("agent:listings", () => fetchAgentListings({ pageSize: 50 }))
  const [pending, setPending] = useState<string | null>(null)

  if (listings.isUnauthenticated) return <PortalAuthRequired />

  const handleSubmit = async (id: string) => {
    setPending(id)
    try {
      await submitListing(id)
      toast.success("Listing submitted for review")
      listings.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setPending(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Soft-delete this listing? Buyers will no longer see it.")) return
    setPending(id)
    try {
      await softDeleteListing(id)
      toast.success("Listing removed")
      listings.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">My listings</h1>
          <p className="text-muted-foreground">Manage drafts, review status, and active inventory.</p>
        </div>
        <Button asChild>
          <Link href="/agent/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            New listing
          </Link>
        </Button>
      </div>

      {listings.error && !listings.isForbidden && (
        <PortalError
          title="Couldn't load listings"
          description="The API returned an error. Please retry."
          onRetry={listings.refresh}
        />
      )}

      {listings.isLoading && <PortalLoading label="Loading listings…" />}

      {listings.data && listings.data.data.length === 0 && (
        <PortalEmpty
          title="No listings yet"
          description="Create your first listing to start receiving inquiries from buyers."
          primaryHref="/agent/listings/new"
          primaryLabel="Create listing"
        />
      )}

      {listings.data && listings.data.data.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.data.data.map((listing) => {
                  const property = listing.property
                  const slug = property.slug ?? listing.id
                  const status = listing.status as ApiListingStatus
                  return (
                    <TableRow key={listing.id}>
                      <TableCell className="max-w-[260px] truncate font-medium">
                        {property.title}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {property.city}, {property.state}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                        {status === "rejected" && listing.rejectionReason && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {listing.rejectionReason}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatKoboNaira(listing.price)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRelativeTime(listing.updatedAt)}
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" aria-label="Open listing">
                          <Link href={`/listings/${slug}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {(status === "draft" || status === "rejected") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={pending === listing.id}
                            onClick={() => handleSubmit(listing.id)}
                            aria-label="Submit for review"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={pending === listing.id}
                          onClick={() => handleDelete(listing.id)}
                          aria-label="Delete listing"
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  )
}
