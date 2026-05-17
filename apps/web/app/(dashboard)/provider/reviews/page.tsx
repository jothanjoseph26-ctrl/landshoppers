"use client"

import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { Loader2, RefreshCw, Star } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import {
  fetchProviderReviews,
  patchProviderReview,
  type ApiProviderReview,
} from "@/lib/api/provider-portal"
import { getAccessToken } from "@/lib/api/auth-session"

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < full ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
          aria-hidden
        />
      ))}
    </div>
  )
}

export default function ProviderReviewsPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { text: string; saving?: boolean }>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null
  const listKey = token ? (["provider-reviews"] as const) : null

  const { data: listRes, error: listErr, isLoading, mutate } = useSWR(listKey, () =>
    fetchProviderReviews({ page: 1, pageSize: 50 }),
  )

  const rows: ApiProviderReview[] = listRes?.data ?? []

  const loadError = useMemo(() => {
    if (!listErr) return null
    return listErr instanceof ApiRequestError ? JSON.stringify(listErr.body) : String(listErr)
  }, [listErr])

  async function saveReply(id: string, existing: string | null) {
    const text = drafts[id]?.text ?? ""
    const trimmed = text.trim()
    if (trimmed === (existing ?? "").trim()) return
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], text, saving: true } }))
    setErr(null)
    try {
      await patchProviderReview(id, { providerResponse: trimmed })
      await mutate()
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Save failed")
      setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], saving: false } }))
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    )
  }

  if (!token) {
    return (
      <Card className="max-w-lg border-dashed shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Sign in required</CardTitle>
          <CardDescription>Reviews are available to verified service provider accounts.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Respond to buyer feedback and protect your reputation (PRV-07).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </Button>
      </div>

      {(err || loadError) && (
        <p className="text-destructive text-sm" role="alert">
          {err ?? loadError}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading reviews…
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed bg-muted/30 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">No reviews yet</CardTitle>
            <CardDescription>Completed jobs with ratings will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => {
            const replyValue = drafts[row.id]?.text ?? row.providerResponse ?? ""
            const baseline = row.providerResponse ?? ""
            const dirty = replyValue.trim() !== baseline.trim()
            return (
              <li key={row.id}>
                <Card className="shadow-none">
                  <CardHeader className="space-y-2 pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Stars rating={row.overallRating} />
                          <span className="text-sm font-medium">{row.overallRating.toFixed(1)}</span>
                          {row.isJobVerified ? (
                            <Badge variant="outline">Verified job</Badge>
                          ) : null}
                        </div>
                        <CardTitle className="text-base">{row.title}</CardTitle>
                        <CardDescription>
                          {row.reviewerLabel} · {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{row.body}</p>
                    <div className="space-y-2 border-t pt-4">
                      <p className="text-xs font-medium text-muted-foreground">Your reply</p>
                      <Textarea
                        placeholder="Thank the reviewer or clarify the experience…"
                        value={replyValue}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...prev[row.id], text: e.target.value },
                          }))
                        }
                        rows={4}
                        disabled={Boolean(drafts[row.id]?.saving)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!dirty || Boolean(drafts[row.id]?.saving)}
                        onClick={() => saveReply(row.id, row.providerResponse)}
                      >
                        {drafts[row.id]?.saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          "Save reply"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
