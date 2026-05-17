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
  fetchAgentSubscription,
  fetchAgentSubscriptionInvoices,
  postAgentSubscriptionCheckout,
  type AgentSubscriptionPlan,
  type ApiAgentSubscription,
} from "@/lib/api/agent-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

const TIERS: {
  id: AgentSubscriptionPlan | "enterprise"
  name: string
  planArg?: AgentSubscriptionPlan
  bullets: string[]
}[] = [
  {
    id: "agent_basic",
    name: "Pro",
    planArg: "agent_basic",
    bullets: ["Unlimited active listings", "WhatsApp bridge (1)", "Full analytics depth"],
  },
  {
    id: "agent_pro",
    name: "Elite",
    planArg: "agent_pro",
    bullets: ["Everything in Pro", "Top listings table", "Up to 5 WhatsApp connections"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    bullets: ["Custom contracts", "Dedicated support", "API integrations"],
  },
]

function planLabel(plan: string | null | undefined, tier: string): string {
  if (!plan) return tier === "free" ? "Free" : tier
  if (plan === "agent_basic") return "Pro (agent_basic)"
  if (plan === "agent_pro") return "Elite (agent_pro)"
  return plan
}

export default function AgentSubscriptionPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [checkoutBusy, setCheckoutBusy] = useState<AgentSubscriptionPlan | null>(null)

  useEffect(() => setMounted(true), [])

  const token = mounted ? getAccessToken() : null
  const { data: subRes, isLoading } = useSWR(token ? (["agent-subscription"] as const) : null, () =>
    fetchAgentSubscription(),
  )
  const { data: invRes } = useSWR(token ? (["agent-subscription-invoices"] as const) : null, () =>
    fetchAgentSubscriptionInvoices({ page: 1, pageSize: 20 }),
  )

  const summary: ApiAgentSubscription | undefined = subRes?.data
  const paystackOk = summary?.paystackConfigured ?? false
  const invoices = invRes?.data ?? []

  async function checkout(plan: AgentSubscriptionPlan) {
    setErr(null)
    setCheckoutBusy(plan)
    try {
      const res = await postAgentSubscriptionCheckout(plan)
      window.open(res.data.authorizationUrl, "_blank", "noopener,noreferrer")
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Checkout failed")
    } finally {
      setCheckoutBusy(null)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!token) {
    return (
      <Card className="max-w-lg border-dashed shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Sign in required</CardTitle>
          <CardDescription>Subscription is available after you sign in as an agent.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Subscription</h1>
          <p className="text-muted-foreground">Manage your plan, usage, and billing.</p>
        </div>

        {err ? (
          <p className="text-destructive text-sm" role="alert">
            {err}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-none lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Current plan</CardTitle>
              <CardDescription>{summary?.agencyName ?? "—"}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !summary ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      {planLabel(summary.subscription.plan, summary.tier)}
                    </span>
                    {summary.subscription.status ? (
                      <Badge variant="secondary" className="capitalize">
                        {summary.subscription.status}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    Active listings: {summary.usage.activeListings} · Inquiries this month:{" "}
                    {summary.usage.inquiriesThisMonth}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Paystack: {paystackOk ? "configured (stub checkout)" : "not configured"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((tier) => (
            <Card key={tier.id} className="shadow-none flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{tier.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <ul className="text-muted-foreground text-xs list-disc pl-4 space-y-1 flex-1">
                  {tier.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                {tier.id === "enterprise" ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href="mailto:sales@landshoppers.com?subject=Agent%20Enterprise">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact sales
                    </a>
                  </Button>
                ) : tier.planArg ? (
                  !paystackOk ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-full">
                          <Button size="sm" className="w-full" disabled>
                            Upgrade
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Configure Paystack keys to enable checkout.</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={checkoutBusy === tier.planArg}
                      onClick={() => void checkout(tier.planArg!)}
                    >
                      {checkoutBusy === tier.planArg ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Upgrade
                        </>
                      )}
                    </Button>
                  )
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        {invoices.length > 0 ? (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {invoices.length} payment record(s) on file.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
