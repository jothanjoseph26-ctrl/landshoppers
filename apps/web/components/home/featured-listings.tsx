import Link from 'next/link'
import { ArrowRight, Bed, Bath, Square, MapPin, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchFeaturedListings } from '@/lib/api/listings'
import {
  koboToNairaNumber,
  LISTING_PLACEHOLDER_IMAGE,
} from '@/lib/listings/map-api-listing'

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  }
  return `₦${price.toLocaleString()}`
}

export async function FeaturedListings() {
  const listings = await fetchFeaturedListings(6)

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Featured Properties
            </h2>
            <p className="mt-2 text-muted-foreground">
              Pulled live from the API when{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                @landshoppers/api
              </code>{' '}
              is running
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/listings" className="gap-2">
              View All Properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center text-muted-foreground">
            <p>No listings returned yet.</p>
            <p className="mt-2 text-sm">
              Run Postgres, migrate/seed, start the API on{' '}
              <code className="rounded bg-muted px-1 text-xs">
                NEXT_PUBLIC_API_URL
              </code>{' '}
              (default <code className="rounded bg-muted px-1 text-xs">http://localhost:4001</code>
              ), then refresh.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const p = listing.property
              const price = koboToNairaNumber(listing.price)
              const typeLabel =
                listing.isForRent && !listing.isForSale ? 'For Rent' : 'For Sale'
              const created = new Date(listing.createdAt).getTime()
              const isNew =
                Date.now() - created < 14 * 24 * 60 * 60 * 1000

              return (
                <Card
                  key={listing.id}
                  className="group overflow-hidden border-0 shadow-md transition-shadow hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={LISTING_PLACEHOLDER_IMAGE}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      <Badge
                        variant={
                          typeLabel === 'For Sale' ? 'default' : 'secondary'
                        }
                      >
                        {typeLabel}
                      </Badge>
                      {listing.isFeatured && (
                        <Badge className="bg-primary text-primary-foreground">
                          Featured
                        </Badge>
                      )}
                      {isNew && (
                        <Badge className="bg-secondary text-secondary-foreground">
                          New
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-primary"
                    >
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">Save property</span>
                    </button>
                    <div className="absolute bottom-3 left-3 rounded-lg bg-background/90 px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-lg font-bold text-foreground">
                        {formatPrice(price)}
                      </span>
                      {listing.isForRent && (
                        <span className="text-sm text-muted-foreground">
                          /year
                        </span>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <Link
                      href={`/listings/${p.slug}`}
                      className="line-clamp-1 text-lg font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">
                        {[p.city, p.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-4 border-t pt-4">
                      {p.bedrooms != null && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Bed className="h-4 w-4" />
                          <span>{p.bedrooms} Beds</span>
                        </div>
                      )}
                      {p.bathrooms != null && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Bath className="h-4 w-4" />
                          <span>{p.bathrooms} Baths</span>
                        </div>
                      )}
                      {p.squareMeters != null && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Square className="h-4 w-4" />
                          <span>{p.squareMeters} m²</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
