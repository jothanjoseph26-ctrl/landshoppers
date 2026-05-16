"use client"

import {
  Calendar,
  Clock,
  Heart,
  Home,
  MessageSquare,
  Search,
  Settings,
  User,
  Briefcase,
} from "lucide-react"

import { PortalShell, type PortalNavItem } from "@/components/dashboard/portal-shell"

const navItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/buyer", icon: Home },
  { title: "Saved Listings", href: "/buyer/saved", icon: Heart },
  { title: "Searches", href: "/buyer/searches", icon: Search },
  { title: "Inquiries", href: "/buyer/inquiries", icon: MessageSquare },
  { title: "Services", href: "/buyer/services", icon: Briefcase },
  { title: "Recently viewed", href: "/buyer/recent", icon: Clock },
  { title: "Tours", href: "/buyer/tours", icon: Calendar },
  { title: "Profile", href: "/buyer/profile", icon: User },
  { title: "Settings", href: "/buyer/settings", icon: Settings },
]

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      navItems={navItems}
      portalTitle="Buyer Dashboard"
      persona="Property Buyer"
      initials="BY"
    >
      {children}
    </PortalShell>
  )
}
