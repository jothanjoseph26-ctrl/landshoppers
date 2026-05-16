"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import {
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  fetchDeveloperInquiries,
  fetchDeveloperLeadsDigest,
  fetchDeveloperProjects,
  postDeveloperLeadsDigestEmail,
  requestInquiryPitchDraft,
  type ApiDeveloperInquiryRow,
  type ApiDeveloperLeadsDigest,
  type ApiPitchDraftResponse,
} from "@/lib/api/developer-portal"
import { ApiRequestError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/auth-session"

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800", icon: Clock },
  responded: { label: "Contacted", color: "bg-muted text-foreground", icon: Phone },
  touring: { label: "Site visit", color: "bg-purple-100 text-purple-800", icon: Calendar },
  closed: { label: "Closed", color: "bg-primary/10 text-primary", icon: CheckCircle },
  lost: { label: "Lost", color: "bg-gray-100 text-gray-800", icon: XCircle },
}

function displayLeadName(row: ApiDeveloperInquiryRow): string {
  return (
    row.buyerName?.trim() ||
    row.buyerEmail?.trim() ||
    row.buyerPhone?.trim() ||
    "Buyer"
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

export default function DeveloperLeadsPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [digestPeriod, setDigestPeriod] = useState<"week" | "month" | "all">("week")
  const [digestData, setDigestData] = useState<ApiDeveloperLeadsDigest | null>(null)
  const [digestLoading, setDigestLoading] = useState(false)
  const [digestError, setDigestError] = useState<string | null>(null)
  const [pitchOpen, setPitchOpen] = useState(false)
  const [pitchLoading, setPitchLoading] = useState(false)
  const [pitchErr, setPitchErr] = useState<string | null>(null)
  const [pitchData, setPitchData] = useState<ApiPitchDraftResponse | null>(null)
  const [digestEmailLoading, setDigestEmailLoading] = useState(false)
  const [digestEmailNotice, setDigestEmailNotice] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const projectsKey = token ? (["developer-leads-projects"] as const) : null
  const { data: projectList } = useSWR(projectsKey, () =>
    fetchDeveloperProjects({ page: 1, pageSize: 50 }).then((r) => r.data),
  )

  const inquiriesKey =
    token && mounted
      ? (["developer-inquiries", statusFilter === "all" ? "" : statusFilter] as const)
      : null
  const { data: inquiryRows, error, isLoading, mutate } = useSWR(
    inquiriesKey,
    () =>
      fetchDeveloperInquiries({
        page: 1,
        pageSize: 50,
        status: statusFilter === "all" ? undefined : statusFilter,
      }).then((r) => r.data),
    { revalidateOnFocus: true },
  )

  const rows = inquiryRows ?? []

  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return rows.filter((lead) => {
      const name = displayLeadName(lead).toLowerCase()
      const email = (lead.buyerEmail ?? "").toLowerCase()
      const phone = (lead.buyerPhone ?? "").toLowerCase()
      const proj = (lead.project?.name ?? "").toLowerCase()
      const msg = (lead.message ?? "").toLowerCase()
      const matchesSearch =
        !q || name.includes(q) || email.includes(q) || phone.includes(q) || proj.includes(q) || msg.includes(q)
      const matchesProject =
        projectFilter === "all" || lead.projectId === projectFilter || lead.project?.id === projectFilter
      return matchesSearch && matchesProject
    })
  }, [rows, searchQuery, projectFilter])

  const stats = useMemo(() => {
    const newC = rows.filter((r) => r.status === "new").length
    const progress = rows.filter((r) => r.status === "responded" || r.status === "touring").length
    const closed = rows.filter((r) => r.status === "closed").length
    const lost = rows.filter((r) => r.status === "lost").length
    return [
      { label: "New", value: String(newC), change: "Needs first response" },
      { label: "In progress", value: String(progress), change: "Contacted or touring" },
      { label: "Closed won", value: String(closed), change: "Marked closed" },
      { label: "Lost", value: String(lost), change: "Marked lost" },
    ]
  }, [rows])

  const signedIn = Boolean(token)

  async function loadDigest() {
    if (!signedIn) return
    setDigestError(null)
    setDigestLoading(true)
    try {
      const res = await fetchDeveloperLeadsDigest(digestPeriod)
      setDigestData(res.data)
    } catch (e) {
      setDigestData(null)
      setDigestError(
        e instanceof ApiRequestError ? `Request failed (${e.status})` : "Could not load digest",
      )
    } finally {
      setDigestLoading(false)
    }
  }

  async function emailDigest() {
    if (!signedIn) return
    setDigestEmailNotice(null)
    setDigestEmailLoading(true)
    try {
      const res = await postDeveloperLeadsDigestEmail(digestPeriod)
      const d = res.data
      if (d.emailed) {
        setDigestEmailNotice("Digest sent to your account email.")
      } else if (d.mode === "log_only") {
        setDigestEmailNotice(
          "Digest recorded (log-only): API has no RESEND_API_KEY — check the API server console for the email body.",
        )
      } else {
        setDigestEmailNotice("Request completed.")
      }
    } catch (e) {
      setDigestEmailNotice(
        e instanceof ApiRequestError ? `Request failed (${e.status})` : "Could not send digest email",
      )
    } finally {
      setDigestEmailLoading(false)
    }
  }

  async function runPitch(inquiryId: string) {
    setPitchOpen(true)
    setPitchErr(null)
    setPitchData(null)
    setPitchLoading(true)
    try {
      const res = await requestInquiryPitchDraft(inquiryId)
      setPitchData(res.data)
    } catch (e) {
      setPitchErr(e instanceof ApiRequestError ? `Request failed (${e.status})` : "Could not generate draft")
    } finally {
      setPitchLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {mounted && !signedIn ? (
        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Sign in with a <strong className="text-foreground">developer</strong> account to load
          inquiries from <code className="text-xs">/v1/me/developer/inquiries</code>.
        </div>
      ) : null}

      {signedIn && error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load leads.{" "}
          <button type="button" className="underline" onClick={() => void mutate()}>
            Retry
          </button>
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-bold">Lead Management</h1>
        <p className="text-muted-foreground">Buyer inquiries on your development projects</p>
      </div>

      {signedIn ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads…"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter} disabled={!signedIn}>
          <SelectTrigger className="w-full sm:w-56">
            <Building2 className="mr-2 h-4 w-4 shrink-0" />
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {(projectList ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!signedIn}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {signedIn ? (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Lead digest (Phase C)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Snapshot from <code className="text-xs">GET /v1/me/developer/leads/digest</code>. Email yourself the
                same window via <code className="text-xs">POST …/leads/digest/email</code> (Resend when configured).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={digestPeriod}
                onValueChange={(v) => setDigestPeriod(v as "week" | "month" | "all")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={digestEmailLoading}
                onClick={() => void emailDigest()}
              >
                {digestEmailLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Email digest
                  </>
                )}
              </Button>
              <Button type="button" variant="secondary" size="sm" disabled={digestLoading} onClick={() => void loadDigest()}>
                {digestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load digest"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {digestEmailNotice ? (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-muted-foreground">
                {digestEmailNotice}
              </p>
            ) : null}
            {digestError ? <p className="text-destructive">{digestError}</p> : null}
            {digestData ? (
              <>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{digestData.totals.inquiriesInPeriod}</span>{" "}
                  inquiries in window · generated {formatDistanceToNow(new Date(digestData.generatedAt), { addSuffix: true })}
                </p>
                {digestData.byProject.length > 0 ? (
                  <div>
                    <p className="mb-1 font-medium">By project</p>
                    <ul className="list-inside list-disc text-muted-foreground">
                      {digestData.byProject.map((p) => (
                        <li key={p.projectId}>
                          {p.projectName} — {p.count}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {digestData.hotLeads.length > 0 ? (
                  <div>
                    <p className="mb-1 font-medium">Hot leads (heuristic)</p>
                    <ul className="space-y-1">
                      {digestData.hotLeads.slice(0, 8).map((h) => (
                        <li key={h.inquiryId} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed py-1 last:border-0">
                          <span className="text-muted-foreground">{h.projectName ?? "Project"}</span>
                          <span className="text-xs text-muted-foreground">
                            score {h.score.toFixed(0)} · {h.reason}
                          </span>
                          <span className="w-full truncate text-xs">{h.summary}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No inquiries in this period.</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Choose a window and load to preview a digest.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inquiries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {signedIn && isLoading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left font-medium">Lead</th>
                    <th className="hidden p-4 text-left font-medium md:table-cell">Project</th>
                    <th className="hidden p-4 text-left font-medium lg:table-cell">Message</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="hidden p-4 text-left font-medium sm:table-cell">When</th>
                    <th className="p-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const name = displayLeadName(lead)
                    const cfg = statusConfig[lead.status] ?? {
                      label: lead.status,
                      color: "bg-muted text-foreground",
                      icon: MessageSquare,
                    }
                    const StatusIcon = cfg.icon
                    const when = formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })
                    return (
                      <tr key={lead.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{initials(name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-sm text-muted-foreground">
                                {[lead.buyerEmail, lead.buyerPhone].filter(Boolean).join(" · ") || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden p-4 md:table-cell">
                          <p className="font-medium">{lead.project?.name ?? "—"}</p>
                          <p className="text-sm capitalize text-muted-foreground">{lead.source}</p>
                        </td>
                        <td className="hidden max-w-xs p-4 lg:table-cell">
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {lead.message?.trim() || "—"}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge className={cfg.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="hidden p-4 text-muted-foreground sm:table-cell">{when}</td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {lead.buyerPhone ? (
                                <DropdownMenuItem asChild>
                                  <a href={`tel:${lead.buyerPhone.replace(/\s/g, "")}`}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    Call
                                  </a>
                                </DropdownMenuItem>
                              ) : null}
                              {lead.buyerEmail ? (
                                <DropdownMenuItem asChild>
                                  <a href={`mailto:${lead.buyerEmail}`}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Email
                                  </a>
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={!signedIn}
                                onSelect={(e) => {
                                  e.preventDefault()
                                  void runPitch(lead.id)
                                }}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate pitch draft
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled>
                                <Calendar className="mr-2 h-4 w-4" />
                                Schedule tour (soon)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {signedIn && !isLoading && filteredLeads.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-1 font-semibold">No leads found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting search or filters</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={pitchOpen}
        onOpenChange={(open) => {
          setPitchOpen(open)
          if (!open) {
            setPitchData(null)
            setPitchErr(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pitch draft</DialogTitle>
            <DialogDescription>
              Template response from <code className="text-xs">POST /v1/me/developer/inquiries/:id/pitch-draft</code>
            </DialogDescription>
          </DialogHeader>
          {pitchLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pitchErr ? (
            <p className="text-sm text-destructive">{pitchErr}</p>
          ) : pitchData ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{pitchData.disclaimer}</p>
              <p className="text-xs text-muted-foreground">
                Confidence {pitchData.confidence} · {pitchData.model}
              </p>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input readOnly value={pitchData.draft.subject} className="font-medium" />
              </div>
              <div className="space-y-1">
                <Label>Body</Label>
                <Textarea readOnly className="min-h-[200px] font-mono text-xs" value={pitchData.draft.body} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
