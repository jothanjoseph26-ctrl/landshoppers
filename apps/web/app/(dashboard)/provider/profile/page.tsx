"use client"

import useSWR from "swr"
import { Loader2, Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import {
  fetchProviderProfile,
  patchProviderProfile,
  type ApiProviderProfile,
} from "@/lib/api/provider-portal"
import { SERVICE_HUB_CATEGORIES } from "@/lib/servicehub/categories"
import { getAccessToken } from "@/lib/api/auth-session"

const prismaCategories = SERVICE_HUB_CATEGORIES.filter((c) => c.inPrismaEnum)

function profileStrength(profile: ApiProviderProfile | undefined): number {
  if (!profile) return 0
  let score = 0
  if (profile.logoUrl?.trim()) score += 10
  if (profile.description && profile.description.trim().length >= 40) score += 15
  if (profile.services.length >= 3) score += 15
  else if (profile.services.length >= 1) score += 8
  if (profile.city?.trim() && profile.state?.trim()) score += 10
  if (profile.phone?.trim()) score += 5
  if (profile.email?.trim()) score += 5
  if (profile.isVerified) score += 20
  if (profile.reviewCount >= 2) score += 15
  return Math.min(100, score)
}

export default function ProviderProfilePage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [businessName, setBusinessName] = useState("")
  const [category, setCategory] = useState<string>("legal")
  const [description, setDescription] = useState("")
  const [servicesText, setServicesText] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("Nigeria")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [instagram, setInstagram] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const { data: profile, isLoading, mutate } = useSWR(
    token ? (["provider-profile"] as const) : null,
    () => fetchProviderProfile(),
    { shouldRetryOnError: false },
  )

  useEffect(() => {
    if (!profile) return
    setBusinessName(profile.businessName)
    setCategory(profile.category)
    setDescription(profile.description ?? "")
    setServicesText(profile.services.join("\n"))
    setAddress(profile.address ?? "")
    setCity(profile.city)
    setState(profile.state)
    setCountry(profile.country)
    setPhone(profile.phone ?? "")
    setEmail(profile.email ?? "")
    setWebsite(profile.website ?? "")
    setLinkedin(profile.socialLinks?.linkedin?.trim() ?? "")
    setInstagram(profile.socialLinks?.instagram?.trim() ?? "")
  }, [profile])

  const strength = useMemo(() => profileStrength(profile), [profile])

  async function onSave() {
    if (!token || !profile) return
    setSaving(true)
    setErr(null)
    try {
      const services = servicesText
        .split(/\n/)
        .flatMap((line) => line.split(",").map((s) => s.trim()))
        .filter(Boolean)
        .slice(0, 40)

      const social: Record<string, string> = {}
      if (linkedin.trim()) social.linkedin = linkedin.trim()
      if (instagram.trim()) social.instagram = instagram.trim()

      await patchProviderProfile({
        businessName: businessName.trim() || profile.businessName,
        category,
        description: description.trim() === "" ? null : description.trim(),
        services: services.length > 0 ? services : profile.services,
        address: address.trim() === "" ? null : address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || profile.country,
        phone: phone.trim() === "" ? null : phone.trim(),
        email: email.trim() === "" ? null : email.trim(),
        website: website.trim() === "" ? null : website.trim(),
        socialLinks: Object.keys(social).length > 0 ? social : null,
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
          <CardDescription>Provider profile loads after authentication.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My services & profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            ServiceHub PRV-03 — minimal editor aligned to current{" "}
            <code className="text-xs">GET/PATCH /v1/provider/profile</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Strength</span>
          <Badge variant="secondary">{strength}%</Badge>
        </div>
      </div>

      {err ? (
        <p className="text-destructive text-sm" role="alert">
          {err}
        </p>
      ) : null}

      {isLoading || !profile ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading profile…
        </div>
      ) : (
        <>
          <Card className="shadow-none border-dashed bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Public slug</CardTitle>
              <CardDescription>
                <code className="text-xs">{profile.slug}</code> — public directory URL ships with Stream 2 (
                <code className="text-xs">/services/…</code>).
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Business</CardTitle>
              <CardDescription>How you appear on LandShoppers ServiceHub.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="biz-name">Business name</Label>
                  <Input
                    id="biz-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    autoComplete="organization"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="category">Primary category</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {prismaCategories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What you do, who you serve, and what makes you trusted."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="services">Services offered (one per line)</Label>
                  <Textarea
                    id="services"
                    rows={4}
                    value={servicesText}
                    onChange={(e) => setServicesText(e.target.value)}
                    placeholder={"Title perfection\nBoundary survey\nGovernor's consent"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Coverage & contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="addr">Address</Label>
                <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="web">Website</Label>
                <Input
                  id="web"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Social (optional)</CardTitle>
              <CardDescription>Stored as structured links for the marketplace profile (Stream 2 render).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="li">LinkedIn</Label>
                <Input id="li" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig">Instagram</Label>
                <Input id="ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-2 h-4 w-4" aria-hidden />}
              Save changes
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
