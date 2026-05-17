"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PortalAuthRequired,
} from "@/components/dashboard/portal-feedback"
import { downloadAdminReport, type AdminReportKind } from "@/lib/api/admin-portal"
import { getAccessToken } from "@/lib/api/auth-session"

const REPORTS: { kind: AdminReportKind; title: string; description: string }[] = [
  {
    kind: "users",
    title: "Users export",
    description: "CSV of active users with email, role, city, and login timestamps.",
  },
  {
    kind: "listings",
    title: "Listings export",
    description: "CSV of listings with status, price, title, and location.",
  },
  {
    kind: "payments",
    title: "Payments export",
    description: "CSV of payment ledger rows with agent and reference.",
  },
]

export default function AdminReportsPage() {
  const [busy, setBusy] = useState<AdminReportKind | null>(null)
  const hasToken = typeof window !== "undefined" && Boolean(getAccessToken())

  if (!hasToken) return <PortalAuthRequired />

  const onDownload = async (kind: AdminReportKind) => {
    setBusy(kind)
    try {
      await downloadAdminReport(kind)
      toast.success("Download started")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Reports</h1>
        <p className="text-muted-foreground">
          Download CSV snapshots for offline analysis. Exports are rate-limited to 10 per hour per admin.
        </p>
      </div>

      <div className="grid gap-4">
        {REPORTS.map((r) => (
          <Card key={r.kind} className="shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base">{r.title}</CardTitle>
                <CardDescription className="mt-1">{r.description}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => void onDownload(r.kind)}
              >
                {busy === r.kind ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground text-xs font-mono">GET /v1/admin/reports/{r.kind}?format=csv</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
