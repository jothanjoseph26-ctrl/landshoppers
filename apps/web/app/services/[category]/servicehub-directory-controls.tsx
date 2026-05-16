"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SlidersHorizontal } from "lucide-react"

type Props = {
  category: string
  sort: string
  /** When set, URLs stay under `/services/[category]/[geo]` (SVC-PUB-02). */
  geoSlug?: string
}

export function ServiceHubDirectoryControls({ category, sort, geoSlug }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onSort = (value: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "")
    next.set("sort", value)
    const base =
      geoSlug !== undefined
        ? `/services/${category}/${geoSlug}`
        : `/services/${category}`
    router.push(`${base}?${next.toString()}`)
  }

  return (
    <div className="mb-6 flex justify-end">
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
