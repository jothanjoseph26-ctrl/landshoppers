"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceHubBundleWizard } from "@/components/servicehub/servicehub-bundle-wizard"
import type { ApiServiceBundle } from "@/lib/api/services-marketplace"
import { getServiceHubCategoryMeta } from "@/lib/servicehub/categories"

function formatBand(fromKobo: string, toKobo: string): string {
  try {
    const lo = Number(BigInt(fromKobo)) / 100
    const hi = Number(BigInt(toKobo)) / 100
    const fmt = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    })
    return `${fmt.format(lo)} – ${fmt.format(hi)}`
  } catch {
    return "Price on request"
  }
}

type Props = {
  bundles: ApiServiceBundle[]
  highlightSlug?: string | null
  defaultLocation?: string
  defaultMessage?: string
  defaultDeveloperProjectId?: string
}

export function ServiceHubBundlesCatalog({
  bundles,
  highlightSlug,
  defaultLocation,
  defaultMessage,
  defaultDeveloperProjectId,
}: Props) {
  const [active, setActive] = useState<ApiServiceBundle | null>(null)

  const sorted = [...bundles].sort((a, b) => {
    if (highlightSlug && a.slug === highlightSlug) return -1
    if (highlightSlug && b.slug === highlightSlug) return 1
    return b.activationCount - a.activationCount
  })

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {sorted.map((b) => {
          const highlighted = highlightSlug === b.slug
          return (
            <Card
              key={b.id}
              className={`flex flex-col ${highlighted ? "border-primary ring-1 ring-primary/30" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{b.name}</CardTitle>
                  {highlighted && <Badge>Recommended</Badge>}
                </div>
                <CardDescription>{b.description}</CardDescription>
                <p className="pt-2 text-sm font-medium text-primary">
                  {formatBand(b.priceFromKobo, b.priceToKobo)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.categories.length} categories · {b.activationCount} activations
                </p>
              </CardHeader>
              <CardContent className="mt-auto space-y-3 border-t pt-4">
                <div className="flex flex-wrap gap-1">
                  {b.categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {getServiceHubCategoryMeta(c)?.label ?? c}
                    </span>
                  ))}
                </div>
                <Button className="w-full" onClick={() => setActive(b)}>
                  Get started
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {active && (
        <ServiceHubBundleWizard
          bundle={active}
          open={Boolean(active)}
          onOpenChange={(open) => {
            if (!open) setActive(null)
          }}
          defaultLocation={defaultLocation}
          defaultMessage={defaultMessage}
          defaultDeveloperProjectId={defaultDeveloperProjectId}
        />
      )}
    </>
  )
}

