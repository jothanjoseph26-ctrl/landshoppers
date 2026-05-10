"use client"

import { useState } from "react"
import { Bell, BellOff, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import {
  deleteSavedSearch,
  fetchSavedSearches,
  updateSavedSearch,
} from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

const FREQUENCIES: Array<"instant" | "daily" | "weekly"> = ["instant", "daily", "weekly"]

function summarizeFilters(raw: Record<string, unknown>): string {
  const entries = Object.entries(raw).filter(([, v]) => v !== undefined && v !== null && v !== "")
  if (entries.length === 0) return "All listings"
  return entries
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .slice(0, 4)
    .join(" · ")
}

export default function BuyerSavedSearchesPage() {
  const searches = usePortalData("buyer:searches-page", fetchSavedSearches)
  const [pendingId, setPendingId] = useState<string | null>(null)

  if (searches.isUnauthenticated) return <PortalAuthRequired />

  const handleFrequency = async (id: string, value: "instant" | "daily" | "weekly") => {
    setPendingId(id)
    try {
      await updateSavedSearch(id, { alertFrequency: value })
      toast.success("Alert frequency updated")
      searches.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    } finally {
      setPendingId(null)
    }
  }

  const handleAlertsToggle = async (id: string, currentlyOn: boolean) => {
    setPendingId(id)
    try {
      await updateSavedSearch(id, { emailAlerts: !currentlyOn })
      toast.success(currentlyOn ? "Email alerts paused" : "Email alerts enabled")
      searches.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    } finally {
      setPendingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setPendingId(id)
    try {
      await deleteSavedSearch(id)
      toast.success("Search removed")
      searches.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Saved searches</h1>
        <p className="text-muted-foreground">
          Manage email alert frequency for filters you saved while browsing the marketplace.
        </p>
      </div>

      {searches.error && !searches.isForbidden && (
        <PortalError
          title="Couldn't load saved searches"
          description="The API returned an error. Please retry."
          onRetry={searches.refresh}
        />
      )}

      {searches.isLoading && <PortalLoading label="Loading saved searches…" />}

      {searches.data && searches.data.length === 0 && (
        <PortalEmpty
          title="No saved searches yet"
          description="From the listings page, run a search and tap Save to receive matching alerts."
          primaryHref="/listings"
          primaryLabel="Open listings search"
        />
      )}

      {searches.data && searches.data.length > 0 && (
        <Card>
          <CardContent className="divide-y p-0">
            {searches.data.map((s) => (
              <div key={s.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{s.name ?? "Untitled search"}</p>
                    {!s.emailAlerts && (
                      <Badge variant="outline" className="text-xs">
                        Alerts paused
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {summarizeFilters(s.filters)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatRelativeTime(s.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={s.alertFrequency}
                    onValueChange={(v) =>
                      handleFrequency(s.id, v as "instant" | "daily" | "weekly")
                    }
                    disabled={pendingId === s.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlertsToggle(s.id, s.emailAlerts)}
                    disabled={pendingId === s.id}
                  >
                    {s.emailAlerts ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                    {s.emailAlerts ? "Pause" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                    disabled={pendingId === s.id}
                    aria-label="Delete saved search"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
