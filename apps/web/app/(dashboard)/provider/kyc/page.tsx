"use client"

import useSWR from "swr"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiRequestError } from "@/lib/api/client"
import type { ApiProviderKyc } from "@/lib/api/provider-portal"
import { fetchProviderKyc, patchProviderKyc } from "@/lib/api/provider-portal"
import { getAccessToken } from "@/lib/api/auth-session"

export default function ProviderKycPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [licenseNumber, setLicenseNumber] = useState("")
  const [licenseBody, setLicenseBody] = useState("")
  const [docs, setDocs] = useState<NonNullable<ApiProviderKyc["kycDocuments"]>>([])
  const [newType, setNewType] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null
  const key = token ? (["provider-kyc"] as const) : null

  const { data, error: loadErr, isLoading, mutate } = useSWR(key, fetchProviderKyc)

  useEffect(() => {
    if (!data) return
    setLicenseNumber(data.licenseNumber ?? "")
    setLicenseBody(data.licenseBody ?? "")
    setDocs(data.kycDocuments ?? [])
  }, [data])

  const loadError = useMemo(() => {
    if (!loadErr) return null
    return loadErr instanceof ApiRequestError ? JSON.stringify(loadErr.body) : String(loadErr)
  }, [loadErr])

  function addDoc() {
    const type = newType.trim()
    const externalUrl = newUrl.trim()
    if (!type || !externalUrl) return
    setDocs((prev) => [...prev, { type, externalUrl }])
    setNewType("")
    setNewUrl("")
  }

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await patchProviderKyc({
        licenseNumber: licenseNumber.trim() || null,
        licenseBody: licenseBody.trim() || null,
        kycDocuments: docs.length ? docs : [],
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
          <CardDescription>KYC is available to verified service provider accounts.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">KYC & verification</h1>
          <p className="text-muted-foreground text-sm mt-1">
            License details and supporting documents for trust tiers (PRV-09).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </Button>
      </div>

      {(err || loadError) && (
        <p className="text-destructive text-sm" role="alert">
          {err ?? loadError}
        </p>
      )}

      {isLoading && !data ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading KYC…
        </div>
      ) : null}

      {data ? (
        <>
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Checklist</CardTitle>
              <CardDescription>
                Verification level: <span className="font-medium text-foreground">{data.verificationLevel}</span>
                {data.isVerified ? " · Verified" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.checklist.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <span className={item.complete ? "text-emerald-600" : "text-muted-foreground"} aria-hidden>
                      {item.complete ? "✓" : "○"}
                    </span>
                    <span className={item.complete ? "" : "text-muted-foreground"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">License</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license-number">License number</Label>
                <Input
                  id="license-number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Registration or license ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license-body">Issuing body</Label>
                <Input
                  id="license-body"
                  value={licenseBody}
                  onChange={(e) => setLicenseBody(e.target.value)}
                  placeholder="e.g. COREN, ARCON"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription>Add secure links to PDFs or cloud-hosted proofs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doc-type">Document type</Label>
                  <Input
                    id="doc-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="e.g. certificate, insurance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-url">External URL</Label>
                  <Input
                    id="doc-url"
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addDoc}>
                Add document
              </Button>

              {docs.length ? (
                <ul className="space-y-2 border-t pt-4">
                  {docs.map((d, idx) => (
                    <li key={`${d.type}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.type}</p>
                        <a
                          href={d.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs break-all underline-offset-4 hover:underline"
                        >
                          {d.externalUrl}
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        aria-label={`Remove ${d.type}`}
                        onClick={() => setDocs((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No documents added yet.</p>
              )}
            </CardContent>
          </Card>

          <Button type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Save"}
          </Button>
        </>
      ) : null}
    </div>
  )
}
