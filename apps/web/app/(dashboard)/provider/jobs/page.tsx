"use client"

import useSWR from "swr"
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
  fetchProviderJobs,
  patchProviderJob,
  type ApiProviderLead,
} from "@/lib/api/provider-portal"
import { getAccessToken } from "@/lib/api/auth-session"

const COLUMNS = [
  { status: "quoted", title: "Quoted" },
  { status: "negotiating", title: "In progress" },
  { status: "accepted", title: "Accepted" },
  { status: "completed", title: "Completed" },
  { status: "cancelled", title: "Cancelled" },
] as const

type JobColumnStatus = (typeof COLUMNS)[number]["status"]

const COLUMN_STATUS_SET = new Set<string>(COLUMNS.map((c) => c.status))

export default function ProviderJobsPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null
  const listKey = token ? (["provider-jobs"] as const) : null

  const { data: listRes, error: listErr, isLoading, mutate } = useSWR(listKey, () =>
    fetchProviderJobs({ page: 1, pageSize: 50 }),
  )

  const rows: ApiProviderLead[] = listRes?.data ?? []

  const loadError = useMemo(() => {
    if (!listErr) return null
    return listErr instanceof ApiRequestError ? JSON.stringify(listErr.body) : String(listErr)
  }, [listErr])

  const grouped = useMemo(() => {
    const m: Record<JobColumnStatus, ApiProviderLead[]> = {
      quoted: [],
      negotiating: [],
      accepted: [],
      completed: [],
      cancelled: [],
    }
    for (const row of rows) {
      if (COLUMN_STATUS_SET.has(row.status)) {
        m[row.status as JobColumnStatus].push(row)
      }
    }
    return m
  }, [rows])

  const visibleJobCount = useMemo(
    () => COLUMNS.reduce((n, col) => n + grouped[col.status].length, 0),
    [grouped],
  )

  async function changeStatus(job: ApiProviderLead, status: JobColumnStatus) {
    if (status === job.status) return
    setErr(null)
    setPendingId(job.id)
    try {
      await patchProviderJob(job.id, { status })
      await mutate()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Update failed")
    } finally {
      setPendingId(null)
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
          <CardDescription>Jobs pipeline is available to verified service provider accounts.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kanban over quoted work — move cards as negotiations progress (PRV-04).
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
          Loading jobs…
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed bg-muted/30 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">No jobs yet</CardTitle>
            <CardDescription>
              Accepted quotes and pipeline stages appear here once leads move past quoting.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : rows.length > 0 && visibleJobCount === 0 ? (
        <Card className="border-dashed bg-muted/30 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">No jobs in these stages</CardTitle>
            <CardDescription>
              Loaded {rows.length} row{rows.length === 1 ? "" : "s"}, but none use quoted, in progress, accepted,
              completed, or cancelled yet.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <div key={col.status} className="w-[min(100%,280px)] shrink-0 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-medium">{col.title}</h2>
                <Badge variant="secondary">{grouped[col.status].length}</Badge>
              </div>
              <div className="space-y-3">
                {grouped[col.status].map((job) => (
                  <Card key={job.id} className="shadow-none">
                    <CardHeader className="space-y-2 pb-2">
                      <CardTitle className="text-sm leading-snug">{job.serviceRequested}</CardTitle>
                      <CardDescription className="text-xs">{job.clientNameMasked}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <p className="text-xs text-muted-foreground">Move</p>
                      <Select
                        value={job.status}
                        disabled={pendingId === job.id}
                        onValueChange={(v) => changeStatus(job, v as JobColumnStatus)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map((c) => (
                            <SelectItem key={c.status} value={c.status}>
                              {c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {pendingId === job.id ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                          Saving…
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
