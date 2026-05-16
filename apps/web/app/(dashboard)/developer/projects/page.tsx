"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  MessageSquare,
  MapPin,
  Building2,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { fetchDeveloperProjects } from "@/lib/api/developer-portal"
import { getAccessToken } from "@/lib/api/auth-session"

const statusColors: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  ONGOING: "bg-primary/10 text-primary",
  COMPLETED: "bg-gray-100 text-gray-800",
  SOLD_OUT: "bg-purple-100 text-purple-800",
}

function formatKoboRange(min: string | null, max: string | null): string {
  if (!min && !max) return "—"
  const toNaira = (k: string) => {
    const n = BigInt(k) / BigInt(100)
    if (n >= BigInt(1000000000)) return `₦${(Number(n) / 1e9).toFixed(1)}B`
    if (n >= BigInt(1000000)) return `₦${(Number(n) / 1e6).toFixed(0)}M`
    return `₦${n.toLocaleString()}`
  }
  if (min && max) return `${toNaira(min)} – ${toNaira(max)}`
  if (min) return `${toNaira(min)}+`
  return toNaira(max!)
}

export default function DeveloperProjectsPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const swrKey = token
    ? (["developer-projects", statusFilter === "all" ? "" : statusFilter] as const)
    : null

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      const res = await fetchDeveloperProjects({
        page: 1,
        pageSize: 50,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      return res.data
    },
    { revalidateOnFocus: true },
  )

  const projects = useMemo(() => {
    const list = data ?? []
    return list.filter((project) => {
      const q = searchQuery.toLowerCase()
      const loc = `${project.city} ${project.state}`.toLowerCase()
      const matchesSearch =
        !q || project.name.toLowerCase().includes(q) || loc.includes(q)
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [data, searchQuery, statusFilter])

  const signedIn = Boolean(token)

  return (
    <div className="space-y-6">
      {mounted && !signedIn ? (
        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Sign in with a <strong className="text-foreground">developer</strong> account to load
          projects from the API. Sample data has been removed so the list matches your account.
        </div>
      ) : null}

      {signedIn && error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load projects.{" "}
          <button type="button" className="underline" onClick={() => void mutate()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">Manage your development projects and units</p>
        </div>
        <Link href="/developer/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="ONGOING">Ongoing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" type="button" aria-label="Filters (coming soon)">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {signedIn && isLoading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading projects…
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const soldPercentage =
            project.totalUnits > 0 ? (project.soldUnits / project.totalUnits) * 100 : 0
          const cover = project.images[0] ?? null
          return (
            <Card key={project.id} className="group overflow-hidden">
              <div className="relative h-48 bg-muted">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Building2 className="h-12 w-12 opacity-40" />
                  </div>
                )}
                <Badge
                  className={`absolute left-3 top-3 ${statusColors[project.status] ?? "bg-muted"}`}
                >
                  {project.status.replace("_", " ")}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="absolute right-3 top-3 h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/developer/projects/${project.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Public page
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-4">
                <Link href={`/developer/projects/${project.id}`}>
                  <h3 className="mb-1 text-lg font-semibold transition-colors group-hover:text-primary">
                    {project.name}
                  </h3>
                </Link>
                <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {project.city}, {project.state}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Units sold</span>
                      <span className="font-medium">
                        {project.soldUnits}/{project.totalUnits}
                      </span>
                    </div>
                    <Progress value={soldPercentage} className="h-2" />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price range</span>
                    <span className="font-medium">
                      {formatKoboRange(project.priceRangeMin, project.priceRangeMax)}
                    </span>
                  </div>

                  <div className="flex gap-4 border-t pt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {project.viewCount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      {project.inquiryCount}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {project.availableUnits} available
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {signedIn && !isLoading && projects.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No projects found</h3>
          <p className="mb-4 text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first project to get started"}
          </p>
          <Link href="/developer/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create project
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  )
}
