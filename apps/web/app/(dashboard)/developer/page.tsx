"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import {
  Building2,
  TrendingUp,
  Users,
  Eye,
  MessageSquare,
  Plus,
  ChevronRight,
  Home,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MarketListingsStat } from "@/components/developer/market-listings-stat"
import {
  fetchDeveloperDashboard,
  fetchDeveloperInquiries,
  type ApiDeveloperProject,
  type ApiDeveloperInquiryRow,
} from "@/lib/api/developer-portal"
import { getAccessToken } from "@/lib/api/auth-session"

const statusColors: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  ONGOING: "bg-primary/10 text-primary",
  COMPLETED: "bg-gray-100 text-gray-800",
  SOLD_OUT: "bg-purple-100 text-purple-800",
}

const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  responded: "bg-muted text-foreground",
  touring: "bg-primary/10 text-primary",
  closed: "bg-gray-100 text-gray-800",
  lost: "bg-destructive/10 text-destructive",
}

function activeInquiryCount(byStatus: Record<string, number>): number {
  const keys = ["new", "responded", "touring"] as const
  return keys.reduce((sum, k) => sum + (byStatus[k] ?? 0), 0)
}

function displayLeadName(row: ApiDeveloperInquiryRow): string {
  return (
    row.buyerName?.trim() ||
    row.buyerEmail?.trim() ||
    row.buyerPhone?.trim() ||
    "Buyer"
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

export default function DeveloperDashboard() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const dashKey = token ? (["developer-dashboard"] as const) : null
  const { data: dash, error: dashError, isLoading: dashLoading } = useSWR(
    dashKey,
    () => fetchDeveloperDashboard().then((r) => r.data),
  )

  const inqKey = token ? (["developer-inquiries-preview"] as const) : null
  const { data: leadRows, error: inqError } = useSWR(
    inqKey,
    () => fetchDeveloperInquiries({ page: 1, pageSize: 6 }).then((r) => r.data),
  )

  const signedIn = Boolean(token)
  const loadError = dashError || inqError
  const recentProjects: ApiDeveloperProject[] = useMemo(
    () => dash?.recentProjects ?? [],
    [dash],
  )
  const previewLeads: ApiDeveloperInquiryRow[] = leadRows ?? []

  return (
    <div className="space-y-8">
      {mounted && !signedIn ? (
        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Sign in with a <strong className="text-foreground">developer</strong> account to load your
          portfolio stats, recent projects, and inquiries. Marketplace listing totals below stay live
          for everyone.
        </div>
      ) : null}

      {signedIn && loadError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load dashboard data. Check that the API is running and you are logged in as a
          developer.
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            {signedIn && dash?.companyName
              ? `${dash.companyName} — portfolio overview`
              : "Welcome back! Here's your portfolio overview."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/developer/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketListingsStat />
        {signedIn && dashLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="flex h-[120px] items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : signedIn && dash ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-primary">Live</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{dash.totalUnitsSold}</p>
                  <p className="text-sm text-muted-foreground">Units sold (your projects)</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-primary">Live</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{activeInquiryCount(dash.inquiries.byStatus)}</p>
                  <p className="text-sm text-muted-foreground">Open inquiries (new + in progress)</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dash.inquiries.total} total · {dash.inquiries.byStatus["closed"] ?? 0} closed
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-accent/20 p-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-primary">Live</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{dash.projectCount}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-dashed">
                <CardContent className="flex h-[120px] flex-col justify-center p-6">
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                  <p className="text-sm text-muted-foreground">
                    {i === 1 ? "Units sold" : i === 2 ? "Open inquiries" : "Projects"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  {signedIn ? "Latest updates across your developments" : "Sign in to see your projects"}
                </CardDescription>
              </div>
              <Link href="/developer/projects">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {signedIn && dashLoading ? (
                <div className="flex justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : signedIn && recentProjects.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <p className="mb-3">No projects yet.</p>
                  <Link href="/developer/projects/new">
                    <Button size="sm">Create your first project</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => {
                    const img = project.images[0]
                    return (
                      <Link
                        key={project.id}
                        href={`/developer/projects/${project.id}`}
                        className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <Building2 className="h-6 w-6 opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="truncate font-semibold">{project.name}</h4>
                            <Badge
                              className={statusColors[project.status] ?? "bg-muted"}
                              variant="secondary"
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              {project.soldUnits}/{project.totalUnits} units sold
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {project.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {project.inquiryCount}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest buyer inquiries on your projects</CardDescription>
            </div>
            <Link href="/developer/leads">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {signedIn && !leadRows && !inqError ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : signedIn && previewLeads.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No inquiries yet. When buyers message your projects, they will appear here.
              </p>
            ) : signedIn ? (
              <div className="space-y-4">
                {previewLeads.map((lead) => {
                  const name = displayLeadName(lead)
                  const rel = formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })
                  const raw = lead.message?.trim()
                  const preview =
                    raw && raw.length > 80 ? `${raw.slice(0, 80)}…` : raw ?? ""
                  return (
                    <div key={lead.id} className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium">{name}</p>
                          <Badge
                            className={leadStatusColors[lead.status] ?? "bg-muted"}
                            variant="secondary"
                          >
                            {lead.status}
                          </Badge>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {preview || "—"} · {lead.project?.name ?? "Project"}
                        </p>
                        <p className="text-xs text-muted-foreground">{rel}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sign in as a developer to see inquiries from your projects.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Link href="/developer/projects/new">
              <Button variant="outline" className="flex h-auto w-full flex-col gap-2 py-4">
                <Plus className="h-6 w-6" />
                <span>Add New Project</span>
              </Button>
            </Link>
            <Link href="/developer/bulk-upload">
              <Button variant="outline" className="flex h-auto w-full flex-col gap-2 py-4">
                <Building2 className="h-6 w-6" />
                <span>Bulk Upload Units</span>
              </Button>
            </Link>
            <Link href="/developer/leads">
              <Button variant="outline" className="flex h-auto w-full flex-col gap-2 py-4">
                <Users className="h-6 w-6" />
                <span>View All Leads</span>
              </Button>
            </Link>
            <Link href="/developer/analytics">
              <Button variant="outline" className="flex h-auto w-full flex-col gap-2 py-4">
                <TrendingUp className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
