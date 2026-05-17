"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { ExternalLink, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  fetchDeveloperSubscription,
  fetchDeveloperSubscriptionInvoices,
  postDeveloperSubscriptionCheckout,
  type ApiDeveloperSubscriptionSummary,
  type DeveloperSubscriptionPlan,
} from "@/lib/api/developer-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

const TIERS: {
  id: DeveloperSubscriptionPlan | "enterprise"
  name: string
  blurb: string
  bullets: string[]
  cta: string
  planArg?: DeveloperSubscriptionPlan
}[] = [
  {
    id: "developer_basic",
    name: "Starter",
    blurb: "developer_basic",
    bullets: ["Core portal & projects", "Bulk CSV uploads", "Lead inbox + digest"],
    cta: "Upgrade to Starter",
    planArg: "developer_basic",
  },
  {
    id: "developer_pro",
    name: "Pro",
    blurb: "developer_pro",
    bullets: ["Everything in Starter", "Higher limits (when enforced)", "Priority support (roadmap)"],
    cta: "Upgrade to Pro",
    planArg: "developer_pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "Custom",
    bullets: ["SSO / contracts", "Dedicated success", "Custom integrations"],
    cta: "Contact sales",
  },
]

function planLabel(plan: string | null | undefined): string {
  if (!plan) return "Free"
  if (plan === "developer_basic") return "Starter (Basic)"
  if (plan === "developer_pro") return "Pro"
  return plan
}

export default function DeveloperSubscriptionPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [checkoutBusy, setCheckoutBusy] = useState<DeveloperSubscriptionPlan | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const subKey = token ? (["developer-subscription"] as const) : null
  const { data: subRes, isLoading: subLoading } = useSWR(subKey, () => fetchDeveloperSubscription())

  const invKey = token ? (["developer-subscription-invoices"] as const) : null
  const { data: invRes, isLoading: invLoading } = useSWR(invKey, () =>
    fetchDeveloperSubscriptionInvoices({ page: 1, pageSize: 20 }),
  )

  const summary: ApiDeveloperSubscriptionSummary | undefined = subRes?.data
  const paystackOk = summary?.paystackConfigured ?? false
  const invoices = invRes?.data ?? []

  async function checkout(plan: DeveloperSubscriptionPlan) {
    setErr(null)
    setCheckoutBusy(plan)
    try {
      const res = await postDeveloperSubscriptionCheckout(plan)
      window.open(res.data.authorizationUrl, "_blank", "noopener,noreferrer")
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
          <CardDescription>Subscription & billing are available after you sign in as a developer.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Subscription & billing</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Current plan, usage from your portfolio, and upgrade paths. Billing history stays empty until Paystack
            webhooks populate developer-scoped payments in the API.
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
              <CardDescription className="text-xs">
                {summary?.companyName ?? "—"} · Naira pricing when Paystack checkout is fully wired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subLoading || !summary ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{planLabel(summary.subscription.plan)}</span>
                    {summary.subscription.status ? (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {summary.subscription.status}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        No paid subscription row
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {summary.subscription.renewsAt
                      ? `Renews ${new Date(summary.subscription.renewsAt).toLocaleDateString()}`
                      : "No renewal date until a subscription is active."}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Paystack keys: {paystackOk ? "configured (stub checkout enabled)" : "not set — upgrade buttons show a tooltip."}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Usage (this month)</CardTitle>
              <CardDescription className="text-xs">Real counts from projects + inquiries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {subLoading || !summary ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="font-medium tabular-nums">{summary.usage.projectCount}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Listed units (sum)</span>
                    <span className="font-medium tabular-nums">{summary.usage.listedUnits}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Leads (inquiries, MTD)</span>
                    <span className="font-medium tabular-nums">{summary.usage.inquiriesThisMonth}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">AI credits</span>
                    <span className="font-medium tabular-nums text-muted-foreground">
                      {summary.usage.aiCreditsRemaining === null ? "—" : summary.usage.aiCreditsRemaining}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs pt-1">
                    Plan limits are <code className="bg-muted px-1 rounded">null</code> until tiers are enforced server-side.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((tier) => (
              <Card key={tier.id} className="shadow-none flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tier.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{tier.blurb}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                  <ul className="text-muted-foreground text-xs space-y-1.5 list-disc pl-4 flex-1">
                    {tier.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {tier.id === "enterprise" ? (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="mailto:sales@landshoppers.com?subject=Developer%20Enterprise">
                        <Mail className="h-4 w-4 mr-2" />
                        {tier.cta}
                      </a>
                    </Button>
                  ) : tier.planArg ? (
                    !paystackOk ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex w-full">
                            <Button type="button" size="sm" className="w-full" disabled>
                              {tier.cta}
                              <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-70" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Set PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY to enable checkout (stub URL for now).
                        </TooltipContent>
                      </Tooltip>
                    ) : (
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
                    )
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Billing history</CardTitle>
            <CardDescription className="text-xs">
              {invLoading ? "Loading…" : invoices.length === 0 ? "No invoices yet — correct empty state until webhooks land." : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {invLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : invoices.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center border border-dashed rounded-lg bg-muted/20">
                No invoices to show.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs">{row.createdAt}</TableCell>
                      <TableCell className="text-xs">{row.amountKobo}</TableCell>
                      <TableCell className="text-xs">{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
