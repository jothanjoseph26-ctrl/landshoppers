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

export default function AgentKycPage() {
  const me = usePortalData("agent:kyc-me", fetchMe)
  if (me.isUnauthenticated) return <PortalAuthRequired />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">KYC & verification</h1>
        <p className="text-muted-foreground">Submit documents and track verification status.</p>
      </div>

      {me.error && !me.isForbidden && <PortalError onRetry={me.refresh} />}
      {me.isLoading && <PortalLoading />}

      {me.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {me.data.agent?.agencyName ?? me.data.email}
              <Badge variant={me.data.agent?.isVerified ? "default" : "outline"}>
                {me.data.agent?.isVerified ? "Verified" : "Pending"}
              </Badge>
            </CardTitle>
            <CardDescription>
              KYC document upload will be wired into the upload + admin review API in the next slice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Until the upload API ships, your verification badge reflects the value on your agent profile.</p>
            <p>Reach out to support if you need an early review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
