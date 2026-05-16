"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  fetchDeveloperSettings,
  patchDeveloperSettings,
  type ApiDeveloperSettings,
} from "@/lib/api/developer-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

export default function DeveloperSettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [companyName, setCompanyName] = useState("")
  const [rcNumber, setRcNumber] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyCity, setCompanyCity] = useState("")
  const [companyState, setCompanyState] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const { data, isLoading, mutate } = useSWR(token ? (["developer-settings"] as const) : null, async () => {
    setErr(null)
    return fetchDeveloperSettings()
  })

  const row = data?.data

  useEffect(() => {
    if (!row) return
    setCompanyName(row.companyName)
    setRcNumber(row.rcNumber ?? "")
    setCompanyEmail(row.companyEmail ?? "")
    setCompanyPhone(row.companyPhone ?? "")
    setCompanyWebsite(row.companyWebsite ?? "")
    setCompanyAddress(row.companyAddress ?? "")
    setCompanyCity(row.companyCity ?? "")
    setCompanyState(row.companyState ?? "")
    setDescription(row.description ?? "")
  }, [row])

  async function onSave() {
    if (!token) return
    setSaving(true)
    setErr(null)
    try {
      const baseName = companyName.trim() || row.companyName
      await patchDeveloperSettings({
        companyName: baseName,
        rcNumber: rcNumber.trim() === "" ? null : rcNumber.trim(),
        companyEmail: companyEmail.trim() === "" ? null : companyEmail.trim(),
        companyPhone: companyPhone.trim() === "" ? null : companyPhone.trim(),
        companyWebsite: companyWebsite.trim() === "" ? "" : companyWebsite.trim(),
        companyAddress: companyAddress.trim() === "" ? null : companyAddress.trim(),
        companyCity: companyCity.trim() === "" ? null : companyCity.trim(),
        companyState: companyState.trim() === "" ? null : companyState.trim(),
        description: description.trim() === "" ? null : description.trim(),
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
          <CardDescription>Organisation settings are available after you sign in as a developer.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Company profile for your developer account. Login email is managed from your main account settings when that
          flow exists; here you can update organisation details stored on your developer profile.
        </p>
      </div>

      {err ? (
        <p className="text-destructive text-sm" role="alert">
          {err}
        </p>
      ) : null}

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Organisation</CardTitle>
          <CardDescription className="text-xs">
            Account email (sign-in):{" "}
            <span className="text-foreground font-medium">{row?.email ?? "—"}</span>
            {row ? (
              <>
                {" "}
                · KYC: <span className="capitalize">{row.kycStatus}</span>
                {row.isVerified ? " · Verified" : null}
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {isLoading || !row ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs">
                  Company name
                </Label>
                <Input
                  id="companyName"
                  className="h-9 text-sm"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rcNumber" className="text-xs">
                  RC / CAC number
                </Label>
                <Input
                  id="rcNumber"
                  className="h-9 text-sm"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="companyEmail" className="text-xs">
                    Company email
                  </Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    className="h-9 text-sm"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyPhone" className="text-xs">
                    Company phone
                  </Label>
                  <Input
                    id="companyPhone"
                    className="h-9 text-sm"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyWebsite" className="text-xs">
                  Website
                </Label>
                <Input
                  id="companyWebsite"
                  className="h-9 text-sm"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyAddress" className="text-xs">
                  Address
                </Label>
                <Input
                  id="companyAddress"
                  className="h-9 text-sm"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="companyCity" className="text-xs">
                    City
                  </Label>
                  <Input
                    id="companyCity"
                    className="h-9 text-sm"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyState" className="text-xs">
                    State
                  </Label>
                  <Input
                    id="companyState"
                    className="h-9 text-sm"
                    value={companyState}
                    onChange={(e) => setCompanyState(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">
                  Description
                </Label>
                <Textarea
                  id="description"
                  className="text-sm min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
