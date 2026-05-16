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
import { ChevronDown, Loader2 } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  fetchDeveloperAnalyticsSummary,
  fetchDeveloperProjects,
  type ApiDeveloperAnalyticsSummary,
  type DeveloperAnalyticsPeriod,
} from "@/lib/api/developer-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string | null
}) {
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

export default function DeveloperAnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [period, setPeriod] = useState<DeveloperAnalyticsPeriod>("month")
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const projectsKey = token ? (["developer-analytics-projects"] as const) : null
  const { data: projectsRes } = useSWR(projectsKey, () =>
    fetchDeveloperProjects({ page: 1, pageSize: 100 }).then((r) => r),
  )

  const projects = projectsRes?.data ?? []

  const summaryKey =
    token && mounted
      ? (["developer-analytics-summary", period, selectedProjectIds.join(",")] as const)
      : null

  const { data: summaryRes, isLoading } = useSWR(summaryKey, async () => {
    setErr(null)
    try {
      return await fetchDeveloperAnalyticsSummary({
        period,
        projectIds: selectedProjectIds.length ? selectedProjectIds : undefined,
      })
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Failed to load analytics")
      throw e
    }
  })

  const summary: ApiDeveloperAnalyticsSummary | undefined = summaryRes?.data

  const statusChartData = useMemo(() => {
    if (!summary) return []
    return Object.entries(summary.inquiriesByStatus).map(([status, count]) => ({
      status,
      count,
    }))
  }, [summary])

  const toggleProject = (id: string, checked: boolean) => {
    setSelectedProjectIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((x) => x !== id)
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-sm">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Lead volume and inventory signals for your projects (NGN context; revenue funnel coming
          soon).
        </p>
      </div>

      {!token ? (
        <p className="text-muted-foreground">
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>{" "}
          to view analytics.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2 sm:max-w-xs">
              <Label>Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as DeveloperAnalyticsPeriod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Past month (UTC)</SelectItem>
                  <SelectItem value="quarter">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Projects (optional filter)</Label>
              <div className="bg-muted/40 max-h-40 max-w-md overflow-y-auto rounded-md border p-2">
                {projects.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No projects yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {projects.map((p) => (
                      <li key={p.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`proj-${p.id}`}
                          checked={selectedProjectIds.includes(p.id)}
                          onCheckedChange={(c) => toggleProject(p.id, c === true)}
                        />
                        <label htmlFor={`proj-${p.id}`} className="cursor-pointer text-xs leading-none">
                          {p.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {err ? <p className="text-destructive text-xs">{err}</p> : null}

          {isLoading && !summary ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : null}

          {summary && summary.kpis.projectCount === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">No data yet</CardTitle>
                <CardDescription>
                  Create a project and start receiving inquiries to populate charts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm">
                  <Link href="/developer/projects/new">Create project</Link>
                </Button>
              </CardContent>
            </Card>
          ) : summary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="Projects in scope" value={summary.kpis.projectCount} />
                <KpiCard label="Units (total)" value={summary.kpis.totalUnits} />
                <KpiCard label="Available units" value={summary.kpis.availableUnits} />
                <KpiCard label="Sold units" value={summary.kpis.soldUnits} />
                <KpiCard label="Inquiries (period)" value={summary.kpis.inquiriesInPeriod} />
                <KpiCard
                  label="Revenue (NGN)"
                  value="—"
                  hint="Payments wiring is not connected yet."
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Inquiries over time</CardTitle>
                    <CardDescription>Daily count in the selected window.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    {summary.inquiriesByDay.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No inquiries in this period.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.inquiriesByDay}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">By status</CardTitle>
                    <CardDescription>Inquiry pipeline mix.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="status" width={72} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Top projects by inquiries</CardTitle>
                  <CardDescription>Up to 12 projects in the current scope.</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.byProject.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No project-level volume yet.</p>
                  ) : (
                    <ul className="divide-y">
                      {summary.byProject.map((row) => (
                        <li
                          key={row.projectId}
                          className="flex items-center justify-between gap-2 py-2 text-xs"
                        >
                          <span className="font-medium">{row.projectName}</span>
                          <span className="text-muted-foreground tabular-nums">{row.inquiryCount}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Collapsible defaultOpen={false} className="group">
                <CollapsibleTrigger
                  className={cn(
                    "border-input bg-background flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium shadow-sm",
                    "hover:bg-muted/50",
                  )}
                >
                  <span>Insights</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="border-input mt-2 rounded-md border bg-muted/20 px-3 py-2">
                  <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs">
                    {summary.insights.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
