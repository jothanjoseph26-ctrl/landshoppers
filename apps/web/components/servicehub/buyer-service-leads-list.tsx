"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ExternalLink, Loader2, Star } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import {
  fetchBuyerServiceLeads,
  postBuyerServiceLeadReview,
  type ApiBuyerServiceLead,
  type PostBuyerServiceLeadReviewBody,
} from "@/lib/api/buyer-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  quoted: "Quoted",
  negotiating: "Negotiating",
  accepted: "Accepted",
  completed: "Completed",
  cancelled: "Cancelled",
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "completed":
      return "default"
    case "cancelled":
      return "destructive"
    case "accepted":
    case "quoted":
      return "secondary"
    default:
      return "outline"
  }
}

function providerProfileHref(lead: ApiBuyerServiceLead): string {
  const category = lead.provider.category || "legal"
  return `/services/${category}/${lead.provider.slug}`
}

type Props = {
  compact?: boolean
}

export function BuyerServiceLeadsList({ compact = false }: Props) {
  const leads = usePortalData("buyer:service-leads", fetchBuyerServiceLeads)
  const [reviewTarget, setReviewTarget] = useState<ApiBuyerServiceLead | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  const rows = leads.data?.data ?? []
  const displayRows = useMemo(() => (compact ? rows.slice(0, 5) : rows), [compact, rows])

  if (leads.isUnauthenticated) {
    return <PortalAuthRequired portalHref="/login?next=/buyer/services" />
  }

  const submitReview = async (body: PostBuyerServiceLeadReviewBody) => {
    if (!reviewTarget) return
    setPending(reviewTarget.id)
    try {
      await postBuyerServiceLeadReview(reviewTarget.id, body)
      toast.success("Review submitted")
      setReviewTarget(null)
      void leads.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Review failed")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className={cn(compact ? "space-y-3" : "space-y-6")}>
      {leads.error && !leads.isForbidden && (
        <PortalError
          title="Couldn't load service requests"
          description="The API returned an error. Please retry."
          onRetry={leads.refresh}
        />
      )}

      {leads.isLoading && <PortalLoading label="Loading service requests…" />}

      {leads.data && rows.length === 0 && (
        <PortalEmpty
          title="No service requests yet"
          description="Request a quote from the ServiceHub directory or listing recommendations — your pipeline appears here."
          primaryHref="/services"
          primaryLabel="Browse ServiceHub"
        />
      )}

      {leads.data && displayRows.length > 0 && (
        <ul className={cn("space-y-3", !compact && "space-y-4")}>
          {displayRows.map((lead) => (
            <li key={lead.id}>
              <Card className="shadow-none">
                <CardContent className={cn("p-4", compact && "p-3")}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={providerProfileHref(lead)}
                          className="font-semibold hover:text-primary"
                        >
                          {lead.provider.businessName}
                        </Link>
                        <Badge variant={statusVariant(lead.status)} className="capitalize">
                          {STATUS_LABELS[lead.status] ?? lead.status}
                        </Badge>
                      </div>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {lead.serviceRequested}
                        {lead.location ? ` · ${lead.location}` : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {formatRelativeTime(lead.createdAt)}
                        {lead.respondedAt
                          ? ` · Responded ${formatRelativeTime(lead.respondedAt)}`
                          : null}
                        {lead.completedAt
                          ? ` · Completed ${formatRelativeTime(lead.completedAt)}`
                          : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={providerProfileHref(lead)}>
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Profile
                        </Link>
                      </Button>
                      {lead.status === "completed" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={pending === lead.id}
                          onClick={() => setReviewTarget(lead)}
                        >
                          {pending === lead.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Star className="mr-1 h-4 w-4" />
                              Leave review
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {compact && rows.length > 5 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing 5 of {rows.length} requests.{" "}
          <Link href="/buyer/services" className="font-medium text-primary underline">
            View all
          </Link>
        </p>
      )}

      <ReviewDialog
        lead={reviewTarget}
        pending={Boolean(pending)}
        onClose={() => setReviewTarget(null)}
        onSubmit={submitReview}
      />
    </div>
  )
}

function ReviewDialog({
  lead,
  pending,
  onClose,
  onSubmit,
}: {
  lead: ApiBuyerServiceLead | null
  pending: boolean
  onClose: () => void
  onSubmit: (body: PostBuyerServiceLeadReviewBody) => Promise<void>
}) {
  const [overallRating, setOverallRating] = useState(5)
  const [qualityRating, setQualityRating] = useState(5)
  const [communicationRating, setCommunicationRating] = useState(5)
  const [timelinessRating, setTimelinessRating] = useState(5)
  const [valueRating, setValueRating] = useState(5)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const reset = () => {
    setOverallRating(5)
    setQualityRating(5)
    setCommunicationRating(5)
    setTimelinessRating(5)
    setValueRating(5)
    setTitle("")
    setBody("")
  }

  return (
    <Dialog
      open={Boolean(lead)}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          reset()
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a review</DialogTitle>
          <DialogDescription>
            {lead
              ? `Share your experience with ${lead.provider.businessName} for "${lead.serviceRequested}".`
              : null}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit({
              overallRating,
              qualityRating,
              communicationRating,
              timelinessRating,
              valueRating,
              title: title.trim(),
              body: body.trim(),
            })
          }}
        >
          <RatingRow label="Overall" value={overallRating} onChange={setOverallRating} />
          <RatingRow label="Quality" value={qualityRating} onChange={setQualityRating} />
          <RatingRow
            label="Communication"
            value={communicationRating}
            onChange={setCommunicationRating}
          />
          <RatingRow label="Timeliness" value={timelinessRating} onChange={setTimelinessRating} />
          <RatingRow label="Value" value={valueRating} onChange={setValueRating} />
          <div className="space-y-2">
            <Label htmlFor="review-title">Title</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-body">Review</Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              minLength={10}
              maxLength={2000}
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || title.trim().length < 2 || body.trim().length < 10}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-sm">{label}</Label>
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} rating`}
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} stars
          </option>
        ))}
      </select>
    </div>
  )
}