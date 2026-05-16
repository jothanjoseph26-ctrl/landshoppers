import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Eye,
  Share2,
  Heart,
  Check,
  Car,
  Waves,
  Zap,
  Shield,
  Droplets,
  Sun,
  Building2,
  Home,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ImageGallery } from '@/components/listings/image-gallery'
import { InquiryForm } from '@/components/listings/inquiry-form'
import { ServiceHubListingMatchSection } from '@/components/servicehub/servicehub-listing-match-section'
import { ListingMiniMap } from '@/components/listings/listing-mini-map'
import { MortgageCalculator } from '@/components/listings/mortgage-calculator'
import { PropertyCard } from '@/components/listings/property-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Metadata } from 'next'
import { fetchListingBySlugOrId, fetchSimilarListings } from '@/lib/api/listings'
import {
  LISTING_PLACEHOLDER_IMAGE,
  mapApiListingToCardProps,
  mapApiListingToDetailView,
} from '@/lib/listings/map-api-listing'

const featureIcons: Record<string, React.ElementType> = {
  pool: Waves,
  security: Shield,
  generator: Zap,
  parking: Car,
  borehole: Droplets,
  solar: Sun,
  elevator: Building2,
  gym: Home,
}

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `₦${(price / 1000000000).toFixed(price % 1000000000 === 0 ? 0 : 1)}B`
  }
  if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  }
  return `₦${price.toLocaleString()}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const row = await fetchListingBySlugOrId(slug)
    if (!row) {
      return { title: 'Listing | LandShoppers' }
    }
    const listing = mapApiListingToDetailView(row)
    const beds = listing.bedrooms ?? '—'

    return {
      title: listing.title,
      description: `${beds} bedroom ${listing.propertyType} in ${listing.city}, ${listing.state}. ${formatPrice(listing.price)}.`,
      openGraph: {
        title: `${listing.title} | LandShoppers`,
        description: `${beds} bed ${listing.propertyType} in ${listing.city}. ${formatPrice(listing.price)}`,
        images: [listing.images[0]?.url ?? LISTING_PLACEHOLDER_IMAGE],
      },
    }
  } catch {
    return { title: 'Listing | LandShoppers' }
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let row
  try {
    row = await fetchListingBySlugOrId(slug)
  } catch {
    notFound()
  }
  if (!row) {
    notFound()
  }

  const listing = mapApiListingToDetailView(row)
  const similarRows = await fetchSimilarListings(row.id, 6)
  const similarListings = similarRows.map(mapApiListingToCardProps)

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/listings" className="hover:text-foreground">
                Listings
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link
                href={`/listings?location=${listing.city}`}
                className="hover:text-foreground"
              >
                {listing.city}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground line-clamp-1">{listing.title}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Image Gallery */}
          <div className="relative">
            <ImageGallery images={listing.images} title={listing.title} />
          </div>

          {/* Main Content */}
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={listing.listingType === 'sale' ? 'default' : 'secondary'}>
                    {listing.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                  </Badge>
                  {listing.isNew && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      New Listing
                    </Badge>
                  )}
                  {listing.isFeatured && (
                    <Badge className="bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  )}
                  {listing.isVerified && (
                    <Badge variant="outline">Verified</Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                  {listing.title}
                </h1>

                <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 shrink-0" />
                  <span>{listing.address}, {listing.city}, {listing.state}</span>
                </div>

                {/* Price and Stats */}
                <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold text-primary lg:text-4xl">
                      {formatPrice(listing.price)}
                    </p>
                    {listing.sqm && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(Math.round(listing.price / listing.sqm))}/m²
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {listing.viewCount.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Listed {formatDate(listing.publishedAt)}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 flex flex-wrap gap-6">
                  {listing.bedrooms && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Bed className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{listing.bedrooms}</p>
                        <p className="text-xs text-muted-foreground">Bedrooms</p>
                      </div>
                    </div>
                  )}
                  {listing.bathrooms && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Bath className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{listing.bathrooms}</p>
                        <p className="text-xs text-muted-foreground">Bathrooms</p>
                      </div>
                    </div>
                  )}
                  {listing.sqm && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Square className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{listing.sqm}</p>
                        <p className="text-xs text-muted-foreground">Sq. Meters</p>
                      </div>
                    </div>
                  )}
                  {listing.parkingSpaces && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{listing.parkingSpaces}</p>
                        <p className="text-xs text-muted-foreground">Parking</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Heart className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        {listing.description.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="mb-4 leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Property Details Grid */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Property Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Property Type</p>
                          <p className="mt-1 font-medium capitalize">{listing.propertyType}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Year Built</p>
                          <p className="mt-1 font-medium">
                            {listing.yearBuilt ?? '—'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Furnishing</p>
                          <p className="mt-1 font-medium">
                            {listing.isFurnished ? 'Furnished' : 'Unfurnished'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Toilets</p>
                          <p className="mt-1 font-medium">
                            {listing.toilets ?? '—'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">City</p>
                          <p className="mt-1 font-medium">{listing.city}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">State</p>
                          <p className="mt-1 font-medium">{listing.state}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="features" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Features & Amenities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {listing.features.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Structured amenities will appear here once listing features
                          are synced from the database.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                          {listing.features.map((feature) => {
                            const Icon = featureIcons[feature.icon] || Check
                            return (
                              <div
                                key={feature.name}
                                className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-sm font-medium">{feature.name}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="location" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ListingMiniMap
                        latitude={listing.latitude}
                        longitude={listing.longitude}
                        title={listing.title}
                      />
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {listing.address}, {listing.city}, {listing.state}
                        </span>
                      </div>
                      <Button variant="outline" asChild>
                        <a
                          href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in Google Maps
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Mortgage Calculator */}
                  <MortgageCalculator propertyPrice={listing.price} />

                  {listing.priceHistory.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Price history</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="divide-y rounded-lg border">
                          {listing.priceHistory.slice(0, 8).map((row) => (
                            <div
                              key={row.date}
                              className="flex items-center justify-between px-3 py-2 text-sm"
                            >
                              <span className="text-muted-foreground">
                                {formatDate(row.date)}
                              </span>
                              <span className="font-medium">{formatPrice(row.price)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
            </div>

            {/* Right Column — sticky contact + trust signals */}
            <div
              id="contact"
              className="space-y-6 lg:sticky lg:top-20 lg:self-start"
            >
              <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-5 w-5 text-primary" />
                    Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    This listing is published on LandShoppers with standard marketplace checks.
                    Always verify title, payment instructions, and agency credentials before
                    transferring funds.
                  </p>
                  {listing.isVerified && (
                    <Badge variant="secondary" className="mt-2">
                      Verified badge (UI)
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <InquiryForm
                listingId={listing.id}
                listingTitle={listing.title}
                agent={listing.agent}
              />
            </div>
          </div>

          <section className="mt-14" aria-label="Recommended services">
            <ServiceHubListingMatchSection
              listingId={listing.id}
              city={listing.city}
              state={listing.state}
            />
          </section>

          {/* Similar Listings */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground">
              Similar Properties
            </h2>
            <p className="mt-2 text-muted-foreground">
              Other properties you might be interested in
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarListings.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
