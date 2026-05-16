"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Download, Loader2, Upload } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  commitDeveloperBulkUpload,
  createDeveloperBulkUpload,
  fetchDeveloperBulkUploadRows,
  fetchDeveloperBulkUploads,
  fetchDeveloperProjects,
  type ApiDeveloperBulkUpload,
  type ApiDeveloperBulkUploadRow,
} from "@/lib/api/developer-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

const SAMPLE_CSV = `unitName,squareMeters,priceKobo,status
Plot A-1,500,1500000000,available
Plot A-2,502,1500000000,available
`

export default function DeveloperBulkUploadPage() {
  const [mounted, setMounted] = useState(false)
  const [projectId, setProjectId] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [activeUpload, setActiveUpload] = useState<ApiDeveloperBulkUpload | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const projectsKey = token ? (["developer-bulk-projects"] as const) : null
  const { data: projectsRes } = useSWR(projectsKey, () =>
    fetchDeveloperProjects({ page: 1, pageSize: 50 }).then((r) => r),
  )

  const uploadsKey = token ? (["developer-bulk-uploads"] as const) : null
  const { data: uploadsRes, mutate: mutateUploads } = useSWR(uploadsKey, () =>
    fetchDeveloperBulkUploads({ page: 1, pageSize: 20 }).then((r) => r),
  )

  const rowsKey =
    token && activeUpload?.id ? (["developer-bulk-rows", activeUpload.id] as const) : null
  const { data: rowsRes, mutate: mutateRows } = useSWR(rowsKey, () =>
    fetchDeveloperBulkUploadRows(activeUpload!.id, { page: 1, pageSize: 50 }).then((r) => r),
  )

  const projects = projectsRes?.data ?? []
  const uploads = uploadsRes?.data ?? []
  const rows: ApiDeveloperBulkUploadRow[] = rowsRes?.data ?? []

  const canPublish = activeUpload?.status === "ready"

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "landshoppers-bulk-units-sample.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const onPickFile = async (file: File | null) => {
    setErr(null)
    if (!file || !projectId) {
      setErr("Choose a project and a CSV file.")
      return
    }
    if (!token) {
      setErr("Sign in to upload.")
      return
    }
    setBusy(true)
    try {
      const csvText = await file.text()
      const res = await createDeveloperBulkUpload({
        projectId,
        filename: file.name || "inventory.csv",
        csvText,
      })
      setActiveUpload(res.data)
      await mutateUploads()
      await mutateRows()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  const commit = async (mode: "draft" | "publish") => {
    if (!activeUpload?.id || !token) return
    setBusy(true)
    setErr(null)
    try {
      const res = await commitDeveloperBulkUpload(activeUpload.id, mode)
      setActiveUpload(res.data)
      await mutateUploads()
      await mutateRows()
    } catch (e) {
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Commit failed")
    } finally {
      setBusy(false)
    }
  }

  const statusBadge = useMemo(() => {
    if (!activeUpload) return null
    const variant =
      activeUpload.status === "ready"
        ? "default"
        : activeUpload.status === "committed"
          ? "secondary"
          : "outline"
    return <Badge variant={variant}>{activeUpload.status}</Badge>
  }, [activeUpload])

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Bulk upload</h1>
          <p className="text-muted-foreground">
            CSV inventory for project units (plot names, sqm, price in kobo). Presigned S3 uploads
            ship later — paste or pick a UTF-8 CSV.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={downloadSample}>
            <Download className="mr-2 h-4 w-4" />
            Sample CSV
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/developer/projects/new">New project</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">New upload</CardTitle>
          <CardDescription>
            Required columns: <code className="text-xs">unitName</code>,{" "}
            <code className="text-xs">priceKobo</code>. Optional: squareMeters, unitType, bedrooms,
            bathrooms, toilets, status (available | reserved | sold).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <p className="text-muted-foreground">
              <Link className="text-primary underline" href="/login">
                Sign in
              </Link>{" "}
              to use bulk upload.
            </p>
          ) : (
            <>
              <div className="grid gap-2 sm:max-w-md">
                <Label>Target project</Label>
                <Select
                  value={projectId || undefined}
                  onValueChange={setProjectId}
                  disabled={projects.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={projects.length ? "Select project" : "No projects yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" size="sm" disabled={busy || !projectId} asChild>
                  <label className="cursor-pointer">
                    <Upload className="mr-2 inline h-4 w-4" />
                    Choose CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </Button>
                {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              </div>
            </>
          )}

          {err ? <p className="text-destructive text-xs">{err}</p> : null}
        </CardContent>
      </Card>

      {activeUpload ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base">Current upload</CardTitle>
              <CardDescription>
                {activeUpload.filename} · {activeUpload.stats?.rowCount ?? "—"} rows
              </CardDescription>
            </div>
            {statusBadge}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || activeUpload.status === "committed"}
                onClick={() => void commit("draft")}
              >
                Save draft (commit metadata)
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy || !canPublish || activeUpload.status === "committed"}
                onClick={() => void commit("publish")}
              >
                Publish units
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (kobo)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No rows loaded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.rowIndex}>
                        <TableCell>{r.rowIndex}</TableCell>
                        <TableCell className="font-medium">
                          {String(r.payload["unitName"] ?? "—")}
                        </TableCell>
                        <TableCell>{String(r.payload["priceKobo"] ?? "—")}</TableCell>
                        <TableCell>{String(r.payload["status"] ?? "—")}</TableCell>
                        <TableCell className="max-w-xs text-xs text-destructive">
                          {r.errors.length ? r.errors.join("; ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Recent uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <p className="text-muted-foreground">No uploads yet.</p>
          ) : (
            <ul className="space-y-2">
              {uploads.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0">
                  <button
                    type="button"
                    className="text-left font-medium text-primary hover:underline"
                    onClick={() => setActiveUpload(u)}
                  >
                    {u.filename}
                  </button>
                  <span className="text-muted-foreground text-xs">
                    {u.status}
                    {u.stats ? ` · ${u.stats.validCount}/${u.stats.rowCount} valid` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
