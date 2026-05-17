"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { fetchAdminUsers, patchAdminUser, type ApiAdminUser } from "@/lib/api/admin-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

export default function AdminUsersPage() {
  const [q, setQ] = useState("")
  const [role, setRole] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [pending, setPending] = useState<string | null>(null)

  const users = usePortalData(
    `admin:users:${q}:${role}:${status}`,
    () =>
      fetchAdminUsers({
        pageSize: 50,
        q: q.trim() || undefined,
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : (status as "active" | "suspended"),
      }),

  )

  if (users.isUnauthenticated) return <PortalAuthRequired />

  const toggleSuspend = async (row: ApiAdminUser) => {
    setPending(row.id)
    try {
      await patchAdminUser(row.id, { suspended: !row.flags.suspended })
      toast.success(row.flags.suspended ? "User reactivated" : "User suspended")
      users.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">User management</h1>
        <p className="text-muted-foreground">Search users, filter by role, and suspend accounts.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search email or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => users.refresh()}>
          Refresh
        </Button>
      </div>

      {users.error && !users.isForbidden && (
        <PortalError title="Couldn't load users" onRetry={users.refresh} />
      )}

      {users.isLoading && <PortalLoading label="Loading users…" />}

      {users.data && users.data.data.length === 0 && (
        <PortalEmpty title="No users match" description="Try a different search or filter." />
      )}

      {users.data && users.data.data.length > 0 && (
        <Card className="shadow-none overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.email}</div>
                      <div className="text-muted-foreground text-xs">
                        {[row.profile?.firstName, row.profile?.lastName].filter(Boolean).join(" ") ||
                          "—"}
                        {row.profile?.city ? ` · ${row.profile.city}` : null}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{row.role.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={row.flags.suspended ? "destructive" : "secondary"}>
                        {row.flags.suspended ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.lastLoginAt ? formatRelativeTime(row.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending === row.id}
                        onClick={() => void toggleSuspend(row)}
                      >
                        {pending === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : row.flags.suspended ? (
                          "Reactivate"
                        ) : (
                          "Suspend"
                        )}
                      </Button>
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
