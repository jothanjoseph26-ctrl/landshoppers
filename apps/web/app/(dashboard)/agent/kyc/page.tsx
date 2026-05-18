"use client"

import useSWR from "swr"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  PortalAuthRequired,
  PortalError,
} from "@/components/dashboard/portal-feedback"
import { ApiRequestError } from "@/lib/api/client"
import {
  fetchAgentKyc,
  patchAgentKyc,
  type ApiAgentKyc,
  type ApiAgentKycDocument,
} from "@/lib/api/agent-portal"
import { getAccessToken } from "@/lib/api/auth-session"
import { formatDate } from "@/lib/format"

const DOC_TYPES = [
  { value: "license", label: "Agent license" },
  { value: "id_card", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "utility_bill", label: "Proof of address" },
  { value: "other", label: "Other" },
] as const

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "verified") return "default"
  if (s === "rejected") return "destructive"
  if (s === "submitted") return "secondary"
  return "outline"
}

function statusLabel(s: string): string {
  if (s === "verified") return "Verified"
  if (s === "rejected") return "Rejected"
  if (s === "submitted") return "Under review"
  return "Pending"
}

export default function AgentKycPage() {
  const [mounted, setMounted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [licenseNumber, setLicenseNumber] = useState("")
  const [docs, setDocs] = useState<ApiAgentKycDocument[]>([])
  const [newType, setNewType] = useState<string>("license")
  const [newLabel, setNewLabel] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null
  const key = token ? (["agent-kyc"] as const) : null

  const { data, error: loadErr, isLoading, mutate } = useSWR(key, fetchAgentKyc)

  useEffect(() => {
    if (!data) return
    setLicenseNumber(data.licenseNumber ?? "")
    setDocs(data.kycDocuments ?? [])
  }, [data])

  const loadError = useMemo(() => {
    if (!loadErr) return null
    if (loadErr instanceof ApiRequestError) {
      const body = loadErr.body as { error?: { message?: string } } | null
      return body?.error?.message ?? "Could not load KYC"
    }
    return "Could not load KYC"
  }, [loadErr])

  const isLocked = data?.kycStatus === "verified"

  function addDoc() {
    const type = newType.trim()
    const externalUrl = newUrl.trim()
    if (!type || !externalUrl) return
    setDocs((prev) => [
      ...prev,
      {
        type,
        externalUrl,
        ...(newLabel.trim() ? { label: newLabel.trim() } : {}),
        uploadedAt: new Date().toISOString(),
      },
    ])
    setNewUrl("")
    setNewLabel("")
  }

  async function saveDraft() {
    setSaving(true)
    setErr(null)
    try {
      await patchAgentKyc({
        licenseNumber: licenseNumber.trim() || null,
        kycDocuments: docs,
      })
      await mutate()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function submitForReview() {
    setSubmitting(true)
    setErr(null)
    try {
      await patchAgentKyc({
        licenseNumber: licenseNumber.trim() || null,
        kycDocuments: docs,
        submitForReview: true,
      })
      await mutate()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Submit failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    )
  }

  if (!token) return <PortalAuthRequired />

  if (loadErr && !data) {
    return <PortalError title="Couldn't load KYC" description={loadError ?? undefined} onRetry={() => mutate()} />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">KYC & verification</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload license and identity documents for admin review.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </Button>
      </div>

      {err && (
        <p className="text-destructive text-sm" role="alert">
          {err}
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
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {data.agencyName ?? data.email}
                <Badge variant={statusVariant(data.kycStatus)}>{statusLabel(data.kycStatus)}</Badge>
                {data.verificationBadge ? <Badge variant="outline">Badge</Badge> : null}
              </CardTitle>
              <CardDescription>
                {data.kycVerifiedAt
                  ? `Verified ${formatDate(data.kycVerifiedAt)}`
                  : data.kycSubmittedAt
                    ? `Submitted ${formatDate(data.kycSubmittedAt)} — awaiting admin review`
                    : "Complete the checklist and submit for review."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.kycRejectionReason ? (
                <p className="text-sm text-destructive border border-destructive/30 rounded-md p-3 bg-destructive/5">
                  Rejected: {data.kycRejectionReason}
                </p>
              ) : null}

              <ul className="space-y-2 text-sm">
                {data.checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${item.complete ? "bg-primary" : "bg-muted-foreground/40"}`}
                      aria-hidden
                    />
                    <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>

              {(data.bvnOnFile || data.ninOnFile) && (
                <p className="text-xs text-muted-foreground">
                  On file: {[data.bvnOnFile && "BVN", data.ninOnFile && "NIN"].filter(Boolean).join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">License</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="license">License number</Label>
                <Input
                  id="license"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  disabled={isLocked}
                  placeholder="State estate agent license"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription>
                Paste HTTPS links to PDF or image files (Google Drive, Dropbox, etc.) until S3 presign ships.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {docs.length > 0 ? (
                <ul className="space-y-2">
                  {docs.map((d, i) => (
                    <li
                      key={`${d.type}-${d.externalUrl}-${i}`}
                      className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium capitalize">{d.label ?? d.type.replace(/_/g, " ")}</p>
                        <a
                          href={d.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs break-all hover:underline"
                        >
                          {d.externalUrl}
                        </a>
                      </div>
                      {!isLocked ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setDocs((prev) => prev.filter((_, j) => j !== i))}
                          aria-label="Remove document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No documents added yet.</p>
              )}

              {!isLocked ? (
                <div className="grid gap-3 border-t pt-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Document type</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                      >
                        {DOC_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-label">Label (optional)</Label>
                      <Input
                        id="doc-label"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. Lagos state license 2025"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-url">Document URL (HTTPS)</Label>
                    <Input
                      id="doc-url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={addDoc}>
                    Add document
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {!isLocked ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={saving || submitting} onClick={() => void saveDraft()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save draft"}
              </Button>
              <Button
                type="button"
                disabled={saving || submitting || docs.length === 0}
                onClick={() => void submitForReview()}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for review"}
              </Button>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground border-l-2 pl-3">
            Admin review updates your verification badge. S3 direct upload and Dojah BVN verification ship in a later
            slice.
          </p>
        </>
      ) : null}
    </div>
  )
}
