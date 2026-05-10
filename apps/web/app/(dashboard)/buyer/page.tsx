"use client"

import { Calendar, Heart, MessageSquare, Search } from "lucide-react"

import { PortalDashboard } from "@/components/dashboard/portal-dashboard"

export default function BuyerDashboardPage() {
  return (
    <PortalDashboard
      title="Buyer Dashboard"
      description="Track saved homes, inquiries, tours, and property searches."
      stats={[
        { title: "Saved listings", value: "0", description: "Homes you are watching", icon: Heart },
        { title: "Active searches", value: "0", description: "Saved filters and alerts", icon: Search },
        { title: "Inquiries", value: "0", description: "Messages sent to agents", icon: MessageSquare },
        { title: "Tours", value: "0", description: "Scheduled property visits", icon: Calendar },
      ]}
      actions={[
        { title: "Browse listings", description: "Find active properties in the marketplace.", href: "/listings" },
        { title: "Find agents", description: "Contact verified professionals.", href: "/agents" },
        { title: "Explore services", description: "Connect with property service providers.", href: "/services" },
      ]}
    />
  )
}
