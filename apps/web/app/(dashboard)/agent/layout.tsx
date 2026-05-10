"use client"

import { BadgeCheck, BarChart3, CreditCard, Home, ListChecks, MessageSquare, Settings, User } from "lucide-react"

import { PortalShell, type PortalNavItem } from "@/components/dashboard/portal-shell"

const navItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/agent", icon: Home },
  { title: "Listings", href: "/agent/listings", icon: ListChecks },
  { title: "Leads", href: "/agent/leads", icon: MessageSquare },
  { title: "KYC", href: "/agent/kyc", icon: BadgeCheck },
  { title: "Subscription", href: "/agent/subscription", icon: CreditCard },
  { title: "Analytics", href: "/agent/analytics", icon: BarChart3 },
  { title: "Profile", href: "/agent/profile", icon: User },
  { title: "Settings", href: "/agent/settings", icon: Settings },
]

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      navItems={navItems}
      portalTitle="Agent Portal"
      persona="Property Agent"
      initials="AG"
    >
      {children}
    </PortalShell>
  )
}
