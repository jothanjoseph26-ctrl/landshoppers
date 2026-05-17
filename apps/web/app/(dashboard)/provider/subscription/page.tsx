"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { ExternalLink, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  fetchProviderSubscription,
  postProviderSubscriptionCheckout,
  type ApiProviderSubscription,
} from "@/lib/api/provider-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

type ProviderCheckoutTier = "pro" | "elite"

const TIERS: {
  id: ProviderCheckoutTier | "enterprise"
  name: string
  bullets: string[]
  cta: string
  planArg?: ProviderCheckoutTier
}[] = [
  {
    id: "pro",
    name: "Pro",
    bullets: ["Full analytics", "WhatsApp bridge (MVP)", "Content studio templates"],
    cta: "Upgrade to Pro",
    planArg: "pro",
  },
  {
    id: "elite",
    name: "Elite",
    bullets: ["Everything in Pro", "Priority placement (roadmap)", "Dedicated support"],
    cta: "Upgrade to Elite",
    planArg: "elite",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    bullets: ["Custom contracts", "Multi-branch teams", "API integrations"],
    cta: "Contact sales",
  },
]

function tierLabel(tier: string): string {
  if (tier === "free") return "Free"
  if (tier === "pro") return "Pro"
  if (tier === "elite") return "Elite"
  return tier
}

export default function ProviderSubscriptionPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [checkoutBusy, setCheckoutBusy] = useState<ProviderCheckoutTier | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const subKey = token ? (["provider-subscription"] as const) : null
  const { data: summary, isLoading: subLoading, mutate } = useSWR(subKey, () =>
    fetchProviderSubscription(),
  )

  async function checkout(plan: ProviderCheckoutTier) {
    setErr(null)
    setCheckoutBusy(plan)
    try {
      const res = await postProviderSubscriptionCheckout(plan)
      if (res.authorizationUrl) {
        window.open(res.authorizationUrl, "_blank", "noopener,noreferrer")
      } else if (res.mode === "stub_direct") {
        await mutate()
      }
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Checkout failed")
    } finally {
      setCheckoutBusy(null)
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
          <CardDescription>Subscription & billing are available after you sign in as a provider.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const paystackOk = summary?.paystackConfigured ?? false

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            PRV-10 — plan tier, usage meters, and upgrade paths. Without Paystack keys, dev checkout updates tier
            locally.
          </p>
        </div>

        {err ? (
          <p className="text-destructive text-sm" role="alert">
            {err}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-none lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Current plan</CardTitle>
              <CardDescription className="text-xs">{summary?.businessName ?? "—"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subLoading || !summary ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold capitalize">{tierLabel(summary.tier)}</span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {summary.limits.analyticsDepth} analytics
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Paystack: {paystackOk ? "configured (stub checkout)" : "not set — dev stub upgrades tier directly."}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <UsageCard summary={summary} loading={subLoading} />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((tier) => (
              <Card key={tier.id} className="shadow-none flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tier.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                  <ul className="text-muted-foreground text-xs space-y-1.5 list-disc pl-4 flex-1">
                    {tier.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {tier.id === "enterprise" ? (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="mailto:sales@landshoppers.com?subject=Provider%20Enterprise">
                        <Mail className="h-4 w-4 mr-2" />
                        {tier.cta}
                      </a>
                    </Button>
                  ) : tier.planArg ? (
                    !paystackOk ? (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        disabled={checkoutBusy !== null}
                        onClick={() => void checkout(tier.planArg!)}
                      >
                        {checkoutBusy === tier.planArg ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          tier.cta
                        )}
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex w-full">
                            <Button
                              type="button"
                              size="sm"
                              className="w-full"
                              disabled={checkoutBusy !== null}
                              onClick={() => void checkout(tier.planArg!)}
                            >
                              {checkoutBusy === tier.planArg ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  {tier.cta}
                                  <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-70" />
                                </>
                              )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Opens Paystack stub URL; tier updates on webhook when live.
                        </TooltipContent>
                      </Tooltip>
                    )
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function UsageCard({ summary, loading }: { summary?: ApiProviderSubscription; loading: boolean }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Usage</CardTitle>
        <CardDescription className="text-xs">Jobs and leads on your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {loading || !summary ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Row label="Active jobs" value={summary.usage.activeJobs} />
            <Row label="Completed jobs" value={summary.usage.completedJobs} />
            <Row label="Total leads" value={summary.usage.leadCount} />
            <Row label="Reviews" value={summary.usage.reviewCount} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}
