"use client"

import Image from "next/image"
import Link from "next/link"
import { HelpCircle, MapPin, Star } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ApiServicesMatchPayload } from "@/lib/api/services-marketplace"

type Props = {
  data: ApiServicesMatchPayload
}

function profileHref(category: string, slug: string, listingId?: string) {
  const base = `/services/${category}/${slug}`
  const id = listingId?.trim()
  if (!id) return base
  return `${base}?listingId=${encodeURIComponent(id)}&source=contextual`
}

export function ServiceHubListingMatchClient({ data }: Props) {
  const tabs = data.groups.filter((g) => g.providers.length > 0)
  const defaultTab = tabs[0]?.category ?? data.groups[0]?.category ?? "legal"

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-md">
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Recommended services for this property</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified professionals near {data.areaLabel ?? "this area"} who can help complete your
            transaction.
          </p>
        </div>

        {tabs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No contextual matches yet.{" "}
            <Link href="/services" className="font-medium text-primary underline-offset-4 hover:underline">
              Browse the directory
            </Link>
          </p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tabs defaultValue={defaultTab}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
              {tabs.map((g) => (
                <TabsTrigger key={g.category} value={g.category} className="text-xs sm:text-sm">
                  {g.label ?? g.category}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((g) => (
              <TabsContent key={g.category} value={g.category} className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/services/${g.category}`}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View all{" "}
                    {(g.label ?? g.category).toLowerCase()}
                    {" "}providers →
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.providers.slice(0, 3).map((p) => {
                    const cover =
                      p.coverImageUrl ||
                      p.logoUrl ||
                      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=240&h=160&fit=crop"
                    return (
                      <div
                        key={p.slug}
                        className="flex gap-3 rounded-lg border bg-card p-3 shadow-sm transition hover:border-primary/30"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                          <Image src={cover} alt="" fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start gap-2">
                            <Link
                              href={profileHref(p.category, p.slug, data.listingId)}
                              className="line-clamp-2 min-w-0 flex-1 font-semibold leading-tight hover:text-primary"
                            >
                              {p.businessName}
                            </Link>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="mt-0.5 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                                  aria-label="Why this provider"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                {p.matchHint ??
                                  "Ranked by category fit, proximity, verification, and response patterns."}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {p.rating}
                            </span>
                            <span className="flex min-w-0 items-center gap-0.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {p.city}
                              </span>
                            </span>
                            {p.isVerified && <Badge variant="secondary" className="text-[10px] px-1 py-0">Verified</Badge>}
                          </div>
                          <Button asChild size="sm" className="mt-1 h-8 w-full text-xs sm:w-auto">
                            <Link href={profileHref(p.category, p.slug, data.listingId)}>
                              Request quote
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            ))}
            </Tabs>
          </TooltipProvider>
        )}

        {data.bundleUpsell && (
          <div className="rounded-lg border border-dashed border-primary/40 bg-background/80 p-4 text-sm">
            <p className="font-medium">Need multiple services?</p>
            <p className="mt-1 text-muted-foreground">
              The <span className="font-medium text-foreground">{data.bundleUpsell.name}</span>
              {data.bundleUpsell.priceFromLabel
                ? ` — ${data.bundleUpsell.priceFromLabel}.`
                : " bundles coordinated delivery across providers."}
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-3">
              <Link href="/services/bundles">Explore bundles</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
