"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  PortalAuthRequired,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { fetchMe } from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

export default function AgentProfilePage() {
  const me = usePortalData("agent:profile-me", fetchMe)
  if (me.isUnauthenticated) return <PortalAuthRequired />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Agent profile</h1>
        <p className="text-muted-foreground">
          Read-only summary of your public agent profile. Editing will land in the next slice.
        </p>
      </div>

      {me.error && !me.isForbidden && <PortalError onRetry={me.refresh} />}
      {me.isLoading && <PortalLoading />}

      {me.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {me.data.profile?.firstName ?? me.data.email}
              {me.data.agent?.isVerified && <Badge>Verified</Badge>}
            </CardTitle>
            <CardDescription>
              Joined {formatRelativeTime(me.data.createdAt)} · last login {formatRelativeTime(me.data.lastLoginAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Email</p>
              <p>{me.data.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Agency</p>
              <p>{me.data.agent?.agencyName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Phone</p>
              <p>{me.data.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Location</p>
              <p>{me.data.profile?.city && me.data.profile?.state ? `${me.data.profile.city}, ${me.data.profile.state}` : "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
