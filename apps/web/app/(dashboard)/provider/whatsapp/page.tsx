"use client"

import useSWR from "swr"
import { Loader2, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ApiRequestError } from "@/lib/api/client"
import type { ApiErrorBody } from "@/lib/api/types"
import {
  fetchProviderContext,
  fetchProviderWhatsapp,
  patchProviderWhatsapp,
} from "@/lib/api/provider-portal"
import { getAccessToken } from "@/lib/api/auth-session"

function featureGatedMessage(err: ApiRequestError): string | null {
  const body = err.body
  if (body && typeof body === "object" && "error" in body) {
    const b = body as ApiErrorBody
    if (b.error.code === "FEATURE_GATED") return b.error.message
  }
  return null
}

export default function ProviderWhatsappPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  const [toggleBusy, setToggleBusy] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null
  const ctxKey = token ? (["provider-context"] as const) : null
  const waKey = token ? (["provider-whatsapp"] as const) : null

  const { data: ctx, error: ctxErr } = useSWR(ctxKey, fetchProviderContext)
  const {
    data: wa,
    error: waErr,
    isLoading,
    mutate,
  } = useSWR(waKey, fetchProviderWhatsapp)

  useEffect(() => {
    if (wa?.phoneNumber != null) setPhone(wa.phoneNumber)
    if (wa?.phoneNumber === null) setPhone("")
  }, [wa?.phoneNumber])

  const tierFree = ctx?.tier === "free"

  const loadError = useMemo(() => {
    const e = ctxErr ?? waErr
    if (!e) return null
    return e instanceof ApiRequestError ? JSON.stringify(e.body) : String(e)
  }, [ctxErr, waErr])

  async function onConnectedChange(next: boolean) {
    setErr(null)
    setToggleBusy(true)
    try {
      await patchProviderWhatsapp({ connected: next })
      await mutate()
    } catch (e) {
      if (e instanceof ApiRequestError) {
        const gated = featureGatedMessage(e)
        setErr(gated ?? JSON.stringify(e.body))
      } else {
        setErr("Update failed")
      }
    } finally {
      setToggleBusy(false)
    }
  }

  async function savePhone() {
    setErr(null)
    try {
      await patchProviderWhatsapp({ phoneNumber: phone.trim() || null })
      await mutate()
    } catch (e) {
      if (e instanceof ApiRequestError) {
        const gated = featureGatedMessage(e)
        setErr(gated ?? JSON.stringify(e.body))
      } else {
        setErr("Update failed")
      }
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
          <CardDescription>WhatsApp bridge is available to service provider accounts.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const statusLabel = wa?.status ?? (wa?.connected ? "connected" : "disconnected")

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">WhatsApp bridge</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect monitored WhatsApp activity for lead capture (PRV-05). Requires Pro or Elite when Evolution is
            enabled.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </Button>
      </div>

      {tierFree ? (
        <Card className="border-amber-200 bg-amber-50/80 shadow-none dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upgrade required</CardTitle>
            <CardDescription className="text-foreground/90">
              WhatsApp bridge requires a Pro or Elite subscription.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {(err || loadError) && (
        <p className="text-destructive text-sm" role="alert">
          {err ?? loadError}
        </p>
      )}

      {isLoading && !wa ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading connection…
        </div>
      ) : wa ? (
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connection</CardTitle>
            <CardDescription>
              Evolution integration {wa.evolutionEnabled ? "enabled" : "disabled"} on this environment · Status:{" "}
              <span className="font-medium text-foreground">{statusLabel}</span>
              {wa.lastActiveAt ? (
                <>
                  {" "}
                  · Last active {new Date(wa.lastActiveAt).toLocaleString()}
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Connected</p>
                <p className="text-xs text-muted-foreground">Mirror inbox monitoring state</p>
              </div>
              <Switch
                checked={wa.connected}
                disabled={tierFree || toggleBusy}
                onCheckedChange={(c) => void onConnectedChange(c)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-phone">Phone number</Label>
              <Input
                id="wa-phone"
                type="tel"
                value={phone}
                disabled={tierFree}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234…"
              />
              <Button type="button" variant="link" className="h-auto px-0" disabled={tierFree} onClick={() => void savePhone()}>
                Save phone number
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Monitored groups: {wa.monitoredGroups.length}</p>
              <p>Extracted leads (session): {wa.extractedLeadsCount}</p>
            </div>

            {toggleBusy ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                Updating…
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
