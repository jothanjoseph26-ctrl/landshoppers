"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { List, Map, SlidersHorizontal } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Props = {
  category: string
  sort: string
  view?: "list" | "map"
  /** When set, URLs stay under `/services/[category]/[geo]` (SVC-PUB-02). */
  geoSlug?: string
}

export function ServiceHubDirectoryControls({ category, sort, view = "list", geoSlug }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const basePath =
    geoSlug !== undefined ? `/services/${category}/${geoSlug}` : `/services/${category}`

  const pushWith = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "")
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") next.delete(key)
      else next.set(key, value)
    }
    const q = next.toString()
    router.push(q ? `${basePath}?${q}` : basePath)
  }

  const onSort = (value: string) => pushWith({ sort: value })
  const onView = (nextView: "list" | "map") => pushWith({ view: nextView === "list" ? undefined : nextView })

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Directory view">
        <Button
          type="button"
          size="sm"
          variant={view === "list" ? "secondary" : "ghost"}
          className="gap-1.5"
          onClick={() => onView("list")}
        >
          <List className="h-4 w-4" aria-hidden />
          List
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "map" ? "secondary" : "ghost"}
          className="gap-1.5"
          onClick={() => onView("map")}
        >
          <Map className="h-4 w-4" aria-hidden />
          Map
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
        <Select value={sort} onValueChange={onSort}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest rated</SelectItem>
            <SelectItem value="jobs">Most jobs completed</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="response">Fastest response</SelectItem>
            <SelectItem value="recommended">Recommended</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
