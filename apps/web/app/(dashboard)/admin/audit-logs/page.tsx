"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { fetchAdminAuditLogs } from "@/lib/api/admin-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

export default function AdminAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("")
  const [appliedAction, setAppliedAction] = useState<string | undefined>(undefined)

  const logs = usePortalData(`admin:audit-logs:${appliedAction ?? "all"}`, () =>
    fetchAdminAuditLogs({ pageSize: 50, action: appliedAction }),
  )

  if (logs.isUnauthenticated) return <PortalAuthRequired />

  const applyFilters = () => {
    const trimmed = actionFilter.trim()
    setAppliedAction(trimmed.length > 0 ? trimmed : undefined)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Audit logs</h1>
        <p className="text-muted-foreground">
          Operational evidence for compliance and incident review.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="actionFilter">Action contains</Label>
            <Input
              id="actionFilter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="admin.user.suspend"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <Button onClick={applyFilters}>Apply</Button>
          {appliedAction && (
            <Button
              variant="outline"
              onClick={() => {
                setActionFilter("")
                setAppliedAction(undefined)
              }}
            >
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {logs.error && !logs.isForbidden && (
        <PortalError
          title="Couldn't load audit logs"
          description="The API returned an error. Please retry."
          onRetry={logs.refresh}
        />
      )}

      {logs.isLoading && <PortalLoading label="Loading audit trail…" />}

      {logs.data && logs.data.data.length === 0 && (
        <PortalEmpty
          title="No entries"
          description="No audit log entries match your filters."
          primaryHref="/admin"
          primaryLabel="Back to admin"
        />
      )}

      {logs.data && logs.data.data.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {row.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{row.actorEmail ?? "—"}</div>
                      {row.actorRole && (
                        <p className="text-xs text-muted-foreground">{row.actorRole}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.targetType && row.targetId
                        ? `${row.targetType}:${row.targetId.slice(0, 8)}…`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-xs font-mono text-muted-foreground">
                      {row.changesPreview ?? "—"}
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
