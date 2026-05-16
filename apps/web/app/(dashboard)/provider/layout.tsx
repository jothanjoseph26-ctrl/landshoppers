"use client"

import {
  BarChart3,
  Briefcase,
  CreditCard,
  FileText,
  Home,
  ImageIcon,
  Inbox,
  MessageCircle,
  Settings,
  ShieldCheck,
  Star,
  User,
} from "lucide-react"
import { useEffect, useState } from "react"
import useSWR from "swr"

import { PortalShell, type PortalNavItem } from "@/components/dashboard/portal-shell"
import { fetchProviderContext } from "@/lib/api/provider-portal"
import { getAccessToken } from "@/lib/api/auth-session"

const navItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/provider", icon: Home },
  { title: "Lead inbox", href: "/provider/leads", icon: Inbox },
  { title: "Profile & services", href: "/provider/profile", icon: User },
  { title: "Jobs", href: "/provider/jobs", icon: Briefcase },
  { title: "WhatsApp", href: "/provider/whatsapp", icon: MessageCircle },
  { title: "Analytics", href: "/provider/analytics", icon: BarChart3 },
  { title: "Reviews", href: "/provider/reviews", icon: Star },
  { title: "Content studio", href: "/provider/content", icon: ImageIcon },
  { title: "KYC & verification", href: "/provider/kyc", icon: ShieldCheck },
  { title: "Subscription", href: "/provider/subscription", icon: CreditCard },
  { title: "Settings", href: "/provider/settings", icon: Settings },
]

function initialsFrom(text: string): string {
  const t = text.trim()
  if (!t) return "?"
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const { data: ctx } = useSWR(token ? "provider-portal:context" : null, () => fetchProviderContext(), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  const persona = !token ? "Service provider" : ctx ? ctx.businessName : "Loading…"
  const initials = !token ? "SV" : ctx ? initialsFrom(ctx.businessName) : "…"
  const subline =
    ctx?.displayName?.trim() || ctx?.email
      ? [ctx.displayName?.trim(), [ctx.city, ctx.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")
      : null

  return (
    <PortalShell
      navItems={navItems}
      portalTitle="Provider Portal"
      persona={persona}
      initials={initials}
      personaSubline={subline}
      avatarUrl={ctx?.avatarUrl ?? ctx?.logoUrl ?? null}
      tier={ctx?.tier ?? null}
      subscriptionHref="/provider/subscription"
    >
      {children}
    </PortalShell>
  )
}
