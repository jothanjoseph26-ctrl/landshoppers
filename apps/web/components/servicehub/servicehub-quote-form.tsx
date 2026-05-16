"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiRequestError } from "@/lib/api/client"
import { submitServiceQuote, type ServiceQuotePayload } from "@/lib/api/services-marketplace"

type Props = {
  providerSlug: string
  providerName: string
  services: string[]
  listingId?: string
  quoteSource?: ServiceQuotePayload["source"]
}

export function ServiceHubQuoteForm({
  providerSlug,
  providerName,
  services,
  listingId,
  quoteSource = "directory",
}: Props) {
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    serviceRequested: services[0] ?? "General enquiry",
    message: "",
    timeline: "",
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setPending(true)
    try {
      await submitServiceQuote(providerSlug, {
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        clientEmail: form.clientEmail.trim() || undefined,
        serviceRequested: form.serviceRequested,
        message: form.message.trim() || `Quote request for ${providerName}.`,
        timeline: form.timeline || undefined,
        listingId,
        source: quoteSource,
      })
      setSent(true)
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.status === 404 || e.status === 501) {
          setErr(
            "Quote requests are not available from the server yet. Try again after the next API update, or call the provider directly.",
          )
          return
        }
        const b = e.body as { error?: { message?: string } } | null
        setErr(b?.error?.message ?? `Could not submit (${e.status}).`)
      } else {
        setErr("Something went wrong. Try again.")
      }
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks — your request was sent to {providerName}. They will reply on the phone number you
        provided.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="q-name">Name</Label>
        <Input
          id="q-name"
          value={form.clientName}
          onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="q-phone">Phone</Label>
        <Input
          id="q-phone"
          type="tel"
          value={form.clientPhone}
          onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="q-email">Email (optional)</Label>
        <Input
          id="q-email"
          type="email"
          value={form.clientEmail}
          onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Service needed</Label>
        <Select
          value={form.serviceRequested}
          onValueChange={(v) => setForm((f) => ({ ...f, serviceRequested: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="q-msg">Message</Label>
        <Textarea
          id="q-msg"
          rows={4}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Describe what you need and any deadlines."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Timeline</Label>
        <Select
          value={form.timeline || "unset"}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, timeline: v === "unset" ? "" : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="When do you need this?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">Not specified</SelectItem>
            <SelectItem value="ASAP">ASAP</SelectItem>
            <SelectItem value="Within 1 week">Within 1 week</SelectItem>
            <SelectItem value="1–4 weeks">1–4 weeks</SelectItem>
            <SelectItem value="Flexible">Flexible</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {err && <p className="text-xs text-amber-800 dark:text-amber-100">{err}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending
          </>
        ) : (
          "Request quote"
        )}
      </Button>
    </form>
  )
}
