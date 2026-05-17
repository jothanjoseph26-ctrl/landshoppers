"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

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
import { ApiRequestError } from "@/lib/api/client"
import type { ApiProviderContentCaption } from "@/lib/api/provider-portal"
import { postProviderContentGenerate } from "@/lib/api/provider-portal"
import { getAccessToken } from "@/lib/api/auth-session"

export default function ProviderContentPage() {
  const [mounted, setMounted] = useState(false)
  const [tone, setTone] = useState<"professional" | "friendly">("professional")
  const [leadId, setLeadId] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [captions, setCaptions] = useState<ApiProviderContentCaption[]>([])
  const [disclaimer, setDisclaimer] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  async function generate() {
    setGenerating(true)
    setErr(null)
    try {
      const res = await postProviderContentGenerate({
        tone,
        ...(leadId.trim() ? { leadId: leadId.trim() } : {}),
      })
      setCaptions(res.captions)
      setDisclaimer(res.disclaimer)
    } catch (e) {
      setCaptions([])
      setDisclaimer(null)
      setErr(e instanceof ApiRequestError ? JSON.stringify(e.body) : "Generation failed")
    } finally {
      setGenerating(false)
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
          <CardDescription>Content studio is available to verified service provider accounts.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Content studio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate caption drafts for social posts (PRV-08). Tier limits apply on the API.
        </p>
      </div>

      {err && (
        <p className="text-destructive text-sm" role="alert">
          {err}
        </p>
      )}

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generate</CardTitle>
          <CardDescription>Optional lead ID scopes tone to a specific engagement.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 flex-1 min-w-[180px]">
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
          <div className="space-y-2 flex-1 min-w-[220px]">
            <Label htmlFor="lead-id">Lead ID (optional)</Label>
            <Input
              id="lead-id"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              placeholder="UUID from lead inbox"
            />
          </div>
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

      {captions.length ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Captions</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {captions.map((c) => (
              <li key={c.id}>
                <Card className="shadow-none h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{c.platform}</CardTitle>
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
    </div>
  )
}
