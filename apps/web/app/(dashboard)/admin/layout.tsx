"use client"

import { BarChart3, ClipboardList, CreditCard, FileText, Home, ListChecks, Settings, Shield, Users } from "lucide-react"

import { PortalShell, type PortalNavItem } from "@/components/dashboard/portal-shell"

const navItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/admin", icon: Home },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Listings", href: "/admin/listings", icon: ListChecks },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Reports", href: "/admin/reports", icon: ClipboardList },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      navItems={navItems}
      portalTitle="Admin Panel"
      persona="Platform Admin"
      initials="AD"
    >
      {children}
    </PortalShell>
  )
}
