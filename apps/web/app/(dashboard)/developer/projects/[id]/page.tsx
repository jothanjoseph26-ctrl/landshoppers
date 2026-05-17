"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, ExternalLink, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeveloperServiceHubBundleCta } from "@/components/servicehub/developer-servicehub-bundle-cta"
import { fetchDeveloperProject, type ApiDeveloperProject } from "@/lib/api/developer-portal"
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

export default function DeveloperProjectDetailPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const { data, error, isLoading } = useSWR(
    token && id ? ["developer-project", id] : null,
    () => fetchDeveloperProject(id).then((r) => r.data),
  )

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Sign in with a developer account to view this project.</p>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading project…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/developer/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <p className="text-destructive text-sm">
          {error ? "Could not load this project." : "Project not found."}
        </p>
      </div>
    )
  }

  const p: ApiDeveloperProject = data
  const cover = p.images[0] ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/developer/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All projects
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{p.name}</h1>
            <Badge className={statusColors[p.status] ?? "bg-muted"} variant="secondary">
              {p.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            {p.city}, {p.state}, {p.country}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/projects/${p.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Public page
          </Link>
        </Button>
      </div>

      {cover ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total units</span>
              <span className="font-medium">{p.totalUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium">{p.availableUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sold</span>
              <span className="font-medium">{p.soldUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inquiries</span>
              <span className="font-medium">{p.inquiryCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Views</span>
              <span className="font-medium">{p.viewCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing (kobo stored)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{formatKoboRange(p.priceRangeMin, p.priceRangeMax)}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Refine min/max prices in a future edit form; values are stored in kobo on the API.
            </p>
          </CardContent>
        </Card>
      </div>

      {(p.description ?? p.shortDescription) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {p.shortDescription ? <p className="font-medium text-foreground">{p.shortDescription}</p> : null}
            {p.description ? <p className="whitespace-pre-wrap">{p.description}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <DeveloperServiceHubBundleCta projectId={p.id} city={p.city} state={p.state} />
    </div>
  )
}
