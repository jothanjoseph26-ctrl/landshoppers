"use client"

import Link from "next/link"
import { TierGate } from "@/components/dashboard/tier-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { fetchAgentCommissions, type ApiAgentCommissions } from "@/lib/api/agent-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatDate, formatKoboNaira, formatRelativeTime } from "@/lib/format"

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "successful") return "default"
  if (status === "pending") return "secondary"
  if (status === "failed" || status === "refunded") return "destructive"
  return "outline"
}

export default function AgentCommissionsPage() {
  const commissions = usePortalData("agent:commissions", fetchAgentCommissions)

  if (commissions.isUnauthenticated) return <PortalAuthRequired />

  const data: ApiAgentCommissions | undefined = commissions.data
  const summary = data?.summary

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AGT-08</p>
          <h1 className="text-2xl font-bold md:text-3xl">Commission tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track earned commissions, wallet balance, and payout-related transactions.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/agent/analytics">View analytics</Link>
        </Button>
      </div>

      {commissions.isLoading && <PortalLoading label="Loading commissions…" />}

      {commissions.error && !commissions.isForbidden && (
        <PortalError title="Couldn't load commissions" onRetry={commissions.refresh} />
      )}

      {summary && data && (
        <>
          <TierGate minTier="pro" currentTier={summary.tier}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Lifetime earned"
                value={formatKoboNaira(summary.commissionEarnedKobo)}
                hint="Total commission credited to your profile"
              />
              <KpiCard
                label="Wallet balance"
                value={formatKoboNaira(summary.walletBalanceKobo)}
                hint="Available for payout"
              />
              <KpiCard
                label="Pending payout"
                value={formatKoboNaira(summary.pendingPayoutKobo)}
                hint="Same as wallet until withdrawal rails ship"
              />
              <KpiCard
                label="Est. monthly"
                value={
                  summary.estimatedMonthlyNgKobo != null
                    ? formatKoboNaira(summary.estimatedMonthlyNgKobo)
                    : "—"
                }
                hint="Lifetime ÷ 12 heuristic"
              />
            </div>
          </TierGate>

          {!summary.earningsAvailable && (
            <Card className="border-dashed shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Upgrade for earnings insights</CardTitle>
                <CardDescription>
                  Pro and Elite tiers unlock commission KPIs on your dashboard and this tracker.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" asChild>
                  <Link href="/agent/subscription">View plans</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {data.disclaimer ? (
            <p className="text-xs text-muted-foreground border-l-2 pl-3">{data.disclaimer}</p>
          ) : null}

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Closed deals</CardTitle>
              <CardDescription>Estimated commission from closed inquiries (2.5% heuristic).</CardDescription>
            </CardHeader>
            <CardContent>
              {data.closedDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No closed deals yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing</TableHead>
                      <TableHead>Closed</TableHead>
                      <TableHead className="text-right">Est. commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.closedDeals.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.listingTitle}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(row.closedAt)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatKoboNaira(row.estimatedCommissionKobo)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.payoutStatus === "paid" ? "default" : "secondary"}>
                            {row.payoutStatus === "paid" ? "Paid" : "Accrued"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Payment ledger</CardTitle>
              <CardDescription>Paystack-linked transactions on your agent account.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment transactions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.reference.slice(0, 12)}…</TableCell>
                        <TableCell className="capitalize text-sm">{tx.type.replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(tx.status)}>{tx.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatKoboNaira(tx.amountKobo)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatRelativeTime(tx.paidAt ?? tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
