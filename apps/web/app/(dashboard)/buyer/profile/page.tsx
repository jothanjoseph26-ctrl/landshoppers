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

export default function BuyerProfilePage() {
  const me = usePortalData("buyer:profile-me", fetchMe)

  if (me.isUnauthenticated) return <PortalAuthRequired />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Profile</h1>
        <p className="text-muted-foreground">
          Read-only summary of your account. Editing will land with the next vertical slice.
        </p>
      </div>

      {me.error && !me.isForbidden && (
        <PortalError title="Couldn't load profile" onRetry={me.refresh} />
      )}
      {me.isLoading && <PortalLoading />}
      {me.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {me.data.email}
              <Badge variant="secondary">{me.data.role}</Badge>
              {me.data.isEmailVerified && <Badge variant="outline">Email verified</Badge>}
            </CardTitle>
            <CardDescription>
              Account created {formatRelativeTime(me.data.createdAt)} ·
              {" "}
              last login {formatRelativeTime(me.data.lastLoginAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">First name</p>
              <p>{me.data.profile?.firstName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Last name</p>
              <p>{me.data.profile?.lastName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">City</p>
              <p>{me.data.profile?.city ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">State</p>
              <p>{me.data.profile?.state ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Phone</p>
              <p>{me.data.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Country</p>
              <p>{me.data.profile?.country ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
