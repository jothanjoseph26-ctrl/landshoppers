"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  createDeveloperKycDocument,
  fetchDeveloperKycDocument,
  fetchDeveloperKycDocuments,
  fetchDeveloperProjects,
  type ApiDeveloperKycDocument,
  type DeveloperKycDocumentType,
} from "@/lib/api/developer-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

const TYPE_LABELS: Record<DeveloperKycDocumentType, string> = {
  c_of_o: "Certificate of Occupancy",
  survey: "Survey plan",
  governor_consent: "Governor's consent",
  cac: "CAC / company",
  tax_clearance: "Tax clearance",
  other: "Other",
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "verified") return "default"
  if (s === "rejected") return "destructive"
  if (s === "expired") return "secondary"
  return "outline"
}

export default function DeveloperKycPage() {
  const [mounted, setMounted] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [docType, setDocType] = useState<DeveloperKycDocumentType>("c_of_o")
  const [projectId, setProjectId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [fileName, setFileName] = useState("document.pdf")
  const [mimeType, setMimeType] = useState<"application/pdf" | "image/jpeg" | "image/png" | "image/webp">(
    "application/pdf",
  )
  const [externalUrl, setExternalUrl] = useState("https://")

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const listKey = token ? (["developer-kyc-docs"] as const) : null
  const { data: listRes, isLoading, mutate } = useSWR(listKey, () =>
    fetchDeveloperKycDocuments({ page: 1, pageSize: 50 }).then((r) => r),
  )

  const projectsKey = token ? (["developer-kyc-projects"] as const) : null
  const { data: projectsRes } = useSWR(projectsKey, () =>
    fetchDeveloperProjects({ page: 1, pageSize: 100 }).then((r) => r),
  )

  const detailKey = token && activeId && sheetOpen ? (["developer-kyc-doc", activeId] as const) : null
  const { data: detailRes } = useSWR(detailKey, () => fetchDeveloperKycDocument(activeId!).then((r) => r.data))

  const rows = listRes?.data ?? []
  const meta = listRes?.meta
  const projects = projectsRes?.data ?? []

  const overview = useMemo(() => {
    const c = meta?.countsByStatus ?? {}
    return [
      { key: "pending", label: "Pending", n: c["pending"] ?? 0 },
      { key: "verified", label: "Verified", n: c["verified"] ?? 0 },
      { key: "rejected", label: "Rejected", n: c["rejected"] ?? 0 },
      { key: "expired", label: "Expired", n: c["expired"] ?? 0 },
    ]
  }, [meta])

  const openRow = (id: string) => {
    setActiveId(id)
    setSheetOpen(true)
  }

  const submitNew = async () => {
    if (!token) return
    setSaving(true)
    setFormErr(null)
    try {
      await createDeveloperKycDocument({
        documentType: docType,
        projectId: projectId || undefined,
        title: title.trim() || undefined,
        fileName: fileName.trim() || "document.pdf",
        mimeType,
        externalUrl: externalUrl.trim(),
      })
      await mutate()
      setTitle("")
      setExternalUrl("https://")
    } catch (e) {
      setFormErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Could not register document")
    } finally {
      setSaving(false)
    }
  }

  const preview = detailRes
  const isPdf = preview?.mimeType === "application/pdf"

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-sm">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">KYC & verification</h1>
        <p className="text-muted-foreground">
          Register compliance files with a secure HTTPS link (hosted drive, object storage, etc.). S3
          presigned uploads return 501 until storage is wired.
        </p>
      </div>

      {!token ? (
        <p className="text-muted-foreground">
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>{" "}
          to manage KYC documents.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {overview.map((o) => (
              <Card key={o.key} className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-muted-foreground text-xs font-medium">{o.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tabular-nums">{o.n}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Register a document</CardTitle>
              <CardDescription>
                Link must be <strong>https</strong>. Allowed MIME types: PDF, JPEG, PNG, WebP.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={docType} onValueChange={(v) => setDocType(v as DeveloperKycDocumentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as DeveloperKycDocumentType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {TYPE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Project (optional)</Label>
                <Select value={projectId || "__none__"} onValueChange={(v) => setProjectId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Company-wide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Company-wide</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Title (optional)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Phase 2 C of O" />
              </div>
              <div className="grid gap-2">
                <Label>File name</Label>
                <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>MIME type</Label>
                <Select
                  value={mimeType}
                  onValueChange={(v) =>
                    setMimeType(v as "application/pdf" | "image/jpeg" | "image/png" | "image/webp")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application/pdf">application/pdf</SelectItem>
                    <SelectItem value="image/jpeg">image/jpeg</SelectItem>
                    <SelectItem value="image/png">image/png</SelectItem>
                    <SelectItem value="image/webp">image/webp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>HTTPS URL</Label>
                <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
              </div>
              {formErr ? <p className="text-destructive text-xs sm:col-span-2">{formErr}</p> : null}
              <div className="sm:col-span-2">
                <Button type="button" size="sm" disabled={saving} onClick={() => void submitNew()}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add document
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
              ) : rows.length === 0 ? (
                <p className="text-muted-foreground text-xs">No documents yet.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r: ApiDeveloperKycDocument) => (
                        <TableRow
                          key={r.id}
                          className="cursor-pointer"
                          onClick={() => openRow(r.id)}
                        >
                          <TableCell className="font-medium">{TYPE_LABELS[r.documentType]}</TableCell>
                          <TableCell>{r.title ?? "—"}</TableCell>
                          <TableCell>{r.project?.name ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {new Date(r.updatedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Document</SheetTitle>
                <SheetDescription>
                  {preview ? TYPE_LABELS[preview.documentType] : ""}
                </SheetDescription>
              </SheetHeader>
              {preview ? (
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusVariant(preview.status)}>{preview.status}</Badge>
                    {preview.rejectionReason ? (
                      <span className="text-destructive">{preview.rejectionReason}</span>
                    ) : null}
                  </div>
                  <p>
                    <span className="text-muted-foreground">File:</span> {preview.fileName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">URL:</span>{" "}
                    <a className="text-primary underline" href={preview.externalUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </p>
                  {isPdf ? (
                    <iframe
                      title="Preview"
                      className="mt-2 h-80 w-full rounded-md border"
                      src={preview.previewUrl}
                    />
                  ) : (
                    <p className="text-muted-foreground">Preview iframe is shown for PDF MIME type only.</p>
                  )}
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}
