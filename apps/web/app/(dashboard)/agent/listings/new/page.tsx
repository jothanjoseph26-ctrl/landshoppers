"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, Save, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { PortalAuthRequired } from "@/components/dashboard/portal-feedback"
import { ApiRequestError } from "@/lib/api/client"
import { createListing, submitListing } from "@/lib/api/portal"
import { getAccessToken } from "@/lib/api/auth-session"

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "estate_unit", label: "Estate unit" },
] as const

type PropertyType = (typeof PROPERTY_TYPES)[number]["value"]

type FormState = {
  title: string
  description: string
  propertyType: PropertyType
  city: string
  state: string
  country: string
  address: string
  bedrooms: string
  bathrooms: string
  toilets: string
  squareMeters: string
  priceNaira: string
  priceNegotiable: boolean
  isForSale: boolean
  isForRent: boolean
  rentPeriod: string
}

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  propertyType: "house",
  city: "",
  state: "",
  country: "Nigeria",
  address: "",
  bedrooms: "",
  bathrooms: "",
  toilets: "",
  squareMeters: "",
  priceNaira: "",
  priceNegotiable: false,
  isForSale: true,
  isForRent: false,
  rentPeriod: "",
}

function nairaToKobo(input: string): string | null {
  const trimmed = input.replace(/[, ]/g, "")
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null
  const [whole, fraction = "0"] = trimmed.split(".")
  const padded = (fraction + "00").slice(0, 2)
  return `${whole}${padded}`
}

export default function AgentCreateListingPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (typeof window !== "undefined" && !getAccessToken()) {
    return <PortalAuthRequired />
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (): { ok: boolean; priceKobo?: string } => {
    const next: Record<string, string> = {}
    if (form.title.trim().length < 3) next.title = "Title must be at least 3 characters"
    if (!form.city.trim()) next.city = "City is required"
    if (!form.state.trim()) next.state = "State is required"
    const priceKobo = nairaToKobo(form.priceNaira)
    if (!priceKobo) next.priceNaira = "Enter a price like 45000000 or 45,000,000.00"
    if (!form.isForSale && !form.isForRent) next.isForSale = "Pick at least one of sale or rent"
    setErrors(next)
    if (Object.keys(next).length > 0) return { ok: false }
    return { ok: true, priceKobo: priceKobo ?? undefined }
  }

  const buildBody = (priceKobo: string) => ({
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    propertyType: form.propertyType,
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim() || "Nigeria",
    address: form.address.trim() || undefined,
    bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
    toilets: form.toilets ? Number(form.toilets) : undefined,
    squareMeters: form.squareMeters ? Number(form.squareMeters) : undefined,
    priceKobo,
    priceNegotiable: form.priceNegotiable,
    isForSale: form.isForSale,
    isForRent: form.isForRent,
    rentPeriod: form.isForRent ? form.rentPeriod || "monthly" : undefined,
  })

  const handle = async (mode: "draft" | "submit") => {
    const validation = validate()
    if (!validation.ok || !validation.priceKobo) return
    setBusy(mode)
    try {
      const created = await createListing(buildBody(validation.priceKobo))
      if (mode === "submit") {
        await submitListing(created.id)
        toast.success("Listing submitted for review")
      } else {
        toast.success("Draft saved")
      }
      router.push("/agent/listings")
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? (err.body as { error?: { message?: string } } | undefined)?.error?.message ??
            `Request failed (${err.status})`
          : err instanceof Error
            ? err.message
            : "Failed to create listing"
      toast.error(msg)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">New listing</h1>
        <p className="text-muted-foreground">
          Create a draft, then submit it for admin review. Prices are stored in kobo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. 4 Bedroom Detached, Lekki"
              required
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Highlights, condition, neighborhood notes…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyType">Property type</Label>
            <Select
              value={form.propertyType}
              onValueChange={(v) => setField("propertyType", v as PropertyType)}
            >
              <SelectTrigger id="propertyType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Street + landmark"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              required
            />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={form.state}
              onChange={(e) => setField("state", e.target.value)}
              required
            />
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 md:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) => setField("bedrooms", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min={0}
                value={form.bathrooms}
                onChange={(e) => setField("bathrooms", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="squareMeters">m²</Label>
              <Input
                id="squareMeters"
                type="number"
                min={0}
                value={form.squareMeters}
                onChange={(e) => setField("squareMeters", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listing details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="priceNaira">Price (₦)</Label>
            <Input
              id="priceNaira"
              value={form.priceNaira}
              onChange={(e) => setField("priceNaira", e.target.value)}
              placeholder="e.g. 45000000"
              required
            />
            {errors.priceNaira && <p className="text-xs text-destructive">{errors.priceNaira}</p>}
          </div>
          <div className="flex items-end gap-2">
            <Switch
              id="priceNegotiable"
              checked={form.priceNegotiable}
              onCheckedChange={(v) => setField("priceNegotiable", v)}
            />
            <Label htmlFor="priceNegotiable">Price negotiable</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="isForSale"
              checked={form.isForSale}
              onCheckedChange={(v) => setField("isForSale", v)}
            />
            <Label htmlFor="isForSale">For sale</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="isForRent"
              checked={form.isForRent}
              onCheckedChange={(v) => setField("isForRent", v)}
            />
            <Label htmlFor="isForRent">For rent</Label>
          </div>
          {form.isForRent && (
            <div className="space-y-2">
              <Label htmlFor="rentPeriod">Rent period</Label>
              <Input
                id="rentPeriod"
                value={form.rentPeriod}
                onChange={(e) => setField("rentPeriod", e.target.value)}
                placeholder="monthly | yearly"
              />
            </div>
          )}
          {errors.isForSale && <p className="text-xs text-destructive">{errors.isForSale}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handle("draft")} variant="outline" disabled={busy !== null}>
          {busy === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save as draft
        </Button>
        <Button onClick={() => handle("submit")} disabled={busy !== null}>
          {busy === "submit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Save & submit for review
        </Button>
      </div>
    </div>
  )
}
