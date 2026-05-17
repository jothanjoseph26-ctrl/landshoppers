"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { fetchAdminPayments, fetchAdminPaymentsSummary } from "@/lib/api/admin-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatKoboNaira, formatRelativeTime } from "@/lib/format"
import { getAccessToken } from "@/lib/api/auth-session"

export default function AdminPaymentsPage() {
  const hasToken = typeof window !== "undefined" && Boolean(getAccessToken())

  const payments = usePortalData("admin:payments", () => fetchAdminPayments({ pageSize: 50 }))
  const { data: summaryRes } = useSWR(hasToken ? "admin:payments-summary" : null, () =>
    fetchAdminPaymentsSummary("month"),
  )
  const summary = summaryRes?.data

  if (payments.isUnauthenticated) return <PortalAuthRequired />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Payments</h1>
        <p className="text-muted-foreground">Subscription payments and platform GMV (MTD).</p>
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs">GMV (period)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatKoboNaira(summary.gmvNgKobo)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold tabular-nums">{summary.paymentCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs">Active subs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold tabular-nums">{summary.activeSubscriptions}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {payments.error && !payments.isForbidden && (
        <PortalError title="Couldn't load payments" onRetry={payments.refresh} />
      )}

      {payments.isLoading && <PortalLoading label="Loading ledger…" />}

      {payments.data && payments.data.data.length === 0 && (
        <PortalEmpty title="No payments yet" description="Payment records appear when checkout completes." />
      )}

      {payments.data && payments.data.data.length > 0 && (
        <Card className="shadow-none overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Ledger</CardTitle>
            <CardDescription>Recent payment rows</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.data.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                    <TableCell>{p.agentAgencyName ?? "—"}</TableCell>
                    <TableCell className="capitalize">{p.type.replace("_", " ")}</TableCell>
                    <TableCell className="capitalize">{p.status}</TableCell>
                    <TableCell className="text-right">{formatKoboNaira(p.amount)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelativeTime(p.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
