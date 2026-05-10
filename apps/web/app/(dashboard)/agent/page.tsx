"use client"

import { BadgeCheck, Eye, ListChecks, MessageSquare } from "lucide-react"

import { PortalDashboard } from "@/components/dashboard/portal-dashboard"

export default function AgentDashboardPage() {
  return (
    <PortalDashboard
      title="Agent Portal"
      description="Manage listings, leads, verification, and subscription status."
      stats={[
        { title: "Active listings", value: "0", description: "Properties currently marketed", icon: ListChecks },
        { title: "New leads", value: "0", description: "Buyer inquiries to handle", icon: MessageSquare },
        { title: "Profile views", value: "0", description: "Marketplace visibility", icon: Eye },
        { title: "KYC status", value: "Pending", description: "Verification workflow", icon: BadgeCheck },
      ]}
      actions={[
        { title: "Browse live listings", description: "Review public marketplace inventory.", href: "/listings" },
        { title: "Review leads", description: "Open the lead inbox shell.", href: "/agent/leads" },
        { title: "Start verification", description: "Open the KYC route shell.", href: "/agent/kyc" },
      ]}
    />
  )
}
