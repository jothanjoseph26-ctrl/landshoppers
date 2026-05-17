"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  fetchProviderAnalyticsSummary,
  type ApiProviderAnalyticsSummary,
  type ProviderAnalyticsPeriod,
} from "@/lib/api/provider-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"
import { formatKoboNaira } from "@/lib/format"

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string | null }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

function formatMedianHours(h: number | null): string {
  if (h == null) return "—"
  if (h < 1) return "< 1 h"
  return `${h.toFixed(1)} h`
}

export default function ProviderAnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [period, setPeriod] = useState<ProviderAnalyticsPeriod>("month")

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const summaryKey = token ? (["provider-analytics", period] as const) : null
  const {
    data: summary,
    error: summaryErr,
    isLoading,
  } = useSWR(summaryKey, () => fetchProviderAnalyticsSummary(period), {
    shouldRetryOnError: false,
  })

  const loadError = useMemo(() => {
    if (!summaryErr) return null
    return summaryErr instanceof ApiRequestError ? JSON.stringify(summaryErr.body) : String(summaryErr)
  }, [summaryErr])

  const funnelData = useMemo(() => {
    if (!summary) return []
    const f = summary.kpis.funnel
    return [
      { stage: "Quoted", count: f.quoted },
      { stage: "Negotiating", count: f.negotiating },
      { stage: "Accepted", count: f.accepted },
      { stage: "Completed", count: f.completed },
      { stage: "Cancelled", count: f.cancelled },
    ]
  }, [summary])

  const isFunnelEmpty = funnelData.every((d) => d.count === 0)
  const leadsByDay = summary?.kpis.leadsByDay ?? []
  const isLeadsTrendEmpty = leadsByDay.length === 0 || leadsByDay.every((d) => d.count === 0)

  const periodEmpty =
    summary &&
    summary.kpis.totalLeads === 0 &&
    summary.kpis.jobsInProgress === 0 &&
    isLeadsTrendEmpty &&
    isFunnelEmpty

  if (!mounted) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            PRV-06 — lead funnel, response time, and revenue rollups. Free tier uses basic depth (30-day cap on
            &quot;all time&quot;).
          </p>
        </div>
        {token ? (
          <div className="grid gap-2 sm:w-48">
            <Label htmlFor="provider-analytics-period">Period</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as ProviderAnalyticsPeriod)}>
              <SelectTrigger id="provider-analytics-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="quarter">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {!token ? (
        <p className="text-muted-foreground text-sm">
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>{" "}
          to view analytics.
        </p>
      ) : loadError ? (
        <p className="text-destructive text-sm" role="alert">
          {loadError}
        </p>
      ) : isLoading && !summary ? (
        <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="sr-only">Loading analytics</span>
        </div>
      ) : summary ? (
        <AnalyticsContent
          summary={summary}
          funnelData={funnelData}
          isFunnelEmpty={isFunnelEmpty}
          isLeadsTrendEmpty={isLeadsTrendEmpty}
          periodEmpty={!!periodEmpty}
        />
      ) : (
        <p className="text-muted-foreground text-sm">No analytics data available.</p>
      )}
    </div>
  )
}

function AnalyticsContent({
  summary,
  funnelData,
  isFunnelEmpty,
  isLeadsTrendEmpty,
  periodEmpty,
}: {
  summary: ApiProviderAnalyticsSummary
  funnelData: Array<{ stage: string; count: number }>
  isFunnelEmpty: boolean
  isLeadsTrendEmpty: boolean
  periodEmpty: boolean
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {summary.tier}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {summary.analyticsDepth} analytics
        </Badge>
      </div>

      {periodEmpty ? (
        <Card className="border-dashed shadow-none">
          <CardHeader>
            <CardTitle className="text-base">No activity this period</CardTitle>
            <CardDescription>
              Leads and funnel metrics will appear here once you start receiving inquiries for the selected
              range.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total leads" value={summary.kpis.totalLeads} />
        <KpiCard label="Jobs in progress" value={summary.kpis.jobsInProgress} />
        <KpiCard
          label="Median response"
          value={formatMedianHours(summary.kpis.medianResponseHours)}
          hint="Hours to first response"
        />
        <KpiCard
          label="Revenue quoted"
          value={formatKoboNaira(summary.kpis.revenueQuotedKobo)}
          hint="NGN (from quoted amounts)"
        />
        <KpiCard
          label="Revenue finalized"
          value={formatKoboNaira(summary.kpis.revenueFinalKobo)}
          hint="NGN (completed jobs)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Leads by day</CardTitle>
            <CardDescription>New leads per day in this period.</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {isLeadsTrendEmpty ? (
              <p className="text-muted-foreground text-sm">No leads in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.kpis.leadsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Pipeline funnel</CardTitle>
            <CardDescription>Lead counts by stage.</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {isFunnelEmpty ? (
              <p className="text-muted-foreground text-sm">No funnel data in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
