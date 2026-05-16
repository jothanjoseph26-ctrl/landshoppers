"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  Briefcase,
  ChevronRight,
  Flame,
  Eye,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"

import { TierGate } from "@/components/dashboard/tier-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServiceHubCategoryMeta } from "@/lib/servicehub/categories"
import { ApiRequestError } from "@/lib/api/client"
import {
  fetchProviderDashboard,
  type ProviderPortalTier,
} from "@/lib/api/provider-portal"
import { getAccessToken } from "@/lib/api/auth-session"

const INSIGHT_CARD_CLASS = {
  info: "border-border bg-card",
  warning: "border-amber-500/40 bg-amber-500/5",
  success: "border-emerald-500/35 bg-emerald-500/5",
} as const

function tierBadgeVariant(tier: ProviderPortalTier): "default" | "secondary" | "outline" {
  if (tier === "elite") return "default"
  if (tier === "pro") return "secondary"
  return "outline"
}

export default function ProviderDashboardPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const dashKey = token ? (["provider-dashboard"] as const) : null
  const { data: dash, error, isLoading } = useSWR(
    dashKey,
    () => fetchProviderDashboard(),
    { shouldRetryOnError: false },
  )

  const categoryMeta = dash ? getServiceHubCategoryMeta(dash.category) : undefined

  const loadErr = error instanceof ApiRequestError ? error.body : error ? String(error) : null

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
          <CardDescription>
            Open this portal with a service provider account (role <code className="text-xs">service_provider</code>
            ).
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Command center</h1>
            {dash ? (
              <Badge variant={tierBadgeVariant(dash.tier)} className="text-xs capitalize">
                {dash.tier}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            ServiceHub PRV-01 — who needs you today and what to do first.
            {categoryMeta ? (
              <>
                {" "}
                Primary category:{" "}
                <span className="text-foreground font-medium">{categoryMeta.shortLabel}</span>.
              </>
            ) : null}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/provider/profile">
            Edit profile <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      {loadErr ? (
        <p className="text-destructive text-sm" role="alert">
          Could not load dashboard.{" "}
          {typeof loadErr === "object" ? JSON.stringify(loadErr) : String(loadErr)}
        </p>
      ) : null}

      {isLoading || !dash ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading dashboard…
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="New leads today"
              value={dash.kpis.newLeadsToday}
              icon={Users}
              href="/provider/leads"
              pulse={dash.kpis.newLeadsPulse}
              subtitle="Lead inbox"
            />
            <TierGate
              minTier="pro"
              currentTier={dash.tier}
              subscriptionHref="/provider/subscription"
              portalProductLabel="Provider Portal"
            >
              <StatCard
                title="Hot leads"
                value={dash.kpis.hotLeads.count}
                icon={Flame}
                href="/provider/leads"
                subtitle={
                  dash.kpis.hotLeads.leadScoringAvailable ? "AI scoring on" : "Upgrade for scoring"
                }
              />
            </TierGate>
            <StatCard
              title="Jobs in progress"
              value={dash.kpis.jobsInProgress}
              icon={Briefcase}
              href="/provider/jobs"
              subtitle="Pipeline"
            />
            <StatCard
              title="Profile views"
              value={dash.kpis.profileViewsWeek.value}
              icon={Eye}
              href="/provider/analytics"
              subtitle="Tracked views (aggregate)"
            />
            <TierGate
              minTier="pro"
              currentTier={dash.tier}
              subscriptionHref="/provider/subscription"
              portalProductLabel="Provider Portal"
            >
              <StatCard
                title="Match appearances"
                value={dash.kpis.matchAppearancesWeek ?? "—"}
                icon={Target}
                href="/provider/analytics"
                subtitle="Contextual placements"
              />
            </TierGate>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">Trust & momentum</CardTitle>
                  <CardDescription>Signals buyers see on your public profile.</CardDescription>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Rating</p>
                  <p className="text-2xl font-semibold">{dash.trust.rating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{dash.trust.reviewCount} reviews</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Leads (lifetime)</p>
                  <p className="text-2xl font-semibold">{dash.trust.leadCount}</p>
                  <p className="text-xs text-muted-foreground">Quote requests received</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Match score</p>
                  <p className="text-2xl font-semibold">
                    {dash.trust.aiMatchScore != null ? `${dash.trust.aiMatchScore}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Refreshed by worker (Phase B)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-dashed bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Insights
                </CardTitle>
                <CardDescription>Rule-based for now — AI cards ship with Stream 4.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dash.insights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You are all caught up.</p>
                ) : (
                  dash.insights.map((i) => (
                    <div
                      key={i.id}
                      className={`rounded-lg border p-3 text-sm ${INSIGHT_CARD_CLASS[i.severity]}`}
                    >
                      <p className="font-medium">{i.title}</p>
                      <p className="text-muted-foreground mt-1 leading-relaxed">{i.body}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent leads</CardTitle>
                <CardDescription>
                  Latest quote requests — open the inbox to filter, respond, and update status.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/provider/leads">Open inbox</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {dash.recentLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No leads yet — finish your profile so ServiceHub can match you to listings.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {dash.recentLeads.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span>{row.maskedClientLabel}</span>
                      <span className="text-muted-foreground">{row.serviceRequested}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  pulse,
}: {
  title: string
  value: number | string
  subtitle?: string
  href: string
  icon: typeof Users
  pulse?: boolean
}) {
  return (
    <Link href={href} className="block group">
      <Card className="shadow-none transition-colors group-hover:bg-muted/40">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon
            className={`h-4 w-4 text-muted-foreground ${pulse ? "animate-pulse text-primary" : ""}`}
            aria-hidden
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{value}</div>
          {subtitle ? <p className="text-xs text-muted-foreground mt-1">{subtitle}</p> : null}
        </CardContent>
      </Card>
    </Link>
  )
}
