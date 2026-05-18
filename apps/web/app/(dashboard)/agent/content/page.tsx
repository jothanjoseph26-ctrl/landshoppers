"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

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
  PortalAuthRequired,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { ApiRequestError } from "@/lib/api/client"
import {
  fetchAgentContext,
  postAgentContentGenerate,
  type AgentContentKind,
  type ApiAgentContentCaption,
} from "@/lib/api/agent-portal"
import { fetchAgentListings } from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"

export default function AgentContentPage() {
  const [tone, setTone] = useState<"professional" | "friendly">("professional")
  const [kind, setKind] = useState<AgentContentKind>("captions")
  const [listingId, setListingId] = useState<string>("")
  const [err, setErr] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [captions, setCaptions] = useState<ApiAgentContentCaption[]>([])
  const [mediaBrief, setMediaBrief] = useState<string | null>(null)
  const [disclaimer, setDisclaimer] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const ctx = usePortalData("agent:content-context", fetchAgentContext)
  const listings = usePortalData("agent:content-listings", () => fetchAgentListings({ pageSize: 50 }))

  useEffect(() => {
    if (!listingId && listings.data?.data.length) {
      setListingId(listings.data.data[0]!.id)
    }
  }, [listingId, listings.data?.data])

  async function generate() {
    setGenerating(true)
    setErr(null)
    try {
      const res = await postAgentContentGenerate({
        tone,
        kind,
        ...(listingId ? { listingId } : {}),
      })
      setDescription(res.description)
      setCaptions(res.captions)
      setMediaBrief(res.mediaBrief)
      setDisclaimer(res.disclaimer)
    } catch (e) {
      setDescription(null)
      setCaptions([])
      setMediaBrief(null)
      setDisclaimer(null)
      if (e instanceof ApiRequestError) {
        const body = e.body as { error?: { message?: string } } | null
        setErr(body?.error?.message ?? "Generation failed")
      } else {
        setErr("Generation failed")
      }
    } finally {
      setGenerating(false)
    }
  }

  if (ctx.isUnauthenticated) return <PortalAuthRequired />

  const aiEnabled = ctx.data?.featureFlags.agentAiInsightsEnabled ?? true

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Content studio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI-assisted listing copy, social captions, and media briefs for your active listings.
        </p>
      </div>

      {ctx.isLoading && <PortalLoading label="Loading…" />}

      {ctx.error && !ctx.isForbidden && (
        <PortalError title="Couldn't load agent context" onRetry={ctx.refresh} />
      )}

      {!aiEnabled && (
        <Card className="border-dashed shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Content studio unavailable</CardTitle>
            <CardDescription>
              Enable <code className="rounded bg-muted px-1 text-xs">AGENT_AI_INSIGHTS_ENABLED</code> on the API
              deployment, or contact your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {aiEnabled && (
        <>
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generate</CardTitle>
              <CardDescription>
                Pick a listing for context, or leave blank for agency-level copy.{" "}
                <Link href="/agent/listings/new" className="text-primary underline-offset-4 hover:underline">
                  Create a listing
                </Link>{" "}
                to unlock description drafts.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Content type</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as AgentContentKind)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="captions">Social captions</SelectItem>
                      <SelectItem value="description">Listing description</SelectItem>
                      <SelectItem value="media_brief">Media brief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as "professional" | "friendly")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Listing (optional)</Label>
                <Select
                  value={listingId || "__none__"}
                  onValueChange={(v) => setListingId(v === "__none__" ? "" : v)}
                  disabled={listings.isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No listing selected" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No listing — agency default</SelectItem>
                    {(listings.data?.data ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.property.title} · {l.property.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {err ? (
                <p className="text-destructive text-sm" role="alert">
                  {err}
                </p>
              ) : null}

              <Button type="button" onClick={() => void generate()} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Generating…
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            </CardContent>
          </Card>

          {disclaimer ? (
            <p className="text-xs text-muted-foreground border-l-2 pl-3">{disclaimer}</p>
          ) : null}

          {description ? (
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Listing description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{description}</p>
              </CardContent>
            </Card>
          ) : null}

          {mediaBrief ? (
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Media brief</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap font-mono">{mediaBrief}</p>
              </CardContent>
            </Card>
          ) : null}

          {captions.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-medium">Captions</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {captions.map((c) => (
                  <li key={c.id}>
                    <Card className="shadow-none h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                          {c.platform}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{c.text}</p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
