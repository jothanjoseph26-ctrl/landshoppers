"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  fetchAgentSettings,
  patchAgentSettings,
  type ApiAgentSettings,
} from "@/lib/api/agent-portal"
import { getAccessToken } from "@/lib/api/auth-session"

export default function AgentSettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [agencyName, setAgencyName] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(true)
  const [notifyPush, setNotifyPush] = useState(false)

  useEffect(() => setMounted(true), [])

  const token = mounted ? getAccessToken() : null
  const { data, isLoading, mutate } = useSWR(token ? (["agent-settings"] as const) : null, () =>
    fetchAgentSettings(),
  )

  const row: ApiAgentSettings | undefined = data?.data

  useEffect(() => {
    if (!row) return
    setAgencyName(row.agency.agencyName ?? "")
    setLicenseNumber(row.agency.licenseNumber ?? "")
    setFirstName(row.profile?.firstName ?? "")
    setLastName(row.profile?.lastName ?? "")
    setNotifyEmail(row.notifications.notifyEmail)
    setNotifySms(row.notifications.notifySms)
    setNotifyPush(row.notifications.notifyPush)
  }, [row])

  async function onSave() {
    if (!token) return
    setSaving(true)
    try {
      await patchAgentSettings({
        agencyName: agencyName.trim() || null,
        licenseNumber: licenseNumber.trim() || null,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        notifyEmail,
        notifySms,
        notifyPush,
      })
      await mutate()
      toast.success("Settings saved")
    } catch {
      toast.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (!token) {
    return (
      <Card className="border-dashed shadow-none max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Sign in required</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Agency profile and notification preferences.</p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Agency</CardTitle>
          <CardDescription className="text-xs">Email: {row?.email ?? "—"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || !row ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {row.persona === "agent" ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="agencyName">Agency name</Label>
                    <Input
                      id="agencyName"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="license">License number</Label>
                    <Input
                      id="license"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Organisation name is managed on the developer settings page.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Email</Label>
            <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
          </div>
          <div className="flex justify-between items-center">
            <Label>SMS</Label>
            <Switch checked={notifySms} onCheckedChange={setNotifySms} />
          </div>
          <div className="flex justify-between items-center">
            <Label>Push</Label>
            <Switch checked={notifyPush} onCheckedChange={setNotifyPush} />
          </div>
        </CardContent>
      </Card>

      <Button disabled={saving} onClick={() => void onSave()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save changes
      </Button>
    </div>
  )
}
