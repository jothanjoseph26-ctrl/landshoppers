"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TierGate } from "@/components/dashboard/tier-gate"
import {
  fetchAgentAnalyticsSummary,
  type AgentAnalyticsPeriod,
  type ApiAgentAnalyticsSummary,
} from "@/lib/api/agent-portal"
import { getAccessToken } from "@/lib/api/auth-session"

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export default function AgentAnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [period, setPeriod] = useState<AgentAnalyticsPeriod>("month")

  useEffect(() => setMounted(true), [])

  const token = mounted ? getAccessToken() : null
  const key = token ? (["agent-analytics", period] as const) : null
  const { data, isLoading } = useSWR(key, () => fetchAgentAnalyticsSummary(period))

  const summary: ApiAgentAnalyticsSummary | undefined = data?.data

  const statusChart = useMemo(() => {
    if (!summary) return []
    return Object.entries(summary.kpis.inquiries.byStatus).map(([status, count]) => ({ status, count }))
  }, [summary])

  if (!mounted) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!token) {
    return (
      <p className="text-muted-foreground text-sm">
        <Link href="/login" className="text-primary underline">
          Sign in
        </Link>{" "}
        to view analytics.
      </p>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Analytics</h1>
          <p className="text-muted-foreground">Listing views, inquiries, and conversion for your portfolio.</p>
        </div>
        <div className="grid gap-2 sm:w-48">
          <Label>Period</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as AgentAnalyticsPeriod)}>
            <SelectTrigger>
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
      </div>

      {isLoading && !summary ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Views"
              value={summary.kpis.views.total}
              hint={
                summary.kpis.views.changePercent != null
                  ? `${summary.kpis.views.changePercent}% vs prior week`
                  : undefined
              }
            />
            <KpiCard label="Inquiries" value={summary.kpis.inquiries.total} />
            <KpiCard
              label="Conversion"
              value={
                summary.kpis.conversionRatePercent != null
                  ? `${summary.kpis.conversionRatePercent}%`
                  : "—"
              }
            />
            <KpiCard label="Plan" value={summary.tier} hint={summary.analyticsDepth} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Views by day</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {summary.kpis.views.byDay.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No views in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.kpis.views.byDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Inquiries by status</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {statusChart.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No inquiries in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <TierGate minTier="elite" currentTier={summary.tier}>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Top listings</CardTitle>
                <CardDescription>Elite — highest combined views and inquiries.</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.kpis.topListings.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No listing activity yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Listing</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Inquiries</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.kpis.topListings.map((row) => (
                        <TableRow key={row.listingId}>
                          <TableCell>{row.title}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.views}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.inquiries}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TierGate>

          <Button variant="outline" size="sm" asChild>
            <Link href="/agent/listings">Manage listings</Link>
          </Button>
        </>
      ) : null}
    </div>
  )
}
