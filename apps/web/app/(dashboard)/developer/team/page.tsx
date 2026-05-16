"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  createDeveloperTeamInvite,
  fetchDeveloperTeamActivity,
  fetchDeveloperTeamInvites,
  fetchDeveloperTeamMembers,
  patchDeveloperTeamMember,
  revokeDeveloperTeamInvite,
  type ApiTeamMember,
  type DeveloperTeamRole,
} from "@/lib/api/developer-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

const ROLES: DeveloperTeamRole[] = ["admin", "sales", "marketing", "viewer"]

const PERMISSION_ROWS: { capability: string; admin: string; sales: string; marketing: string; viewer: string }[] = [
  { capability: "Invite / revoke", admin: "Yes", sales: "—", marketing: "—", viewer: "—" },
  { capability: "Change roles / disable", admin: "Yes", sales: "—", marketing: "—", viewer: "—" },
  { capability: "View members & activity", admin: "Yes", sales: "Yes", marketing: "Yes", viewer: "Yes" },
  { capability: "Projects & leads (portal)", admin: "Yes", sales: "Yes*", marketing: "Yes*", viewer: "Read*" },
]

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "admin") return "default"
  if (role === "viewer") return "outline"
  return "secondary"
}

export default function DeveloperTeamPage() {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState("members")
  const [err, setErr] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<DeveloperTeamRole>("sales")
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteFlash, setInviteFlash] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const teamKey = token ? (["developer-team", "core"] as const) : null

  const loadTeam = async () => {
    setErr(null)
    try {
      const [members, invites, activity] = await Promise.all([
        fetchDeveloperTeamMembers(),
        fetchDeveloperTeamInvites(),
        fetchDeveloperTeamActivity({ page: 1, pageSize: 20 }),
      ])
      return { members, invites, activity }
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Failed to load team")
      throw e
    }
  }

  const { data, isLoading, mutate } = useSWR(teamKey, loadTeam)

  const portalAdmin = data?.members.meta.portalAdmin ?? false
  const members = data?.members.data ?? []
  const invites = data?.invites.data ?? []
  const activity = data?.activity.data ?? []

  async function submitInvite() {
    if (!inviteEmail.trim()) return
    setInviteBusy(true)
    setInviteFlash(null)
    setErr(null)
    try {
      const res = await createDeveloperTeamInvite({
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      setInviteFlash(
        `Invite created. One-time accept link (share securely): ${typeof window !== "undefined" ? window.location.origin : ""}${res.data.acceptPath}`,
      )
      setInviteEmail("")
      await mutate()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Invite failed")
    } finally {
      setInviteBusy(false)
    }
  }

  async function revokeInvite(id: string) {
    setErr(null)
    try {
      await revokeDeveloperTeamInvite(id)
      await mutate()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Revoke failed")
    }
  }

  async function saveMember(m: ApiTeamMember, next: { role?: DeveloperTeamRole; isDisabled?: boolean }) {
    if (m.isOwner) return
    setErr(null)
    try {
      await patchDeveloperTeamMember(m.userId, next)
      await mutate()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Update failed")
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    )
  }

  if (!token) {
    return (
      <Card className="max-w-lg border-dashed shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Sign in required</CardTitle>
          <CardDescription>Team settings are available to developer accounts after login.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Team</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Members, invites, and audit trail for this developer account. Staff with their own developer profile can
          pass <code className="text-xs bg-muted px-1 py-0.5 rounded">X-Portal-Developer-Id</code> on API calls to
          switch organisation context.
        </p>
      </div>

      {err ? (
        <p className="text-destructive text-sm" role="alert">
          {err}
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Members</CardTitle>
              <CardDescription className="text-xs">
                Organisation owner is always admin. Additional seats use roles below.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.userId}>
                        <TableCell className="text-sm font-medium">{m.displayName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{m.email}</TableCell>
                        <TableCell>
                          {m.isOwner ? (
                            <Badge variant={roleBadgeVariant(m.role)} className="text-xs">
                              {m.role} (owner)
                            </Badge>
                          ) : portalAdmin ? (
                            <Select
                              value={m.role}
                              onValueChange={(v) => {
                                const role = v as DeveloperTeamRole
                                void saveMember(m, { role })
                              }}
                            >
                              <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r} value={r} className="text-xs">
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={roleBadgeVariant(m.role)} className="text-xs">
                              {m.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.isOwner ? (
                            "active"
                          ) : portalAdmin ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={m.status === "disabled"}
                                onCheckedChange={(checked) => {
                                  const isDisabled = Boolean(checked)
                                  void saveMember(m, { isDisabled })
                                }}
                              />
                              <span className="text-muted-foreground text-xs">{m.status}</span>
                            </div>
                          ) : (
                            m.status
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {m.lastActiveAt ? new Date(m.lastActiveAt).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          {portalAdmin ? (
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  New invite
                </CardTitle>
                <CardDescription className="text-xs">
                  Sends a tokenised link (MVP). Accept-invite UI is a follow-up route.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email" className="text-xs">
                      Email
                    </Label>
                    <Input
                      id="invite-email"
                      type="email"
                      className="h-9 text-sm"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as DeveloperTeamRole)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="button" size="sm" disabled={inviteBusy} onClick={() => void submitInvite()}>
                  {inviteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create invite"}
                </Button>
                {inviteFlash ? (
                  <p className="text-muted-foreground text-xs break-all border border-dashed rounded-md p-2 bg-muted/30">
                    {inviteFlash}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm">Only portal admins can create or revoke invites.</p>
          )}

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pending invites</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : invites.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active invites.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Expires</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="text-sm">{inv.email}</TableCell>
                        <TableCell className="text-xs">{inv.role}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {portalAdmin ? (
                            <Button type="button" variant="ghost" size="sm" onClick={() => void revokeInvite(inv.id)}>
                              Revoke
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Team activity</CardTitle>
              <CardDescription className="text-xs">Invite and membership changes (audit log subset).</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : activity.length === 0 ? (
                <p className="text-muted-foreground text-sm">No team events yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">When</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{row.action}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.actorEmail ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Role matrix (MVP)</CardTitle>
              <CardDescription className="text-xs">
                Server enforces admin-only mutations; project-scoped access uses membership{" "}
                <code className="bg-muted px-1 rounded">projectIds</code> when set.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Capability</TableHead>
                    <TableHead className="text-xs">Admin</TableHead>
                    <TableHead className="text-xs">Sales</TableHead>
                    <TableHead className="text-xs">Marketing</TableHead>
                    <TableHead className="text-xs">Viewer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_ROWS.map((r) => (
                    <TableRow key={r.capability}>
                      <TableCell className="text-sm">{r.capability}</TableCell>
                      <TableCell className="text-xs">{r.admin}</TableCell>
                      <TableCell className="text-xs">{r.sales}</TableCell>
                      <TableCell className="text-xs">{r.marketing}</TableCell>
                      <TableCell className="text-xs">{r.viewer}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-muted-foreground text-xs mt-2">
                *Other portal routes still resolve your primary developer profile unless{" "}
                <code className="bg-muted px-1 rounded">X-Portal-Developer-Id</code> is added there too (team routes
                only for now).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
