"use client"

import { useEffect, useState } from "react"
import { Building2, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getPublicApiBaseUrl } from "@/lib/api/config"
import type { ApiListResponse, ApiListing } from "@/lib/api/types"

/** Live count from `@landshoppers/api` GET `/v1/listings` meta (Agent 4 ↔ Agent 2 bridge). */
export function MarketListingsStat() {
  const [value, setValue] = useState<string>("—")

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const base = getPublicApiBaseUrl()
        const res = await fetch(`${base}/v1/listings?page=1&pageSize=1`)
        if (!res.ok) throw new Error("bad status")
        const json = (await res.json()) as ApiListResponse<ApiListing[]>
        const total = json.meta?.total ?? json.data?.length ?? 0
        if (!cancelled) setValue(String(total))
      } catch {
        if (!cancelled) setValue("—")
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-blue-100 p-2">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            API
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">
            Active listings (API meta.total)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
