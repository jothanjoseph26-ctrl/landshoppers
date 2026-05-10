import Link from "next/link"
import { Building2, Home, ShieldCheck, UserRound } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const dashboards = [
  { title: "Buyer", href: "/buyer", description: "Saved listings, searches, inquiries, and tours.", icon: Home },
  { title: "Agent", href: "/agent", description: "Listings, leads, KYC, subscription, and analytics.", icon: UserRound },
  { title: "Developer", href: "/developer", description: "Projects, units, leads, team, and analytics.", icon: Building2 },
  { title: "Admin", href: "/admin", description: "Moderation, payments, reports, and audit logs.", icon: ShieldCheck },
]

export default function DashboardIndexPage() {
  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Choose a dashboard</h1>
          <p className="text-muted-foreground">Select the portal you want to inspect.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {dashboards.map((dashboard) => (
            <Link key={dashboard.href} href={dashboard.href}>
              <Card className="h-full transition-colors hover:bg-muted">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <dashboard.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{dashboard.title}</CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm font-medium text-primary">
                  Open {dashboard.title.toLowerCase()} dashboard
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
