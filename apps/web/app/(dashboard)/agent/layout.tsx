"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import {
  BadgeCheck,
  BarChart3,
  CreditCard,
  Handshake,
  Home,
  Inbox,
  ListChecks,
  MessageSquare,
  PenLine,
  Settings,
  Share2,
  User,
  Wallet,
} from "lucide-react"

import { PortalShell, type PortalNavItem } from "@/components/dashboard/portal-shell"
import { fetchAgentContext } from "@/lib/api/agent-portal"
import { getAccessToken } from "@/lib/api/auth-session"

const navItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/agent", icon: Home },
  { title: "Listings", href: "/agent/listings", icon: ListChecks },
  { title: "Content", href: "/agent/content", icon: PenLine },
  { title: "Partners", href: "/agent/partners", icon: Handshake },
  { title: "Referrals", href: "/agent/referrals", icon: Share2 },
  { title: "Commissions", href: "/agent/commissions", icon: Wallet },
  { title: "Leads", href: "/agent/leads", icon: MessageSquare },
  { title: "Messages", href: "/agent/messages", icon: Inbox },
  { title: "WhatsApp", href: "/agent/whatsapp", icon: MessageSquare },
  { title: "KYC", href: "/agent/kyc", icon: BadgeCheck },
  { title: "Subscription", href: "/agent/subscription", icon: CreditCard },
  { title: "Analytics", href: "/agent/analytics", icon: BarChart3 },
  { title: "Profile", href: "/agent/profile", icon: User },
  { title: "Settings", href: "/agent/settings", icon: Settings },
]

function initialsFrom(text: string): string {
  const t = text.trim()
  if (!t) return "?"
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

function primaryPersonaLabel(ctx: {
  agencyName: string | null
  displayName: string | null
  email: string
}): string {
  if (ctx.agencyName?.trim()) return ctx.agencyName.trim()
  if (ctx.displayName?.trim()) return ctx.displayName.trim()
  return ctx.email.split("@")[0] || "Agent"
}

function personaSubline(ctx: {
  agencyName: string | null
  displayName: string | null
  city: string | null
  state: string | null
}): string | null {
  const bits: string[] = []
  if (ctx.agencyName?.trim() && ctx.displayName?.trim()) {
    bits.push(ctx.displayName.trim())
  }
  const loc = [ctx.city?.trim(), ctx.state?.trim()].filter(Boolean).join(", ")
  if (loc) bits.push(loc)
  const s = bits.join(" · ")
  return s.length > 0 ? s : null
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const { data: ctx } = useSWR(token ? "agent-portal:context" : null, () => fetchAgentContext(), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  const persona = !token
    ? "Property Agent"
    : ctx
      ? primaryPersonaLabel(ctx)
      : "Loading…"

  const initials = !token ? "AG" : ctx ? initialsFrom(primaryPersonaLabel(ctx)) : "…"

  return (
    <PortalShell
      navItems={navItems}
      portalTitle="Agent Portal"
      persona={persona}
      initials={initials}
      personaSubline={ctx ? personaSubline(ctx) : null}
      avatarUrl={ctx?.avatarUrl ?? null}
      tier={ctx?.tier ?? null}
      subscriptionHref="/agent/subscription"
    >
      {children}
    </PortalShell>
  )
}
