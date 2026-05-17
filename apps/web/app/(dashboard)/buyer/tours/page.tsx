"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ExternalLink, Loader2, X } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { cancelBuyerTour, fetchBuyerTours, type ApiBuyerTour } from "@/lib/api/buyer-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

type TabKey = "upcoming" | "past" | "cancelled"

function filterTours(tours: ApiBuyerTour[], tab: TabKey): ApiBuyerTour[] {
  const now = Date.now()
  if (tab === "upcoming") {
    return tours.filter(
      (t) =>
        (t.status === "pending" || t.status === "confirmed") && new Date(t.preferredDate).getTime() >= now,
    )
  }
  if (tab === "cancelled") return tours.filter((t) => t.status === "cancelled")
  return tours.filter(
    (t) => t.status === "completed" || (t.status !== "cancelled" && new Date(t.preferredDate).getTime() < now),
  )
}

export default function BuyerToursPage() {
  const [tab, setTab] = useState<TabKey>("upcoming")
  const [cancelTarget, setCancelTarget] = useState<ApiBuyerTour | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [pending, setPending] = useState<string | null>(null)

  const tours = usePortalData("buyer:tours", () => fetchBuyerTours({ pageSize: 50 }))

  const filtered = useMemo(
    () => (tours.data ? filterTours(tours.data.data, tab) : []),
    [tours.data, tab],
  )

  if (tours.isUnauthenticated) return <PortalAuthRequired />

  const submitCancel = async () => {
    if (!cancelTarget) return
    setPending(cancelTarget.id)
    try {
      await cancelBuyerTour(cancelTarget.id, cancelReason.trim() || undefined)
      toast.success("Tour cancelled")
      setCancelTarget(null)
      setCancelReason("")
      void tours.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Tours</h1>
        <p className="text-muted-foreground">In-person and virtual visits scheduled with agents.</p>
      </div>

      {tours.error && !tours.isForbidden && (
        <PortalError
          title="Couldn't load tours"
          description="The API returned an error. Please retry."
          onRetry={tours.refresh}
        />
      )}

      {tours.isLoading && <PortalLoading label="Loading tours…" />}

      {tours.data && tours.data.data.length === 0 && (
        <PortalEmpty
          title="No tour requests yet"
          description="Request a tour from a listing page to schedule a visit with the listing agent."
          primaryHref="/listings"
          primaryLabel="Browse listings"
        />
      )}

      {tours.data && tours.data.data.length > 0 && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <Card className="border-dashed shadow-none">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No tours in this tab.
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-none overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-medium">{t.listing.title}</div>
                          <div className="text-muted-foreground text-xs">
                            {t.listing.city}
                            {t.agent?.agencyName ? ` · ${t.agent.agencyName}` : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(t.preferredDate).toLocaleDateString()}
                          {t.preferredTime ? ` · ${t.preferredTime}` : null}
                          <span className="text-muted-foreground text-xs block">
                            {formatRelativeTime(t.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="capitalize text-sm">{t.tourType.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/listings/${t.listing.slug}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {(t.status === "pending" || t.status === "confirmed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={pending === t.id}
                              onClick={() => {
                                setCancelTarget(t)
                                setCancelReason("")
                              }}
                            >
                              {pending === t.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel tour</DialogTitle>
            <DialogDescription>
              {cancelTarget
                ? `Cancel your ${cancelTarget.tourType.replace("_", " ")} tour for ${cancelTarget.listing.title}?`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">Reason (optional)</Label>
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Schedule conflict, found another property…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep tour
            </Button>
            <Button variant="destructive" disabled={!!pending} onClick={() => void submitCancel()}>
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
