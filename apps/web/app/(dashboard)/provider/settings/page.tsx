"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { fetchProviderSettings, patchProviderSettings } from "@/lib/api/provider-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

export default function ProviderSettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(true)
  const [notifyPush, setNotifyPush] = useState(false)
  const [defaultQuoteNote, setDefaultQuoteNote] = useState("")
  const [autoAck, setAutoAck] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null
  const { data, isLoading, mutate } = useSWR(token ? (["provider-settings"] as const) : null, () =>
    fetchProviderSettings(),
  )

  useEffect(() => {
    if (!data) return
    setNotifyEmail(data.notifyEmail)
    setNotifySms(data.notifySms)
    setNotifyPush(data.notifyPush)
    setDefaultQuoteNote(data.preferences?.serviceProvider?.defaultQuoteNote ?? "")
    setAutoAck(data.preferences?.serviceProvider?.autoAcknowledgeLeads ?? false)
  }, [data])

  async function onSave() {
    if (!token) return
    setSaving(true)
    setErr(null)
    try {
      await patchProviderSettings({
        notifyEmail,
        notifySms,
        notifyPush,
        preferences: {
          serviceProvider: {
            autoAcknowledgeLeads: autoAck,
            defaultQuoteNote: defaultQuoteNote.trim() === "" ? null : defaultQuoteNote.trim(),
          },
        },
      })
      await mutate()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Save failed")
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
          <CardDescription>Provider settings are available after you sign in.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          PRV-11 — notifications and lead defaults for your provider account.
        </p>
      </div>

      {err ? (
        <p className="text-destructive text-sm" role="alert">
          {err}
        </p>
      ) : null}

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription className="text-xs">
            {data?.businessName ?? "—"} · {data?.email ?? "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          {isLoading || !data ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-sm font-medium">Notifications</h2>
                <NotifyRow id="notifyEmail" label="Email" checked={notifyEmail} onChange={setNotifyEmail} />
                <NotifyRow id="notifySms" label="SMS" checked={notifySms} onChange={setNotifySms} />
                <NotifyRow id="notifyPush" label="Push" checked={notifyPush} onChange={setNotifyPush} />
              </section>
              <section className="space-y-3 border-t pt-4">
                <h2 className="text-sm font-medium">Lead preferences</h2>
                <NotifyRow id="autoAck" label="Auto-acknowledge new leads" checked={autoAck} onChange={setAutoAck} />
                <div className="space-y-1.5">
                  <Label htmlFor="quoteNote" className="text-xs">
                    Default quote note
                  </Label>
                  <Textarea
                    id="quoteNote"
                    className="text-sm min-h-[80px]"
                    value={defaultQuoteNote}
                    onChange={(e) => setDefaultQuoteNote(e.target.value)}
                  />
                </div>
              </section>
              <Button type="button" size="sm" disabled={saving} onClick={() => void onSave()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save changes
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NotifyRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
