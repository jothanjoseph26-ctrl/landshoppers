"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Copy, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  PortalAuthRequired,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { fetchAdminSettings, patchAdminSettings } from "@/lib/api/admin-portal"
import { ApiRequestError } from "@/lib/api/client"

function FlagRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "On" : "Off"}</Badge>
    </div>
  )
}

export default function AdminSettingsPage() {
  const { data, error, isLoading, mutate } = useSWR("admin:settings", fetchAdminSettings, {
    onError: () => {},
  })
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [minScore, setMinScore] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) return
    setMaintenanceMode(data.maintenanceMode)
    setMinScore(
      data.whatsappAutoApproveMinScore != null ? String(data.whatsappAutoApproveMinScore) : "",
    )
  }, [data])

  if (error && error instanceof ApiRequestError && error.status === 401) {
    return <PortalAuthRequired />
  }

  const copy = (value: string) => {
    void navigator.clipboard.writeText(value)
    toast.success("Copied to clipboard")
  }

  const onSave = async () => {
    if (!data?.patchSupported) return
    setSaving(true)
    try {
      const parsed = minScore.trim() === "" ? null : Number.parseFloat(minScore.trim())
      if (minScore.trim() !== "" && (parsed == null || parsed < 0 || parsed > 1)) {
        toast.error("Auto-approve score must be between 0 and 1")
        return
      }
      await patchAdminSettings({
        maintenanceMode,
        whatsappAutoApproveMinScore: parsed,
      })
      toast.success("Platform settings saved")
      await mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Platform settings</h1>
          <p className="text-muted-foreground">
            Editable runtime flags stored in the database. Infrastructure keys remain env-backed.
          </p>
        </div>
        {data?.patchSupported && (
          <Button onClick={onSave} disabled={saving || isLoading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        )}
      </div>

      {error && (
        <PortalError
          title="Couldn't load settings"
          description="The API returned an error. Please retry."
          onRetry={() => mutate()}
        />
      )}

      {isLoading && <PortalLoading label="Loading platform config…" />}

      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Runtime (database)</CardTitle>
              <CardDescription>
                Last updated {new Date(data.updatedAt).toLocaleString()}
                {data.updatedBy ? ` · admin ${data.updatedBy.slice(0, 8)}…` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="maintenanceMode">Maintenance mode</Label>
                  <p className="text-xs text-muted-foreground">
                    When on, portals can show a maintenance banner (wire in middleware as needed).
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waMinScore">WhatsApp auto-approve min score</Label>
                <Input
                  id="waMinScore"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  placeholder="0.85 (empty = disabled)"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Confidence threshold for automatic listing approval from WhatsApp intake.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Infrastructure (read-only)</CardTitle>
              <CardDescription>Configured via deployment environment variables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Paystack</span>
                <Badge variant={data.paystackConfigured ? "default" : "secondary"}>
                  {data.paystackConfigured ? "Configured" : "Not set"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Resend email</span>
                <Badge variant={data.resendConfigured ? "default" : "secondary"}>
                  {data.resendConfigured ? "Configured" : "Not set"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0">WA listing owner ID</span>
                <div className="flex min-w-0 items-center gap-1">
                  <code className="truncate text-xs text-muted-foreground">
                    {data.whatsappDefaultListingUserId ?? "auto (first buyer)"}
                  </code>
                  {data.whatsappDefaultListingUserId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copy(data.whatsappDefaultListingUserId!)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Feature flags</CardTitle>
              <CardDescription>Portal capabilities gated by env until moved to DB.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <FlagRow label="Agent WhatsApp" enabled={data.featureFlags.agentWhatsappEnabled} />
              <FlagRow label="Agent AI insights" enabled={data.featureFlags.agentAiInsightsEnabled} />
              <FlagRow label="Provider WhatsApp" enabled={data.featureFlags.providerWhatsappEnabled} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
