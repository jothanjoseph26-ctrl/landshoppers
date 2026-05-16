"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import { activateServiceBundle } from "@/lib/api/services-marketplace"
import { getAccessToken } from "@/lib/api/auth-session"
import Link from "next/link"

type Props = {
  bundleId: string
  bundleName: string
}

export function ServiceHubBundleActivateForm({ bundleId, bundleName }: Props) {
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [location, setLocation] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(null)
    if (!getAccessToken()) {
      setError("Please sign in to activate a bundle.")
      return
    }
    setBusy(true)
    try {
      const raw = await activateServiceBundle(bundleId, {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        ...(clientEmail.trim() ? { clientEmail: clientEmail.trim() } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      })
      const leads =
        raw &&
        typeof raw === "object" &&
        "data" in raw &&
        (raw as { data?: { leads?: unknown[] } }).data?.leads
      const n = Array.isArray(leads) ? leads.length : 0
      setDone(`Request sent. ${n} matched provider(s) will see your quote in their inbox.`)
      setClientName("")
      setClientPhone("")
      setClientEmail("")
      setLocation("")
      setMessage("")
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const code =
          err.body &&
          typeof err.body === "object" &&
          "error" in err.body &&
          (err.body as { error?: { message?: string; code?: string } }).error
        setError(code?.message ?? `Request failed (${err.status})`)
      } else {
        setError("Something went wrong.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left">
      <p className="text-sm text-muted-foreground">
        Sign in required.{" "}
        <Link href="/login?next=/services/bundles" className="text-primary underline">
          Sign in
        </Link>
      </p>
      <p className="text-sm font-medium">{bundleName}</p>
      <div className="grid gap-2">
        <Label htmlFor={`nm-${bundleId}`}>Your name</Label>
        <Input
          id={`nm-${bundleId}`}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          minLength={2}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`ph-${bundleId}`}>Phone</Label>
          <Input
            id={`ph-${bundleId}`}
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`em-${bundleId}`}>Email (optional)</Label>
          <Input
            id={`em-${bundleId}`}
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`loc-${bundleId}`}>Where is the work needed?</Label>
        <Input
          id={`loc-${bundleId}`}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Lekki, Lagos"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`msg-${bundleId}`}>Notes (optional)</Label>
        <Textarea
          id={`msg-${bundleId}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {done ? <p className="text-sm text-green-700 dark:text-green-400">{done}</p> : null}
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Request matched quotes"
        )}
      </Button>
    </form>
  )
}
