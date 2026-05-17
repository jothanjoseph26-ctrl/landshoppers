"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
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
import { fetchAdminAnalyticsSummary } from "@/lib/api/admin-portal"
import { getAccessToken } from "@/lib/api/auth-session"

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "all">("month")
  const token = typeof window !== "undefined" ? getAccessToken() : null

  const { data, isLoading } = useSWR(token ? ["admin-analytics", period] : null, () =>
    fetchAdminAnalyticsSummary(period),
  )

  const summary = data?.data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Analytics</h1>
          <p className="text-muted-foreground">Platform-wide KPIs and growth trends.</p>
        </div>
        <div className="grid gap-2 sm:w-44">
          <Label>Period</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Total users" value={summary.kpis.totalUsers} />
            <Kpi label="Active (proxy)" value={summary.kpis.activeUsersProxy} />
            <Kpi label="Listings" value={summary.kpis.totalListings} />
            <Kpi label="Active listings" value={summary.kpis.activeListings} />
            <Kpi label="Inquiries" value={summary.kpis.inquiriesInPeriod} />
            <Kpi label="Pending KYC" value={summary.kpis.pendingKycCount} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">New users</CardTitle>
                <CardDescription>Daily signups in period</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.trends.newUsersByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} width={28} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">New listings</CardTitle>
                <CardDescription>Daily listings created</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.trends.newListingsByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} width={28} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-2))" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
