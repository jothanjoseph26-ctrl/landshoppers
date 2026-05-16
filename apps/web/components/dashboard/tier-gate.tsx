"use client"

import Link from "next/link"
import { Lock } from "lucide-react"

import type { AgentPortalTier } from "@/lib/api/agent-portal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const TIER_RANK: Record<AgentPortalTier, number> = {
  free: 0,
  pro: 1,
  elite: 2,
}

type Props = {
  /** Minimum tier required to see `children`. */
  minTier: "pro" | "elite"
  currentTier: AgentPortalTier
  children: React.ReactNode
  /** Shown when the user is below `minTier`. Defaults to upgrade card. */
  fallback?: React.ReactNode
  subscriptionHref?: string
  /** Portal name shown on the upgrade card (Provider vs Agent). */
  portalProductLabel?: string
}

export function TierGate({
  minTier,
  currentTier,
  children,
  fallback,
  subscriptionHref = "/agent/subscription",
  portalProductLabel = "LandShoppers Agent Portal",
}: Props) {
  if (TIER_RANK[currentTier] >= TIER_RANK[minTier]) {
    return <>{children}</>
  }

  if (fallback !== undefined) {
    return <>{fallback}</>
  }

  const target = minTier === "elite" ? "Elite" : "Pro"

  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <CardTitle className="text-base font-semibold">{target} feature</CardTitle>
        </div>
        <CardDescription>
          Upgrade your plan to unlock this on {portalProductLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild size="sm">
          <Link href={subscriptionHref}>View plans</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
