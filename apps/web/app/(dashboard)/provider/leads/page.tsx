"use client"

import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { Loader2, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiRequestError } from "@/lib/api/client"
import {
  fetchProviderLeads,
  patchProviderLead,
  type ApiProviderLead,
} from "@/lib/api/provider-portal"
import { getAccessToken } from "@/lib/api/auth-session"

const STATUSES = [
  "pending",
  "responded",
  "quoted",
  "negotiating",
  "accepted",
  "completed",
  "cancelled",
  "lost",
] as const

const SOURCES = [
  "listing_page",
  "directory",
  "bundle",
  "whatsapp",
  "agent_referral",
  "developer_rfq",
  "post_purchase",
] as const

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "pending") return "secondary"
  if (s === "completed" || s === "accepted") return "default"
  if (s === "lost" || s === "cancelled") return "destructive"
  return "outline"
}

export default function ProviderLeadsPage() {
  const [mounted, setMounted] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [sourceFilter, setSourceFilter] = useState<string>("")
  const [err, setErr] = useState<string | null>(null)

  /** Row-local optimistic status + quote draft */
  const [drafts, setDrafts] = useState<
    Record<string, { status?: string; quote?: string; saving?: boolean }>
  >({})

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const listKey = token
    ? (["provider-leads", statusFilter, sourceFilter] as const)
    : null

  const { data: listRes, error: listErr, isLoading, mutate } = useSWR(
    listKey,
    () =>
      fetchProviderLeads({
        page: 1,
        pageSize: 30,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
      }),
    { shouldRetryOnError: false },
  )

  const rows: ApiProviderLead[] = listRes?.data ?? []

  const loadError = useMemo(() => {
    if (!listErr) return null
    return listErr instanceof ApiRequestError ? JSON.stringify(listErr.body) : String(listErr)
  }, [listErr])

  async function saveLead(id: string) {
    const d = drafts[id]
    if (!d?.status && !d?.quote?.trim()) return
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], saving: true } }))
    setErr(null)
    try {
      await patchProviderLead(id, {
        ...(d.status ? { status: d.status } : {}),
        ...(d.quote?.trim() ? { quotedAmountKobo: d.quote.trim() } : {}),
      })
      await mutate()
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Update failed")
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
          <CardDescription>Lead inbox is available to verified service provider accounts.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Lead inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">
            ServiceHub PRV-02 — read pipeline + update status / quote (Phase B). AI scoring respects your tier on the
            dashboard.
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

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={statusFilter || "__all"} onValueChange={(v) => setStatusFilter(v === "__all" ? "" : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Source</p>
            <Select value={sourceFilter || "__all"} onValueChange={(v) => setSourceFilter(v === "__all" ? "" : v)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All sources</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading leads…
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed bg-muted/30 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">No leads yet</CardTitle>
            <CardDescription>
              Quote requests from the marketplace and contextual matches appear here once Stream 2 buyers submit quotes
              and Stream 4 scoring is enabled.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="shadow-none">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between space-y-0">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{row.serviceRequested}</CardTitle>
                      <Badge variant={statusVariant(row.status)}>{row.status.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline">{row.source.replace(/_/g, " ")}</Badge>
                      {row.aiScore != null ? (
                        <Badge variant={row.aiScore >= 70 ? "default" : "secondary"}>
                          AI {Math.round(row.aiScore)}
                        </Badge>
                      ) : null}
                    </div>
                    <CardDescription>
                      {row.clientNameMasked} · {row.clientPhone}
                      {row.clientEmail ? ` · ${row.clientEmail}` : ""}
                    </CardDescription>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Location:</span> {row.location}
                    </p>
                    {row.timeline ? (
                      <p>
                        <span className="text-muted-foreground">Timeline:</span> {row.timeline}
                      </p>
                    ) : null}
                    {row.budgetKobo ? (
                      <p>
                        <span className="text-muted-foreground">Budget (kobo):</span> {row.budgetKobo}
                      </p>
                    ) : null}
                    <p className="text-muted-foreground whitespace-pre-wrap">{row.message}</p>
                    {row.aiSummary ? (
                      <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
                        <span className="font-medium text-foreground">AI summary · </span>
                        {row.aiSummary}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
                    <div className="space-y-1 flex-1">
                      <p className="text-xs text-muted-foreground">Update status</p>
                      <Select
                        value={drafts[row.id]?.status ?? row.status}
                        onValueChange={(v) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...prev[row.id], status: v },
                          }))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[220px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-xs text-muted-foreground">Quote (NGN kobo, digits only)</p>
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder={row.quotedAmountKobo ?? "e.g. 35000000"}
                        value={drafts[row.id]?.quote ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...prev[row.id], quote: e.target.value.replace(/\D/g, "") },
                          }))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => saveLead(row.id)}
                      disabled={(() => {
                        const d = drafts[row.id]
                        const saving = Boolean(d?.saving)
                        const statusChanged = d?.status !== undefined && d.status !== row.status
                        const quoteEntered = Boolean(d?.quote?.trim())
                        return saving || (!statusChanged && !quoteEntered)
                      })()}
                    >
                      {drafts[row.id]?.saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
