"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
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
import {
  DEMO_SERVICE_PROVIDERS,
  submitServiceQuote,
  tryFetchServiceProviders,
  type ApiServiceProviderListItem,
} from "@/lib/api/services-marketplace"
import {
  SERVICE_HUB_CATEGORIES,
  getServiceHubCategoryMeta,
  type ServiceHubCategorySlug,
} from "@/lib/servicehub/categories"
import { getAccessToken } from "@/lib/api/auth-session"
import { cn } from "@/lib/utils"

const STEPS = ["Categories", "Details", "Submit"] as const

type Props = {
  defaultLocation?: string
  defaultMessage?: string
}

export function ServiceHubCustomBundleBuilder({ defaultLocation = "", defaultMessage = "" }: Props) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<ServiceHubCategorySlug[]>([])
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [location, setLocation] = useState(defaultLocation)
  const [message, setMessage] = useState(defaultMessage)
  const [picks, setPicks] = useState<Record<string, ApiServiceProviderListItem>>({})
  const [pool, setPool] = useState<Record<string, ApiServiceProviderListItem[]>>({})
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const signedIn = Boolean(getAccessToken())

  const toggleCategory = (slug: ServiceHubCategorySlug) => {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 6) return prev
      return [...prev, slug]
    })
  }

  const loadPreview = useCallback(async () => {
    setLoading(true)
    const stateGuess = location.split(",").pop()?.trim() || location.trim()
    const nextPool: Record<string, ApiServiceProviderListItem[]> = {}
    const nextPicks: Record<string, ApiServiceProviderListItem> = {}

    await Promise.all(
      selected.map(async (cat) => {
        const res = await tryFetchServiceProviders({
          category: cat,
          state: stateGuess || undefined,
          limit: 5,
          sort: "recommended",
        })
        let items = res?.items?.length ? res.items : DEMO_SERVICE_PROVIDERS.filter((p) => p.category === cat)
        if (!items.length) items = DEMO_SERVICE_PROVIDERS.filter((p) => p.category === cat)
        nextPool[cat] = items
        if (items[0]) nextPicks[cat] = items[0]
      }),
    )

    setPool(nextPool)
    setPicks(nextPicks)
    setLoading(false)
  }, [selected, location])

  async function onSubmit() {
    setError(null)
    if (!signedIn) {
      setError("Sign in to send coordinated quote requests.")
      return
    }
    const missing = selected.some((cat) => !picks[cat])
    if (missing) {
      setError("Wait for provider matches to load, or go back and try again.")
      return
    }
    setBusy(true)
    let ok = 0
    const failures: string[] = []

    for (const cat of selected) {
      const provider = picks[cat]
      if (!provider) continue
      try {
        await submitServiceQuote(provider.slug, {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim() || undefined,
          serviceRequested: getServiceHubCategoryMeta(cat)?.label ?? cat,
          message: [
            message.trim() ||
              `Custom ServiceHub bundle request for ${getServiceHubCategoryMeta(cat)?.label ?? cat}.`,
            location.trim() ? `Location: ${location.trim()}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          source: "directory",
        })
        ok += 1
      } catch (err) {
        if (err instanceof ApiRequestError && (err.status === 404 || err.status === 501)) {
          failures.push("Quote API unavailable")
          break
        }
        failures.push(provider.businessName)
      }
    }

    setBusy(false)
    if (ok === 0) {
      setError(failures[0] ?? "Could not submit any quotes. Try again later.")
      return
    }
    setSuccess(
      `Sent ${ok} quote request(s)${failures.length ? ` (${failures.length} failed)` : ""}. Providers will contact you on ${clientPhone}.`,
    )
  }

  const canStep0 = selected.length >= 2
  const canStep1 = clientName.trim().length >= 2 && clientPhone.trim().length >= 5 && location.trim().length >= 2
  const canSubmit =
    !loading && selected.length > 0 && selected.every((cat) => Boolean(picks[cat]))

  if (success) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm">{success}</p>
        <Button asChild>
          <Link href="/services">Back to ServiceHub</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex gap-1">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex-1 rounded-md border py-1.5 text-center text-xs font-medium",
              i === step
                ? "border-primary bg-primary/10 text-primary"
                : i < step
                  ? "border-muted bg-muted/50"
                  : "border-border text-muted-foreground",
            )}
          >
            {i < step ? <Check className="mx-auto h-3 w-3" /> : label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose between 2 and 6 service categories.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICE_HUB_CATEGORIES.filter((c) => c.inPrismaEnum).map((c) => {
              const on = selected.includes(c.slug)
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggleCategory(c.slug)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition",
                    on ? "border-primary bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">{selected.length} selected (max 6)</p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {!signedIn && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
              <Link href="/login?next=/services/bundles/build" className="font-medium text-primary underline">
                Sign in
              </Link>{" "}
              to submit quotes.
            </p>
          )}
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Email (optional)</Label>
              <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 text-sm">
          <p className="font-medium">Review providers and submit</p>
          {loading ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading matches…
            </p>
          ) : (
            <ul className="space-y-2">
              {selected.map((cat) => {
                const options = pool[cat] ?? []
                const pick = picks[cat]
                return (
                  <li key={cat} className="rounded-lg border p-3">
                    <p className="text-xs uppercase text-muted-foreground">
                      {getServiceHubCategoryMeta(cat)?.label ?? cat}
                    </p>
                    <p className="font-medium">{pick?.businessName ?? "—"}</p>
                    {options.length > 1 && (
                      <Select
                        value={pick?.slug ?? ""}
                        onValueChange={(slug) => {
                          const found = options.find((o) => o.slug === slug)
                          if (found) setPicks((p) => ({ ...p, [cat]: found }))
                        }}
                      >
                        <SelectTrigger className="mt-2 h-8">
                          <SelectValue placeholder="Swap" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((o) => (
                            <SelectItem key={o.slug} value={o.slug}>
                              {o.businessName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {error && <p className="text-destructive">{error}</p>}
        </div>
      )}

      <div className="flex justify-between border-t pt-4">
        <Button type="button" variant="ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {step < 2 ? (
          <Button
            type="button"
            disabled={(step === 0 && !canStep0) || (step === 1 && !canStep1)}
            onClick={() => {
              if (step === 0) {
                setStep(1)
              } else {
                setStep(2)
                void loadPreview()
              }
            }}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" disabled={busy || !canSubmit} onClick={() => void onSubmit()}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Submit all quotes"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
