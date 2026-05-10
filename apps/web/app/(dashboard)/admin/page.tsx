"use client"

import { CreditCard, ListChecks, Shield, Users } from "lucide-react"

import { PortalDashboard } from "@/components/dashboard/portal-dashboard"

export default function AdminDashboardPage() {
  return (
    <PortalDashboard
      title="Admin Panel"
      description="Moderate users, listings, payments, reports, and audit evidence."
      stats={[
        { title: "Users", value: "0", description: "Accounts awaiting operational wiring", icon: Users },
        { title: "Listings", value: "0", description: "Moderation queue shell", icon: ListChecks },
        { title: "Payments", value: "0", description: "Subscription/payment events", icon: CreditCard },
        { title: "Security", value: "Open", description: "Launch gate tracking", icon: Shield },
      ]}
      actions={[
        { title: "User moderation", description: "Open the user management route shell.", href: "/admin/users" },
        { title: "Listing review", description: "Open listing moderation route shell.", href: "/admin/listings" },
        { title: "Audit evidence", description: "Open audit log route shell.", href: "/admin/audit-logs" },
      ]}
    />
  )
}
