"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, ChevronLeft, ChevronRight, Star, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ApiServiceProviderListItem } from "@/lib/api/services-marketplace"

type Props = {
  providers: ApiServiceProviderListItem[]
}

export function ServiceHubFeaturedCarousel({ providers }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || providers.length === 0) return
    const id = window.setInterval(() => {
      const next = el.scrollLeft + el.clientWidth * 0.85
      if (next >= el.scrollWidth - el.clientWidth - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        el.scrollTo({ left: next, behavior: "smooth" })
      }
    }, 5500)
    return () => window.clearInterval(id)
  }, [providers.length])

  if (providers.length === 0) return null

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 md:inline-flex"
        onClick={() => scrollByDir(-1)}
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 md:inline-flex"
        onClick={() => scrollByDir(1)}
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {providers.map((p) => {
          const href = `/services/${p.category}/${p.slug}`
          const cover =
            p.coverImageUrl ||
            p.galleryImages?.[0] ||
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop"
          return (
            <div
              key={p.id}
              className="w-[min(100%,320px)] flex-none snap-start sm:w-80"
            >
              <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
                <div className="relative h-40">
                  <Image src={cover} alt="" fill className="object-cover" />
                  <Badge className="absolute left-3 top-3 bg-background/90 text-foreground">
                    Featured
                  </Badge>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{p.businessName}</h3>
                    {p.isVerified && <CheckCircle className="h-5 w-5 shrink-0 text-primary" />}
                  </div>
                  <p className="text-xs capitalize text-muted-foreground">
                    {p.category.replace(/_/g, " ")}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      {p.rating}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {p.city}
                    </span>
                  </div>
                  <Button asChild className="w-full" size="sm">
                    <Link href={href}>View profile</Link>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
