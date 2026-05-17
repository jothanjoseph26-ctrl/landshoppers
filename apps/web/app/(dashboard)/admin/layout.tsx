"use client"

import {
  BarChart3,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  ListChecks,
  MessageCircle,
  Search,
  Settings,
  Users,
} from "lucide-react"

import { PortalShell, type PortalNavItem } from "@/components/dashboard/portal-shell"

const navItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/admin", icon: Home },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "KYC", href: "/admin/kyc", icon: Users },
  { title: "Developers", href: "/admin/developers", icon: Users },
  { title: "Services", href: "/admin/services", icon: Search },
  { title: "Listings", href: "/admin/listings", icon: ListChecks },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "WhatsApp", href: "/admin/whatsapp", icon: MessageCircle },
  { title: "SEO", href: "/admin/seo", icon: Search },
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
