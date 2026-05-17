"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ApiRequestError } from "@/lib/api/client"
import {
  activateServiceBundle,
  DEMO_SERVICE_PROVIDERS,
  tryFetchServiceProviders,
  type ApiServiceBundle,
  type ApiServiceProviderListItem,
} from "@/lib/api/services-marketplace"
import { getServiceHubCategoryMeta } from "@/lib/servicehub/categories"
import { getAccessToken } from "@/lib/api/auth-session"

const STEPS = ["Details", "Providers", "Confirm"] as const

type Props = {
  bundle: ApiServiceBundle
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultLocation?: string
  defaultListingId?: string
  defaultMessage?: string
  defaultDeveloperProjectId?: string
}

export function ServiceHubBundleWizard({
  bundle,
  open,
  onOpenChange,
  defaultLocation = "",
  defaultListingId,
  defaultMessage = "",
  defaultDeveloperProjectId,
}: Props) {
  const [step, setStep] = useState(0)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [location, setLocation] = useState(defaultLocation)
  const [message, setMessage] = useState(defaultMessage)
  const [listingId] = useState(defaultListingId)
  const [picks, setPicks] = useState<Record<string, ApiServiceProviderListItem>>({})
  const [pool, setPool] = useState<Record<string, ApiServiceProviderListItem[]>>({})
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const signedIn = Boolean(getAccessToken())

  const reset = useCallback(() => {
    setStep(0)
    setError(null)
    setSuccess(null)
    setPicks({})
    setPool({})
  }, [])

  useEffect(() => {
    if (!open) reset()
    else {
      setLocation(defaultLocation)
      setMessage(defaultMessage)
    }
  }, [open, defaultLocation, defaultMessage, reset])

  const loadPreview = useCallback(async () => {
    setLoadingProviders(true)
    const stateGuess = location.split(",").pop()?.trim() || location.trim()
    const nextPool: Record<string, ApiServiceProviderListItem[]> = {}
    const nextPicks: Record<string, ApiServiceProviderListItem> = {}

    await Promise.all(
      bundle.categories.map(async (cat) => {
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
    setLoadingProviders(false)
  }, [bundle.categories, location])

  const priceLabel = useMemo(() => {
    try {
      const lo = Number(BigInt(bundle.priceFromKobo)) / 100
      const hi = Number(BigInt(bundle.priceToKobo)) / 100
      const fmt = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      })
      return `${fmt.format(lo)} – ${fmt.format(hi)}`
    } catch {
      return ""
    }
  }, [bundle.priceFromKobo, bundle.priceToKobo])

  async function onActivate() {
    setError(null)
    if (!signedIn) {
      setError("Sign in to activate this package.")
      return
    }
    setBusy(true)
    try {
      const raw = await activateServiceBundle(bundle.id, {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        ...(clientEmail.trim() ? { clientEmail: clientEmail.trim() } : {}),
        ...(listingId ? { listingId } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
        ...(defaultDeveloperProjectId?.trim()
          ? { developerProjectId: defaultDeveloperProjectId.trim() }
          : {}),
      })
      const leads =
        raw &&
        typeof raw === "object" &&
        "data" in raw &&
        (raw as { data?: { leads?: unknown[] } }).data?.leads
      const n = Array.isArray(leads) ? leads.length : bundle.categories.length
      setSuccess(
        `Activation complete. ${n} provider lead(s) were created — providers will respond in your inbox.`,
      )
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const apiErr =
          err.body && typeof err.body === "object" && "error" in err.body
            ? (err.body as { error?: { message?: string } }).error
            : undefined
        setError(apiErr?.message ?? `Request failed (${err.status})`)
      } else {
        setError("Something went wrong.")
      }
    } finally {
      setBusy(false)
    }
  }

  const canAdvanceStep0 =
    clientName.trim().length >= 2 && clientPhone.trim().length >= 5 && location.trim().length >= 2

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{bundle.name}</SheetTitle>
          <SheetDescription>
            {priceLabel ? `${priceLabel} (est.) · ` : ""}
            {bundle.categories.length} categories · step {step + 1} of {STEPS.length}
          </SheetDescription>
        </SheetHeader>

        <div className="mb-4 flex gap-1">
          {STEPS.map((label, i) => (
            <StepPill key={label} label={label} active={i === step} done={i < step} />
          ))}
        </div>

        {success ? (
          <SuccessPane onClose={() => onOpenChange(false)} message={success} />
        ) : (
          <>
            {step === 0 && (
              <StepDetails
                bundle={bundle}
                signedIn={signedIn}
                clientName={clientName}
                setClientName={setClientName}
                clientPhone={clientPhone}
                setClientPhone={setClientPhone}
                clientEmail={clientEmail}
                setClientEmail={setClientEmail}
                location={location}
                setLocation={setLocation}
                message={message}
                setMessage={setMessage}
              />
            )}

            {step === 1 && (
              <StepProviders
                bundle={bundle}
                loadingProviders={loadingProviders}
                picks={picks}
                pool={pool}
                setPicks={setPicks}
              />
            )}

            {step === 2 && (
              <div className="space-y-4 text-sm">
                <p className="font-medium">Ready to send quote requests</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    <span className="text-foreground">{bundle.name}</span> · {bundle.categories.length}{" "}
                    categories
                  </li>
                  <li>Location: {location}</li>
                  <li>
                    Contact: {clientName} · {clientPhone}
                  </li>
                </ul>
                {error && <p className="text-destructive">{error}</p>}
              </div>
            )}

            <WizardNav
              step={step}
              busy={busy}
              canAdvanceStep0={canAdvanceStep0}
              loadingProviders={loadingProviders}
              onBack={() => setStep((s) => Math.max(0, s - 1))}
              onNext={() => {
                if (step === 0) {
                  setStep(1)
                  void loadPreview()
                } else setStep(2)
              }}
              onActivate={() => void onActivate()}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function StepPill({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div
      className={`flex-1 rounded-md border py-1.5 text-center text-xs font-medium ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : done
            ? "border-muted bg-muted/50 text-muted-foreground"
            : "border-border text-muted-foreground"
      }`}
    >
      {done ? <Check className="mx-auto h-3 w-3" /> : label}
    </div>
  )
}

function StepDetails(props: {
  bundle: ApiServiceBundle
  signedIn: boolean
  clientName: string
  setClientName: (v: string) => void
  clientPhone: string
  setClientPhone: (v: string) => void
  clientEmail: string
  setClientEmail: (v: string) => void
  location: string
  setLocation: (v: string) => void
  message: string
  setMessage: (v: string) => void
}) {
  const {
    bundle,
    signedIn,
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    clientEmail,
    setClientEmail,
    location,
    setLocation,
    message,
    setMessage,
  } = props

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{bundle.description}</p>
      {!signedIn && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          <Link href="/login?next=/services/bundles" className="font-medium text-primary underline">
            Sign in
          </Link>{" "}
          to activate.
        </p>
      )}
      <FieldGroup label="Your name" id="bw-name">
        <Input id="bw-name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
      </FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Phone" id="bw-phone">
          <Input id="bw-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
        </FieldGroup>
        <FieldGroup label="Email (optional)" id="bw-email">
          <Input
            id="bw-email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
        </FieldGroup>
      </div>
      <FieldGroup label="Property / work location" id="bw-loc">
        <Input
          id="bw-loc"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Lekki, Lagos"
          required
        />
      </FieldGroup>
      <FieldGroup label="Notes (optional)" id="bw-msg">
        <Textarea id="bw-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </FieldGroup>
    </div>
  )
}

function FieldGroup({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function StepProviders({
  bundle,
  loadingProviders,
  picks,
  pool,
  setPicks,
}: {
  bundle: ApiServiceBundle
  loadingProviders: boolean
  picks: Record<string, ApiServiceProviderListItem>
  pool: Record<string, ApiServiceProviderListItem[]>
  setPicks: React.Dispatch<React.SetStateAction<Record<string, ApiServiceProviderListItem>>>
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Preview recommended providers per category. Final matching is confirmed when you submit.
      </p>
      {loadingProviders ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading matches…
        </div>
      ) : (
        <ul className="space-y-3">
          {bundle.categories.map((cat) => {
            const meta = getServiceHubCategoryMeta(cat)
            const options = pool[cat] ?? []
            const pick = picks[cat]
            return (
              <li key={cat} className="rounded-lg border p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {meta?.label ?? cat}
                </p>
                {pick ? (
                  <p className="mt-1 font-medium">{pick.businessName}</p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No preview available</p>
                )}
                {options.length > 1 && (
                  <Select
                    value={pick?.slug ?? ""}
                    onValueChange={(slug) => {
                      const found = options.find((o) => o.slug === slug)
                      if (found) setPicks((prev) => ({ ...prev, [cat]: found }))
                    }}
                  >
                    <SelectTrigger className="mt-2 h-9">
                      <SelectValue placeholder="Swap provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.slug} value={o.slug}>
                          {o.businessName} · {o.rating}★
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
    </div>
  )
}

function WizardNav({
  step,
  busy,
  canAdvanceStep0,
  loadingProviders,
  onBack,
  onNext,
  onActivate,
}: {
  step: number
  busy: boolean
  canAdvanceStep0: boolean
  loadingProviders: boolean
  onBack: () => void
  onNext: () => void
  onActivate: () => void
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-2 border-t pt-4">
      <Button type="button" variant="ghost" disabled={step === 0 || busy} onClick={onBack}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back
      </Button>
      {step < 2 ? (
        <Button
          type="button"
          disabled={(step === 0 && !canAdvanceStep0) || (step === 1 && loadingProviders)}
          onClick={onNext}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" disabled={busy} onClick={onActivate}>
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activating…
            </>
          ) : (
            "Activate package"
          )}
        </Button>
      )}
    </div>
  )
}

function SuccessPane({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="space-y-4 py-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm">{message}</p>
      <Button onClick={onClose}>Done</Button>
    </div>
  )
}
