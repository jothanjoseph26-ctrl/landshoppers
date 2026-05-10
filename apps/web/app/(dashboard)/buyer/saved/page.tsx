"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { Bath, Bed, MapPin, Square, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { fetchSavedListings, unsaveListing } from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatKoboNaira, formatRelativeTime } from "@/lib/format"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=70"

export default function BuyerSavedListingsPage() {
  const [removing, setRemoving] = useState<string | null>(null)
  const saved = usePortalData("buyer:saved-page", () => fetchSavedListings({ pageSize: 50 }))

  const onRemove = useCallback(
    async (listingId: string) => {
      setRemoving(listingId)
      try {
        await unsaveListing(listingId)
        toast.success("Removed from saved")
        saved.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to remove"
        toast.error(msg)
      } finally {
        setRemoving(null)
      }
    },
    [saved],
  )

  if (saved.isUnauthenticated) return <PortalAuthRequired />

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Saved listings</h1>
          <p className="text-muted-foreground">
            {saved.data ? `${saved.data.meta?.total ?? saved.data.data.length} saved` : "Properties you have starred"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/listings">Browse marketplace</Link>
        </Button>
      </div>

      {saved.error && !saved.isForbidden && (
        <PortalError
          title="Couldn't load saved listings"
          description="We couldn't reach the API. Please retry."
          onRetry={saved.refresh}
        />
      )}

      {saved.isLoading && <PortalLoading label="Loading saved listings…" />}

      {saved.data && saved.data.data.length === 0 && (
        <PortalEmpty
          title="No saved listings yet"
          description="Hit the heart icon on any listing card to save it here for later."
          primaryHref="/listings"
          primaryLabel="Browse listings"
        />
      )}

      {saved.data && saved.data.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {saved.data.data.map((row) => {
            const listing = row.listing
            const property = listing.property
            const slug = property.slug ?? listing.id
            return (
              <Card key={row.id} className="overflow-hidden">
                <Link href={`/listings/${slug}`} className="relative block aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={PLACEHOLDER_IMAGE}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                  <Badge className="absolute left-3 top-3" variant={listing.isForRent ? "secondary" : "default"}>
                    {listing.isForRent ? "For Rent" : "For Sale"}
                  </Badge>
                </Link>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/listings/${slug}`}
                        className="line-clamp-1 text-base font-semibold hover:text-primary"
                      >
                        {property.title}
                      </Link>
                      <p className="text-sm font-bold text-foreground">{formatKoboNaira(listing.price)}</p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(listing.id)}
                      disabled={removing === listing.id}
                      aria-label="Remove from saved"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {property.city}, {property.state}
                    </span>
                  </div>
                  {(property.bedrooms || property.bathrooms || property.squareMeters) && (
                    <div className="flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
                      {property.bedrooms !== null && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" />
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms !== null && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" />
                          {property.bathrooms}
                        </span>
                      )}
                      {property.squareMeters !== null && (
                        <span className="flex items-center gap-1">
                          <Square className="h-3.5 w-3.5" />
                          {property.squareMeters} m²
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Saved {formatRelativeTime(row.savedAt)}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
