"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { fetchRecentListings } from "@/lib/api/portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatKoboNaira, formatRelativeTime } from "@/lib/format"

export default function BuyerRecentListingsPage() {
  const recent = usePortalData("buyer:recent-page", () => fetchRecentListings({ pageSize: 50 }))

  if (recent.isUnauthenticated) return <PortalAuthRequired />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Recently viewed</h1>
        <p className="text-muted-foreground">Listings you visited, sorted by most recent.</p>
      </div>

      {recent.error && !recent.isForbidden && (
        <PortalError
          title="Couldn't load recent listings"
          description="The API returned an error. Please retry."
          onRetry={recent.refresh}
        />
      )}

      {recent.isLoading && <PortalLoading label="Loading recent listings…" />}

      {recent.data && recent.data.data.length === 0 && (
        <PortalEmpty
          title="Nothing viewed yet"
          description="Open any listing to start building your recently viewed history."
          primaryHref="/listings"
          primaryLabel="Browse listings"
        />
      )}

      {recent.data && recent.data.data.length > 0 && (
        <Card>
          <CardContent className="divide-y p-0">
            {recent.data.data.map((row) => {
              const listing = row.listing
              const property = listing.property
              const slug = property.slug ?? listing.id
              return (
                <Link
                  href={`/listings/${slug}`}
                  key={row.id}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{property.title}</p>
                      <Badge variant={listing.isForRent ? "secondary" : "default"} className="text-xs">
                        {listing.isForRent ? "Rent" : "Sale"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">
                        {property.city}, {property.state}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Viewed {formatRelativeTime(row.lastViewedAt)}
                    </p>
                  </div>
                  <p className="font-bold">{formatKoboNaira(listing.price)}</p>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
