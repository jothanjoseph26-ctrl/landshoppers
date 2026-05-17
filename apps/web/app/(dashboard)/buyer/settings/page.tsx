"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PortalError } from "@/components/dashboard/portal-feedback"
import {
  fetchBuyerSettings,
  patchBuyerSettings,
  type ApiBuyerSettings,
} from "@/lib/api/buyer-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

export default function BuyerSettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [phone, setPhone] = useState("")
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(true)
  const [notifyPush, setNotifyPush] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const { data, error, isLoading, mutate } = useSWR(token ? (["buyer-settings"] as const) : null, () =>
    fetchBuyerSettings(),
    { shouldRetryOnError: false },
  )

  const row: ApiBuyerSettings | undefined = data?.data

  useEffect(() => {
    if (!row) return
    setFirstName(row.profile?.firstName ?? "")
    setLastName(row.profile?.lastName ?? "")
    setCity(row.profile?.city ?? "")
    setState(row.profile?.state ?? "")
    setPhone(row.phone ?? "")
    setNotifyEmail(row.notifications.notifyEmail)
    setNotifySms(row.notifications.notifySms)
    setNotifyPush(row.notifications.notifyPush)
  }, [row])

  async function onSave() {
    if (!token) return
    setSaving(true)
    try {
      await patchBuyerSettings({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        phone: phone.trim() || null,
        notifyEmail,
        notifySms,
        notifyPush,
      })
      await mutate()
      toast.success("Settings saved")
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? "Could not save settings" : "Save failed")
    } finally {
      setSaving(false)
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
          <CardDescription>Settings are available after you sign in.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Profile, notifications, and account preferences.</p>
      </div>

      {error && (
        <PortalError
          title="Couldn't load settings"
          description={
            error instanceof ApiRequestError && error.status === 404
              ? "The settings API was not found. Restart the API on port 4001 and reload."
              : "Check that the API is running and you are signed in."
          }
          onRetry={() => void mutate()}
        />
      )}

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription className="text-xs">
            Account email: <span className="text-foreground font-medium">{row?.email ?? "—"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {isLoading || !row ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    className="h-9 text-sm"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    className="h-9 text-sm"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs">
                    City
                  </Label>
                  <Input id="city" className="h-9 text-sm" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs">
                    State
                  </Label>
                  <Input
                    id="state"
                    className="h-9 text-sm"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">
                  Phone
                </Label>
                <Input id="phone" className="h-9 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription className="text-xs">Choose how we reach you about tours and listings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifyEmail" className="text-sm">
              Email
            </Label>
            <Switch id="notifyEmail" checked={notifyEmail} onCheckedChange={setNotifyEmail} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifySms" className="text-sm">
              SMS
            </Label>
            <Switch id="notifySms" checked={notifySms} onCheckedChange={setNotifySms} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifyPush" className="text-sm">
              Push (when available)
            </Label>
            <Switch id="notifyPush" checked={notifyPush} onCheckedChange={setNotifyPush} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription className="text-xs">Password changes use the standard reset flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link href="/forgot-password">Reset password</Link>
          </Button>
        </CardContent>
      </Card>

      <Button type="button" disabled={saving || isLoading} onClick={() => void onSave()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save changes
      </Button>
    </div>
  )
}
